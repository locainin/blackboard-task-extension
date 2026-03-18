import React from 'react';
import styled from 'styled-components';

interface StyledButtonProps {
  menuVisible: boolean;
  last: boolean;
  color: string;
}

const StyledButton = styled.div<StyledButtonProps>`
  font-weight: 650;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
  padding: 12px 14px;
  border-radius: 16px;
  background-color: inherit;
  z-index: 20;
  &:hover {
    cursor: pointer;
    background: rgba(79, 135, 255, 0.12);
  }
  display: ${(props) => (props.menuVisible ? 'block' : 'none')};
  color: ${(props) => props.color};
`;

export interface CourseButtonProps {
  name: string;
  color: string;
  id: string;
  last: boolean;
  setCourse: (id: string) => void;
  menuVisible: boolean;
  setMenuVisible: (menuVisible: boolean) => void;
}

/*
  Individual options in course name dropdown
*/
export default function CourseButton({
  name,
  color = 'black',
  id = '',
  last = false,
  setCourse,
  menuVisible,
  setMenuVisible,
}: CourseButtonProps): JSX.Element {
  function handleClick() {
    setCourse(id);
    setMenuVisible(false);
  }
  return (
    <StyledButton
      color={color}
      last={last}
      menuVisible={menuVisible}
      onClick={handleClick}
    >
      {name}
    </StyledButton>
  );
}
