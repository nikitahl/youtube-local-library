chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveTo',
    title: 'Save to YouTube Local Library',
    contexts: [ 'link' ],
    documentUrlPatterns: [ '*://*.youtube.com/*' ]
  });
});

// Handle context menu item click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.linkUrl) {
    // eslint-disable-next-line
    const linkUrl = new URL(info.linkUrl);
    const linkType = determineLinkType(linkUrl);
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
  const { pathname } = linkUrl;
  if (pathname.startsWith('/watch') || pathname.startsWith('/shorts') || linkUrl.origin.includes('youtu.be/')) {
    return 'video';
  } else if (pathname.startsWith('/@') || pathname.startsWith('/channel')) {
    return 'channel';
  }
  return null;
}
