import { getBlackboardCourseId } from './onCoursePage';

describe('getBlackboardCourseId', () => {
  it('reads the course id from ultra course routes', () => {
    expect(
      getBlackboardCourseId(
        'https://example.edu/ultra/courses/_123_1/cl/outline'
      )
    ).toBe('_123_1');
  });

  it('reads the course id from original blackboard pages', () => {
    expect(
      getBlackboardCourseId(
        'https://example.edu/webapps/blackboard/execute/courseMain?course_id=_456_1'
      )
    ).toBe('_456_1');
  });

  it('returns false outside course pages', () => {
    expect(getBlackboardCourseId('https://example.edu/ultra/institution-page')).toBe(
      false
    );
  });
});
