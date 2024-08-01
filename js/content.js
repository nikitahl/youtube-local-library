const { chrome } = window;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // const pageUrl = new URL(window.location.href);
  // const pageType = pageUrl.pathname;
  // console.log('pageType',pageType)

  // console.log('message',message);
  // console.log('sender',sender);
  if (message.action === 'getLinkParams') {
    const linkUrl = message.linkUrl;
    const linkElements = Array.from(document.querySelectorAll('a')).filter(link => link.href === linkUrl);
    console.log('linkElements',linkElements);

    const linkText = getText(linkElements);
    const linkMeta = getMeta(linkElements, message.linkType);
    console.log('linkText',linkText);
    console.log('linkMeta',linkMeta);
    sendResponse({
      linkText: linkText,
      linkMeta: linkMeta
    });
  }
  if (message.action === 'openPopup') {
    const { link, type, linkText, linkMeta } = message;
    console.log('openPopup', { link, type, linkText, linkMeta });
    createPopup(link, type, linkText, linkMeta);
  }
  console.log('=======');
});

const popupStyle = `<style>
.save-btn,.close-btn{display:block;background:none;border:none;cursor:pointer;padding:8px 24px;color:#333;border-radius:10px;}
.save-btn{margin:0 0 8px;}
.option:last-of-type .save-btn{margin:0;}
.save-btn:hover,.close-btn:hover{background:#dfdfdf;}
.close-btn{position:absolute;top:5px;right:5px;padding:5px;}
.save-text{display:inline-block;font-size:12px;margin:15px 0 10px;}
.save-input{display:inline-block;border:1px solid #dfdfdf;border-radius:10px;padding:7px 10px;margin:0 0 10px;}
</style>`;
const channelsBtn = `<div class="option">
<button class="save-btn" id="saveChannel">Save Channel</button>
</div>`;
const playlistBtn = `<!--<div class="option">
<button class="save-btn" id="saveToPlaylist">Save to Playlist</button>
<div id="playlistOptions" style="display: none;">
  <select id="playlistSelect"></select>
  <input class="save-input" type="text" id="newPlaylistName" placeholder="New playlist name" />
  <button class="save-btn" id="createPlaylist">Create and Save</button>
</div>
</div>-->
<div class="option">
<button class="save-btn" id="saveToWatchlist">Save to Watch later</button>
</div>`;
const closeBtn = '<button class="close-btn" id="closePopup" title="Close"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="18" viewBox="0 0 24 24" width="18" focusable="false" style="pointer-events: none; display: inherit;" aria-hidden="true"><path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path></svg></button>';

function createPopup(link, type, linkText, linkMeta) {
  const existingPopup = document.getElementById('extension-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.classList.add('save-popup');
  popup.id = 'extension-popup';
  popup.style.position = 'fixed';
  popup.style.right = '10px';
  popup.style.top = '10px';
  popup.style.zIndex = '10000';
  popup.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  popup.style.borderRadius = '10px';
  popup.style.padding = '15px';
  popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
  popup.style.width = '300px';

  const isChannel = type === 'channel';
  popup.innerHTML = closeBtn;
  if (linkText === 'No text available') {
    popup.innerHTML += `<b class="save-text">Could not get the name of the ${type}. Please input the name:</b><br>
    <input class="save-input" id="linkName" type="text" placeholder="No text available">`;
  }

  popup.innerHTML += isChannel ? channelsBtn : playlistBtn;

  document.body.appendChild(popup);
  popup.insertAdjacentHTML('beforebegin', popupStyle);

  if (isChannel) {
    document.getElementById('saveChannel').addEventListener('click', () => {
      saveToLocalStorage('channels', link, linkText, linkMeta);
      closePopup();
    });
  } else {
    document.getElementById('saveToWatchlist').addEventListener('click', () => {
      saveToLocalStorage('watchlist', link, linkText, linkMeta);
      closePopup();
    });

    // document.getElementById('saveToPlaylist').addEventListener('click', () => {
    //   document.getElementById('playlistOptions').style.display = 'block';
    //   loadPlaylists(link, linkText, linkMeta);
    // });
  
    // document.getElementById('createPlaylist').addEventListener('click', () => {
    //   const playlistName = document.getElementById('newPlaylistName').value;
    //   if (playlistName) {
    //     saveToLocalStorage('playlists', link, linkText, linkMeta, playlistName);
    //   }
    //   closePopup();
    // });
  }

  document.getElementById('closePopup').addEventListener('click', closePopup);

  function closePopup() {
    popup.remove();
  }
}

function saveToLocalStorage(category, link, linkText, linkMeta, playlistName = null) {
  if (linkText === 'No text available' && document.getElementById('linkName')) {
    linkText = document.getElementById('linkName').value;
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
      if (!items[playlistName]) {
        items[playlistName] = [];
        save = true;
      }
      if (!items[playlistName].find(item => item.link === link)) {
        items[playlistName].push(itemToSave);
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

    console.log('itemToSave',itemToSave);
    if (save) {
      chrome.storage.local.set({ [category]: items }, () => {
        console.log(`${category} saved:`, itemToSave);
      });
    } else {
      console.log(`${link} already exists in ${category}`);
    }
  });
}

// function loadPlaylists(currentLink, linkText) {
//   chrome.storage.local.get([ 'playlists' ], result => {
//     const playlists = result.playlists || {};
//     const playlistSelect = document.getElementById('playlistSelect');
//     playlistSelect.innerHTML = '';

//     for (let playlist in playlists) {
//       let option = document.createElement('option');
//       option.value = playlist;
//       option.textContent = playlist;
//       playlistSelect.appendChild(option);
//     }

//     playlistSelect.addEventListener('change', () => {
//       const selectedPlaylist = playlistSelect.value;
//       saveToLocalStorage('playlists', currentLink, linkText, selectedPlaylist);
//     });
//   });
// }

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
      if (element.closest('#details') && element.closest('#details').querySelector('#decorated-avatar img')) {
        metaElement = element.closest('#details').querySelector('#decorated-avatar img');
      }
    });
    meta.avatar = metaElement?.src || '';
  }

  return meta;
}
