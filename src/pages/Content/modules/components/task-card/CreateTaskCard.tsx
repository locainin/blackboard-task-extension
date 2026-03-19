import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { TaskLeft, TaskLink } from './TaskCard';
import PlusIcon from '../../icons/plus';
import { FinalAssignment } from '../../types';
import TaskForm from '../task-form/TaskForm';
import { DarkContext } from '../../contexts/contexts';
import { DarkProps } from '../../types/props';

export const TaskContainer = styled.div<DarkProps>`
  width: 100%;
  height: 60px;
  margin: 14px 0px 8px 0px;
  padding: 6px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: stretch;
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(21, 29, 46, 0.96) 0%, rgba(16, 23, 38, 0.98) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 254, 0.96) 100%)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
  box-shadow: ${(props) =>
    props.dark
      ? '0 18px 34px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      : '0 16px 30px rgba(31, 49, 88, 0.08)'};
  &:hover {
    border-color: ${(props) =>
      props.dark ? 'rgba(134, 161, 222, 0.24)' : 'rgba(79, 135, 255, 0.16)'};
    box-shadow: ${(props) =>
      props.dark
        ? '0 22px 42px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 0 1px rgba(92, 120, 184, 0.12)'
        : '0 18px 32px rgba(31, 49, 88, 0.12)'};
    cursor: pointer;
    transform: translateY(-1px);
  }
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
`;

const CreateTaskButton = styled.button<DarkProps>`
  // A real button keeps keyboard and screen reader behavior intact
  // The reset strips browser chrome so the footer can match the custom cards
  appearance: none;
  -webkit-appearance: none;
  border: none;
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(41, 52, 79, 0.68) 0%, rgba(30, 40, 63, 0.72) 100%)'
      : 'rgba(255, 255, 255, 0.72)'};
  border-radius: 15px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px 0 10px;
  text-align: left;
  color: inherit;
  font: inherit;
  box-shadow: ${(props) =>
    props.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.65)'};
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.dark
        ? 'linear-gradient(180deg, rgba(62, 77, 114, 0.96) 0%, rgba(45, 57, 88, 0.98) 100%)'
        : 'rgba(255, 255, 255, 0.94)'};
    box-shadow: ${(props) =>
      props.dark
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 0 0 1px rgba(134, 162, 226, 0.24)'
        : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'};
  }
`;

const CreateTaskLeft = styled(TaskLeft)<DarkProps>`
  // The icon tile carries the primary accent so the footer reads as an action
  // without needing another button inside the card
  min-width: 38px;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  box-shadow: ${(props) =>
    props.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.7)'};
  transition:
    background 0.2s ease,
    transform 0.2s ease;

  ${CreateTaskButton}:hover & {
    transform: translateY(-1px);
    background: ${(props) =>
      props.dark ? 'rgba(91, 119, 184, 0.98)' : '#d1e2ff'};
  }
`;

const TaskInfo = styled.div<DarkProps>`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  color: ${(props) =>
    props.dark ? 'rgba(221, 230, 246, 0.72)' : '#69758a'};
`;

const TaskTitle = styled.div<DarkProps>`
  color: ${(props) =>
    props.dark ? 'rgba(234, 240, 251, 0.92)' : '#51627f'};
  font-weight: 760;
  font-size: 16px;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
/*
    Renders an individual task item
*/

interface TaskProps {
  onSubmit?: (assignment: FinalAssignment | FinalAssignment[]) => void;
  selectedCourse?: string;
  grading?: boolean; // whether this show up in the instructor tab
}

export default function CreateTaskCard({
  onSubmit,
  selectedCourse,
  grading = false,
}: TaskProps): JSX.Element {
  const darkMode = useContext(DarkContext);
  const [formVisible, setFormVisible] = useState(false);

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setFormVisible(true);
  }
  function closeForm() {
    setFormVisible(false);
  }

  const text = 'New Task';

  return (
    <>
      <TaskContainer dark={darkMode}>
        <CreateTaskButton
          aria-label="Create a custom task"
          dark={darkMode}
          onClick={onClick}
          type="button"
        >
          <CreateTaskLeft
            color={darkMode ? 'rgba(73, 100, 160, 0.92)' : '#dce8ff'}
            dark={darkMode}
          >
            {PlusIcon}
          </CreateTaskLeft>
          <TaskInfo dark={darkMode}>
            <TaskTitle dark={darkMode}>{text}</TaskTitle>
          </TaskInfo>
        </CreateTaskButton>
      </TaskContainer>
      {formVisible && (
        <TaskForm
          close={closeForm}
          grading={grading}
          onSubmit={onSubmit}
          selectedCourse={selectedCourse}
          visible={formVisible}
        />
      )}
    </>
  );
}

TaskLink.displayName = 'TaskLink';
