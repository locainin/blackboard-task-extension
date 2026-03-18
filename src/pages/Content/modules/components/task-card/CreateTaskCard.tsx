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
  height: 52px;
  margin: 12px 0px 6px 0px;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 12px;
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(22, 31, 49, 0.92) 0%, rgba(15, 22, 38, 0.92) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 254, 0.96) 100%)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
  &:hover {
    box-shadow: ${(props) =>
      props.dark
        ? '0 18px 34px rgba(0, 0, 0, 0.24)'
        : '0 18px 32px rgba(31, 49, 88, 0.12)'};
    cursor: pointer;
  }
  transition: box-shadow 0.2s;
`;

const TaskInfo = styled.div<DarkProps>`
  display: flex;
  flex-direction: column;
  padding: 4px 10px 4px 6px;
  box-sizing: border-box;
  width: 100%;
  font-size: 11px;
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-secondary)' : '#69758a'};
  overflow-x: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TaskTitle = styled.div<DarkProps>`
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-secondary)' : '#69758a'};
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.03em;
  overflow-x: auto;
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
  function onClick(e: React.MouseEvent<HTMLInputElement>) {
    e.preventDefault();
    setFormVisible(true);
  }
  function closeForm() {
    setFormVisible(false);
  }

  const text = 'New Task';

  return (
    <>
      <TaskContainer dark={darkMode} onClick={onClick}>
        <TaskLeft
          color={darkMode ? 'var(--tfc-dark-mode-bg-secondary)' : '#e6ecf8'}
          onClick={onClick}
        >
          {PlusIcon}
        </TaskLeft>
        <TaskInfo dark={darkMode}>
          <TaskTitle dark={darkMode}>{text}</TaskTitle>
        </TaskInfo>
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
