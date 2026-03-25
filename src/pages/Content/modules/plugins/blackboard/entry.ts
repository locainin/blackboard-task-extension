import { BlackboardLMSConfig } from '.';
import runApp from '../..';
import { getOptions } from '../../hooks/useOptions';
import {
  colorFromId,
  loadCustomColors,
  setCustomColors,
} from '../shared/customColors';
import { swallowExtensionContextInvalidated } from '../../utils/extensionContext';
import { logBlackboardDiagnostics } from './utils/diagnostics';

const SIDEBAR_ROOT_ID = 'tfc-blackboard-root';
const PREPARED_CONTAINER_ATTR = 'data-tfc-container-ready';
const COLOR_PICKER_ATTR = 'data-tfc-color-picker';

function setStyles() {
  // Keep the old Canvas-flavored CSS variables mapped to Blackboard colors
  // Many shared components still read these names
  document.documentElement.style.setProperty(
    '--ic-brand-font-color-dark', // used in subtabs and as a default elsewhere
    'rgb(32, 33, 34)'
  );
  document.documentElement.style.setProperty(
    '--ic-brand-global-nav-bgd', // used in subtabs and as a default elsewhere
    '#002040'
  );
  document.documentElement.style.setProperty('--ic-brand-primary', '#002040');
}

function makeColorPicker(
  callback: (color: string) => void,
  defaultColor: string,
  card: HTMLElement,
  variant: 'bar' | 'picker' = 'picker'
) {
  // Blackboard course cards do not expose a built-in color control
  // This small hidden input keeps the existing custom-color feature working
  const existingPicker = card.querySelector(
    `[${COLOR_PICKER_ATTR}="${variant}"]`
  );
  if (existingPicker) return existingPicker as HTMLElement;

  const wrapper = document.createElement('wrapper');
  wrapper.setAttribute(COLOR_PICKER_ATTR, variant);
  const picker = document.createElement('input');
  wrapper.appendChild(picker);
  picker.type = 'color';
  picker.addEventListener('input', (ev: Event) => {
    callback((ev?.target as HTMLInputElement).value);
  });
  if (variant === 'picker') {
    wrapper.style.width = '20px';
    wrapper.style.height = '20px';
    wrapper.style.borderRadius = '5px';
    wrapper.style.marginTop = '5px';
    wrapper.style.border = '1px solid #e3e9f1';
    wrapper.style.right = '0px';
  } else {
    wrapper.style.width = '40px';
    wrapper.style.bottom = '0px';
    wrapper.style.left = '0px';
  }
  wrapper.style.position = 'absolute';

  wrapper.style.top = '0px';
  wrapper.style.zIndex = '1000';

  wrapper.style.cursor = 'pointer';

  picker.style.opacity = '0';
  picker.style.width = '100%';
  picker.style.height = '100%';

  picker.style.cursor = 'pointer';
  picker.onmouseover = () => {
    wrapper.style.opacity = '0.8';
  };
  picker.onmouseleave = () => {
    wrapper.style.opacity = '1';
  };

  picker.value = defaultColor;
  wrapper.style.backgroundColor = picker.value;
  const titleLink = card.querySelector('h4');
  if (titleLink) titleLink.style.color = picker.value;
  const courseLink = card.querySelector('a');
  if (courseLink) courseLink.style.color = picker.value;

  picker.onchange = () => {
    wrapper.style.backgroundColor = picker.value;
    if (titleLink) titleLink.style.color = picker.value;
    if (courseLink) courseLink.style.color = picker.value;
  };

  card.appendChild(wrapper);
  card.style.position = 'relative';

  const details: HTMLElement | null = card.querySelector('.element-details');
  if (details) details.style.marginLeft = '40px';

  return wrapper;
}

function mountUltraColorPicker(
  card: Element,
  titleNode: Element,
  currColors: Record<string, string>
) {
  const mountPicker = () => {
    const courseTitle = titleNode as HTMLElement;

    // Blackboard fills the real course id into the title id after hydration
    // Skip mounting until that id is present
    if (courseTitle.id.length <= 13) return false;

    const courseId = courseTitle.id.slice(12);
    const color =
      courseId in currColors ? currColors[courseId] : colorFromId(courseId);
    makeColorPicker(
      (nextColor: string) => {
        setCustomColors('blackboard_custom', { [courseId]: nextColor });
      },
      color,
      card as HTMLElement,
      'bar'
    );
    return true;
  };

  // Fast Blackboard renders can already have the course id ready
  // Try once before waiting on a later mutation that may never come
  if (mountPicker()) return;

  const observer = new MutationObserver(() => {
    if (!mountPicker()) return;
    observer.disconnect();
  });

  observer.observe(titleNode, {
    childList: false,
    subtree: false,
    attributes: true,
    attributeFilter: ['id'],
  });
}

interface MountTarget {
  container: HTMLElement;
  needsActivityPadding: boolean;
}

function findUltraMountTarget(node: ParentNode): MountTarget | null {
  const searchRoot = node as ParentNode & {
    querySelector?: (selector: string) => Element | null;
  };

  // Course pages already expose the right column wrapper
  const courseColumns = searchRoot.querySelector?.(
    '.course-columns'
  ) as HTMLElement | null;
  if (courseColumns) {
    logBlackboardDiagnostics('mount target detected', {
      surface: 'course-columns',
    });
    return {
      container: courseColumns,
      needsActivityPadding: false,
    };
  }

  // Activity stream pages need the parent wrapper so the panel sits beside the feed
  const activityStreamSelf = node as HTMLElement;
  if (
    activityStreamSelf.id === 'activity-stream' &&
    activityStreamSelf.parentElement
  ) {
    logBlackboardDiagnostics('mount target detected', {
      surface: 'activity-stream-self',
    });
    return {
      container: activityStreamSelf.parentElement,
      needsActivityPadding: true,
    };
  }

  const activityStream = searchRoot.querySelector?.(
    '#activity-stream'
  ) as HTMLElement | null;
  if (activityStream?.parentElement) {
    logBlackboardDiagnostics('mount target detected', {
      surface: 'activity-stream-child',
    });
    return {
      container: activityStream.parentElement,
      needsActivityPadding: true,
    };
  }

  return null;
}

function prepareUltraMountContainer(
  container: HTMLElement,
  needsActivityPadding: boolean
) {
  // Do the layout work once for each Blackboard host node
  if (container.getAttribute(PREPARED_CONTAINER_ATTR) === 'true') return;

  if (needsActivityPadding) {
    container.style.paddingRight = '20px';
  }

  container.style.display = 'flex';
  container.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
  container.style.alignItems = 'flex-start';

  // Let Blackboard content keep the flexible side of the row
  if (container.children.length) {
    (container.children[0] as HTMLElement).style.flexGrow = '1';
  }

  container.setAttribute(PREPARED_CONTAINER_ATTR, 'true');
}

function isStructuralMutation(mutations: MutationRecord[]) {
  // Ignore attribute noise and batch only real DOM moves
  return mutations.some(
    (mutation) =>
      mutation.type === 'childList' &&
      (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
  );
}

async function setColorPickers() {
  const currColors = await loadCustomColors('blackboard_custom');
  const cards = document.querySelectorAll('bb-base-course-card');
  logBlackboardDiagnostics('color picker scan', {
    ultraCards: cards.length,
  });
  // const titleNode = cards[0].querySelector('.course-title');
  if (cards.length) {
    cards.forEach((card) => {
      const titleNode = card.querySelector('.course-title');
      if (!titleNode) return;

      // Blackboard sometimes hydrates the title id before this script attaches
      // Mount immediately when possible and only fall back to observing when needed
      mountUltraColorPicker(card, titleNode, currColors);
    });
  } else {
    const container = document.getElementById('My_Courses_Tools');
    if (container) {
      const observer = new MutationObserver(() => {
        const elems = container.querySelectorAll('a');
        elems.forEach((elem) => {
          if (!elem || !elem.parentElement) return;
          const url = new URL(elem.href);
          const courseId = url.searchParams.get('id');
          if (!courseId) return;
          const color =
            courseId in currColors
              ? currColors[courseId]
              : colorFromId(courseId);
          makeColorPicker(
            (color: string) => {
              setCustomColors('blackboard_custom', { [courseId]: color });
            },
            color,
            elem.parentElement,
            'picker'
          );
        });
        if (elems.length) {
          observer.disconnect();
        }
      });
      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    }
  }
}

async function runRootApp(container: HTMLElement, fixedWidth: boolean = true) {
  // Blackboard navigation can call this multiple times while the DOM settles
  // The root id is the hard guard that keeps one sidebar per host
  if (container.querySelector(`#${SIDEBAR_ROOT_ID}`)) return;

  const root = document.createElement('div');
  root.id = SIDEBAR_ROOT_ID;
  root.style.marginLeft = '2rem';
  root.style.setProperty('line-height', '1.5');
  root.textContent = 'Tasks for Blackboard';
  if (fixedWidth) {
    root.style.width = '280px';
    root.style.minWidth = '280px';
  } else {
    root.style.width = '100%';
  }
  root.style.position = 'relative';
  container.append(root);
  const options = await getOptions();
  logBlackboardDiagnostics('sidebar mount', {
    fixedWidth,
    sidebarHidden: !options.sidebar,
    darkMode: options.dark_mode,
    diagnostics: options.blackboard_diagnostics,
  });
  if (!options.sidebar) {
    const mytasks = document.getElementById('My_Tasks_Tools');
    if (mytasks && mytasks.parentElement) {
      mytasks.parentElement.style.display = 'none';
    }
  }

  runApp(root, BlackboardLMSConfig, options);
  setColorPickers();
}

export default async function BlackboardEntrypoint() {
  setStyles();
  logBlackboardDiagnostics('entrypoint start', {
    url: window.location.href,
  });
  const siteWrap = document.getElementById('site-wrap');
  if (!siteWrap) {
    logBlackboardDiagnostics('entrypoint fallback', {
      mode: 'original-blackboard',
    });
    OldBlackboardEntrypoint();
    return;
  }
  const ultraContainer: HTMLElement = siteWrap;

  let mountQueued = false;

  function ensureUltraRoot() {
    const mountTarget = findUltraMountTarget(ultraContainer);
    if (!mountTarget) {
      logBlackboardDiagnostics('mount target missing', {
        url: window.location.href,
      });
      return;
    }

    // Blackboard swaps wrappers during SPA navigation
    // Re-prepare the host before each mount attempt
    prepareUltraMountContainer(
      mountTarget.container,
      mountTarget.needsActivityPadding
    );

    // Mount once per Blackboard host and let the root guard stop duplicates
    void runRootApp(mountTarget.container).catch(
      swallowExtensionContextInvalidated
    );
  }

  function queueMountCheck() {
    // Blackboard moves a lot of DOM around during navigation
    // One scan per frame is enough and avoids repeated deep queries
    if (mountQueued) return;

    mountQueued = true;
    requestAnimationFrame(() => {
      mountQueued = false;
      ensureUltraRoot();
    });
  }

  // Try once right away in case the target is already on the page
  queueMountCheck();

  const observer = new MutationObserver((mutations) => {
    if (!isStructuralMutation(mutations)) return;
    queueMountCheck();
  });

  observer.observe(ultraContainer, { subtree: true, childList: true });
}

// for non-ultra blackboard
async function OldBlackboardEntrypoint() {
  const container = document.getElementById('column2');
  if (!container) return;
  logBlackboardDiagnostics('old blackboard mount', {
    url: window.location.href,
  });
  const portlet = document.createElement('div');
  portlet.className = 'portlet clearfix reorderableModule';
  portlet.style.display = 'flex';
  portlet.style.justifyContent = 'center';
  portlet.style.alignItems = 'center';
  portlet.style.paddingTop = '2rem';
  portlet.style.paddingRight = '2rem'; // offset the default padding from runRootApp
  if (container.children.length) {
    container.insertBefore(portlet, container.children[0]);
  } else {
    container.appendChild(portlet);
  }
  runRootApp(portlet, false);
}
