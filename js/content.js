chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getLinkParams') {
    const linkUrl = message.linkUrl;
    const linkElements = Array.from(document.querySelectorAll('a')).filter(link => link.href === linkUrl);
    const linkText = getText(linkElements);
    const linkMeta = getMeta(linkElements, message.linkType);
    sendResponse({
      linkText: linkText,
      linkMeta: linkMeta
    });
  }
  if (message.action === 'openPopup') {
    const { link, type, linkText, linkMeta } = message;
    createPopup(link, type, linkText, linkMeta);
  }
});

const { DOMParser } = window;
const parser = new DOMParser();
const popupStyle = `<style id="save-popup-styles">
.save-btn,.close-btn{display:block;border:none;cursor:pointer;padding:10px 24px;color:#333;background:transparent;}
.save-btn{display:block;width:100%;margin:0 0 8px;text-align:left;}
.option:last-of-type .save-btn{margin:0;}
.save-btn:not(:disabled):hover{background:rgba(0,0,0,0.05);}
.save-btn:disabled{cursor:not-allowed}
.close-btn{position:absolute;top:5px;right:5px;padding:5px;}
.no-name{padding:0 24px;}
.save-text{display:inline-block;font-size:12px;margin:15px 0 10px;}
.save-input,.save-select{box-sizing:border-box;display:block;width:100%;border:1px solid #dfdfdf;border-radius:10px;padding:7px 10px;margin:0 0 10px;}
.playlist-container{padding:0 24px}
</style>`;
const channelsBtn = `<div class="option">
<button class="save-btn" id="saveChannel">Save Channel</button>
</div>`;
const playlistBtn = `<div><div class="option">
<button class="save-btn" id="saveToPlaylist">Save to playlist</button>
<div id="playlistOptions" style="display: none;">
  <div class="playlist-container">
    <select class="save-select" id="playlistSelect"></select>
    <input class="save-input" type="text" id="newPlaylistName" placeholder="New playlist name" />
  </div>
  <button class="save-btn" id="createPlaylist" disabled>Create and Save</button>
</div>
</div>
<div class="option">
<button class="save-btn" id="saveToWatchLater">Save to Watch later</button>
</div></div>`;
const closeBtn = '<button class="close-btn" id="closePopup" title="Close"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="18" viewBox="0 0 24 24" width="18" focusable="false" style="pointer-events: none; display: inherit;" aria-hidden="true"><path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path></svg></button>';
const closeBtnElement = parser.parseFromString(closeBtn, 'text/html').body.firstChild;

function createPopup(link, type, linkText, linkMeta) {
  const existingPopup = document.getElementById('extension-popup');

  if (existingPopup) {
    existingPopup.remove();
    const popupStyles = document.getElementById('save-popup-styles');
    popupStyles.remove();
  }

  const popup = document.createElement('div');
  popup.classList.add('save-popup');
  popup.id = 'extension-popup';
  popup.style.position = 'fixed';
  popup.style.right = '10px';
  popup.style.top = '10px';
  popup.style.zIndex = '10000';
  popup.style.backgroundColor = '#fff';
  popup.style.borderRadius = '10px';
  popup.style.padding = '30px 0';
  popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
  popup.style.width = '300px';

  const isChannel = type === 'channel';
  popup.appendChild(closeBtnElement);
  if (linkText === 'No text available') {
    const noText = `<div class="no-name"><b class="save-text">Could not get the name of the ${type}. Please input the name:</b><br>
    <input class="save-input" id="linkName" type="text" placeholder="No text available"></div>`;
    const noTextElement = parser.parseFromString(noText, 'text/html').body.firstChild;
    popup.appendChild(noTextElement);
  }

  const content = isChannel ? channelsBtn : playlistBtn;
  const contentElement = parser.parseFromString(content, 'text/html').body.firstChild;
  popup.appendChild(contentElement);

  const styleElement = parser.parseFromString(popupStyle, 'text/html').head.firstChild;
  document.body.appendChild(styleElement);
  document.body.appendChild(popup);

  if (isChannel) {
    document.getElementById('saveChannel').addEventListener('click', () => {
      saveToLocalStorage('channels', link, linkText, linkMeta);
      closePopup();
    });
  } else {
    document.getElementById('saveToWatchLater').addEventListener('click', () => {
      saveToLocalStorage('playlists', link, linkText, linkMeta, 'Watch later');
      closePopup();
    });

    document.getElementById('saveToPlaylist').addEventListener('click', () => {
      document.getElementById('playlistOptions').style.display = 'block';
      loadPlaylists(link, linkText, linkMeta);
    });
  
    document.getElementById('createPlaylist').addEventListener('click', () => {
      const playlistName = document.getElementById('newPlaylistName').value;
      const select = document.getElementById('playlistSelect');
      const playlistSelect = select.value;
      if (playlistSelect) {
        const selectName = select.querySelector(`option[value="${playlistSelect}"]`).textContent;
        saveToLocalStorage('playlists', link, linkText, linkMeta, selectName);
      } else if (playlistName) {
        saveToLocalStorage('playlists', link, linkText, linkMeta, playlistName);
      } else {
        console.warn('Failed to save to playlist, no playlist was specified');
      }
      closePopup();
    });
  }

  document.getElementById('closePopup').addEventListener('click', closePopup);

  function closePopup() {
    const popupStyles = document.getElementById('save-popup-styles');
    popup.remove();
    popupStyles.remove();
  }
}

function saveToLocalStorage(category, link, linkText, linkMeta, playlistName = null) {
  if (linkText === 'No text available' && document.getElementById('linkName')) {
    linkText = document.getElementById('linkName').value || linkText;
  }
  chrome.storage.local.get([ category ], result => {
    let items = result[category] || {};
    let save = false;
    const itemToSave = {
      link,
      linkText,
      linkMeta
    };

    if (playlistName) {
      const playlistAlias = toCamelCase(playlistName);
      if (!items[playlistAlias]) {
        items[playlistAlias] = {};
        items[playlistAlias].videos = [];
        items[playlistAlias].playlistName = playlistName;
        save = true;
      }
      if (!items[playlistAlias].videos.find(item => item.link === link)) {
        items[playlistAlias].videos.push(itemToSave);
        save = true;
      }
    } else {
      if (!items.general) {
        items.general = [];
        save = true;
      }
      if (!items.general.find(item => item.link === link)) {
        items.general.push(itemToSave);
        save = true;
      }
    }

    if (save) {
      chrome.storage.local.set({ [category]: items }, () => {
        console.log(`${category} saved:`, itemToSave);
      });
    } else {
      console.log(`${link} already exists in ${category}`);
    }
  });
}

function toCamelCase(str) {
  return str
    .toLowerCase()
    .split(/[\s_-]+/)  // Split by space, hyphen, or underscore
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

function loadPlaylists() {
  chrome.storage.local.get([ 'playlists' ], result => {
    const playlists = result.playlists || {};
    const playlistSelect = document.getElementById('playlistSelect');
    const playlistName = document.getElementById('newPlaylistName');
    const savePlaylist = document.getElementById('createPlaylist');
    const defaultOption = document.createElement('option');
    defaultOption.setAttribute('value', '');
    defaultOption.textContent = 'Choose a playlist';
    playlistSelect.appendChild(defaultOption);

    for (let playlist in playlists) {
      let option = document.createElement('option');
      option.value = playlist;
      option.textContent = playlists[playlist].playlistName;
      playlistSelect.appendChild(option);
    }

    playlistSelect.addEventListener('change', () => {
      const selectedPlaylist = playlistSelect.value;
      if (selectedPlaylist) {
        const name = playlists[selectedPlaylist].playlistName;
        playlistName.style.display = 'none';
        savePlaylist.textContent = `Save to ${name} playlist`;
        savePlaylist.removeAttribute('disabled');
      } else {
        playlistName.style.display = 'inline-block';
        savePlaylist.textContent = 'Create and Save';
        if (!playlistName.value) {
          savePlaylist.setAttribute('disabled', 'true');
        }
      }
    });

    playlistName.addEventListener('input', e =>{
      if (e.target.value) {
        savePlaylist.removeAttribute('disabled');
      } else {
        savePlaylist.setAttribute('disabled', 'true');
      }
    });
  });
}

function getText (elements) {
  const linkElement = elements.find(element => {
    const isVideo = element?.id.includes('video-title') || element.querySelector('#video-title');
    const isChannel = element.closest('#channel-name');
    return isVideo || isChannel;
  });
  return linkElement?.title || linkElement?.querySelector('#video-title')?.title || linkElement?.textContent || 'No text available';
}

function getMeta (elements, linkType) {
  const meta = {};

  if (linkType === 'video') {
    let metaElement = null;
    elements.forEach(element => {
      if (element?.querySelector('.ytd-channel-name')) { // watch video
        metaElement = element?.querySelector('.ytd-channel-name');
      } else if (element.closest('#meta')?.querySelector('.ytd-channel-name a')) { // video lists
        metaElement = element.closest('#meta').querySelector('.ytd-channel-name a');
      }
    });
    meta.channelName = metaElement?.textContent || '';
    meta.channelLink = metaElement?.href || '';
  } else {
    let metaElement = null;
    elements.forEach(element => {
      if (metaElement === null) {
        if (element.closest('#details') && element.closest('#details').querySelector('#decorated-avatar img')) {
          metaElement = element.closest('#details').querySelector('#decorated-avatar img');
        } else if (element.closest('#channel-info') && element.closest('#channel-info').querySelector('#channel-thumbnail img')) {
          metaElement = element.closest('#channel-info').querySelector('#channel-thumbnail img');
        }
      }
    });
    meta.avatar = metaElement?.src || '';
  }

  return meta;
}
