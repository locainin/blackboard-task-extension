// Keep install and support links inside the project repo
const REPOSITORY_URL = 'https://github.com/locainin/blackboard-task-extension';
const INSTALL_URL = `${REPOSITORY_URL}#installing-and-running-for-development`;
const UNINSTALL_URL = `${REPOSITORY_URL}/issues/new`;

chrome.runtime.onInstalled.addListener(function (object) {
  if (object.reason === 'install') {
    const now = new Date().getTime();
    chrome.tabs.create({ url: `${INSTALL_URL}?ref=install` });
    chrome.storage.sync.set({ install_time: now });
    chrome.runtime.setUninstallURL(`${UNINSTALL_URL}?b=${now}&c=133`);
  }
});

chrome.storage.onChanged.addListener(function (changes) {
  if ('client_id' in changes) {
    chrome.storage.sync.get(['client_id', 'install_time'], (result) => {
      if (!result['install_time']) result['install_time'] = '1693540800000';
      const params = new URLSearchParams({
        a: result['client_id'],
        b: result['install_time'],
        c: '133',
      });
      chrome.runtime.setUninstallURL(`${UNINSTALL_URL}?${params.toString()}`);
    });
  }
});
