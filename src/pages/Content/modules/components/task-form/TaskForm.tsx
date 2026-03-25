import React, { useContext, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
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

type FrameRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const FormContainer = styled.div<{ $frameRect: FrameRect }>`
  position: fixed;
  z-index: 2147483000;
  top: ${(props) => `${props.$frameRect.top}px`};
  left: ${(props) => `${props.$frameRect.left}px`};
  width: ${(props) => `${props.$frameRect.width}px`};
  height: ${(props) => `${props.$frameRect.height}px`};
  padding: 14px;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  display: flex;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(7, 11, 20, 0.3) 0%,
    rgba(7, 11, 20, 0.42) 100%
  );
  backdrop-filter: blur(10px);
`;

const Form = styled.div<DarkProps>`
  box-sizing: border-box;
  position: relative;
  min-width: 0;
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(25, 33, 50, 0.99) 0%, rgba(18, 25, 40, 0.995) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 254, 0.98) 100%)'};
  box-shadow: ${(props) =>
    props.dark
      ? '0 32px 60px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.045)'
      : '0 22px 42px rgba(31, 49, 88, 0.14)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.085)' : 'rgba(15, 23, 42, 0.08)'};
  border-radius: 24px;
  display: flex;
  width: min(100%, 292px);
  max-width: 100%;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 18px 16px 16px;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  // Use soft top and bottom fades instead of a native scrollbar
  // This keeps the panel looking like a modal instead of a nested web page
  &::before,
  &::after {
    content: '';
    position: sticky;
    left: 0;
    right: 0;
    display: block;
    height: 18px;
    pointer-events: none;
    z-index: 4;
  }

  &::before {
    top: 0;
    margin-bottom: -18px;
    background: linear-gradient(
      180deg,
      ${(props) =>
          props.dark ? 'rgba(25, 33, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
        0%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  &::after {
    bottom: 0;
    margin-top: -18px;
    background: linear-gradient(
      0deg,
      ${(props) =>
          props.dark ? 'rgba(18, 25, 40, 0.99)' : 'rgba(248, 250, 254, 0.98)'}
        0%,
      rgba(0, 0, 0, 0) 100%
    );
  }
`;

const FormHeader = styled.div<DarkProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 2px;
  border-bottom: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)'};
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const FormTitle = styled.div<DarkProps>`
  color: ${(props) => (props.dark ? 'rgba(240, 245, 255, 0.96)' : '#172033')};
  font-size: 20px;
  font-weight: 780;
  letter-spacing: -0.03em;
  line-height: 1;
`;

const FormIntro = styled.div<DarkProps>`
  color: ${(props) => (props.dark ? 'rgba(168, 183, 208, 0.74)' : '#6f7d95')};
  font-size: 12px;
  font-weight: 560;
  line-height: 1.35;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 14px;
  min-width: 0;
`;

const FormItem = styled.div<DarkProps>`
  // Keep the wrapper quiet, but use spacing so each field still reads as its own unit
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
`;

const FieldLabel = styled.div<DarkProps>`
  color: ${(props) => (props.dark ? 'rgba(234, 241, 251, 0.96)' : '#24324a')};
  font-size: 13px;
  font-weight: 760;
  letter-spacing: -0.01em;
`;

const ErrorMessage = styled.div`
  color: #ec412d;
  padding: 2px 4px 0;
  font-size: 13px;
  font-weight: 650;
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
  // Keep the toggle separate from the span count
  // This lets the form offer "1 Week" without forcing repeat mode on
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [recurrences, setRecurrences] = useState(2);
  // Resume from the first week that did not save yet
  // This keeps a retry from recreating the weeks that already succeeded
  const [retryStartIndex, setRetryStartIndex] = useState(0);
  const [frameRect, setFrameRect] = useState<FrameRect | null>(null);
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
  const timeLabel = 'Time';
  const linkLabel = 'URL (optional)';
  const courseLabel = 'Course (optional)';
  const formTitleLabel = 'New Task';
  const formIntroLabel = 'Add a reminder beside Blackboard work';
  const [errorMessage, setErrorMessage] = useState('');

  function setSelected(date?: Date) {
    setSelectedDate(date);
  }

  function stopFormClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  const [selectedCourseId, setSelectedCourseId] = useState(
    selectedCourse || ''
  );

  async function submit() {
    setErrorMessage('');
    const recurringAssignments = [];
    const RECUR_DELTA = 7; // num days to recur
    const totalAssignments = repeatEnabled ? recurrences : 1;

    // The repeat toggle controls whether extra weekly copies are created
    // The week count stays separate so "1 Week" can exist without forcing the toggle on
    for (let i = retryStartIndex; i < totalAssignments; i++) {
      const assignment: FinalAssignment = {
        ...AssignmentDefaults,
      } as FinalAssignment;
      assignment.name = title;
      const dueDate = new Date(
        (selectedDate ? selectedDate?.valueOf() : new Date().valueOf()) +
          i * (RECUR_DELTA * 24 * 60 * 60 * 1000)
      );
      // Each repeated task starts from the same chosen date
      // Only the weekly offset changes between copies
      dueDate.setHours(parseInt(selectedTime) / 60);
      dueDate.setMinutes(parseInt(selectedTime) % 60);
      dueDate.setSeconds(0);
      assignment.due_at = dueDate.toISOString();
      assignment.course_id =
        selectedCourseId === ''
          ? AssignmentDefaults.course_id
          : selectedCourseId;
      assignment.type = AssignmentType.NOTE;
      // Use the same id strategy as the shared custom-task path
      // This avoids weak placeholder ids while the real Blackboard id is loading
      assignment.id = crypto.randomUUID();
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
        // Move the retry cursor to the first week that still needs to save
        // This keeps a retry from duplicating the weeks that already finished
        setRetryStartIndex(i);
        setErrorMessage(
          recurringAssignments.length
            ? 'Some weekly tasks were saved before the request failed. Retry will save only the remaining weeks.'
            : 'An error occurred. Make sure you have cookies enabled.'
        );
        // Keep any tasks that were already created in this batch
        // The form stays open so the failed save can be seen and retried
        if (recurringAssignments.length && onSubmit)
          onSubmit(recurringAssignments);
        return;
      }
      assignment.id = res.id ? res.id.toString() : assignment.id.toString();
      // Keep the ids aligned with the created task before the store sees it
      // This avoids a stale placeholder id hanging around after save
      assignment.plannable_id = assignment.id.toString();
      recurringAssignments.push(assignment);
    }

    // Reset the retry cursor once the whole batch is finished
    // The next submit should start from the first week again
    setRetryStartIndex(0);
    if (onSubmit) onSubmit(recurringAssignments);
    close();
  }

  const darkMode = !!options?.dark_mode;
  useEffect(() => {
    if (!visible) {
      // Clear partial-submit state when the sheet closes
      // A fresh open should always start from the first week
      setRetryStartIndex(0);
      setErrorMessage('');
    }
  }, [visible]);

  useEffect(() => {
    // Any field edit changes what the next batch should look like
    // Drop the retry cursor so a later save matches the current form values
    setRetryStartIndex(0);
  }, [
    grading,
    link,
    recurrences,
    repeatEnabled,
    selectedCourseId,
    selectedDate,
    selectedTime,
    title,
  ]);

  useEffect(() => {
    if (!visible) return;

    function updateFrameRect() {
      // Anchor the modal to the sidebar shell instead of the task list
      // That keeps the sheet centered in the panel and out of the list scroll path
      const shell = document.getElementById('tfc-wall-sina');
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      setFrameRect({
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      });
    }

    updateFrameRect();
    window.addEventListener('resize', updateFrameRect);
    window.addEventListener('scroll', updateFrameRect, true);
    window.visualViewport?.addEventListener('resize', updateFrameRect);
    window.visualViewport?.addEventListener('scroll', updateFrameRect);

    return () => {
      window.removeEventListener('resize', updateFrameRect);
      window.removeEventListener('scroll', updateFrameRect, true);
      window.visualViewport?.removeEventListener('resize', updateFrameRect);
      window.visualViewport?.removeEventListener('scroll', updateFrameRect);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    // Lock page scrolling while the task sheet is open
    // This keeps the background scrollbar from showing through the modal edge
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [visible]);

  if (!visible || !frameRect) return null;

  return ReactDOM.createPortal(
    <FormContainer $frameRect={frameRect} onClick={close}>
      {/* Stop backdrop clicks from leaking into the form body */}
      <Form dark={darkMode} onClick={stopFormClick}>
        <FormHeader dark={darkMode}>
          <HeaderCopy>
            <FormTitle dark={darkMode}>{formTitleLabel}</FormTitle>
            <FormIntro dark={darkMode}>{formIntroLabel}</FormIntro>
          </HeaderCopy>
          <div>
            <CheckIcon checkStyle="X" dark={darkMode} onClick={close} />
          </div>
        </FormHeader>

        <FormGrid>
          <FormItem dark={darkMode}>
            <FieldLabel dark={darkMode}>{titleLabel}</FieldLabel>
            <TextInput
              color={themeColor}
              dark={darkMode}
              onChange={setTitle}
              value={title}
            />
          </FormItem>
          <FormItem dark={darkMode}>
            <FieldLabel dark={darkMode}>{dateLabel}</FieldLabel>
            <DatePick
              color={themeColor}
              dark={darkMode}
              selected={selectedDate}
              setSelected={setSelected}
            />
          </FormItem>
          <FormItem dark={darkMode}>
            <FieldLabel dark={darkMode}>{timeLabel}</FieldLabel>
            <TimePick
              color={themeColor}
              dark={darkMode}
              selected={selectedTime}
              setSelected={setSelectedTime}
            />
          </FormItem>

          <FormItem dark={darkMode}>
            <FieldLabel dark={darkMode}>{linkLabel}</FieldLabel>
            <TextInput
              color={themeColor}
              dark={darkMode}
              onChange={setLink}
              value={link}
            />
          </FormItem>

          <FormItem dark={darkMode}>
            <RecurCheckbox
              color={themeColor}
              dark={darkMode}
              enabled={repeatEnabled}
              recurrences={recurrences}
              setEnabled={setRepeatEnabled}
              setRecurrences={setRecurrences}
            />
          </FormItem>

          <FormItem dark={darkMode}>
            <FieldLabel dark={darkMode}>{courseLabel}</FieldLabel>
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

          <Button
            color={themeColor}
            dark={darkMode}
            disabled={!title}
            label="Save"
            onClick={submit}
          />
        </FormGrid>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Form>
    </FormContainer>,
    document.body
  );
}
