import React from 'react';
import styled from 'styled-components';

type StyledButtonProps = {
  color: string;
  disabled?: boolean;
};

const StyledButton = styled.button<StyledButtonProps>`
  background: ${(props) =>
    props.disabled
      ? props.color
      : `linear-gradient(135deg, ${props.color}, #73a5ff)`};
  outline: none;
  opacity: 1;
  &:hover {
    opacity: ${(props) => (props.disabled ? '1' : '0.7')};
  }

  font-size: 15px;
  font-weight: 650;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 16px;
  margin-top: 10px;
  box-shadow: ${(props) =>
    props.disabled ? 'none' : '0 18px 32px rgba(79, 135, 255, 0.22)'};

  transition: background-color 0.5s;
  cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
`;

type Props = {
  label: string;
  onClick: () => void;
  color: string;
  dark?: boolean;
  disabled?: boolean;
};

export default function Button({
  color,
  dark,
  disabled,
  label,
  onClick,
}: Props): JSX.Element {
  return (
    <StyledButton
      color={
        disabled
          ? !dark
            ? 'rgba(180, 180, 180)'
            : 'var(--tfc-dark-mode-bg-secondary)'
          : color
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </StyledButton>
  );
}
