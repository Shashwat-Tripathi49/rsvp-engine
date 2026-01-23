/**
 * RSVP (Rapid Serial Visual Presentation) Engine
 * Handles text processing, ORP calculation, and playback
 */

class RSVPEngine {
  constructor(options = {}) {
    this.wpm = options.wpm || 300;
    this.isPlaying = false;
    this.currentIndex = 0;
    this.words = [];
    this.onWordCallback = null;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
    this.timer = null;
  }

  /**
   * Calculate the Optimal Recognition Point (ORP) for a word
   * The ORP is the letter in the word that helps the brain recognize it fastest
   */
  calculateORP(word) {
    const cleanWord = word.trim();
    const length = cleanWord.length;

    if (length === 0) return 0;

    // ORP calculation based on word length
    if (length <= 2) {
      return 0; // First character
    } else if (length <= 5) {
      return 1; // Second character
    } else if (length <= 9) {
      return 2; // Third character
    } else if (length <= 13) {
      return 3; // Fourth character
    } else {
      return 4; // Fifth character
    }
  }

  /**
   * Calculate delay for a word based on length and punctuation
   */
  calculateDelay(word) {
    const baseDelay = 60000 / this.wpm; // ms per word at given WPM
    const length = word.trim().length;

    let multiplier = 1;

    // Longer words need more time
    if (length > 8) {
      multiplier = 1.2;
    } else if (length > 12) {
      multiplier = 1.4;
    }

    // Punctuation adds pause time
    const lastChar = word.trim().slice(-1);
    if ([".", "?", "!"].includes(lastChar)) {
      multiplier *= 1.8; // End of sentence
    } else if ([",", ";", ":", "—"].includes(lastChar)) {
      multiplier *= 1.3; // Minor pause
    } else if (['"', ")", "}", "]"].includes(lastChar)) {
      multiplier *= 1.1; // Minor pause
    }

    return baseDelay * multiplier;
  }

  /**
   * Tokenize text into array of word objects with metadata
   */
  tokenizeText(text) {
    // Split by spaces but preserve punctuation
    const rawWords = text.split(/\s+/).filter((w) => w.length > 0);

    this.words = rawWords.map((word, index) => ({
      text: word,
      orp: this.calculateORP(word),
      delay: this.calculateDelay(word),
      index: index,
    }));

    this.currentIndex = 0;
    return this.words;
  }

  /**
   * Get current word with ORP information
   */
  getCurrentWord() {
    if (this.currentIndex >= this.words.length) {
      return null;
    }
    return this.words[this.currentIndex];
  }

  /**
   * Start playback
   */
  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.scheduleNextWord();
  }

  /**
   * Pause playback
   */
  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Stop playback and reset to beginning
   */
  stop() {
    this.pause();
    this.currentIndex = 0;
  }

  /**
   * Jump to specific word index
   */
  seekTo(index) {
    this.currentIndex = Math.max(0, Math.min(index, this.words.length - 1));
    this.displayCurrentWord();
  }

  /**
   * Skip forward/backward
   */
  skip(amount) {
    this.currentIndex += amount;
    this.currentIndex = Math.max(
      0,
      Math.min(this.currentIndex, this.words.length - 1),
    );
    this.displayCurrentWord();
  }

  /**
   * Schedule next word in the sequence
   */
  scheduleNextWord() {
    if (!this.isPlaying) return;

    const word = this.getCurrentWord();

    if (!word) {
      // End of text
      this.isPlaying = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return;
    }

    this.displayCurrentWord();

    // Schedule next word
    this.timer = setTimeout(() => {
      this.currentIndex++;
      this.scheduleNextWord();
    }, word.delay);
  }

  /**
   * Display current word (calls callback)
   */
  displayCurrentWord() {
    const word = this.getCurrentWord();
    if (word && this.onWordCallback) {
      this.onWordCallback(word);
    }

    if (this.onProgressCallback) {
      this.onProgressCallback(this.currentIndex, this.words.length);
    }
  }

  /**
   * Set WPM (words per minute)
   */
  setWPM(wpm) {
    this.wpm = Math.max(50, Math.min(1000, wpm));

    // Recalculate delays for all words
    this.words = this.words.map((word) => ({
      ...word,
      delay: this.calculateDelay(word.text),
    }));
  }

  /**
   * Get current progress as percentage
   */
  getProgress() {
    if (this.words.length === 0) return 0;
    return (this.currentIndex / this.words.length) * 100;
  }

  /**
   * Get total word count
   */
  getWordCount() {
    return this.words.length;
  }

  /**
   * Register callbacks
   */
  onWord(callback) {
    this.onWordCallback = callback;
  }

  onProgress(callback) {
    this.onProgressCallback = callback;
  }

  onComplete(callback) {
    this.onCompleteCallback = callback;
  }
}

// Export for use in content script
if (typeof module !== "undefined" && module.exports) {
  module.exports = RSVPEngine;
}
