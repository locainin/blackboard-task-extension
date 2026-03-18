function readCourseIdFromCurrentUrl(url: URL): string | false {
  const ultraCourse = url.pathname.match(/\/ultra\/courses\/([^/]+)/);
  if (ultraCourse?.[1]) return decodeURIComponent(ultraCourse[1]);

  // Original Blackboard pages usually keep the course in a query param
  const legacyCourse =
    url.searchParams.get('course_id') || url.searchParams.get('courseId');
  if (legacyCourse) return legacyCourse;

  return false;
}

export function getBlackboardCourseId(urlString: string): string | false {
  return readCourseIdFromCurrentUrl(new URL(urlString));
}

export default function onCoursePageBlackboard(): false | string {
  return getBlackboardCourseId(window.location.href);
}
