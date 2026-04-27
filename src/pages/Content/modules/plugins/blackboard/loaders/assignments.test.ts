import { AssignmentDefaults, OptionsDefaults } from '../../../constants';
import { AssignmentType, FinalAssignment } from '../../../types';
import {
  filterBlackboardAssignments,
  updateAssignmentDetails,
} from './assignments';
import { resetBlackboardRequestCache } from './requestCache';

function makeAssignment(
  type: AssignmentType,
  overrides: Partial<FinalAssignment> = {}
): FinalAssignment {
  return {
    ...AssignmentDefaults,
    id: `${type}-${overrides.id || '1'}`,
    plannable_id: `${type}-plan-${overrides.id || '1'}`,
    type,
    ...overrides,
  };
}

describe('filterBlackboardAssignments', () => {
  const sample = [
    makeAssignment(AssignmentType.ANNOUNCEMENT),
    makeAssignment(AssignmentType.DISCUSSION, { id: '2' }),
    makeAssignment(AssignmentType.ASSIGNMENT, { id: '3', graded: true }),
    makeAssignment(AssignmentType.ASSIGNMENT, { id: '4', graded: false }),
  ];

  it('removes announcements and discussions when blackboard filters ask for it', () => {
    const res = filterBlackboardAssignments(sample, {
      ...OptionsDefaults,
      blackboard_hide_announcements: true,
      blackboard_hide_discussions: true,
    });

    expect(res.map((assignment) => assignment.id)).toStrictEqual(['3', '4']);
  });

  it('keeps only graded items when blackboard graded-only mode is enabled', () => {
    const res = filterBlackboardAssignments(sample, {
      ...OptionsDefaults,
      blackboard_show_only_graded: true,
    });

    expect(res.map((assignment) => assignment.id)).toStrictEqual(['3']);
  });
});

describe('updateAssignmentDetails', () => {
  const mockedFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockedFetch as typeof fetch;
  });

  beforeEach(() => {
    mockedFetch.mockReset();
    resetBlackboardRequestCache();
  });

  function jsonResponse(body: string, ok = true, status = 200): Response {
    return {
      ok,
      status,
      statusText: ok ? 'OK' : 'Not Found',
      redirected: false,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      text: async () => body,
    } as Response;
  }

  function makeBlackboardAssignment(
    overrides: Partial<FinalAssignment> = {}
  ): FinalAssignment {
    return makeAssignment(AssignmentType.ASSIGNMENT, {
      id: 'content-1',
      plannable_id: 'column-1',
      course_id: 'course-1',
      due_at: '2026-04-27T12:00:00.000Z',
      html_url: '/',
      ...overrides,
    });
  }

  it('keeps an assignment when Blackboard no longer exposes its content link', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse('{"message":"missing"}', false, 404))
      .mockResolvedValueOnce(
        jsonResponse(
          '{"results":[{"id":"attempt-1","status":"Completed","exempt":false,"displayGrade":{"score":9}}]}'
        )
      );

    const res = await updateAssignmentDetails(makeBlackboardAssignment());

    expect(res.html_url).toBe('/');
    expect(res.submitted).toBe(true);
    expect(res.graded).toBe(true);
    expect(res.score).toBe(9);
  });

  it('keeps an assignment when Blackboard no longer exposes attempt details', async () => {
    mockedFetch
      .mockResolvedValueOnce(
        jsonResponse(
          '{"links":[{"href":"/ultra/courses/course-1/x","type":"text/html"}]}'
        )
      )
      .mockResolvedValueOnce(jsonResponse('{"message":"missing"}', false, 404));

    const res = await updateAssignmentDetails(makeBlackboardAssignment());

    expect(res.html_url).toBe('http://localhost/ultra/courses/course-1/x');
    expect(res.submitted).toBe(false);
    expect(res.graded).toBe(false);
  });
});
