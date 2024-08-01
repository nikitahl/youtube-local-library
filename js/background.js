// Create context menu item
const { chrome } = window;
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveTo',
    title: 'Save to ...',
    contexts: [ 'link' ],
    documentUrlPatterns: [ '*://*.youtube.com/*' ]
  });
});

// Handle context menu item click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.linkUrl) {
    const linkType = determineLinkType(info.linkUrl);
    // console.log('info.linkUrl',info.linkUrl);
    // console.log('linkType',linkType);

    if (!linkType) {
      console.warn('The link you wish to save is not a video or a channel.');
      return false;
    }
    // Send a message to the content script to get the link text
    chrome.tabs.sendMessage(tab.id, {
      action: 'getLinkParams',
      linkUrl: info.linkUrl,
      linkType: linkType
    }, response => {
      console.log('response',response);
      const linkText = response ? response.linkText : 'No text available';
      const linkMeta = response ? response.linkMeta : 'No meta available';
      
      chrome.storage.local.set({ currentLink: info.linkUrl, linkText: linkText, linkType: linkType }, () => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'openPopup',
          link: info.linkUrl,
          linkText: linkText,
          type: linkType,
          linkMeta: linkMeta
        });
      });
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('../library.html') });
});

// Function to determine the type of YouTube link
function determineLinkType(linkUrl) {
  if (linkUrl.includes('watch?v=') || linkUrl.includes('youtu.be/')) {
    return 'video';
  } else if (linkUrl.includes('/@')) {
    return 'channel';
  }
  return null;
}
