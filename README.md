# SpeedRead Extension

A Chrome extension that lets you read webpages 3x faster using RSVP (Rapid Serial Visual Presentation) technology.

## Features

- **Smart Text Extraction**: Uses Mozilla's Readability.js to extract clean, readable text from any webpage
- **ORP Engine**: Calculates the Optimal Recognition Point for each word to maximize reading speed
- **Micro-Pause Logic**: Automatically adjusts timing based on word length and punctuation
- **Keyboard Shortcuts**: Full keyboard control for seamless reading
- **Dark Theme**: Eye-friendly dark interface
- **Progress Tracking**: Visual progress bar with word count
- **Customizable Speed**: Adjustable reading speed (50-1000 WPM)

## Installation

### Manual Installation (Chrome/Edge)

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
3. Enable **Developer mode** (toggle in top right corner)
4. Click **Load unpacked**
5. Select the `speedread-extension` folder
6. Pin the extension to your toolbar for quick access

## How to Use

### Reading a Webpage

1. Navigate to any webpage with text (articles, blog posts, documentation, etc.)
2. Click the SpeedRead extension icon
3. Click **"Start SpeedRead"**
4. The overlay will appear with the extracted text

### Reading Copied Text

1. Copy any text to your clipboard
2. Click the SpeedRead extension icon
3. Click **"Paste & Read"**
4. Paste your text in the prompt and click OK

### Controls

| Action                | Keyboard    | Mouse             |
| --------------------- | ----------- | ----------------- |
| Play/Pause            | Space       | Play/Pause button |
| Increase WPM          | Arrow Up    | ▲ button          |
| Decrease WPM          | Arrow Down  | ▼ button          |
| Skip Word Back        | Arrow Left  | -1 button         |
| Skip Word Forward     | Arrow Right | +1 button         |
| Skip 10 Words Back    |             | -10 button        |
| Skip 10 Words Forward |             | +10 button        |
| Restart               |             | ↺ Restart button  |
| Close                 | Escape      | × button          |

## How It Works

### RSVP (Rapid Serial Visual Presentation)

SpeedRead uses the RSVP technique, which displays words one at a time in a fixed position. This:

1. **Eliminates eye movements** - No need to scan across the page
2. **Reduces sub-vocalization** - Helps you read faster than you "say" the words
3. **Minimizes distractions** - Focused on one word at a time

### Optimal Recognition Point (ORP)

Each word is centered on its ORP - the letter your brain uses to recognize the word fastest:

- 0-1 chars: 1st character
- 2-5 chars: 2nd character
- 6-9 chars: 3rd character
- 10-13 chars: 4th character
- 13+ chars: 5th character

The ORP letter is highlighted in red with guide lines above and below to help your eyes focus.

### Micro-Pause Logic

SpeedRead automatically adjusts the display time for each word:

- **Base delay**: Calculated from your WPM setting
- **Long words**: 1.2x - 1.4x delay for 8+ character words
- **Punctuation**: Up to 1.8x delay for periods, commas, etc.

This creates a natural reading rhythm without the mechanical feel of simple RSVP.

## Tech Stack

- **Manifest V3**: Latest Chrome extension API
- **Readability.js**: Mozilla's library for extracting article content
- **DOMPurify**: Sanitizes HTML for security
- **Shadow DOM**: Isolates extension styles from page content
- **Vanilla JavaScript**: No framework dependencies for performance

## Project Structure

```
speedread-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js             # Content script (runs on pages)
├── rsvp-engine.js         # Core RSVP/ORP engine
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── lib/
│   ├── readability.js     # Mozilla Readability
│   └── dompurify.js       # DOM sanitization
├── icon*.png              # Extension icons
└── package.json           # NPM dependencies
```

## Troubleshooting

### Extension doesn't appear on certain pages

Some websites use complex structures that Readability.js may not parse correctly. Try:

1. Highlighting the text you want to read and using "Paste & Read"
2. Copying the content to a document first

### Words display too fast/slow

Adjust the WPM setting using:

- Arrow Up/Down keys while reading
- The WPM controls in the popup before starting

### Reading feels unnatural

Start with a lower WPM (200-300) and:

- Increase gradually as you get used to RSVP
- Use the skip buttons to re-read difficult sections
- Try the default 300 WPM for a balanced experience

## License

MIT License - feel free to use and modify for your own projects.

## Credits

- Built as an MVP inspired by SwiftRead.com
- Uses Mozilla Readability for content extraction
- Based on RSVP research in cognitive psychology and reading speed optimization
