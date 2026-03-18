import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from './header';
import ContentLoader from './content-loader';
import getPeriod from '../utils/getPeriod';
import { useOptionsStore } from '../hooks/useOptions';
import { OptionsContext } from '../contexts/contexts';
import { Options } from '../types';
import { LMSConfig } from '../types/config';
import { BlackboardLMSConfig } from '../plugins/blackboard';
import { DarkProps } from '../types/props';

const AppContainer = styled.div<DarkProps>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 30px;
  position: relative;
  color: ${(props) =>
    props.dark ? 'var(--tfc-dark-mode-text-primary)' : '#172033'};
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(12, 18, 33, 0.96) 0%, rgba(15, 22, 40, 0.98) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 247, 252, 0.96) 100%)'};
  border: 1px solid
    ${(props) =>
      props.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'};
  box-shadow: ${(props) =>
    props.dark
      ? '0 28px 52px rgba(0, 0, 0, 0.32)'
      : '0 20px 42px rgba(31, 49, 88, 0.12)'};
  backdrop-filter: blur(24px);
  font-family: 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Segoe UI',
    sans-serif;

  &::before {
    content: '';
    position: absolute;
    inset: -80px auto auto -60px;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: rgba(79, 135, 255, 0.18);
    filter: blur(40px);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: auto -30px 10px auto;
    width: 120px;
    height: 120px;
    border-radius: 999px;
    background: ${(props) =>
      props.dark
        ? 'rgba(118, 91, 196, 0.16)'
        : 'rgba(118, 91, 196, 0.1)'};
    filter: blur(34px);
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

interface AppProps {
  lms?: LMSConfig;
  options: Options;
  MIN_LOAD_TIME?: number; // for testing only
}

export default function App({
  options,
  lms = BlackboardLMSConfig,
  MIN_LOAD_TIME = 350,
}: AppProps): JSX.Element {
  const [delta, setDelta] = useState(0);
  const [clickableState, setClickableState] = useState({
    clickable: false,
    firstLoad: true,
  });
  const optionsStore = useOptionsStore(options, () =>
    setClickableState({ clickable: false, firstLoad: false })
  );
  const liveOptions = optionsStore.state;
  const { start, end } = useMemo(() => {
    setClickableState({ clickable: false, firstLoad: false });
    return getPeriod(
      liveOptions.period,
      liveOptions.start_date,
      liveOptions.start_hour,
      liveOptions.start_minutes,
      delta,
      liveOptions.rolling_period
    );
  }, [liveOptions, delta]);

  /*
    when prev/next buttons clicked
  */
  function incrementDelta(d: number) {
    setDelta(delta + d);
  }
  /*
    only allow prev/next buttons to be clicked once content is loaded
  */
  function loadedCallback() {
    setClickableState({ clickable: true, firstLoad: false });
  }
  function onPrevClick() {
    setClickableState({ clickable: false, firstLoad: false });
    incrementDelta(-1);
  }
  function onNextClick() {
    setClickableState({ clickable: false, firstLoad: false });
    incrementDelta(1);
  }
  // options will always be available to children
  return (
    // Use the live store state here so theme changes repaint the shell right away
    <AppContainer dark={liveOptions.dark_mode} id="tfc-wall-sina">
      <OptionsContext.Provider value={optionsStore}>
        <Header
          clickable={clickableState.clickable}
          dark={liveOptions.dark_mode}
          onNextClick={onNextClick}
          onPrevClick={onPrevClick}
          weekEnd={end}
          weekStart={start}
        />
        <ContentLoader
          MIN_LOAD_TIME={MIN_LOAD_TIME}
          clickable={clickableState.clickable}
          endDate={end}
          firstLoad={clickableState.firstLoad}
          lms={lms}
          loadedCallback={loadedCallback}
          options={optionsStore.state}
          startDate={start}
        />
      </OptionsContext.Provider>
    </AppContainer>
  );
}
