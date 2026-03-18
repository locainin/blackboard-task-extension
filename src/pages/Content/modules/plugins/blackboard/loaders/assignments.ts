import { BlackboardLMSConfig } from '..';
import { AssignmentDefaults } from '../../../constants';
import {
  AssignmentType,
  Course,
  FinalAssignment,
  Options,
} from '../../../types';
import baseURL from '../../../utils/baseURL';
import { applyCustomOverrides } from '../../shared/customOverride';
import { loadCustomTasks } from '../../shared/customTask';
import {
  filterTimeBounds,
  processAssignmentList,
} from '../../shared/useAssignments';
import fetchBlackboardJson from './fetchJson';
import loadBlackboardCourses, {
  getPaginatedRequestBlackboard,
} from './courses';
import { mapWithConcurrency } from './requestCache';
import { logBlackboardDiagnostics } from '../utils/diagnostics';

const BLACKBOARD_COURSE_REQUEST_CONCURRENCY = 3;
const BLACKBOARD_DETAIL_REQUEST_CONCURRENCY = 6;
const BLACKBOARD_COLUMNS_CACHE_MS = 2 * 60 * 1000;
const BLACKBOARD_ATTEMPTS_CACHE_MS = 60 * 1000;
const BLACKBOARD_LINK_CACHE_MS = 10 * 60 * 1000;
const BLACKBOARD_ANNOUNCEMENTS_CACHE_MS = 2 * 60 * 1000;

type BlackboardGradebookColumn = {
  id: string;
  contentId: string;
  parentId: string;
  name: string;
  score: {
    possible: number;
  };
  grading: {
    due?: string;
    type: string;
  };
  scoreProviderHandle: 'resource/x-bb-assessment' | 'resource/x-bb-forumlink';
};

type BlackboardContentLink = {
  links: {
    href: string;
    type: string;
  }[];
};

type BlackboardAttempt = {
  id: string;
  status: 'NotAttempted' | 'NeedsGrading' | 'Completed';
  exempt: boolean;
  submissionDate?: string;
  displayGrade?: {
    score: number;
  };
};

type BlackboardAnnouncement = {
  id: string;
  title: string;
  availability: {
    duration: {
      start: string;
    };
  };
};

async function getGradebookColumnsRequest(courseId: string) {
  // Gradebook columns are the backbone for Blackboard task discovery
  const url = `${baseURL()}/learn/api/public/v2/courses/${courseId}/gradebook/columns`;
  return getPaginatedRequestBlackboard<BlackboardGradebookColumn>(
    url,
    'Blackboard gradebook columns',
    true,
    BLACKBOARD_COLUMNS_CACHE_MS
  );
}

async function getAssignmentLink(courseId: string, contentId: string) {
  // Gradebook columns point to content ids
  // A second request is needed to recover the page link that users can open
  const url = `${baseURL()}/learn/api/public/v1/courses/${courseId}/contents/${contentId}?fields=links`;
  return await fetchBlackboardJson<BlackboardContentLink>(
    url,
    'Blackboard assignment link',
    {
      cacheKey: `bb-link:${courseId}:${contentId}`,
      cacheTtlMs: BLACKBOARD_LINK_CACHE_MS,
    }
  );
}

async function getAttemptsRequest(courseId: string, column: string) {
  // Attempts carry submission and grading state
  // Blackboard keeps that separate from the column metadata
  const url = `${baseURL()}/learn/api/public/v2/courses/${courseId}/gradebook/columns/${column}/attempts`;
  return await getPaginatedRequestBlackboard<BlackboardAttempt>(
    url,
    'Blackboard attempts',
    true,
    BLACKBOARD_ATTEMPTS_CACHE_MS
  );
}

async function getAnnouncementsRequest(
  courseId: string,
  startDate: string,
  endDate: string
) {
  // Announcements are optional in the sidebar
  // Keep them on a separate path so the user filters can skip this work entirely
  const url = `${baseURL()}/learn/api/public/v1/courses/${courseId}/announcements?startDate=${startDate}&startDateCompare=between&startDateUntil=${endDate}`;
  return await getPaginatedRequestBlackboard<BlackboardAnnouncement>(
    url,
    'Blackboard announcements',
    true,
    BLACKBOARD_ANNOUNCEMENTS_CACHE_MS
  );
}

function parseAnnouncement(
  courseId: string,
  announcement: BlackboardAnnouncement
): FinalAssignment {
  // Normalize Blackboard announcements into the shared assignment model
  const res: FinalAssignment = {
    ...AssignmentDefaults,
    name: announcement.title,
    id: announcement.id,
    type: AssignmentType.ANNOUNCEMENT,
    html_url: `${baseURL()}/ultra/courses/${courseId}/announcements`,
    due_at: announcement.availability.duration.start,
    course_id: courseId,
    marked_complete: false,
  };

  return res;
}

function parseAssignment(
  courseId: string,
  col: BlackboardGradebookColumn
): FinalAssignment {
  // Start with the gradebook view of the item
  // Link and grading details are filled in later
  const assignment = {
    ...AssignmentDefaults,
    name: col.name,
    id: col.contentId + '', // content id
    plannable_id: col.id + '', // gradebook column id
    type: AssignmentType.ASSIGNMENT,
    html_url: '/',
    due_at: col.grading.due || '',
    course_id: courseId,
    submitted: false,
    graded: false,
    points_possible: col.score.possible,
    score: 0,
  };

  // Quizzes have the same internal structure as assignments, so I can't really differentiate them yet.
  if (col.scoreProviderHandle === 'resource/x-bb-forumlink')
    assignment.type = AssignmentType.DISCUSSION;

  return assignment;
}

async function updateAssignmentDetails(assignment: FinalAssignment) {
  // Fetch the clickable content link and grading state in parallel
  const [links, attempts] = await Promise.all([
    getAssignmentLink(assignment.course_id, assignment.id),
    getAttemptsRequest(assignment.course_id, assignment.plannable_id),
  ]);
  if ('links' in links && links.links.length) {
    const html = links.links.filter((l) => l.type === 'text/html');
    if (html.length) assignment.html_url = baseURL() + html[0].href;
  }
  if (attempts.length) {
    const attempt = attempts[0];
    if (attempt.status !== 'NotAttempted') assignment.submitted = true;
    if ('displayGrade' in attempt && attempt.displayGrade) {
      assignment.score = attempt.displayGrade.score;
      assignment.graded = true;
    }
  }

  return assignment;
}

async function collectAnnouncements(
  startDate: Date,
  endDate: Date,
  courses: Course[]
): Promise<FinalAssignment[]> {
  // Blackboard announcement dates are easiest to query with date-only bounds
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  const getAnnouncements = async (course: Course) => {
    const announcements = await getAnnouncementsRequest(
      course.id,
      startStr,
      endStr
    );
    return announcements.map((a) => parseAnnouncement(course.id, a));
  };
  const announcements: FinalAssignment[] = Array.prototype.concat(
    ...(await mapWithConcurrency(
      courses,
      BLACKBOARD_COURSE_REQUEST_CONCURRENCY,
      getAnnouncements
    ))
  );

  logBlackboardDiagnostics('announcements collected', {
    courses: courses.length,
    announcements: announcements.length,
    startDate: startStr,
    endDate: endStr,
  });

  return announcements;
}

function filterGradebookColumns(
  columns: BlackboardGradebookColumn[],
  options: Options
) {
  // Drop unsupported or unwanted Blackboard column types before doing any deeper work
  return columns.filter((column) => {
    if (column.grading.type !== 'Attempts') return false;
    if (
      options.blackboard_hide_courses_without_due_dates &&
      !column.grading.due
    )
      return false;
    if (
      options.blackboard_hide_discussions &&
      column.scoreProviderHandle === 'resource/x-bb-forumlink'
    )
      return false;
    return true;
  });
}

export function filterBlackboardAssignments(
  assignments: FinalAssignment[],
  options: Options
) {
  // Run the Blackboard-specific filters after all source lists are merged
  return assignments.filter((assignment) => {
    if (
      options.blackboard_hide_announcements &&
      assignment.type === AssignmentType.ANNOUNCEMENT
    )
      return false;
    if (
      options.blackboard_hide_discussions &&
      assignment.type === AssignmentType.DISCUSSION
    )
      return false;
    if (options.blackboard_show_only_graded && !assignment.graded) return false;
    return true;
  });
}

async function collectAssignments(
  startDate: Date,
  endDate: Date,
  courses: Course[],
  options: Options
): Promise<FinalAssignment[]> {
  // Pull columns per course first, then enrich only the items that survive the time window
  // This keeps link and attempt requests bounded to visible work
  const cols: BlackboardGradebookColumn[][] = await mapWithConcurrency(
    courses,
    BLACKBOARD_COURSE_REQUEST_CONCURRENCY,
    (course) => getGradebookColumnsRequest(course.id)
  );
  const assignments = Array.prototype.concat(
    ...cols.map((courseCols, i) =>
      filterGradebookColumns(courseCols, options).map((column) =>
        parseAssignment(courses[i].id, column)
      )
    )
  );
  const columnCount = cols.reduce(
    (total, courseCols) => total + courseCols.length,
    0
  );
  const filtered = filterTimeBounds(startDate, endDate, assignments);
  const updated = await mapWithConcurrency(
    filtered,
    BLACKBOARD_DETAIL_REQUEST_CONCURRENCY,
    (assignment) => updateAssignmentDetails(assignment)
  );
  logBlackboardDiagnostics('assignments collected', {
    courses: courses.length,
    gradebookColumns: columnCount,
    parsedAssignments: assignments.length,
    inWindowAssignments: filtered.length,
    detailedAssignments: updated.length,
    hideDiscussions: options.blackboard_hide_discussions,
    hideEmptyCourses: options.blackboard_hide_courses_without_due_dates,
  });
  return updated;
}
// calendars => gradebook columns => (filter) => gradebook column attempts

export default async function loadBlackboardAssignments(
  startDate: Date,
  endDate: Date,
  options: Options
) {
  /* Expand bounds by 1 day to account for possible time zone differences with api. */
  const st = new Date(startDate);
  st.setDate(startDate.getDate() - 1);
  const en = new Date(endDate);
  en.setDate(en.getDate() + 1);

  const courses = await loadBlackboardCourses();
  const includeAnnouncements =
    !options.blackboard_hide_announcements &&
    !options.blackboard_show_only_graded;

  logBlackboardDiagnostics('assignment load start', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    includeAnnouncements,
    courseCount: courses.length,
    gradedOnly: options.blackboard_show_only_graded,
    hideAnnouncements: options.blackboard_hide_announcements,
    hideDiscussions: options.blackboard_hide_discussions,
  });

  const assignmentSources = await Promise.all([
    // Keep each Blackboard source separate so diagnostics can show where the final list came from
    includeAnnouncements ? collectAnnouncements(st, en, courses) : [],
    collectAssignments(st, en, courses, options),
    loadCustomTasks('blackboard_custom'),
  ]);
  const assignments = filterBlackboardAssignments(
    Array.prototype.concat(...assignmentSources),
    options
  );
  const marked = await applyCustomOverrides(assignments, 'blackboard_custom');
  const processed = processAssignmentList(
    marked,
    startDate,
    endDate,
    options,
    BlackboardLMSConfig.onCoursePage,
    BlackboardLMSConfig.dashCourses(courses)
  );
  logBlackboardDiagnostics('assignment load complete', {
    sourceGroups: assignmentSources.map((group) => group.length),
    mergedAssignments: assignments.length,
    processedAssignments: processed.length,
  });
  return processed;
}
