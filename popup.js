/**
 * Popup Script
 * Handles the extension popup UI and user settings
 */

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const pasteBtn = document.getElementById("pasteBtn");
  const wpmUp = document.getElementById("wpmUp");
  const wpmDown = document.getElementById("wpmDown");
  const wpmDisplay = document.getElementById("wpmDisplay");

  // Load saved WPM
  chrome.storage.sync.get(["wpm"], (result) => {
    const wpm = result.wpm || 300;
    wpmDisplay.textContent = `${wpm} WPM`;
  });

  // WPM controls
  wpmUp.addEventListener("click", () => {
    changeWPM(50);
  });

  wpmDown.addEventListener("click", () => {
    changeWPM(-50);
  });

  function changeWPM(delta) {
    chrome.storage.sync.get(["wpm"], (result) => {
      const currentWPM = result.wpm || 300;
      const newWPM = Math.max(50, Math.min(1000, currentWPM + delta));

      chrome.storage.sync.set({ wpm: newWPM }, () => {
        wpmDisplay.textContent = `${newWPM} WPM`;
      });
    });
  }

  // Start SpeedRead on current page
  startBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      // Inject content script
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: [
            "lib/readability.js",
            "lib/dompurify.js",
            "rsvp-engine.js",
            "content.js",
          ],
        },
        () => {
          // Close popup
          window.close();
        },
      );
    });
  });

  // Paste and read
  pasteBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      // Inject content script first
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: [
            "lib/readability.js",
            "lib/dompurify.js",
            "rsvp-engine.js",
            "content.js",
          ],
        },
        () => {
          // Then show paste prompt
          const text = prompt("Paste text to speed read:");

          if (text && text.trim()) {
            // Send the text to content script
            chrome.tabs.sendMessage(activeTab.id, {
              action: "speedreadText",
              text: text.trim(),
            });

            window.close();
          }
        },
      );
    });
  });
});
