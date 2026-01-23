/**
 * Content Script
 * Injects the SpeedRead UI and handles text extraction from webpages
 */

// Check if SpeedRead is already running on the page
if (document.querySelector("#speedread-overlay")) {
  // SpeedRead is already active, toggle visibility
  const existingOverlay = document.querySelector("#speedread-overlay");
  const existingContainer = document.querySelector("#speedread-container");

  if (existingOverlay.style.display === "none") {
    existingOverlay.style.display = "flex";
    existingContainer.style.display = "block";
  } else {
    existingOverlay.style.display = "none";
    existingContainer.style.display = "none";
  }
} else {
  // Initialize SpeedRead
  initializeSpeedRead();
}

function initializeSpeedRead() {
  // Create shadow DOM container for isolation
  const container = document.createElement("div");
  container.id = "speedread-container";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  // Inject styles
  const style = document.createElement("style");
  style.textContent = getSpeedReadStyles();
  shadow.appendChild(style);

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "speedread-overlay";
  shadow.appendChild(overlay);

  // Create reader display
  const readerDisplay = document.createElement("div");
  readerDisplay.id = "speedread-display";
  shadow.appendChild(readerDisplay);

  // Create controls
  const controls = document.createElement("div");
  controls.id = "speedread-controls";
  controls.innerHTML = getControlsHTML();
  shadow.appendChild(controls);

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.id = "speedread-close";
  closeBtn.innerHTML = "×";
  closeBtn.title = "Close SpeedRead";
  shadow.appendChild(closeBtn);

  // Initialize engine
  const engine = new RSVPEngine();

  // Get saved WPM
  chrome.storage.sync.get(["wpm"], (result) => {
    if (result.wpm) {
      engine.setWPM(result.wpm);
      updateWPMDisplay(result.wpm);
    }
  });

  // Extract text from current page
  const extractedText = extractPageText();
  engine.tokenizeText(extractedText);

  // Update progress bar
  const progressBar = shadow.querySelector("#speedread-progress");
  progressBar.max = engine.getWordCount();

  // Set up word display callback
  engine.onWord((word) => {
    const display = shadow.querySelector("#speedread-word");
    display.innerHTML = formatWordWithORP(word);
  });

  // Set up progress callback
  engine.onProgress((current, total) => {
    progressBar.value = current;
    const progressText = shadow.querySelector("#speedread-progress-text");
    progressText.textContent = `${current} / ${total}`;
  });

  // Set up completion callback
  engine.onComplete(() => {
    engine.isPlaying = false;
    const playBtn = shadow.querySelector("#speedread-play-btn");
    playBtn.textContent = "▶ Play";
  });

  // Event listeners for controls
  const playBtn = shadow.querySelector("#speedread-play-btn");
  playBtn.addEventListener("click", () => {
    if (engine.isPlaying) {
      engine.pause();
      playBtn.textContent = "▶ Play";
    } else {
      if (engine.getCurrentWord() === null) {
        engine.seekTo(0);
      }
      engine.play();
      playBtn.textContent = "⏸ Pause";
    }
  });

  const wpmDown = shadow.querySelector("#speedread-wpm-down");
  const wpmUp = shadow.querySelector("#speedread-wpm-up");
  const wpmDisplay = shadow.querySelector("#speedread-wpm-display");

  wpmDown.addEventListener("click", () => {
    const newWPM = engine.wpm - 50;
    engine.setWPM(Math.max(50, newWPM));
    updateWPMDisplay(engine.wpm);
    saveWPM(engine.wpm);
  });

  wpmUp.addEventListener("click", () => {
    const newWPM = engine.wpm + 50;
    engine.setWPM(Math.min(1000, newWPM));
    updateWPMDisplay(engine.wpm);
    saveWPM(engine.wpm);
  });

  // Skip controls
  shadow
    .querySelector("#speedread-back-10")
    .addEventListener("click", () => engine.skip(-10));
  shadow
    .querySelector("#speedread-back-1")
    .addEventListener("click", () => engine.skip(-1));
  shadow
    .querySelector("#speedread-forward-1")
    .addEventListener("click", () => engine.skip(1));
  shadow
    .querySelector("#speedread-forward-10")
    .addEventListener("click", () => engine.skip(10));

  // Restart button
  shadow.querySelector("#speedread-restart").addEventListener("click", () => {
    engine.stop();
    playBtn.textContent = "▶ Play";
  });

  // Close button
  closeBtn.addEventListener("click", () => {
    engine.stop();
    overlay.style.display = "none";
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (overlay.style.display === "none") return;

    // Spacebar - toggle play/pause
    if (e.code === "Space") {
      e.preventDefault();
      playBtn.click();
    }

    // Arrow up - increase WPM
    if (e.code === "ArrowUp") {
      e.preventDefault();
      wpmUp.click();
    }

    // Arrow down - decrease WPM
    if (e.code === "ArrowDown") {
      e.preventDefault();
      wpmDown.click();
    }

    // Arrow left - skip back
    if (e.code === "ArrowLeft") {
      e.preventDefault();
      engine.skip(-1);
    }

    // Arrow right - skip forward
    if (e.code === "ArrowRight") {
      e.preventDefault();
      engine.skip(1);
    }

    // Escape - close
    if (e.code === "Escape") {
      closeBtn.click();
    }
  });

  function updateWPMDisplay(wpm) {
    wpmDisplay.textContent = `${wpm} WPM`;
  }

  function saveWPM(wpm) {
    chrome.storage.sync.set({ wpm: wpm });
  }
}

/**
 * Extract clean text from current page using Readability
 */
function extractPageText() {
  try {
    const documentClone = document.cloneNode(true);
    const article = new Readability(documentClone).parse();

    if (article && article.textContent) {
      return article.textContent;
    }
  } catch (e) {
    console.error("Readability failed, falling back to body text:", e);
  }

  // Fallback: get all text from body
  return document.body.innerText || "";
}

/**
 * Format word with ORP highlighting
 */
function formatWordWithORP(word) {
  const text = word.text;
  const orp = word.orp;

  const before = text.slice(0, orp);
  const orpChar = text.slice(orp, orp + 1);
  const after = text.slice(orp + 1);

  return `
    <span class="sr-word-before">${before}</span>
    <span class="sr-word-orp">${orpChar}</span>
    <span class="sr-word-after">${after}</span>
  `;
}

/**
 * Get CSS styles for the SpeedRead UI
 */
function getSpeedReadStyles() {
  return `
    #speedread-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #speedread-display {
      position: relative;
      width: 80%;
      max-width: 800px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #speedread-word {
      font-size: 72px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
    }

    .sr-word-before {
      color: #888888;
    }

    .sr-word-orp {
      color: #ff3b30;
      font-weight: bold;
      position: relative;
    }

    .sr-word-orp::before,
    .sr-word-orp::after {
      content: '';
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      background: #ff3b30;
    }

    .sr-word-orp::before {
      top: -10px;
    }

    .sr-word-orp::after {
      bottom: -10px;
    }

    #speedread-controls {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .sr-wpm-control {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .sr-wpm-control button {
      padding: 8px 16px;
      background: #333;
      border: 1px solid #555;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }

    .sr-wpm-control button:hover {
      background: #444;
    }

    #speedread-wpm-display {
      font-size: 20px;
      color: #ffffff;
      min-width: 120px;
      text-align: center;
    }

    .sr-playback-controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    #speedread-play-btn {
      padding: 12px 32px;
      font-size: 18px;
      background: #007aff;
      border: none;
      color: white;
      border-radius: 8px;
      cursor: pointer;
    }

    #speedread-play-btn:hover {
      background: #0056b3;
    }

    .sr-skip-btn {
      padding: 10px 20px;
      background: #333;
      border: 1px solid #555;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .sr-skip-btn:hover {
      background: #444;
    }

    #speedread-progress {
      width: 80%;
      max-width: 800px;
      height: 4px;
      background: #333;
      border-radius: 2px;
      -webkit-appearance: none;
    }

    #speedread-progress::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: #007aff;
      border-radius: 50%;
      cursor: pointer;
    }

    #speedread-progress-text {
      margin-top: 10px;
      color: #888;
      font-size: 14px;
    }

    #speedread-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      font-size: 32px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
    }

    #speedread-close:hover {
      color: #fff;
    }
  `;
}

/**
 * Get HTML for controls
 */
function getControlsHTML() {
  return `
    <div class="sr-wpm-control">
      <button id="speedread-wpm-down">▼</button>
      <span id="speedread-wpm-display">300 WPM</span>
      <button id="speedread-wpm-up">▲</button>
    </div>
    <div class="sr-playback-controls">
      <button id="speedread-play-btn">▶ Play</button>
      <button class="sr-skip-btn" id="speedread-back-10">-10</button>
      <button class="sr-skip-btn" id="speedread-back-1">-1</button>
      <button class="sr-skip-btn" id="speedread-forward-1">+1</button>
      <button class="sr-skip-btn" id="speedread-forward-10">+10</button>
      <button class="sr-skip-btn" id="speedread-restart">↺ Restart</button>
    </div>
    <input type="range" id="speedread-progress" value="0" min="0">
    <div id="speedread-progress-text">0 / 0</div>
  `;
}
