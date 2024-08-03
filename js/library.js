document.addEventListener('DOMContentLoaded', () => {
  const videosList = document.getElementById('videosList');
  const channelsList = document.getElementById('channelsList');
  const playlistsContainer = document.getElementById('playlists');

  // Fetch saved videos from localStorage
  chrome.storage.local.get({ watchlist: [] }, result => {
    const savedVideos = result.watchlist.general;
    if (!savedVideos) {
      videosList.innerHTML = '<p style="margin:0">You have no videos saved in watch later.</p>';
      return;
    }
    // eslint-disable-next-line
    renderVideos(savedVideos, videosList); // defined in utils.js
  });

  chrome.storage.local.get({ playlists: [] }, result => {
    const playlists = result.playlists;
    if (!playlists.length) {
      playlistsContainer.innerHTML = '<p style="margin:0">You have no playlists.</p>';
      return;
    }
    for (const key in playlists) {
      if (Object.hasOwnProperty.call(playlists, key)) {
        const playlist = playlists[key];
        const playlistContainer = document.createElement('div');
        playlistContainer.classList.add('playlist');
        playlistContainer.innerHTML = `<strong class="title">${playlist.playlistName}</strong>
        <span class="secondary-link">${playlist.videos.length} videos</span>
        <a class="primary-link view-playlist" data-playlist-id="${key}" href="playlist.html">View full playlist</a>
        `;
        playlistsContainer.appendChild(playlistContainer);
      }
    }
    const playlistElements = document.querySelectorAll('.view-playlist');
    playlistElements.forEach(playlistElement => {
      playlistElement.addEventListener('click', e => {
        e.preventDefault();
        const playlistId = playlistElement.dataset.playlistId;
        const playlistData = playlists[playlistId];

        chrome.storage.local.set({ selectedPlaylist: playlistData }, () => {
          window.location.href = chrome.runtime.getURL('playlist.html');
        });
      });
    });
  });

  // Fetch saved channels from localStorage
  chrome.storage.local.get({ channels: [] }, result => {
    const savedChannels = result.channels.general;
    if (!savedChannels) {
      channelsList.innerHTML = '<p style="margin:0">You have no saved channels.</p>';
      return;
    }
    savedChannels && savedChannels.forEach(channel => {
      const li = document.createElement('li');
      const channelLink = document.createElement('a');
      const removeBtn = document.createElement('button');
      const avatar = document.createElement('img');
      li.dataset.link = channel.link;
      li.dataset.category = 'channels';
      li.dataset.type = 'channel';
      channelLink.href = channel.link;
      channelLink.textContent = channel.linkText;
      channelLink.title = channel.linkText;
      channelLink.target = '_blank';
      channelLink.classList.add('secondary-link');
      removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: inherit;" aria-hidden="true"><path d="M11 17H9V8h2v9zm4-9h-2v9h2V8zm4-4v1h-1v16H6V5H5V4h4V3h6v1h4zm-2 1H7v15h10V5z"></path></svg>';
      removeBtn.title = 'Remove';
      removeBtn.classList.add('remove-item');
      avatar.classList.add('avatar');
      if (channel?.linkMeta?.avatar) {
        avatar.src = channel.linkMeta.avatar;
      }
      li.appendChild(avatar);
      li.appendChild(channelLink);
      li.appendChild(removeBtn);
      channelsList.appendChild(li);
    });
  });

  document.body.addEventListener('click', e => {
    const item = e.target.closest('li');
    const type = item.dataset.type;
    if (e.target.tagName === 'BUTTON' && e.target.classList.contains('remove-item') && window.confirm(`Do you really want to remove this ${type}?`)) {
      const link = item.dataset.link;
      const category = item.dataset.category;
      removeFromLocalStorage(category, link);
      item.remove();
    }
  });

  function removeFromLocalStorage(category, link, playlistName = null) {
    chrome.storage.local.get([ category ], result => {
      let items = result[category] || {};
      let save = false;

      if (playlistName) {
        if (items[playlistName] && items[playlistName].find(item => item.link === link)) {
          items[playlistName] = items[playlistName].filter(item => item.link !== link);
          save = true;
        }
      } else {
        if (items.general && items.general.find(item => item.link === link)) {
          items.general = items.general.filter(item => item.link !== link);
          save = true;
        }
      }

      if (save) {
        chrome.storage.local.set({ [category]: items }, () => {
          console.log(`${category} removed:`, link);
        });
      } else {
        console.log(`${link} does not exist in ${category}`);
      }
    });
  }
});