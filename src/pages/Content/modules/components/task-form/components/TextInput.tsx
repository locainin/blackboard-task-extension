import React, { ChangeEvent } from 'react';
import styled from 'styled-components';
import ArrowButton from '../../arrow-button/ArrowButton';
import { Direction } from '../../../types';
import { THEME_COLOR } from '../../../constants';
import { ColorProps } from './DatePick';
import { DarkProps } from '../../../types/props';

const Input = styled.input<ColorProps & DarkProps>`
  // The form shell is the darkest surface
  // Inputs sit one step above it so fields are easy to scan at a glance
  border: 1px solid
    ${(props) =>
      props.dark
        ? 'rgba(255, 255, 255, 0.11)'
        : 'rgba(15, 23, 42, 0.12)'};
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-primary)' : '#172033'};
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(54, 64, 92, 0.82) 0%, rgba(42, 51, 76, 0.86) 100%)'
      : 'rgba(248, 250, 254, 0.96)'};
  min-height: 48px;
  padding: 11px 14px;
  border-radius: 17px;
  font-size: 15px;
  outline: none;
  box-shadow: ${(props) =>
    props.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 6px 16px rgba(0, 0, 0, 0.12)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.7)'};
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
  display: flex;
  justify-content: space-between;

  &:focus {
    border-color: ${(props) => props.color || THEME_COLOR};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.dark
          ? 'rgba(79, 135, 255, 0.18)'
          : 'rgba(79, 135, 255, 0.14)'};
  }
`;

const Select = styled.div<ColorProps & DarkProps>`
  border: 1px solid
    ${(props) =>
      props.dark
        ? 'rgba(255, 255, 255, 0.11)'
        : 'rgba(15, 23, 42, 0.12)'};
  min-height: 48px;
  padding: 11px 14px;
  border-radius: 17px;
  font-size: 15px;
  cursor: pointer;
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-primary)' : '#172033'};
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(54, 64, 92, 0.82) 0%, rgba(42, 51, 76, 0.86) 100%)'
      : 'rgba(248, 250, 254, 0.96)'};
  box-shadow: ${(props) =>
    props.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 6px 16px rgba(0, 0, 0, 0.12)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.7)'};
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
  outline: none;

  &:hover {
    // Use a surface lift instead of a bright ring
    // The picker stays clear without getting noisy in dark mode
    border-color: ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.13)' : 'rgba(15, 23, 42, 0.14)'};
    background: ${(props) =>
      props.dark
        ? 'linear-gradient(180deg, rgba(58, 68, 97, 0.88) 0%, rgba(46, 55, 80, 0.9) 100%)'
        : 'rgba(255, 255, 255, 0.98)'};
    box-shadow: ${(props) =>
      props.dark
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.045), 0 10px 22px rgba(0, 0, 0, 0.16)'
        : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'};
  }

  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

type Props = {
  color?: string;
  dark?: boolean;
  onChange?: (value: string) => void;
  onClick?: () => void;
  onFocus?: () => void;
  onUnfocus?: () => void;
  select?: boolean;
  value: string;
  menuVisible?: boolean;
};

export default function TextInput({
  menuVisible,
  color,
  dark,
  onChange,
  onClick,
  onFocus,
  onUnfocus,
  select,
  value,
}: Props): JSX.Element {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (onChange) onChange(e.target?.value);
  }
  function handleClick() {
    if (onClick) onClick();
  }
  return !select ? (
    <Input
      color={color}
      dark={dark}
      onBlur={onUnfocus}
      onChange={handleChange}
      onClick={onClick}
      onFocus={onFocus}
      value={value}
    />
  ) : (
    // Keep the trigger simple here
    // The dropdown component owns the menu state and option list
    <Select color={color} dark={dark} onClick={handleClick}>
      {value}{' '}
      <ArrowButton
        dark={dark}
        direction={menuVisible ? Direction.UP : Direction.DOWN}
        hoverIndependent={false}
        hovering={false}
      />
    </Select>
  );
}
