import { OptionsDefaults } from '../Content/modules/constants';
import Options from '../Content/modules/types/options';
import './index.css';

const storedUserOptions = Object.keys(OptionsDefaults);
const OPTIONS_THEME_KEY = 'blackboard-task-options-theme';
const LAST_CUSTOM_THEME_COLOR_KEY = 'blackboard-task-last-theme-color';

function applyDefaults(options: Options): Options {
  return {
    ...OptionsDefaults,
    ...options,
  };
}

// Keep the settings page theme local to the settings page
function applyAppearanceTheme(darkMode: boolean) {
  document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
}

function setAppearanceButtons(darkMode: boolean) {
  const darkButton = document.getElementById('appearance-dark');
  const lightButton = document.getElementById('appearance-light');
  if (darkButton) {
    darkButton.classList.toggle('appearance-selected', darkMode);
    darkButton.setAttribute('aria-pressed', darkMode ? 'true' : 'false');
  }
  if (lightButton) {
    lightButton.classList.toggle('appearance-selected', !darkMode);
    lightButton.setAttribute('aria-pressed', !darkMode ? 'true' : 'false');
  }
}

function setAppearanceMode(darkMode: boolean) {
  applyAppearanceTheme(darkMode);
  setAppearanceButtons(darkMode);
  window.localStorage.setItem(OPTIONS_THEME_KEY, darkMode ? 'dark' : 'light');
}

function setAppearanceToggle() {
  const darkButton = document.getElementById('appearance-dark');
  const lightButton = document.getElementById('appearance-light');
  if (darkButton) darkButton.onclick = () => setAppearanceMode(true);
  if (lightButton) lightButton.onclick = () => setAppearanceMode(false);
}

function getSavedAppearanceTheme(): boolean {
  const savedTheme = window.localStorage.getItem(OPTIONS_THEME_KEY);
  if (savedTheme === 'light') return false;
  return true;
}

function restoreDefaults() {
  window.localStorage.removeItem(OPTIONS_THEME_KEY);
  window.localStorage.removeItem(LAST_CUSTOM_THEME_COLOR_KEY);
  chrome.storage.sync.set(OptionsDefaults, () => {
    window.location.reload();
  });
}

function setRestoreDefaults() {
  const restoreButton = document.getElementById('restore-defaults');
  if (restoreButton) restoreButton.onclick = () => restoreDefaults();
}

/* Point the visible repo links at the upstream source */
function setStoreLinks() {
  const storeURL =
    'https://github.com/locainin/blackboard-task-extension';

  Array.from(document.getElementsByTagName('a')).forEach((elem) => {
    if (elem.className === 'store-link') elem.href = storeURL;
  });
}

function createDropdownOption(label: string, cb: () => void): HTMLElement {
  const option = document.createElement('div');
  option.className = 'dropdown-option';
  option.textContent = label;
  option.onclick = cb;
  return option;
}

function setSelectedDropdownOption(
  label: string,
  dropdownId: string,
  selectedId: string
) {
  const selected = document.getElementById(selectedId);
  const dropdown = document.getElementById(dropdownId);
  if (selected?.firstChild) selected.firstChild.textContent = label;
  if (dropdown) dropdown.classList.add('hidden');
}

function setDropdown(
  keys: Record<string, number> | Record<string, string>,
  dropdownId: string,
  selectedId: string,
  cb?: (key: string) => void,
  cmp?: (a: string, b: string) => number
) {
  const weekdayDropdown = document.getElementById(dropdownId);
  const weekdaySelected = document.getElementById(selectedId);
  if (weekdaySelected && weekdayDropdown)
    weekdaySelected.onclick = () => {
      if (!weekdayDropdown.classList.contains('hidden'))
        weekdayDropdown.classList.add('hidden');
      else weekdayDropdown.classList.remove('hidden');
    };
  let iter = Object.keys(keys);
  if (cmp) iter = iter.sort();
  iter.forEach((w) => {
    weekdayDropdown?.appendChild(
      createDropdownOption(w, () => {
        setSelectedDropdownOption(w, dropdownId, selectedId);
        if (cb) cb(w);
      })
    );
  });
}

const weekdays: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

const ampm: Record<string, number> = {
  am: 0,
  pm: 12,
};

const hours: Record<string, number> = {};
for (let h = 1; h <= 12; h++) {
  hours[h] = h % 12;
}

const minutes: Record<string, number> = {};
for (let m = 0; m < 60; m++) {
  minutes[(m < 10 ? '0' : '') + m] = m;
}

const listLength: Record<string, number> = {};
for (let l = 4; l <= 10; l++) {
  listLength[l + ''] = l;
}

function setWeekdayDropdown() {
  // Blackboard stores weekdays as 1..7 instead of zero-based indexes
  setDropdown(
    weekdays,
    'weekdays-options',
    'weekday-selected',
    (key: string) => {
      chrome.storage.sync.set({
        start_date: Object.keys(weekdays).indexOf(key) + 1,
      });
    }
  );
}

function setHoursDropdown() {
  // Persist the hour in 24-hour form so the sidebar math stays simple
  setDropdown(hours, 'hours-options', 'hours-selected', (key: string) => {
    chrome.storage.sync.set({
      start_hour: hours[key] + ampm[getSelectedAmPm()],
    });
  });
}

function getSelectedHours() {
  return document.getElementById('hours-selected')?.textContent?.trim() || '0';
}

function setListLengthDropdown() {
  // Keep the dropdown in sync with the stored numeric limit
  setDropdown(
    listLength,
    'list-length-options',
    'list-length-selected',
    (key: string) => {
      chrome.storage.sync.set({
        default_list_length: listLength[key],
      });
    }
  );
}

function setMinutesDropdown() {
  // Minutes are displayed as padded strings but stored as numbers
  setDropdown(
    minutes,
    'minutes-options',
    'minutes-selected',
    (key: string) => {
      chrome.storage.sync.set({
        start_minutes: minutes[key],
      });
    },
    (a, b) => parseInt(a) - parseInt(b)
  );
}

function setAmPmDropdown() {
  setDropdown(ampm, 'ampm-options', 'ampm-selected', (key: string) => {
    // Combine the visible hour with the chosen half of the day
    chrome.storage.sync.set({
      start_hour: hours[getSelectedHours()] + ampm[key],
    });
  });
}

function getSelectedAmPm() {
  return document.getElementById('ampm-selected')?.textContent?.trim() || 'am';
}

const periods: Record<string, string> = {
  day: 'Day',
  three_day: 'ThreeDay',
  week: 'Week',
  month: 'Month',
};

function setSelectedPeriod(key: string) {
  const selected = document.getElementById(key);
  Object.keys(periods).forEach((p) => {
    document.getElementById(p)?.classList.remove('selected-period');
  });
  if (selected) {
    selected.classList.add('selected-period');
    const weekday = document.getElementById('weekday-dropdown');
    // Only week mode needs a named start day
    if (key !== 'week') weekday?.classList.add('hidden');
    else weekday?.classList.remove('hidden');
    const label = document.getElementById('start-label');
    if (label) {
      label.textContent = periods[key] + ' start';
    }
  }
}

function setPeriods() {
  Object.keys(periods).forEach((p) => {
    const pd = document.getElementById(p);
    if (pd)
      pd.onclick = () => {
        setSelectedPeriod(p);
        chrome.storage.sync.set({ period: periods[p] });
      };
  });
}

const booleanOptions: Record<string, string> = {
  'default-sidebar': 'sidebar',
  'active-rings': 'dash_courses',
  'due-date-headings': 'due_date_headings',
  'show-locked-assignments': 'show_locked_assignments',
  'show-confetti': 'show_confetti',
  'dark-mode': 'dark_mode',
  'rolling-period': 'rolling_period',
  'custom-theme-color': 'theme_color',
  'show-needs-grading': 'show_needs_grading',
  'color-tabs': 'color_tabs',
  'long-overdue': 'show_long_overdue',
  'clock-24hr': 'clock_24hr',
  'show-rings': 'show_rings',
  'blackboard-hide-announcements': 'blackboard_hide_announcements',
  'blackboard-show-only-graded': 'blackboard_show_only_graded',
  'blackboard-hide-discussions': 'blackboard_hide_discussions',
  'blackboard-hide-empty-courses': 'blackboard_hide_courses_without_due_dates',
  'blackboard-diagnostics': 'blackboard_diagnostics',
};

const invertedKeys = ['dash_courses', 'sidebar'];

function setBooleanOption(key: string, checked: boolean) {
  const updatedKey: Record<string, boolean> = {};
  // A few legacy settings are stored inverted from the checkbox label
  updatedKey[key] = invertedKeys.includes(key) ? !checked : checked;
  chrome.storage.sync.set(updatedKey);
}

function toggleClass(className: string, elem: HTMLElement) {
  if (elem.classList.contains(className)) elem.classList.remove(className);
  else elem.classList.add(className);
}

function setCheckbox(key: string, checked: boolean) {
  if (checked) document.getElementById(key)?.classList.add('checked');
  else document.getElementById(key)?.classList.remove('checked');
}

// let selectedColor = '';
document
  .getElementById('color-choice')
  ?.addEventListener('input', (ev: Event) => {
    setThemeColor((ev?.target as HTMLInputElement).value);
  });

/* getPropertyValue() includes CSS formatting whitespace, so trim() is needed. */
const defaultColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--theme-default')
  .trim();

function getRememberedThemeColor() {
  return (
    window.localStorage.getItem(LAST_CUSTOM_THEME_COLOR_KEY) || defaultColor
  );
}

function rememberThemeColor(color: string) {
  window.localStorage.setItem(LAST_CUSTOM_THEME_COLOR_KEY, color);
}

function applyThemeColorPreview(color: string) {
  const colorChoice = document.getElementById('color-choice');
  if (colorChoice) (colorChoice as HTMLInputElement).value = color;
  document.documentElement.style.setProperty('--bg-theme', color);
}

function debounce(func: (...args: string[]) => void, timeout = 300) {
  let timer: number;
  return (...args: string[]) => {
    clearTimeout(timer);
    timer = window.setTimeout(function (this: (...args: string[]) => void) {
      func.apply(this, args);
    }, timeout);
  };
}

const writeThemeColor = debounce((color: string) => {
  // Keep the last chosen custom color around
  // Turning the toggle off should only disable the accent, not forget the choice
  rememberThemeColor(color);
  chrome.storage.sync.set({
    theme_color: color,
  });
});

function setThemeColor(color: string) {
  // Update the preview right away so the settings page does not flash back
  // to the default accent while the debounced storage write is waiting
  rememberThemeColor(color);
  applyThemeColorPreview(color);
  writeThemeColor(color);
}

function clearThemeColor() {
  // Leave the picker on the last custom value
  // This makes the next toggle-on feel immediate instead of resetting to the default
  applyThemeColorPreview(getRememberedThemeColor());
  chrome.storage.sync.set({
    theme_color: 'var(--ic-brand-global-nav-bgd)',
  });
  document.documentElement.style.setProperty('--bg-theme', defaultColor);
}

function setRollingPeriodEffects() {
  const checkbox = document.getElementById('rolling-period');
  const startSelector = document.getElementById('start-selector');
  // Rolling mode ignores the manual start controls
  if (checkbox?.classList.contains('checked')) {
    startSelector?.classList.remove('show');
    startSelector?.classList.add('hide');
  } else {
    startSelector?.classList.remove('hide');
    startSelector?.classList.add('show');
  }
}

function setCustomColorEffects() {
  const checkbox = document.getElementById('custom-theme-color');
  const colorPicker = document.getElementById('color-options');
  // Hide the picker when the override is off so the layout stays compact
  if (!checkbox?.classList.contains('checked')) {
    colorPicker?.classList.remove('show');
    colorPicker?.classList.add('hide');
  } else {
    colorPicker?.classList.remove('hide');
    colorPicker?.classList.add('show');
  }
}

function setBooleanOptions() {
  Object.keys(booleanOptions).forEach((b) => {
    const checkbox = document.getElementById(b);
    if (checkbox) {
      checkbox.onclick = () => {
        // The options page is still plain DOM code
        // Keep the click path explicit so each side effect is easy to follow
        toggleClass('checked', checkbox);
        if (b !== 'custom-theme-color') {
          setBooleanOption(
            booleanOptions[b],
            checkbox.classList.contains('checked')
          );
        }
        if (b === 'rolling-period') {
          setRollingPeriodEffects();
        } else if (b === 'custom-theme-color') {
          setCustomColorEffects();
          if (checkbox.classList.contains('checked')) {
            setThemeColor(getRememberedThemeColor());
          } else {
            clearThemeColor();
          }
        }
      };
    }
  });
}

setStoreLinks();
setWeekdayDropdown();
setHoursDropdown();
setMinutesDropdown();
setListLengthDropdown();
setAmPmDropdown();
setPeriods();
setAppearanceToggle();
setRestoreDefaults();
applyAppearanceTheme(getSavedAppearanceTheme());
setAppearanceButtons(getSavedAppearanceTheme());

chrome.storage.sync.get(storedUserOptions, (items) => {
  const options = applyDefaults(items as Options);
  // Hydrate the plain DOM controls from storage before wiring the click handlers
  setSelectedPeriod(options.period.toLowerCase());
  setCheckbox('show-rings', options.show_rings);
  setCheckbox('rolling-period', options.rolling_period);
  setCheckbox('default-sidebar', !options.sidebar);
  setCheckbox('active-rings', !options.dash_courses);
  setCheckbox('due-date-headings', options.due_date_headings);
  // setCheckbox('show-locked-assignments', options.show_locked_assignments);
  setCheckbox('show-confetti', options.show_confetti);
  setCheckbox('dark-mode', options.dark_mode);
  setCheckbox('show-needs-grading', options.show_needs_grading);
  setCheckbox(
    'custom-theme-color',
    options.theme_color !== 'var(--ic-brand-global-nav-bgd)'
  );
  setCheckbox('color-tabs', options.color_tabs);
  setCheckbox('long-overdue', options.show_long_overdue);
  setCheckbox('clock-24hr', options.clock_24hr);
  setCheckbox(
    'blackboard-hide-announcements',
    options.blackboard_hide_announcements
  );
  setCheckbox(
    'blackboard-show-only-graded',
    options.blackboard_show_only_graded
  );
  setCheckbox(
    'blackboard-hide-discussions',
    options.blackboard_hide_discussions
  );
  setCheckbox(
    'blackboard-hide-empty-courses',
    options.blackboard_hide_courses_without_due_dates
  );
  setCheckbox('blackboard-diagnostics', options.blackboard_diagnostics);
  if (options.theme_color !== OptionsDefaults.theme_color) {
    rememberThemeColor(options.theme_color);
    applyThemeColorPreview(options.theme_color);
  } else {
    // Keep the old custom color around in the picker even when the override is off
    applyThemeColorPreview(getRememberedThemeColor());
    document.documentElement.style.setProperty('--bg-theme', defaultColor);
  }
  setSelectedDropdownOption(
    Object.keys(weekdays)[options.start_date - 1],
    'weekdays-options',
    'weekday-selected'
  );
  if (options.start_hour >= 12) {
    setSelectedDropdownOption(
      '' + (((options.start_hour - 1) % 12) + 1),
      'hours-options',
      'hours-selected'
    );
    setSelectedDropdownOption('pm', 'ampm-options', 'ampm-selected');
  } else {
    setSelectedDropdownOption(
      '' + options.start_hour,
      'hours-options',
      'hours-selected'
    );
    setSelectedDropdownOption('am', 'ampm-options', 'ampm-selected');
  }
  setSelectedDropdownOption(
    (options.start_minutes < 10 ? '0' : '') + options.start_minutes,
    'minutes-options',
    'minutes-selected'
  );
  setBooleanOptions();
  setRollingPeriodEffects();
  setCustomColorEffects();
});
