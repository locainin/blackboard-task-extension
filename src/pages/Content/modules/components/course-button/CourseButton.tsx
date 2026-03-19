import React from 'react';
import styled from 'styled-components';

interface StyledButtonProps {
  dark?: boolean;
  menuVisible: boolean;
  color: string;
  selected?: boolean;
}

const StyledButton = styled.div<StyledButtonProps>`
  font-weight: 650;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
  padding: 12px 14px;
  border-radius: 16px;
  background: ${(props) =>
    // Keep the current row visible without turning the whole menu bright
    // The hover state can then stay subtle
    props.selected
      ? props.dark
        ? 'linear-gradient(180deg, rgba(50, 68, 114, 0.78) 0%, rgba(38, 54, 97, 0.82) 100%)'
        : 'rgba(79, 135, 255, 0.12)'
      : 'transparent'};
  border: 1px solid
    ${(props) =>
      props.selected
        ? props.dark
          ? 'rgba(109, 145, 232, 0.24)'
          : 'rgba(79, 135, 255, 0.14)'
        : 'transparent'};
  box-shadow: ${(props) =>
    props.selected && props.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.035)'
      : 'none'};
  z-index: 20;
  &:hover {
    cursor: pointer;
    background: ${(props) =>
      props.dark
        ? 'linear-gradient(180deg, rgba(49, 62, 95, 0.82) 0%, rgba(38, 49, 78, 0.86) 100%)'
        : 'rgba(79, 135, 255, 0.12)'};
  }
  display: ${(props) => (props.menuVisible ? 'block' : 'none')};
  color: ${(props) => props.color};
`;

export interface CourseButtonProps {
  dark?: boolean;
  name: string;
  color: string;
  id: string;
  selected?: boolean;
  setCourse: (id: string) => void;
  menuVisible: boolean;
  setMenuVisible: (menuVisible: boolean) => void;
}

/*
  Individual options in course name dropdown
*/
export default function CourseButton({
  dark,
  name,
  color = 'black',
  id = '',
  selected = false,
  setCourse,
  menuVisible,
  setMenuVisible,
}: CourseButtonProps): JSX.Element {
  function handleClick() {
    // Close as soon as a choice is made so this behaves like a native picker
    // The parent owns the selected id, so only the value needs to be sent upward
    setCourse(id);
    setMenuVisible(false);
  }
  return (
    <StyledButton
      color={color}
      dark={dark}
      menuVisible={menuVisible}
      onClick={handleClick}
      selected={selected}
    >
      {name}
    </StyledButton>
  );
}
