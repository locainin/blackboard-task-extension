import React, { useContext, useMemo, useState } from 'react';
import styled from 'styled-components';
import TaskCard from '../task-card';
import { FinalAssignment } from '../../types';
import useHeadings, { TaskTypeTab } from './utils/useHeadings';
import useSelectedCourse from './utils/useSelectedCourse';
import { filterByTab, sortByTab } from './utils/sortBy';
import cutAssignmentList from './utils/cutList';
import HeadingGroup from './components/HeadingGroup';
import CreateTaskCard from '../task-card/CreateTaskCard';
import assignmentIsDone from '../../utils/assignmentIsDone';
import Confetti from 'react-dom-confetti';
import { AssignmentStatus } from '../../types/assignment';
import NodeGroup from 'react-move/NodeGroup';
import { TransitionState } from '../task-card/TaskCard';
import { easeQuadInOut } from 'd3-ease';
import { DarkContext } from '../../contexts/contexts';
import AnnouncementCard from '../task-card/AnnouncementCard';
import IconSubTabs from '../sub-tabs/IconSubTabs';
import useOptions from '../../hooks/useOptions';
import { THEME_COLOR } from '../../constants';
import useCourseStore from '../../hooks/useCourseStore';

const ListContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  padding: 0px;
  padding-bottom: 6px;
  gap: 8px;
`;

const ListWrapper = styled.div`
  margin: 0 0 6px;
  width: 100%;
`;

const ConfettiWrapper = styled.div`
  position: absolute;
  top: 350px;
  display: flex;
  justify-content: center;
  width: 100%;
  align-items: center;
  z-index: 10000;
`;

const HideDiv = styled.div<{ visible: boolean }>`
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;

interface ViewMoreProps {
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}
const ViewMore = styled.a<ViewMoreProps>`
  display: inline-flex;
  align-self: center;
  margin-top: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(79, 135, 255, 0.1);
  color: #4f87ff;
  font-size: 0.83rem;
  font-weight: 650;
  text-decoration: none;
`;

export interface TaskListProps {
  announcements: FinalAssignment[];
  assignments: FinalAssignment[];
  createAssignment?: (assignment: FinalAssignment | FinalAssignment[]) => void;
  loading?: boolean;
  markAssignment?: (id: string, status: AssignmentStatus) => void;
  selectedCourseId: string;
  showConfetti?: boolean;
  showDateHeadings: boolean;
  skeleton?: boolean;
  weekKey: string; // unique key value for same headings between different weeks
}

function startTransition() {
  return {
    height: 0,
    opacity: 0,
  };
}
function enterTransition() {
  return {
    height: [74],
    opacity: [1],
    timing: { duration: 500, ease: easeQuadInOut },
  };
}
function leaveTransition() {
  return {
    height: [0],
    opacity: [0],
    timing: { duration: 300, ease: easeQuadInOut },
  };
}

// some animations become "updates" instead of "enters" when switching tabs during them
function updateTransition() {
  return {
    height: [74],
    opacity: [1],
    timing: { duration: 500, ease: easeQuadInOut },
  };
}

const processRenderList = (
  assignments: FinalAssignment[],
  tab: TaskTypeTab,
  selectedCourseId: string,
  viewingMore: boolean,
  showDateHeadings: boolean,
  listLength: number
) => {
  const selected = useSelectedCourse(selectedCourseId, assignments);
  const filtered = filterByTab(tab, selected);
  const sorted = sortByTab(tab, filtered);
  const renderedTasks = cutAssignmentList(!viewingMore, listLength, sorted);
  const headings = useHeadings(tab, renderedTasks);
  const allRendered = Object.keys(headings).reduce<
    (FinalAssignment | string)[]
  >((prev, curr) => {
    let nxt = prev;
    if (showDateHeadings && headings[curr].length > 0) nxt = nxt.concat(curr);
    nxt = nxt.concat(headings[curr]);
    return nxt;
  }, []);
  return [allRendered, sorted as FinalAssignment[]];
};

/*
  Renders all unfinished assignments
*/
export default function TaskList({
  announcements,
  assignments,
  createAssignment,
  loading = false,
  markAssignment,
  selectedCourseId = '',
  showDateHeadings,
  showConfetti = true,
  skeleton,
  weekKey,
}: TaskListProps): JSX.Element {
  const courseStore = useCourseStore();
  const darkMode = useContext(DarkContext);
  const { state: options } = useOptions();
  const [confetti, setConfetti] = useState(false);
  const [currentTab, setCurrentTab] = useState<TaskTypeTab>('Unfinished');
  const [viewingMore, setViewingMore] = useState(false);

  const listLength = options.default_list_length;

  const [unfinishedList, allUnfinishedList] = useMemo(
    () =>
      skeleton
        ? [[], []]
        : processRenderList(
            assignments,
            'Unfinished',
            selectedCourseId,
            viewingMore,
            showDateHeadings,
            listLength
          ),
    [
      assignments,
      skeleton,
      selectedCourseId,
      viewingMore,
      showDateHeadings,
      listLength,
    ]
  );

  const [completedList, allCompletedList] = useMemo(
    () =>
      skeleton
        ? [[], []]
        : processRenderList(
            assignments,
            'Completed',
            selectedCourseId,
            viewingMore,
            showDateHeadings,
            listLength
          ),
    [
      assignments,
      selectedCourseId,
      skeleton,
      viewingMore,
      showDateHeadings,
      listLength,
    ]
  );

  const [gradingList, allGradingList] = useMemo(
    () =>
      skeleton
        ? [[], []]
        : processRenderList(
            assignments,
            'NeedsGrading',
            selectedCourseId,
            viewingMore,
            showDateHeadings,
            listLength
          ),
    [
      assignments,
      skeleton,
      selectedCourseId,
      viewingMore,
      showDateHeadings,
      listLength,
    ]
  );

  const [announcementList, allAnnouncementList] = useMemo(
    () =>
      skeleton
        ? [[], []]
        : processRenderList(
            announcements,
            'Announcements',
            selectedCourseId,
            viewingMore,
            showDateHeadings,
            listLength
          ),
    [
      announcements,
      selectedCourseId,
      skeleton,
      viewingMore,
      showDateHeadings,
      listLength,
    ]
  );

  const allList: Record<TaskTypeTab, FinalAssignment[]> = {
    Unfinished: allUnfinishedList as FinalAssignment[],
    Completed: allCompletedList as FinalAssignment[],
    NeedsGrading: allGradingList as FinalAssignment[],
    Announcements: allAnnouncementList as FinalAssignment[],
  };

  function handleViewMoreClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setViewingMore(!viewingMore);
  }

  function markAssignmentFunc(
    id: string,
    tab: TaskTypeTab,
    status: AssignmentStatus,
    mark?: typeof markAssignment
  ) {
    if (!mark)
      return () => {
        console.log('Failed to mark as complete');
      };
    else if (tab === 'Unfinished' || tab === 'NeedsGrading') {
      return () => {
        setTimeout(() => {
          setConfetti(true);
          setTimeout(() => {
            stopConfetti();
          }, 100);
        }, 300);

        mark(id, AssignmentStatus.COMPLETE);
      };
    } else if (tab === 'Completed') {
      return () => mark(id, status);
    } else if (tab === 'Announcements') {
      return () => mark(id, AssignmentStatus.SEEN);
    }
  }

  function stopConfetti() {
    setConfetti(false);
  }

  interface TaskCardTransitionProps {
    key: number;
    data: FinalAssignment;
    state: TransitionState;
  }

  const assignmentToTaskCard = (
    tab: TaskTypeTab,
    { key, data: assignment, state }: TaskCardTransitionProps
  ) => {
    return tab !== 'Announcements' ? (
      <TaskCard
        assignment={assignment}
        clock24hr={options.clock_24hr}
        color={courseStore.state[assignment.course_id].color}
        complete={assignmentIsDone(assignment)}
        course_name={courseStore.state[assignment.course_id].name}
        key={key}
        markComplete={markAssignmentFunc(
          assignment.id,
          tab,
          AssignmentStatus.UNFINISHED,
          markAssignment
        )}
        markDeleted={markAssignmentFunc(
          assignment.id,
          tab,
          AssignmentStatus.DELETED,
          markAssignment
        )}
        transitionState={state}
      />
    ) : (
      <AnnouncementCard
        assignment={assignment}
        color={courseStore.state[assignment.course_id].color}
        complete={assignmentIsDone(assignment)}
        course_name={courseStore.state[assignment.course_id].name}
        key={key}
        markComplete={markAssignmentFunc(
          assignment.id,
          tab,
          AssignmentStatus.SEEN,
          markAssignment
        )}
        transitionState={state}
      />
    );
  };

  interface HeadingTransitionProps {
    key: string;
    data: string;
    state: TransitionState;
  }

  const headingToComponent = ({
    key,
    data: heading,
    state,
  }: HeadingTransitionProps) => (
    <HeadingGroup heading={heading} key={key} transitionState={state} />
  );

  function dataToComponentFunc(tab: TaskTypeTab) {
    return ({
      key,
      data,
      state,
    }: {
      key: string | number;
      data: FinalAssignment | string;
      state: TransitionState;
    }) => {
      if (typeof data === 'string')
        return headingToComponent({
          key,
          data,
          state,
        } as HeadingTransitionProps);
      else
        return assignmentToTaskCard(tab, {
          key,
          data,
          state,
        } as TaskCardTransitionProps);
    };
  }

  function keyAccess(a: FinalAssignment | string) {
    return typeof a === 'string' ? a + '-' + weekKey : a.id + '-' + weekKey;
  }

  const numNotifs = announcements.filter((x) => !x.marked_complete).length;
  const showAnnouncementsTab = allAnnouncementList.length > 0;
  const showUnfinishedTab = !options.blackboard_show_only_graded;
  const showNeedsGradingTab =
    options.show_needs_grading && !options.blackboard_show_only_graded;
  const preferredTab: TaskTypeTab = showUnfinishedTab
    ? 'Unfinished'
    : showAnnouncementsTab
    ? 'Announcements'
    : showNeedsGradingTab
    ? 'NeedsGrading'
    : 'Completed';

  const iconColor = useMemo(() => {
    if (selectedCourseId && selectedCourseId in courseStore.state)
      return courseStore.state[selectedCourseId].color;

    // Dark mode needs a brighter accent than Blackboard's default navy
    // The default theme color is too low-contrast against the darker panel
    if (darkMode) return '#4f87ff';

    if (options?.color_tabs) return options?.theme_color || THEME_COLOR;
    return 'var(--ic-brand-font-color-dark)';
  }, [darkMode, options, selectedCourseId, courseStore]);

  const hideUnfinishedList: boolean =
    unfinishedList.length === 0 && options.show_needs_grading;

  const visibleTab =
    currentTab === 'Unfinished' && hideUnfinishedList
      ? 'NeedsGrading'
      : currentTab;
  const finalVisibleTab: TaskTypeTab =
    (visibleTab === 'Announcements' && !showAnnouncementsTab) ||
    (visibleTab === 'Unfinished' && !showUnfinishedTab) ||
    (visibleTab === 'NeedsGrading' && !showNeedsGradingTab)
      ? preferredTab
      : visibleTab;

  const viewMoreText = !viewingMore
    ? `View ${allList[finalVisibleTab].length - listLength} more`
    : 'View less';

  const noneText = 'None';

  if (skeleton)
    return (
      <ListWrapper>
        <ListContainer>
          <TaskCard skeleton />
          <TaskCard skeleton />
          <TaskCard skeleton />
          <TaskCard skeleton />
        </ListContainer>
      </ListWrapper>
    );
  return (
    <ListWrapper>
      <IconSubTabs
        activeColor={iconColor}
        dark={darkMode}
        notifs={numNotifs}
        showAnnouncements={showAnnouncementsTab}
        showNeedsGrading={showNeedsGradingTab}
        showUnfinished={showUnfinishedTab && !hideUnfinishedList}
        setTaskListState={setCurrentTab}
        taskListState={finalVisibleTab}
      />
      {showConfetti && (
        <ConfettiWrapper>
          <Confetti
            active={confetti}
            config={{
              elementCount: 15,
              stagger: 10,
              startVelocity: 20,
            }}
          />
        </ConfettiWrapper>
      )}
      <HideDiv visible={finalVisibleTab === 'Announcements'}>
        <ListContainer>
          <NodeGroup
            data={loading ? [] : announcementList}
            enter={enterTransition}
            keyAccessor={keyAccess}
            leave={leaveTransition}
            start={startTransition}
            update={updateTransition}
          >
            {(nodes) => <>{nodes.map(dataToComponentFunc('Announcements'))}</>}
          </NodeGroup>
          {announcementList.length === 0 && <span>{noneText}</span>}
        </ListContainer>
      </HideDiv>
      <HideDiv visible={finalVisibleTab === 'Unfinished'}>
        <ListContainer>
          <NodeGroup
            data={loading ? [] : unfinishedList}
            enter={enterTransition}
            keyAccessor={keyAccess}
            leave={leaveTransition}
            start={startTransition}
            update={updateTransition}
          >
            {(nodes) => <>{nodes.map(dataToComponentFunc('Unfinished'))}</>}
          </NodeGroup>
        </ListContainer>
      </HideDiv>
      <HideDiv visible={finalVisibleTab === 'NeedsGrading'}>
        <ListContainer>
          <NodeGroup
            data={loading ? [] : gradingList}
            enter={enterTransition}
            keyAccessor={keyAccess}
            leave={leaveTransition}
            start={startTransition}
            update={updateTransition}
          >
            {(nodes) => <>{nodes.map(dataToComponentFunc('NeedsGrading'))}</>}
          </NodeGroup>
        </ListContainer>
      </HideDiv>

      <HideDiv visible={finalVisibleTab === 'Completed'}>
        <ListContainer>
          <NodeGroup
            data={loading ? [] : completedList}
            enter={enterTransition}
            keyAccessor={keyAccess}
            leave={leaveTransition}
            start={startTransition}
            update={updateTransition}
          >
            {(nodes) => <>{nodes.map(dataToComponentFunc('Completed'))}</>}
          </NodeGroup>
          {completedList.length === 0 && <span>{noneText}</span>}
        </ListContainer>
      </HideDiv>
      {allList[finalVisibleTab].length > listLength && (
        <ViewMore href="#" onClick={handleViewMoreClick}>
          {viewMoreText}
        </ViewMore>
      )}
      {(finalVisibleTab === 'Unfinished' ||
        finalVisibleTab === 'NeedsGrading') && (
        <CreateTaskCard
          grading={finalVisibleTab === 'NeedsGrading'}
          onSubmit={createAssignment}
          selectedCourse={selectedCourseId}
        />
      )}
    </ListWrapper>
  );
}
