import { Course } from '../../types';
import { useEffect, useMemo, useState } from 'react';
import { UseCoursesHookInterface } from '../../types/config';
import { THEME_COLOR } from '../../constants';

export const makeUseCourses = (loader: () => Promise<Course[]>) => {
  return (defaultColor?: string) => {
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [state, setState] = useState<
      Omit<UseCoursesHookInterface, 'data'>
    >({
      isError: false,
      isSuccess: false,
      errorMessage: '',
    });

    // Keep the synthetic course local to the hook result
    // Accent color changes should only repaint this one row instead of reloading Blackboard
    const customCourse = useMemo<Course>(
      () => ({
        id: '0',
        color: defaultColor || THEME_COLOR,
        position: 0,
        name: 'Custom Task',
        course_code: 'Custom Task',
      }),
      [defaultColor]
    );

    // Merge the real Blackboard courses with the local synthetic row
    // This keeps the network state stable while still letting the UI react to theme changes
    const data = useMemo(() => {
      if (!courses) return null;
      return [customCourse].concat(courses);
    }, [courses, customCourse]);

    useEffect(() => {
      let active = true;

      loader()
        .then((res) => {
          if (!active) return;
          // Store only the real Blackboard response here
          // The synthetic custom-task row is derived above so color-only changes stay in memory
          setCourses(res);
          setState({
            isSuccess: true,
            isError: false,
            errorMessage: '',
          });
        })
        .catch((err) => {
          if (!active) return;
          console.error(err);
          // Drop stale course data on failure so the UI does not keep showing a mixed old state
          setCourses(null);
          setState({
            isSuccess: false,
            isError: true,
            errorMessage: err.message,
          });
        });
      return () => {
        active = false;
      };
      // Only the loader should decide when Blackboard data is refreshed
      // UI-only values like the custom accent color are handled by the memo above
    }, []);

    return {
      ...state,
      data,
    };
  };
};
