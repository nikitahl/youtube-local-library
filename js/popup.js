document.getElementById('openPage').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('../library.html') });
});

// TODO:
// (*) Create account page
// (*) Allow to save videos to watch later
// (*) Add ability to "subscribe" to channels
// (*) Add ability to remove videos from playlists
// (*) Add ability to remove channels from list
// (*) Add close button to save to popup
// (*) Fix issues with getting the proper text on copy
// (*) Add metadata to lists
// (*)   Check for type of page (home, video, search, channel, etc)
// (*)   Avatar to channels
// (*)   Channel name to video
// (*) Add styles, account page, popup, save popup
// (*) Add error handling (try/catch)
// (*) Add icon
// (*) Add GitHub repo
// (*) Allow to save videos to playlists
// (*) Add ablitity to create playlists
// (*) Create a release
// (*) Publish
 
// (*) Fix remove video from playlist
// () Add label for shorts (to indicate it'sa short)
// () Add more checks for avatar img
// () Add more checks for channel name
// () Add ability to remove playlists
// (*) Add playlists to playlist page
// () Add checks for local storage cpacity
// ( ) Add dark mode (to the main extention popup)
// ( ) Download (to the main extention popup)
// ( )   Text file (to the main extention popup)
// ( )   JSON file (to the main extention popup)
// ( ) Upload JSON file(to the main extention popup)
// ( ) Clear all with confirmation (to the main extention popup)
// () Add ability to add videos from one playlist to another
// () Add local search to library
// () Add ability to save current video

