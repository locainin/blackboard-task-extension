import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import styled from 'styled-components';
import { THEME_COLOR, THEME_COLOR_LIGHT } from '../../../constants';
import TextInput from './TextInput';

export type ColorProps = {
  color?: string;
};

const DatePickerContainer = styled.div<ColorProps & { dark?: boolean }>`
  .rdp {
    margin: 10px 0px 0px;
    --rdp-cell-size: 32px;
    --rdp-accent-color: ${(props) => props.color || THEME_COLOR};
    --rdp-background-color: ${THEME_COLOR_LIGHT};
    --rdp-accent-color-dark: ${(props) => props.color || THEME_COLOR};
    --rdp-background-color-dark: #180270;
    padding: 12px;
    border-radius: 18px;
    background: ${(props) =>
      props.dark
        ? 'linear-gradient(180deg, rgba(40, 49, 73, 0.72) 0%, rgba(30, 38, 59, 0.74) 100%)'
        : 'rgba(248, 250, 254, 0.96)'};
    border: 1px solid
      ${(props) =>
        props.dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)'};
    box-shadow: ${(props) =>
      props.dark
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        : 'inset 0 1px 0 rgba(255, 255, 255, 0.7)'};
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
  }

  // DayPicker ships with a light-first palette
  // These overrides lift the month header, weekdays, and idle days back above the dark sheet
  ${(props) =>
    props.dark
      ? `
    .rdp,
    .rdp table,
    .rdp tbody,
    .rdp tr,
    .rdp td {
      color: rgba(226, 234, 247, 0.9);
    }

    .rdp-month {
      margin: 0;
      width: 100%;
    }

    .rdp-caption {
      margin-bottom: 8px;
    }

    .rdp-months {
      justify-content: center;
    }

    .rdp-table {
      width: 100%;
      max-width: 100%;
    }

    .rdp-caption_label {
      color: rgba(240, 245, 255, 0.96);
      font-size: 22px;
      font-weight: 780;
      letter-spacing: -0.03em;
      padding: 0;
    }

    .rdp-head_cell {
      color: rgba(170, 184, 208, 0.86);
      font-size: 11px;
      font-weight: 760;
      letter-spacing: 0.08em;
    }

    .rdp-nav_button {
      border-radius: 999px;
      transition: background-color 0.18s ease, border-color 0.18s ease;
    }

    .rdp-button_reset,
    .rdp-button,
    .rdp-day {
      color: rgba(226, 234, 247, 0.94);
    }

    .rdp-button {
      border: 1px solid transparent;
    }

    .rdp-button:hover:not([disabled]) {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .rdp-button:focus:not([disabled]),
    .rdp-button:active:not([disabled]) {
      border: 1px solid rgba(255, 255, 255, 0.12);
      background-color: rgba(255, 255, 255, 0.08);
    }

    .rdp-day_selected,
    .rdp-day_selected:focus-visible,
    .rdp-day_selected:hover {
      color: rgba(255, 255, 255, 0.98);
      background-color: ${props.color || THEME_COLOR};
    }

    .rdp-day_today:not(.rdp-day_outside) {
      color: rgba(248, 251, 255, 0.98);
      font-weight: 760;
    }

    .rdp-button[disabled],
    .rdp-day_outside {
      color: rgba(126, 141, 167, 0.42);
    }
  `
      : ''}

  position: relative;
`;

type Props = {
  color?: string;
  dark?: boolean;
  selected?: Date;
  setSelected: (date?: Date) => void;
};

export default function DatePick({
  color,
  dark,
  selected,
  setSelected,
}: Props): JSX.Element {
  const [pickerVisible, setPickerVisible] = useState(false);
  function onSelect(date?: Date) {
    // Close as soon as a day is chosen
    // The trigger field already shows the selected date
    setPickerVisible(false);
    setSelected(date);
  }
  function togglePicker() {
    setPickerVisible(!pickerVisible);
  }
  return (
    <DatePickerContainer color={color} dark={dark}>
      <TextInput
        color={color}
        dark={dark}
        menuVisible={pickerVisible}
        onClick={togglePicker}
        select
        value={selected ? selected.toLocaleDateString() : ''}
      />
      {pickerVisible && (
        <DayPicker
          mode="single"
          onSelect={onSelect}
          selected={selected}
          styles={{
            // Keep inline values narrow enough for the sidebar width
            // The dark theme overrides above handle the rest of the calendar styling
            caption: {
              fontSize: 14,
            },
            day: {
              fontSize: 14,
            },
          }}
        />
      )}
    </DatePickerContainer>
  );
}
