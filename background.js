/**
 * Background Service Worker
 * Handles extension background tasks
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("SpeedRead extension installed");

  // Set default WPM
  chrome.storage.sync.set({ wpm: 300 }, () => {
    console.log("Default WPM set to 300");
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getWPM") {
    chrome.storage.sync.get(["wpm"], (result) => {
      sendResponse(result.wpm || 300);
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "setWPM") {
    chrome.storage.sync.set({ wpm: request.wpm }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
