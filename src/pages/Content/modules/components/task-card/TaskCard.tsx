import React, { useContext } from 'react';
import styled from 'styled-components';
import { AssignmentType, FinalAssignment } from '../../types';
import { AssignmentDefaults } from '../../constants';
import { CheckIcon } from '../../icons';
import fmtDate, { fmtDateSince } from './utils/fmtDate';
import { DarkProps } from '../../types/props';
import { DarkContext, LMSContext } from '../../contexts/contexts';
import assignmentHasGrade from '../../utils/assignmentHasGrade';

export interface AnimatedProps {
  static?: boolean;
  opacity?: number;
  height?: number;
}

export const TaskContainer = styled.div.attrs(
    (props: AnimatedProps & DarkProps) => ({
      style: {
        height: props.height ? props.height : 0,
        margin: props.opacity ? 4 * props.opacity : 0,
        opacity: props.opacity ? props.opacity : 0,
      },
    })
  )<AnimatedProps & DarkProps>`
    width: 100%;
    background: ${(props) =>
      props.dark
        ? 'linear-gradient(180deg, rgba(22, 31, 49, 0.96) 0%, rgba(15, 22, 38, 0.96) 100%)'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 254, 0.98) 100%)'};
    border-radius: 18px;
    display: flex;
    flex-direction: row;
    font-size: 12px;
    border: 1px solid
      ${(props) =>
        props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
    box-shadow: ${(props) =>
      props.dark
        ? '0 16px 28px rgba(0, 0, 0, 0.22)'
        : '0 12px 24px rgba(31, 49, 88, 0.08)'};
    &:hover {
      box-shadow: ${(props) =>
        props.dark
          ? '0 18px 34px rgba(0, 0, 0, 0.28)'
          : '0 18px 32px rgba(31, 49, 88, 0.12)'};
      transform: translateY(-1px);
    }
    @keyframes tasks-skeleton-pulse {
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }

    transition:
      box-shadow 0.2s,
      transform 0.2s;
  `,
  TaskInfo = styled.div<DarkProps>`
    display: flex;
    flex-direction: column;
    padding: 10px 12px 10px 6px;
    box-sizing: border-box;
    width: 100%;
    font-size: 12px;
    color: ${(props) =>
      props.dark ? 'var(--tfc-dark-mode-text-secondary)' : '#69758a'};
    overflow-x: auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  TaskLink = styled.a<DarkProps & AnimatedProps>`
    color: ${(props) =>
      props.dark
        ? 'var(--tfc-dark-mode-text-primary)'
        : '#172033'};
    opacity: ${(props) => (props.opacity ? props.opacity : '1')};
    font-weight: 750;
    font-size: 17px;
    letter-spacing: -0.03em;
    &:hover {
      color: ${(props) =>
        props.dark
          ? 'var(--tfc-dark-mode-text-primary)'
          : '#172033'};
      text-decoration: underline;
    }
    text-decoration: none;
    overflow-x: auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  TaskLeft = styled.div`
    width: 46px;
    min-width: 46px;
    margin: 7px 0 7px 7px;
    border-radius: 14px;
    background-color: ${(props) => props.color};
    padding: 8px;
    padding-bottom: 8px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      cursor: pointer;
    }
  `,
  CourseCodeText = styled.div`
    color: ${(props) => props.color};
    font-weight: 700;
    margin-top: 2px;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    overflow-x: auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  `,
  TaskTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  `,
  TaskDetailsText = styled.div<AnimatedProps>`
    overflow-x: auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: ${(props) => (props.opacity ? props.opacity : '1')};
    font-weight: 500;
  `,
  SkeletonTitle = styled.div<AnimatedProps & DarkProps>`
    width: 90%;
    height: 12px;
    background-color: ${(props) => (!props.dark ? '#e8e8e8' : '#3f3f46')};
    border-radius: 100px;
    margin: 2px 0px;
    animation: ${(props) =>
      props.static ? 'none' : 'tasks-skeleton-pulse 1s infinite'};
  `,
  SkeletonInfo = styled.div<AnimatedProps & DarkProps>`
    width: 75%;
    height: 12px;
    background-color: ${(props) => (!props.dark ? '#e8e8e8' : '#3f3f46')};
    border-radius: 100px;
    margin: 2px 0px;
    animation: ${(props) =>
      props.static
        ? 'none'
        : 'tasks-skeleton-pulse 1s 0.5s infinite linear both'};
  `,
  SkeletonCourseCode = styled.div<AnimatedProps & DarkProps>`
    width: 50%;
    height: 12px;
    background-color: ${(props) => (!props.dark ? '#e8e8e8' : '#3f3f46')};
    border-radius: 100px;
    margin: 2px 0px;
    margin-top: 6px;
    animation: ${(props) =>
      props.static
        ? 'none'
        : 'tasks-skeleton-pulse 1s 0.5s infinite linear both'};
  `;
export interface TaskProps {
  assignment?: FinalAssignment;
  complete?: boolean;
  color?: string;
  course_name?: string;
  markComplete?: () => void;
  markDeleted?: () => void;
  skeleton?: boolean;
  transitionState?: TransitionState;
  clock24hr?: boolean;
}

export interface TransitionState {
  opacity: number;
  height: number;
}

function roundAssignmentScore(score: number | object) {
  if (typeof score === 'number') return Math.round(score * 100) / 100;
  else if (typeof score === 'object')
    // BigNumber or bigint
    return Math.round(parseFloat(score.toString()) * 100) / 100;
  return score;
}

/*
    Renders an individual task item
*/

export default function TaskCard({
  assignment = AssignmentDefaults,
  complete = AssignmentDefaults.marked_complete,
  course_name,
  color,
  markComplete,
  markDeleted,
  skeleton,
  transitionState,
  clock24hr = false,
}: TaskProps): JSX.Element {
  const lms = useContext(LMSContext);
  const [due_date, due_time] = fmtDate(assignment.due_at, clock24hr);
  const gradedSince = assignment.graded_at
    ? fmtDateSince(assignment.graded_at)
    : '';
  function onClick(e: React.MouseEvent<HTMLInputElement>) {
    e.preventDefault();
    window.location.href = assignment.html_url;
  }
  // if on completed tab, display grade even if it would normally be considered "ungraded" (i.e. 0-point grade)
  const display_grade = complete && assignmentHasGrade(assignment);
  const is_instructor =
    assignment.needs_grading_count && assignment.type !== AssignmentType.NOTE;
  const icon =
    lms.iconSet.assignments[is_instructor ? 'ungraded' : assignment.type];

  const due = 'Due';
  const submittedText =
    !assignment.submitted && complete
      ? 'Unsubmitted'
      : assignment.points_possible
      ? 'Submitted'
      : '';
  const dueText = ` ${due_date} at ${due_time}`;
  const gradedAtText = !display_grade
    ? ''
    : assignment.grade === 'Excused'
    ? ' Excused'
    : ` ${roundAssignmentScore(assignment.score)}/${
        assignment.points_possible
      } points`;

  const pointsPlural = !assignment.points_possible
    ? ''
    : assignment.points_possible > 1
    ? 'points'
    : 'point';
  const pointsText = assignment.points_possible
    ? ` \xa0|\xa0 ${assignment.points_possible} ${pointsPlural}`
    : '';
  const needsGradingText = is_instructor
    ? `${assignment.needs_grading_count} ungraded`
    : '';
  const gradedText =
    assignment.submitted || display_grade
      ? ` ${!display_grade ? ' Waiting for grade' : ' Graded: '}`
      : ' Completed';
  function markAssignmentAsComplete() {
    if (markComplete) {
      markComplete();
    }
  }
  function markAssignmentAsDeleted() {
    if (markDeleted) {
      markDeleted();
    }
  }
  const darkMode = useContext(DarkContext);
  const canBeDeleted = [AssignmentType.NOTE].includes(assignment.type);
  return (
    <TaskContainer
      dark={darkMode}
      height={transitionState ? transitionState?.height : 65}
      opacity={transitionState ? transitionState?.opacity : 1}
    >
      <TaskLeft
        color={
          (!skeleton ? color : darkMode ? '#3f3f46' : '#e8e8e8') || '000000'
        }
        onClick={onClick}
      >
        {!skeleton && (transitionState ? transitionState?.height >= 40 : true)
          ? icon
          : ''}
      </TaskLeft>
      <TaskInfo dark={darkMode}>
        <TaskTop>
          <CourseCodeText color={color}>
            {!skeleton ? course_name : <SkeletonCourseCode dark={darkMode} />}
          </CourseCodeText>
          {!skeleton && !is_instructor ? ( // assignments that need grading should not be marked manually
            <CheckIcon
              checkStyle={complete ? 'Revert' : 'Check'}
              dark={darkMode}
              onClick={markAssignmentAsComplete}
            />
          ) : (
            ''
          )}
          {!skeleton && complete && canBeDeleted ? (
            <CheckIcon
              checkStyle="X"
              dark={darkMode}
              onClick={markAssignmentAsDeleted}
            />
          ) : (
            ''
          )}
        </TaskTop>
        <TaskLink dark={darkMode} href={assignment.html_url}>
          {!skeleton ? assignment.name : <SkeletonTitle dark={darkMode} />}
        </TaskLink>
        <TaskDetailsText>
          {skeleton ? (
            <SkeletonInfo dark={darkMode} />
          ) : !complete || is_instructor ? (
            <>
              <strong>{due}</strong>
              {dueText}
              {is_instructor ? (
                <strong>
                  {' \xa0|\xa0 '}
                  <span style={{ color: color }}>{needsGradingText}</span>
                </strong>
              ) : (
                pointsText
              )}
            </>
          ) : (
            <>
              {!display_grade && assignment.points_possible ? (
                <>
                  <strong>{submittedText}</strong>
                  {' \xa0|\xa0 '}
                </>
              ) : (
                ''
              )}
              {!display_grade ? <strong>{gradedText}</strong> : gradedText}
              <strong>{gradedAtText}</strong>
              {gradedAtText && gradedSince ? ' | ' + gradedSince : ''}
            </>
          )}
        </TaskDetailsText>
      </TaskInfo>
    </TaskContainer>
  );
}

TaskLink.displayName = 'TaskLink';
