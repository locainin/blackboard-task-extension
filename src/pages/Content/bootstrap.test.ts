import {
  isBlackboardPage,
  startBlackboardEntrypoint,
  waitForBlackboardPage,
} from './bootstrap';

function addBlackboardMeta(content = 'Blackboard') {
  const meta = document.createElement('meta');
  meta.name = 'author';
  meta.content = content;
  document.head.appendChild(meta);
  return meta;
}

function flushMutationObserver() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

describe('content bootstrap', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.__tfcBlackboardEntrypointStarted;
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('detects Blackboard from the author meta tag', () => {
    addBlackboardMeta();

    expect(isBlackboardPage()).toBe(true);
  });

  it('does not treat unrelated author meta tags as Blackboard', () => {
    addBlackboardMeta('Other');

    expect(isBlackboardPage()).toBe(false);
  });

  it('starts immediately when Blackboard is already hydrated', () => {
    const onStart = jest.fn();
    addBlackboardMeta();

    const observer = waitForBlackboardPage({
      isTopLevelFrame: () => true,
      onStart,
      windowRef: window,
    });

    expect(observer).toBeNull();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(window.__tfcBlackboardEntrypointStarted).toBe(true);
  });

  it('starts after Blackboard hydrates the author meta tag', async () => {
    const onStart = jest.fn();

    const observer = waitForBlackboardPage({
      isTopLevelFrame: () => true,
      onStart,
      windowRef: window,
    });

    expect(observer).not.toBeNull();
    expect(onStart).not.toHaveBeenCalled();

    addBlackboardMeta();
    await flushMutationObserver();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(window.__tfcBlackboardEntrypointStarted).toBe(true);
  });

  it('does not start inside embedded frames', () => {
    const onStart = jest.fn();

    const observer = waitForBlackboardPage({
      isTopLevelFrame: () => false,
      onStart,
      windowRef: window,
    });

    expect(observer).toBeNull();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('starts only once even if called repeatedly', () => {
    const onStart = jest.fn();

    expect(startBlackboardEntrypoint({ onStart, windowRef: window })).toBe(
      true
    );
    expect(startBlackboardEntrypoint({ onStart, windowRef: window })).toBe(
      false
    );

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('disconnects the hydration observer after the timeout', () => {
    jest.useFakeTimers();
    const onStart = jest.fn();

    const observer = waitForBlackboardPage({
      isTopLevelFrame: () => true,
      onStart,
      timeoutMs: 100,
      windowRef: window,
    });
    if (!observer) throw new Error('Expected bootstrap observer');

    const disconnect = jest.spyOn(observer, 'disconnect');
    jest.advanceTimersByTime(100);

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });
});
