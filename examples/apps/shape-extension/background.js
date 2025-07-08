chrome.runtime.onInstalled.addListener(() => {
  console.log('Shape Sidekick installed');
  
  chrome.storage.sync.set({
    enabled: true,
    apiKey: '',
    shapeUsername: 'shaperobot',
    personality: 'snarky',
    voiceEnabled: false,
    commentFrequency: 30000,
    idleThreshold: 300000
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let isResponseAsync = false;

  switch (message.action) {
    case 'openSettings':
      chrome.runtime.openOptionsPage();
      break;

    case 'openTab':
      if (message.url) {
        chrome.tabs.create({ url: message.url });
      }
      break;

    case 'getSettings':
      isResponseAsync = true;
      chrome.storage.sync.get(null, (settings) => {
        sendResponse(settings);
      });
      break;
      
    case 'saveSettings':
      isResponseAsync = true;
      chrome.storage.sync.set(message.settings, () => {
        sendResponse({ success: true });
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { action: 'reload' }).catch(() => {});
            }
          });
        });
      });
      break;
  }
  
  return isResponseAsync;
});