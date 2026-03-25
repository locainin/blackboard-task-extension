import { Course } from '../../../types';
import baseURL from '../../../utils/baseURL';
import { loadCustomColorsWithDefaults } from '../../shared/customColors';
import fetchBlackboardJson from './fetchJson';
import { logBlackboardDiagnostics } from '../utils/diagnostics';

const BLACKBOARD_COURSE_CACHE_MS = 5 * 60 * 1000;

type PaginatedAPIResponse<T> = {
  results: T[];
  paging?: {
    nextPage: string;
  };
};

export async function getPaginatedRequestBlackboard<T>(
  url: string,
  context: string,
  recurse = false,
  cacheTtlMs = 0
): Promise<T[]> {
  // Blackboard pagination uses a nextPage link instead of page numbers
  // Follow that chain until the API stops sending another page
  const res = await fetchBlackboardJson<PaginatedAPIResponse<T>>(
    url,
    context,
    {
      cacheTtlMs,
    }
  );
  if (recurse && 'paging' in res && res.paging) {
    return res.results.concat(
      await getPaginatedRequestBlackboard(
        res.paging.nextPage,
        context,
        true,
        cacheTtlMs
      )
    );
  }
  return res.results;
}

export type BlackboardCalendarItemType = '';

type BlackboardCalendar = {
  id: string;
  name: string;
};

async function getCourseColors(
  courses: string[]
): Promise<Record<string, string>> {
  // Keep course colors stable even when Blackboard does not expose one
  const colors = await loadCustomColorsWithDefaults(
    'blackboard_custom',
    courses
  );

  return colors;
}

export default async function loadBlackboardCourses() {
  // The calendars endpoint is the most reliable way to discover visible Blackboard courses
  const res = await getPaginatedRequestBlackboard<BlackboardCalendar>(
    `${baseURL()}/learn/api/public/v1/calendars`,
    'Blackboard course list',
    true,
    BLACKBOARD_COURSE_CACHE_MS
  );

  const filteredCourses = res.filter(
    (c) => c.id !== 'INSTITUTION' && c.id !== 'PERSONAL'
  );

  logBlackboardDiagnostics('courses loaded', {
    totalCalendars: res.length,
    filteredCourses: filteredCourses.length,
  });

  const colors = await getCourseColors(filteredCourses.map((c) => c.id));

  const courses: Course[] = filteredCourses.map((c) => {
    // Blackboard calendar names often look like "CODE: Course Name"
    // Split once so the sidebar can show a shorter title and still keep the code
    const cnameSplit = c.name.split(': ');
    return {
      id: c.id,
      color: colors[c.id],
      name:
        cnameSplit.length === 1
          ? cnameSplit[0]
          : cnameSplit.slice(1).join(': '),
      course_code: cnameSplit[0],
      position: 0,
    };
  });

  logBlackboardDiagnostics('courses mapped', {
    courseIds: courses.map((course) => course.id),
  });
  return courses;
}
