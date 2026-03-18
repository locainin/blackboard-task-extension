import React, { useEffect, useMemo, useState } from 'react';
import CourseDropdown from '../course-dropdown';
import TaskChart from '../task-chart';
import TaskList from '../task-list';
import { Course, FinalAssignment, Options } from '../../types';
import extractCourses from './utils/extractCourses';
import {
  filterCourses,
  filterTimeBounds,
} from '../../plugins/shared/useAssignments';
import { AssignmentStatus } from '../../types/assignment';
import { OptionsDefaults } from '../../constants';
import {
  CourseStoreContext,
  DarkContext,
  ExperimentsContext,
  LMSContext,
} from '../../contexts/contexts';
import { useNewCourseStore } from '../../hooks/useCourseStore';
import { useExperiments } from '../../hooks/useExperiment';
import { useNewAssignmentStore } from '../../hooks/useAssignmentStore';
import { LMSConfig } from '../../types/config';

export interface TaskContainerProps {
  assignments: FinalAssignment[];
  announcements: FinalAssignment[];
  loading?: boolean;
  courseId?: string | false;
  courseData: Course[]; // all courses, for corner case when on course page w/ no assignments
  options: Options;
  startDate: Date;
  endDate: Date;
  lms: LMSConfig;
}

/*
  Main app component that renders all async content
*/

function TaskContainer({
  announcements,
  assignments,
  courseId,
  courseData,
  loading,
  options,
  startDate,
  endDate,
  lms,
}: TaskContainerProps): JSX.Element {
  const courseStore = useNewCourseStore(
    courseData,
    lms.dashCourses(courseData),
    lms.storageKey
  );
  const courseList = Object.keys(courseStore.state);
  /* IMPORTANT
    I'm not sure if assigment and announcement ids could collide, so I'm using two separate stores.
    A better solution might be using plannable_id as the unique key or, even better, assigning my own unique keys.
  */
  const assignmentStore = useNewAssignmentStore(lms, assignments);
  const announcementStore = useNewAssignmentStore(lms, announcements);
  const [delayLoad, setDelayLoad] = useState(false); // assignmentStore updates one tick after loading for TaskList, so this makes it consistent
  useEffect(() => {
    if (loading) setDelayLoad(true);
  }, [loading]);

  useEffect(() => {
    assignmentStore.newPage(assignments);
  }, [assignments]);
  useEffect(() => announcementStore.newPage(announcements), [announcements]);
  useEffect(() => courseStore.newPage(courseData), [courseData]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courseList && courseId ? courseId : ''
  );
  const themeColor = options.theme_color || OptionsDefaults.theme_color;

  const updatedAssignments = useMemo(() => {
    setDelayLoad(false);
    let res = Object.values(assignmentStore.state);
    if (courseId) res = filterCourses([courseId], res);
    return filterTimeBounds(
      startDate,
      endDate,
      res,
      true,
      options.show_long_overdue
    );
  }, [assignmentStore.assignmentList, courseId]);
  const updatedAnnouncements = useMemo(() => {
    if (courseId)
      return filterCourses([courseId], Object.values(announcementStore.state));
    return Object.values(announcementStore.state);
  }, [announcementStore.assignmentList, courseId]);
  // force the chart to update each week, but make sure the key updates in sync with assignments
  const weekKey = useMemo(() => startDate.toISOString(), [updatedAssignments]);

  function markAssignmentAs(id: string, status: AssignmentStatus) {
    if (id in announcementStore.state)
      announcementStore.updateAssignment(announcementStore.state[id], status);
    else assignmentStore.updateAssignment(assignmentStore.state[id], status);
  }

  async function createNewAssignment(
    assignment: FinalAssignment | FinalAssignment[]
  ) {
    assignmentStore.createAssignment(
      Array.isArray(assignment) ? assignment : [assignment]
    );
  }

  // only assignments in bounds (not rolled over from past weeks) unless needs grading (instructor)
  const chartAssignments = useMemo(() => {
    return updatedAssignments.filter((assignment) => {
      if (assignment.needs_grading_count) return true;
      const due_date = new Date(assignment.due_at);
      return (
        due_date.valueOf() >= startDate.valueOf() &&
        due_date.valueOf() < endDate.valueOf()
      );
    });
  }, [updatedAssignments]);

  // keep the chart focused on courses that actually affect the rings
  const chartCourses: string[] = useMemo(() => {
    if (courseList && courseId !== false)
      return courseId ? courseList.filter((c) => c === courseId) : [];
    // get only the courses with assignments
    const extracted = extractCourses(chartAssignments);
    const skipBlackboardCoursePadding =
      lms.name === 'Blackboard' &&
      options.blackboard_hide_courses_without_due_dates;
    // if showing all dashboard courses, add the courses with no assignments
    if (options.dash_courses && courseList && !skipBlackboardCoursePadding) {
      const inExtracted = new Set();
      extracted.forEach((id) => inExtracted.add(id));
      const dash = courseStore.dashCourses;
      return dash
        ? extracted.concat(
            courseList.filter((c) => dash.has(c) && !inExtracted.has(c))
          )
        : extracted;
    }
    return extracted;
  }, [chartAssignments, courseId, courseList]);

  // keep the filter menu stable even when the current window has no chart data
  const selectableCourseIds = useMemo(() => {
    if (courseList && courseId !== false)
      return courseId ? courseList.filter((c) => c === courseId) : [];

    const dash = courseStore.dashCourses;
    if (options.dash_courses && dash) {
      const visibleDashCourses = courseList.filter((id) => dash.has(id));
      if (visibleDashCourses.length) return visibleDashCourses;
    }

    return courseList;
  }, [courseId, courseList, courseStore.dashCourses, options.dash_courses]);

  const filterDropdownChoices = useMemo(() => {
    // The synthetic custom-task course is useful in forms
    // It should not replace the course filter header in the main sidebar
    return courseStore
      .getCourseList(selectableCourseIds)
      .filter((course) => course.id !== '0');
  }, [courseStore, selectableCourseIds]);

  // Don't let user switch courses when on a course page
  const chosenCourseId = courseId ? courseId : selectedCourseId;

  const exp = useExperiments();

  return (
    <DarkContext.Provider value={options.dark_mode}>
      <LMSContext.Provider value={lms}>
        <CourseStoreContext.Provider value={courseStore}>
          <ExperimentsContext.Provider value={exp}>
            <CourseDropdown
              choices={filterDropdownChoices}
              maxHeight={320}
              onCoursePage={!!courseId}
              selectedId={chosenCourseId}
              setChoice={setSelectedCourseId}
              zIndex={120}
            />
            {options.show_rings ? (
              <TaskChart
                assignments={chartAssignments}
                colorOverride={
                  courseId && chartCourses[0] in courseStore.state
                    ? courseStore.state[chartCourses[0]].color
                    : undefined
                }
                courses={chartCourses}
                loading={loading}
                onCoursePage={!!courseId}
                selectedCourseId={chosenCourseId}
                setCourse={setSelectedCourseId}
                showConfetti={options.show_confetti}
                themeColor={themeColor}
                weekKey={weekKey}
              />
            ) : (
              <div style={{ height: '10px' }} />
            )}
            <TaskList
              announcements={updatedAnnouncements}
              assignments={updatedAssignments}
              createAssignment={createNewAssignment}
              loading={loading || delayLoad}
              markAssignment={markAssignmentAs}
              selectedCourseId={chosenCourseId}
              showConfetti={options.show_confetti}
              showDateHeadings={options.due_date_headings}
              weekKey={weekKey}
            />
          </ExperimentsContext.Provider>
        </CourseStoreContext.Provider>
      </LMSContext.Provider>
    </DarkContext.Provider>
  );
}

// Let React watch the full prop set here
// Option changes like dark mode need to flow through the full task surface immediately
export default React.memo(TaskContainer);
