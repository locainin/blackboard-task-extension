import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { DarkContext } from '../../contexts/contexts';
import { Direction } from '../../types';
import ArrowButton from '../arrow-button/ArrowButton';
import CourseButton from '../course-button';
import TextInput from '../task-form/components/TextInput';
import { DarkProps } from '../../types/props';

interface CourseTitleProps {
  color?: string;
}
const CourseTitle = styled.div<CourseTitleProps & DarkProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  padding: 14px 16px;
  color: ${(p) => (!p.color ? 'inherit' : p.color)};
  font-weight: 650;
  font-size: 14px;
  line-height: 1.2;
  position: relative;
  border: 1px solid
    ${(p) =>
      p.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
  border-radius: 20px;
  background: ${(p) =>
    p.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'};
  &:hover {
    cursor: pointer;
  }
  z-index: 20;
`;

interface DropdownProps {
  inlineMenu?: boolean;
  maxHeight?: number;
  portalMenu?: boolean;
  zIndex?: number;
}

const Dropdown = styled.div<DropdownProps & DarkProps>`
  position: ${(props) => (props.inlineMenu ? 'relative' : 'absolute')};
  left: 0;
  // Keep the menu surface above the page but visually related to the trigger
  // The menu should feel like one clean popover, not a separate scrollbox
  scrollbar-width: none;
  top: ${(props) => (props.inlineMenu ? '0' : 'calc(100% + 10px)')};
  z-index: ${(props) =>
    props.portalMenu ? 2147483300 : props.zIndex || 240};
  max-height: ${(props) =>
    typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : '320px'};
  display: flex;
  flex-direction: column;
  margin-top: ${(props) => (props.inlineMenu ? '8px' : '0')};
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px;
  box-sizing: border-box;
  overscroll-behavior: contain;
  -ms-overflow-style: none;
  box-shadow: ${(props) =>
    props.dark
      ? '0 24px 48px rgba(0, 0, 0, 0.34)'
      : '0 20px 42px rgba(31, 49, 88, 0.16)'};
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgb(23, 31, 49) 0%, rgb(19, 27, 44) 100%)'
      : 'rgb(255, 255, 255)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(15, 23, 42, 0.08)'};
  border-radius: 20px;
  width: 100%;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  // Use fades instead of visible scrollbars
  // The picker reads more like a popover and less like a mini web page
  &::before,
  &::after {
    content: '';
    position: sticky;
    left: 0;
    right: 0;
    display: block;
    height: 16px;
    pointer-events: none;
    z-index: 3;
  }

  &::before {
    top: 0;
    margin-bottom: -16px;
    background: linear-gradient(
      180deg,
      ${(props) =>
          props.dark ? 'rgba(23, 31, 49, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
        0%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  &::after {
    bottom: 0;
    margin-top: -16px;
    background: linear-gradient(
      0deg,
      ${(props) =>
          props.dark ? 'rgba(19, 27, 44, 0.98)' : 'rgba(255, 255, 255, 0.98)'}
        0%,
      rgba(0, 0, 0, 0) 100%
    );
  }
`;

const CourseDropdownContainer = styled.div<{ menuVisible: boolean }>`
  position: relative;
  z-index: ${(props) => (props.menuVisible ? 260 : 1)};
`;

const EmptyState = styled.div<DarkProps>`
  padding: 14px 16px;
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-secondary)' : '#69758a'};
  font-size: 13px;
  font-weight: 600;
`;

export interface DropdownChoice {
  id: string;
  name: string;
  color: string;
}

export interface CourseDropdownProps {
  choices: DropdownChoice[];
  defaultColor?: string;
  inlineMenu?: boolean;
  selectedId?: string;
  setChoice: (id: string) => void;
  onCoursePage: boolean;
  maxHeight?: number;
  zIndex?: number;
  defaultOption?: string;
  noDefault?: boolean;
  instructureStyle?: boolean;
}

interface MenuPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

/*
  Renders the current filtered course and dropdown menu to change the current course
*/
export default function CourseDropdown({
  choices,
  defaultOption,
  defaultColor,
  inlineMenu = false,
  noDefault,
  maxHeight,
  zIndex,
  instructureStyle,
  selectedId = '',
  setChoice,
  onCoursePage = false,
}: CourseDropdownProps): JSX.Element {
  const darkMode = useContext(DarkContext);
  // Keep refs for both the trigger and the portal menu
  // Outside-click handling and viewport positioning need both nodes
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [hovering, setHovering] = useState(false);
  const safeChoices = useMemo(
    // Blackboard can briefly hand back empty items during page switches
    // Filter once here so the render path stays simple
    () => choices.filter((choice): choice is DropdownChoice => Boolean(choice)),
    [choices]
  );

  useEffect(() => {
    if (!menuVisible) return;

    function handlePointerDown(event: MouseEvent) {
      // Treat the trigger and the floated menu as one control
      // Clicks outside either node should collapse the picker
      const targetNode = event.target as Node;
      const inTrigger = containerRef.current?.contains(targetNode);
      const inMenu = menuRef.current?.contains(targetNode);
      if (!inTrigger && !inMenu) {
        setMenuVisible(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuVisible]);

  useEffect(() => {
    if (!menuVisible || inlineMenu) return;

    function updateMenuPosition() {
      if (!containerRef.current) return;

      // Read from visualViewport when available
      // That keeps the menu aligned during zoom and mobile-sized viewport changes
      const rect = containerRef.current.getBoundingClientRect();
      const viewportPadding = 12;
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const desiredWidth = rect.width;
      const maxWidth = Math.max(120, viewportWidth - viewportPadding * 2);
      const width = Math.min(desiredWidth, maxWidth);
      const minLeft = viewportLeft + viewportPadding;
      const maxLeft = viewportLeft + viewportWidth - width - viewportPadding;
      const left = Math.min(Math.max(rect.left, minLeft), maxLeft);
      const roomBelow = viewportTop + viewportHeight - rect.bottom - viewportPadding;
      const roomAbove = rect.top - viewportTop - viewportPadding;
      const desiredHeight = typeof maxHeight === 'number' ? maxHeight : 320;
      const shouldOpenUpward = roomBelow < 220 && roomAbove > roomBelow;
      const availableHeight = shouldOpenUpward ? roomAbove : roomBelow;
      const boundedHeight = Math.min(desiredHeight, Math.max(0, availableHeight));
      const top = shouldOpenUpward
        ? Math.max(
            viewportTop + viewportPadding,
            rect.top - boundedHeight - 10
          )
        : rect.bottom + 10;

      // Render the popover in the document layer
      // This keeps the menu above the chart instead of fighting local stacking contexts
      // Clamp it to the viewport so the panel still works near the bottom of the page
      setMenuPosition({
        left,
        top,
        width,
        maxHeight: boundedHeight,
        openUpward: shouldOpenUpward,
      });
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.visualViewport?.addEventListener('resize', updateMenuPosition);
    window.visualViewport?.addEventListener('scroll', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.visualViewport?.removeEventListener('resize', updateMenuPosition);
      window.visualViewport?.removeEventListener('scroll', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [inlineMenu, maxHeight, menuVisible]);

  function onHover() {
    setHovering(true);
  }
  function onLeave() {
    setHovering(false);
  }

  const selectedChoice = (() => {
    // Fall back to a neutral "All Courses" shell when the current id is missing
    // Blackboard page transitions can briefly desync the choice list and selected id
    if (selectedId) {
      const filtered = safeChoices.filter((choice) => choice.id == selectedId);
      if (filtered.length) return filtered[0];
    }
    if (safeChoices.length === 0)
      return {
        id: '',
        name: 'All Courses',
        color: defaultColor || '#000000',
      };
    return safeChoices[0];
  })();

  const name = selectedId
    ? selectedChoice.name
    : defaultOption
    ? defaultOption
    : 'All Courses';
  const color = selectedId
    ? selectedChoice.color
    : darkMode
    ? 'var(--tfc-dark-mode-text-primary)'
    : 'var(--ic-brand-font-color-dark)';

  function toggleMenu() {
    // Keep the closed state cheap when there is nothing to pick from
    if (!safeChoices.length && !selectedId && !onCoursePage) return;
    setMenuVisible(!menuVisible);
  }

  const menuContent = (
    <Dropdown
      dark={darkMode}
      inlineMenu={inlineMenu}
      maxHeight={menuPosition?.maxHeight || maxHeight}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      portalMenu={!inlineMenu && !!menuPosition}
      ref={menuRef}
      style={
        inlineMenu || !menuPosition
          ? undefined
          : {
              // The fixed portal menu escapes sidebar overflow and chart stacking
              position: 'fixed',
              left: `${menuPosition.left}px`,
              top: `${menuPosition.top}px`,
              width: `${menuPosition.width}px`,
              transformOrigin: menuPosition.openUpward
                ? 'bottom center'
                : 'top center',
              // Portal menus need to sit above modal overlays
              // Local zIndex hints like 25 are still useful for inline menus, but too low here
              zIndex: 2147483300,
            }
      }
      zIndex={zIndex}
    >
      {!noDefault && !onCoursePage && selectedId && (
        <CourseButton
          color={
            darkMode
              ? 'var(--tfc-dark-mode-text-primary)'
              : 'var(--ic-brand-font-color-dark)'
          }
          dark={darkMode}
          id=""
          menuVisible={menuVisible}
          name={defaultOption || 'All Courses'}
          selected={!selectedId}
          setCourse={setChoice}
          setMenuVisible={setMenuVisible}
        />
      )}
      {onCoursePage && selectedId ? (
        <CourseButton
          color={selectedChoice.color}
          dark={darkMode}
          id={selectedId}
          menuVisible={menuVisible}
          name={selectedChoice.name}
          selected
          setCourse={setChoice}
          setMenuVisible={setMenuVisible}
        />
      ) : safeChoices.length ? (
        safeChoices.map((choice, i) => (
          <CourseButton
            color={choice.color}
            dark={darkMode}
            id={choice.id}
            key={`course-btn-${choice.id}`}
            menuVisible={menuVisible}
            name={choice.name}
            selected={choice.id === selectedId}
            setCourse={setChoice}
            setMenuVisible={setMenuVisible}
          />
        ))
      ) : (
        <EmptyState dark={darkMode}>No courses found</EmptyState>
      )}
    </Dropdown>
  );

  return (
    <CourseDropdownContainer
      menuVisible={menuVisible}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      ref={containerRef}
    >
      {instructureStyle ? (
        <TextInput
          color={defaultColor}
          dark={darkMode}
          menuVisible={menuVisible}
          onClick={toggleMenu}
          select
          value={name}
        />
      ) : (
        <CourseTitle
          color={color}
          dark={darkMode}
          onClick={toggleMenu}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          {name}
          <ArrowButton
            dark={darkMode}
            direction={menuVisible ? Direction.UP : Direction.DOWN}
            hoverIndependent={false}
            hovering={hovering}
          />
        </CourseTitle>
      )}
      {menuVisible
        ? inlineMenu
          ? menuContent
          : document.body
          ? ReactDOM.createPortal(menuContent, document.body)
          : menuContent
        : null}
    </CourseDropdownContainer>
  );
}
