import React from 'react';
import styled from 'styled-components';
import { DarkProps } from '../../types/props';
import { TaskTypeTab } from '../task-list/utils/useHeadings';
import { AssignmentIconComponent } from '../../icons/assignment';
import { AnnouncementIconComponent } from '../../icons/announcement';
import { CompletedIconComponent } from '../../icons/completed';
import { ICON_FILL } from '../../icons/constants';
import { NeedsGradingIconComponent } from '../../icons/grade';

const SubtitleDiv = styled.div<DarkProps>`
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 5px;
  border-radius: 20px;
  background: ${(p) =>
    p.dark
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(15, 23, 42, 0.04)'};
  border: 1px solid
    ${(p) =>
      p.dark ? 'rgba(255, 255, 255, 0.055)' : 'rgba(15, 23, 42, 0.08)'};
  box-shadow: ${(p) =>
    p.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.02)'
      : 'none'};
`;

interface SubtitleTabProps {
  active?: boolean;
  iconClassname: string;
  opacity: number;
  color?: string;
}
const SubtitleTab = styled.div<SubtitleTabProps & DarkProps>`
  position: relative;
  color: ${(p) =>
    p.active
      ? p.dark
        ? '#e9eef8'
        : '#172033'
      : p.dark
      ? '#97a6bc'
      : '#69758a'};
  .${(props) => props.iconClassname} {
    transition: 0.2s ease-in-out;
    opacity: ${(props) => props.opacity};
  }
  &:hover {
    .${(props) => props.iconClassname} {
      opacity: 1;
      fill: ${(props) => props.color};
    }
    cursor: pointer;
  }
  font-weight: ${(p) => (p.active ? '700' : '600')};
  flex: 1 1 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 44px;
  border-radius: 14px;
  background: ${(p) =>
    p.active
      ? p.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.92)'
      : 'transparent'};
  border: 1px solid
    ${(p) =>
      p.active
        ? p.dark
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(15, 23, 42, 0.04)'
        : 'transparent'};
  box-shadow: ${(p) =>
    p.active
      ? p.dark
        ? '0 8px 18px rgba(4, 10, 20, 0.16)'
        : '0 10px 24px rgba(0, 0, 0, 0.12)'
      : 'none'};
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: ${(p) =>
      p.active
        ? undefined
        : p.dark
        ? 'rgba(255, 255, 255, 0.045)'
        : 'rgba(255, 255, 255, 0.72)'};
    transform: ${(p) => (p.dark ? 'none' : 'translateY(-1px)')};
  }
`;

interface ColorProps {
  color?: string;
  visible: boolean;
}

interface AnimatedProps {
  pos: number;
  numTabs: number;
}

export interface SubTabsProps {
  activeColor?: string;
  dark?: boolean;
  showAnnouncements?: boolean;
  showCompleted?: boolean;
  showNeedsGrading?: boolean;
  showUnfinished?: boolean;
  setTaskListState?: (state: TaskTypeTab) => void;
  taskListState?: TaskTypeTab;
  notifs?: number;
}

/*
  Renders a subtitle within the app
*/
export default function IconSubTabs({
  activeColor,
  dark,
  showAnnouncements = true,
  showCompleted = true,
  showNeedsGrading = false,
  showUnfinished = true,
  setTaskListState,
  taskListState,
  notifs = 0,
}: SubTabsProps): JSX.Element {
  // Hover state is tracked here so the icon color and icon variant
  // stay in sync instead of relying on SVG CSS overrides alone
  const [hoveredTab, setHoveredTab] = React.useState<TaskTypeTab | null>(null);

  function setTaskListStateFunc(state: TaskTypeTab) {
    if (!setTaskListState)
      return () => {
        return;
      };

    // Keep the click handler creation in one place
    // This avoids repeating the guard for hidden or read-only states
    return () => setTaskListState(state);
  }

  // Hover should preview the same accent used by the selected tab
  // This keeps all four icons on the same color path
  function getTabColor(tab: TaskTypeTab): string {
    if (taskListState === tab || hoveredTab === tab) return activeColor || ICON_FILL;
    return '#6c757c';
  }

  // The filled icon variant makes hover read the same way as the selected state
  // That keeps the third tab from falling back to a weaker outline treatment
  function getTabVariant(tab: TaskTypeTab): 'solid' | 'outline' {
    return taskListState === tab || hoveredTab === tab ? 'solid' : 'outline';
  }

  // Tabs are assembled from the enabled views so the strip shape stays stable
  // for student and grading layouts without splitting the render path
  const tabs = [
    showAnnouncements
      ? {
          key: 'Announcements' as TaskTypeTab,
          render: () => (
            <AnnouncementIconComponent
              color={getTabColor('Announcements')}
              flat
              notifs={notifs}
              variant={getTabVariant('Announcements')}
            />
          ),
          className: 'tfc-announcement-tab',
        }
      : null,
    showUnfinished
      ? {
          key: 'Unfinished' as TaskTypeTab,
          render: () => (
            <AssignmentIconComponent
              color={getTabColor('Unfinished')}
              flat
              variant={getTabVariant('Unfinished')}
            />
          ),
          className: 'tfc-todo-tab',
        }
      : null,
    showNeedsGrading
      ? {
          key: 'NeedsGrading' as TaskTypeTab,
          render: () => (
            <NeedsGradingIconComponent
              color={getTabColor('NeedsGrading')}
              flat
              variant={getTabVariant('NeedsGrading')}
            />
          ),
          className: 'tfc-grade-tab',
        }
      : null,
    showCompleted
      ? {
          key: 'Completed' as TaskTypeTab,
          render: () => (
            <CompletedIconComponent
              color={getTabColor('Completed')}
              variant={getTabVariant('Completed')}
            />
          ),
          className: 'tfc-completed-tab',
        }
      : null,
  ].filter(Boolean) as {
    key: TaskTypeTab;
    render: () => JSX.Element;
    className: string;
  }[];

  return (
    <SubtitleDiv dark={dark}>
      {tabs.map((tab) => (
        <SubtitleTab
          active={taskListState === tab.key}
          color={activeColor}
          dark={dark}
          iconClassname={tab.className}
          key={tab.key}
          // Hover is lifted into React state so every icon uses the same
          // accent logic instead of depending on per-SVG fill behavior
          onMouseEnter={() => setHoveredTab(tab.key)}
          onMouseLeave={() => setHoveredTab((current) => (current === tab.key ? null : current))}
          onClick={setTaskListStateFunc(tab.key)}
          opacity={taskListState === tab.key ? 1 : dark ? 0.82 : 0.6}
        >
          {tab.render()}
        </SubtitleTab>
      ))}
    </SubtitleDiv>
  );
}
