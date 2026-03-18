interface Course {
  id: string;
  color: string; // via dashboard colors request
  name: string; // via course code for now, may change to chosen names
  original_name?: string; // preserved when a custom course name is set
  position: number; // via dashboard positions request
  course_code?: string;
  access_restricted_by_date?: boolean;
}

export default Course;
