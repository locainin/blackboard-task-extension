import React from 'react';
import styled from 'styled-components';

type StyledButtonProps = {
  color: string;
  disabled?: boolean;
};

const StyledButton = styled.button<StyledButtonProps>`
  background: ${(props) =>
    props.disabled
      ? 'linear-gradient(180deg, rgba(89, 103, 131, 0.72) 0%, rgba(74, 88, 114, 0.76) 100%)'
      : `linear-gradient(135deg, ${props.color}, #73a5ff)`};
  outline: none;
  opacity: 1;
  min-height: 50px;
  width: 100%;
  letter-spacing: -0.01em;
  box-shadow: ${(props) =>
    props.disabled
      ? 'none'
      : '0 16px 32px rgba(79, 135, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.14)'};
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;

  &:hover {
    opacity: ${(props) => (props.disabled ? '1' : '1')};
    transform: ${(props) => (props.disabled ? 'none' : 'translateY(-1px)')};
    box-shadow: ${(props) =>
      props.disabled
        ? 'none'
        : '0 18px 34px rgba(79, 135, 255, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.18)'};
  }

  font-size: 15px;
  font-weight: 650;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 16px;
  margin-top: 2px;
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
