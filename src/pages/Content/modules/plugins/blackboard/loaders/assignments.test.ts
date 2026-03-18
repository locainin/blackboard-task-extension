import { AssignmentDefaults, OptionsDefaults } from '../../../constants';
import { AssignmentType, FinalAssignment } from '../../../types';
import { filterBlackboardAssignments } from './assignments';

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
