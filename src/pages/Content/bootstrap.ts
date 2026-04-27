export interface BlackboardBootstrapDeps {
  documentRef?: Document;
  isTopLevelFrame?: () => boolean;
  onStart: () => void;
  setTimeoutRef?: typeof window.setTimeout;
  timeoutMs?: number;
  windowRef?: Window;
}

const DEFAULT_BLACKBOARD_BOOTSTRAP_TIMEOUT_MS = 15 * 1000;

declare global {
  interface Window {
    __tfcBlackboardEntrypointStarted?: boolean;
  }
}

export function isTopLevelFrame(windowRef: Window = window) {
  try {
    // The sidebar belongs in the Blackboard shell, not embedded course iframes
    return windowRef.self === windowRef.top;
  } catch (_error) {
    return false;
  }
}

export function isBlackboardPage(documentRef: Document = document) {
  const author = documentRef.head.querySelector(
    'meta[name="author"]'
  ) as HTMLMetaElement | null;

  return author?.content === 'Blackboard';
}

export function startBlackboardEntrypoint({
  onStart,
  windowRef = window,
}: Pick<BlackboardBootstrapDeps, 'onStart' | 'windowRef'>) {
  // Blackboard can hydrate the author meta tag after the content script loads
  // Starting once from a live check avoids a refresh race without duplicate sidebars
  if (windowRef.__tfcBlackboardEntrypointStarted) return false;
  windowRef.__tfcBlackboardEntrypointStarted = true;

  onStart();
  return true;
}

export function waitForBlackboardPage({
  documentRef = document,
  isTopLevelFrame: getIsTopLevelFrame = () => isTopLevelFrame(),
  onStart,
  setTimeoutRef = window.setTimeout.bind(window),
  timeoutMs = DEFAULT_BLACKBOARD_BOOTSTRAP_TIMEOUT_MS,
  windowRef = window,
}: BlackboardBootstrapDeps) {
  if (!getIsTopLevelFrame()) return null;

  if (isBlackboardPage(documentRef)) {
    startBlackboardEntrypoint({ onStart, windowRef });
    return null;
  }

  const observer = new MutationObserver(() => {
    if (!isBlackboardPage(documentRef)) return;
    observer.disconnect();
    startBlackboardEntrypoint({ onStart, windowRef });
  });

  observer.observe(documentRef.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  setTimeoutRef(() => {
    observer.disconnect();
  }, timeoutMs);

  return observer;
}
