import React, { useContext, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AssignmentDefaults, OptionsDefaults } from '../../constants';
import useOptions from '../../hooks/useOptions';
import { CheckIcon } from '../../icons';
import { AssignmentType, FinalAssignment } from '../../types';
import { DarkProps } from '../../types/props';
import CourseDropdown from '../course-dropdown';
import Button from './components/Button';
import DatePick from './components/DatePick';
import RecurCheckbox from './components/RecurCheckbox';
import TextInput from './components/TextInput';
import TimePick from './components/TimePick';
import useCourseStore from '../../hooks/useCourseStore';
import { LMSContext } from '../../contexts/contexts';

type FormContainerProps = {
  visible?: boolean;
};

const FormContainer = styled.div<FormContainerProps>`
  display: ${(props) => (props.visible ? 'flex' : 'none')};
  position: absolute;
  z-index: 1000;
  width: 100%;
  right: 0;
  left: 0;
  top: 100px;
  justify-content: center;
  align-items: center;
`;

const Form = styled.div<DarkProps>`
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(18, 24, 40, 0.98) 0%, rgba(15, 22, 38, 0.98) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 254, 0.98) 100%)'};
  box-shadow: ${(props) =>
    props.dark
      ? '0 28px 54px rgba(0, 0, 0, 0.34)'
      : '0 22px 42px rgba(31, 49, 88, 0.14)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
  border-radius: 24px;
  display: flex;
  width: 100%;
  padding: 18px;
  flex-direction: column;
`;

const FormTitle = styled.div`
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
`;

const FormItem = styled.div`
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
`;

const ErrorMessage = styled.div`
  color: #ec412d;
  padding: 5px 0px;
`;

type Props = {
  close: () => void;
  grading: boolean;
  onSubmit?: (assignment: FinalAssignment | FinalAssignment[]) => void;
  selectedCourse?: string;
  visible?: boolean;
};

export default function TaskForm({
  close,
  grading,
  onSubmit,
  selectedCourse,
  visible = false,
}: Props): JSX.Element {
  const lms = useContext(LMSContext);
  const courseStore = useCourseStore();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTime, setSelectedTime] = useState('1439');
  const [recurrences, setRecurrences] = useState(1);
  const { state: options } = useOptions();

  const themeColor = options?.theme_color || OptionsDefaults.theme_color;

  const coursesWithoutCustom = useMemo(() => {
    if (options?.dash_courses) {
      const dash = courseStore.dashCourses;
      if (dash)
        return Object.keys(courseStore.state).filter((c) => dash.has(c));
    }
    return Object.keys(courseStore.state).filter((c) => c !== '' && c !== '0');
  }, [courseStore.state, options]);

  const titleLabel = 'Title';
  const dateLabel = 'Due Date';
  const linkLabel = 'URL (optional)';
  const courseLabel = 'Course (optional)';
  const [errorMessage, setErrorMessage] = useState('');

  function setSelected(date?: Date) {
    setSelectedDate(date);
  }

  // const coursePage = onCoursePage();
  const [selectedCourseId, setSelectedCourseId] = useState(
    selectedCourse || ''
  );

  async function submit() {
    setErrorMessage('');
    const recurringAssignments = [];
    const RECUR_DELTA = 7; // num days to recur
    for (let i = 0; i < recurrences; i++) {
      const assignment: FinalAssignment = {
        ...AssignmentDefaults,
      } as FinalAssignment;
      assignment.name = title;
      const dueDate = new Date(
        (selectedDate ? selectedDate?.valueOf() : new Date().valueOf()) +
          i * (RECUR_DELTA * 24 * 60 * 60 * 1000)
      );
      dueDate.setHours(parseInt(selectedTime) / 60);
      dueDate.setMinutes(parseInt(selectedTime) % 60);
      dueDate.setSeconds(0);
      assignment.due_at = dueDate.toISOString();
      assignment.course_id =
        selectedCourseId === ''
          ? AssignmentDefaults.course_id
          : selectedCourseId;
      assignment.type = AssignmentType.NOTE;
      assignment.id = '' + Math.floor(1000000 * Math.random());
      assignment.needs_grading_count = grading ? 1 : 0;
      assignment.total_submissions = grading ? 1 : 0;
      assignment.html_url = link.trim();

      const res = await lms.createAssignment(
        title,
        assignment.due_at,
        assignment.course_id,
        grading,
        link.trim()
      );
      if (!res) {
        setErrorMessage(
          'An error occurred. Make sure you have cookies enabled.'
        );
      } else {
        assignment.id =
          res && !!res.id ? res.id.toString() : assignment.id.toString();
        assignment.plannable_id = assignment.id.toString(); // for marking completing right after creating
      }
      recurringAssignments.push(assignment);
    }

    if (onSubmit) onSubmit(recurringAssignments);
    close();
  }

  const darkMode = !!options?.dark_mode;
  return (
    <FormContainer visible={visible}>
      <Form dark={darkMode}>
        <FormItem>
          <FormTitle>
            {titleLabel}
            <CheckIcon checkStyle="X" dark={darkMode} onClick={close} />
          </FormTitle>
          <TextInput
            color={themeColor}
            dark={darkMode}
            onChange={setTitle}
            value={title}
          />
        </FormItem>
        <FormItem>
          <FormTitle>{dateLabel}</FormTitle>
          <DatePick
            color={themeColor}
            dark={darkMode}
            selected={selectedDate}
            setSelected={setSelected}
          />
        </FormItem>
        <FormItem>
          <TimePick
            color={themeColor}
            dark={darkMode}
            selected={selectedTime}
            setSelected={setSelectedTime}
          />
        </FormItem>
        <FormItem>
          <FormTitle>{linkLabel}</FormTitle>
          <TextInput
            color={themeColor}
            dark={darkMode}
            onChange={setLink}
            value={link}
          />
        </FormItem>
        <FormItem>
          <RecurCheckbox
            color={themeColor}
            dark={darkMode}
            recurrences={recurrences}
            setRecurrences={setRecurrences}
          />
        </FormItem>
        <FormItem>
          <FormTitle>{courseLabel}</FormTitle>
          <CourseDropdown
            choices={courseStore.getCourseList(coursesWithoutCustom)}
            defaultColor={themeColor}
            defaultOption="None"
            instructureStyle
            onCoursePage={selectedCourse !== '0' && !!selectedCourse}
            selectedId={selectedCourseId}
            setChoice={setSelectedCourseId}
          />
        </FormItem>
        <FormItem>
          <Button
            color={themeColor}
            dark={darkMode}
            disabled={!title}
            label="Save"
            onClick={submit}
          />
        </FormItem>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Form>
    </FormContainer>
  );
}
