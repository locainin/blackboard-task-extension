import React from 'react';
import styled from 'styled-components';
import CourseDropdown from '../../course-dropdown';
import { DropdownChoice } from '../../course-dropdown/CourseDropdown';

type CheckProps = {
  checked?: boolean;
  color: string;
  dark?: boolean;
};

const Checkbox = styled.div<CheckProps>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 44px;
  min-width: 44px;
  height: 26px;
  border-radius: 999px;
  padding: 3px;
  background-color: ${(props) =>
    props.checked
      ? props.color
      : props.dark
      ? 'rgba(95, 108, 137, 0.75)'
      : '#d9dfeb'};
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease;
  box-shadow: ${(props) =>
    props.checked
      ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 18px rgba(0, 0, 0, 0.12)'
      : props.dark
      ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.6)'};

  &:hover {
    cursor: pointer;
    opacity: 1;
    transform: translateY(-1px);
  }
`;

const CheckboxKnob = styled.div<CheckProps>`
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  box-shadow:
    0 4px 10px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transform: translateX(${(props) => (props.checked ? '16px' : '0')});
  transition: transform 0.18s ease, box-shadow 0.18s ease;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const Title = styled.div<{ dark?: boolean }>`
  color: ${(props) =>
    props.dark ? 'rgba(235, 241, 251, 0.96)' : '#24324a'};
  font-size: 16px;
  font-weight: 730;
`;

const Subtitle = styled.div<{ dark?: boolean }>`
  color: ${(props) =>
    props.dark ? 'rgba(165, 178, 201, 0.8)' : '#73819a'};
  font-size: 12px;
  line-height: 1.35;
  opacity: 1;
`;

const WarningText = styled.div<{ dark?: boolean }>`
  margin-top: 6px;
  color: ${(props) =>
    props.dark ? 'rgba(165, 178, 201, 0.78)' : '#73819a'};
  font-size: 12px;
  line-height: 1.35;
  opacity: 1;
`;

const RecurrenceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RecurrenceLabel = styled.div<{ dark?: boolean }>`
  color: ${(props) =>
    props.dark ? 'rgba(181, 193, 214, 0.82)' : '#6c7a92'};
  font-size: 13px;
  font-weight: 620;
  line-height: 1.25;
`;

const ToggleRow = styled.div<{ dark?: boolean }>`
  // This row needs its own surface so the copy and switch do not dissolve
  // into the rest of the modal on dark mode
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: ${(props) =>
    props.dark
      ? 'linear-gradient(180deg, rgba(48, 58, 85, 0.72) 0%, rgba(37, 46, 69, 0.76) 100%)'
      : 'rgba(15, 23, 42, 0.03)'};
  box-shadow: ${(props) =>
    props.dark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.035), 0 8px 18px rgba(0, 0, 0, 0.1)'
      : 'none'};
`;

type Props = {
  color: string;
  dark?: boolean;
  enabled: boolean;
  recurrences: number;
  setEnabled: (value: boolean) => void;
  setRecurrences: (value: number) => void;
};

export default function RecurCheckbox({
  color,
  recurrences,
  enabled,
  setEnabled,
  setRecurrences,
  dark = false,
}: Props): JSX.Element {
  function toggleCheck() {
    setEnabled(!enabled);
  }
  function chooseRecurrences(id: string) {
    const p = parseInt(id);
    if (p) setRecurrences(p);
  }
  const repeatWeeklyText = 'Repeat Every Week';
  const repeatWeeklySubtext = 'Create one reminder each week for the chosen span';
  const numberOfWeeksText = 'Repeat for';
  const repeatWarningText =
    'Note that repeating tasks can only be deleted individually.';
  const RECUR_MAX = 10;
  const recurOptions: DropdownChoice[] = [];
  // Build the week list locally so this control stays cheap
  // No Blackboard data is needed for the repeat span
  for (let i = 1; i <= RECUR_MAX; i++) {
    recurOptions.push({
      id: i + '',
      name: i === 1 ? '1 Week' : i + ' Weeks',
      color: dark ? 'var(--tfc-dark-mode-text-primary)' : '#2d3b45',
    });
  }

  return (
    <div>
      <ToggleRow dark={dark}>
        <Copy>
          <Title dark={dark}>{repeatWeeklyText}</Title>
          <Subtitle dark={dark}>{repeatWeeklySubtext}</Subtitle>
        </Copy>
        <Checkbox
          checked={enabled}
          color={color}
          dark={dark}
          onClick={toggleCheck}
        >
          <CheckboxKnob checked={enabled} color={color} />
        </Checkbox>
      </ToggleRow>
      {enabled && (
        <RecurrenceRow>
          <Row>
            <RecurrenceLabel dark={dark}>{numberOfWeeksText}</RecurrenceLabel>
            <CourseDropdown
              choices={recurOptions}
              defaultColor={color}
              instructureStyle
              maxHeight={150}
              noDefault
              onCoursePage={false}
              selectedId={recurrences + ''}
              setChoice={chooseRecurrences}
              zIndex={25}
            />
          </Row>
          <WarningText dark={dark}>{repeatWarningText}</WarningText>
        </RecurrenceRow>
      )}
    </div>
  );
}
