// Immutable task model used by the Blackboard loaders and UI
interface FinalAssignment {
  // color: string; // color assigned to course
  html_url: string; // link to assignment page
  name: string; // title of assignment
  points_possible: number;
  due_at: string;
  course_id: string; // course the assignment belongs to
  id: string; // id of the assignment
  plannable_id: string; // id of planner item for marking complete
  override_id?: string; // id of existing planner override
  submitted: boolean; // has the user submitted it?
  graded: boolean; // has the teacher graded it?
  graded_at: string; // date the teacher graded (if graded)
  score: number; // grade assigned, 0 if ungraded or unsubmitted
  grade?: string; // grade displayed (letter scale or point scale)
  type: AssignmentType;
  // course_name: string; // via useCourseName
  marked_complete: boolean; // marked complete in the sidebar or through the planner
  // position: number;
  needs_grading_count?: number;
  total_submissions?: number;
}

// possible values from plannable_type field
enum AssignmentType {
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  DISCUSSION = 'discussion_topic',
  NOTE = 'planner_note',
  ANNOUNCEMENT = 'announcement',
  EVENT = 'calender_event',
}

enum AssignmentStatus {
  UNFINISHED = 'unfinished',
  COMPLETE = 'complete',
  DELETED = 'deleted',
  SEEN = 'seen',
}

export {
  FinalAssignment,
  AssignmentType,
  AssignmentStatus,
};
