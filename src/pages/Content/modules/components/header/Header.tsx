import React from 'react';
import styled from 'styled-components';
import { SettingsIcon } from '../../icons';
import { Direction } from '../../types';
import { DarkProps } from '../../types/props';
import ArrowButton from '../arrow-button/ArrowButton';
import { safeRuntimeGetURL } from '../../utils/extensionContext';

const HeaderFrame = styled.div<DarkProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 2px 2px;
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-primary)' : '#172033'};
`;

const BrandGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
`;

const TitleText = styled.span`
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.03em;
`;

const SettingsLink = styled.a<DarkProps>`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: ${(props) =>
    props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'};
  box-shadow: ${(props) =>
    props.dark
      ? '0 10px 24px rgba(0, 0, 0, 0.22)'
      : '0 10px 24px rgba(31, 49, 88, 0.08)'};
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  .tasks-extension-settings {
    fill: ${(props) =>
      props.dark ? 'var(--tfc-dark-mode-text-secondary)' : '#536277'};
  }

  &:hover {
    transform: translateY(-1px);
    background: ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)'};
  }
`;

const WindowControl = styled.div<DarkProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  justify-content: flex-end;
  min-width: 0;
  padding: 3px;
  border-radius: 999px;
  background: ${(props) =>
    props.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
`;

const WindowText = styled.div<DarkProps>`
  padding: 0 6px;
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-primary)' : '#172033'};
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.02em;
  white-space: nowrap;
`;

export interface HeaderProps {
  dark?: boolean;
  weekStart: Date;
  weekEnd: Date;
  clickable: boolean;
  onPrevClick: () => void;
  onNextClick: () => void;
}

// Keep the frame compact while making the title and date feel intentional
export default function Header({
  dark,
  weekStart,
  weekEnd,
  clickable = false,
  onPrevClick,
  onNextClick,
}: HeaderProps): JSX.Element {
  const start = weekStart.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    end = weekEnd.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
    tasks = 'Tasks';
  const settingsHref = safeRuntimeGetURL('options.html');

  function prevClick() {
    if (clickable) {
      onPrevClick();
    }
  }
  function nextClick() {
    if (clickable) {
      onNextClick();
    }
  }
  return (
    <HeaderFrame dark={dark}>
      <BrandGroup>
        <TitleText>{tasks}</TitleText>
        <SettingsLink
          dark={dark}
          href={settingsHref}
          rel="noreferrer"
          target="_blank"
        >
          {SettingsIcon}
        </SettingsLink>
      </BrandGroup>
      <WindowControl dark={dark}>
        <ArrowButton
          dark={dark}
          direction={Direction.LEFT}
          disabled={!clickable}
          onClick={prevClick}
          size={22}
        />
        <WindowText dark={dark}>{`${start} to ${end}`}</WindowText>
        <ArrowButton
          dark={dark}
          direction={Direction.RIGHT}
          disabled={!clickable}
          onClick={nextClick}
          size={22}
        />
      </WindowControl>
    </HeaderFrame>
  );
}
