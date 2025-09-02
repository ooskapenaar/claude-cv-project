# Browser Plugin Documentation

**Version**: 1.1.3  
**Location**: `src/browser-plugin/`  
**Purpose**: Chrome extension for extracting LinkedIn job postings with human-in-the-loop validation

## Overview

The Browser Plugin is a Chrome Manifest V3 extension that implements a hybrid manual/automatic approach for extracting job data from LinkedIn. It addresses LinkedIn's anti-bot protections by combining automated DOM extraction with human validation and manual fallback options.

## Architecture

### Core Files

#### `manifest.json`
**Chrome extension configuration**
- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `activeTab`, `storage` for LinkedIn access and data persistence
- **Content Scripts**: Injection into LinkedIn job pages
- **Service Worker**: Background processing and storage coordination

#### `content.js`
**Main extraction logic**
- **Purpose**: DOM manipulation and data extraction on LinkedIn pages
- **Strategy**: Hybrid automatic/manual extraction approach
- **Key Functions**:
  - `extractLinkedInJobData()`: Automatic DOM-based extraction
  - `createManualExtractionUI()`: Fallback manual entry interface
  - `storeJobData()`: Data validation and storage

#### `popup.html` / `popup.js`
**User interface and controls**
- **Purpose**: Extension popup interface for user interaction
- **Features**: 
  - Extraction status display
  - Manual extraction trigger
  - Data review and validation
  - Export to filesystem MCP

#### `background.js`
**Service worker for background processing**
- **Purpose**: Background task coordination and storage management
- **Functions**: Data persistence, cross-tab communication

#### `content.css`
**Styling for injected UI elements**
- **Purpose**: Styles for manual extraction interface
- **Design**: Non-intrusive overlay that integrates with LinkedIn's design

## Extraction Methodology

### Hybrid Extraction Strategy

**Problem**: LinkedIn implements anti-bot protections that block traditional scraping approaches.

**Solution**: Human-in-the-loop extraction that combines automation with manual validation.

### Automatic Extraction Algorithm

**DOM Selector Strategy**:
```javascript
// Primary extraction targets
const selectors = {
  title: '.job-details-jobs-unified-top-card__sticky-header-job-title span:first-child',
  company: '.job-details-jobs-unified-top-card__sticky-header-job-title + div[dir="ltr"] span',
  location: '.job-details-jobs-unified-top-card__sticky-header-job-title + div[dir="ltr"] span:last-child',
  description: '.jobs-description-content__text',
  requirements: '.jobs-box__list li',
  postedDate: '[data-automation-id="job-posted-date"]'
};
```

**Extraction Process**:
1. **Page Detection**: Verifies current page is a LinkedIn job posting
2. **Element Location**: Uses CSS selectors to find job data elements  
3. **Content Extraction**: Extracts text content from located elements
4. **Data Validation**: Validates extracted data completeness and format
5. **Fallback Trigger**: Switches to manual mode if automatic extraction fails

### Manual Extraction Interface

**Trigger Conditions**:
- Automatic extraction returns incomplete data
- User manually triggers extraction 
- Page structure doesn't match expected selectors

**Manual Interface Components**:
- **Job Title Input**: Editable field pre-filled with automatic extraction
- **Company Input**: Editable field with company name
- **Location Input**: Job location field
- **Description Area**: Large text area for job description
- **Save/Cancel Controls**: Action buttons for data persistence

**Validation Rules**:
- Job title: Required, minimum 5 characters
- Company: Required, minimum 2 characters  
- Description: Required, minimum 50 characters
- Location: Optional but recommended

### Data Structure

**Extracted Job Object**:
```javascript
{
  jobId: string,           // Generated unique identifier
  title: string,           // Job title
  company: string,         // Company name
  location: string,        // Job location
  description: string,     // Full job description
  requirements: string[],  // Parsed requirements list
  postedDate: string,     // When job was posted
  extractedAt: string,    // Extraction timestamp
  extractionMethod: 'auto'|'manual'|'hybrid',
  source: 'linkedin',
  url: string             // Original job posting URL
}
```

## Technical Implementation

### Manifest V3 Service Worker

**Background Processing**:
```javascript
// Service worker setup (background.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'storeJob') {
    // Store job data in chrome.storage
    // Coordinate with filesystem MCP if available
  }
});
```

**Content Script Injection**:
```javascript
// Automatic injection on LinkedIn job pages
"content_scripts": [
  {
    "matches": ["https://www.linkedin.com/jobs/view/*"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_idle"
  }
]
```

### DOM Extraction Techniques

**Robust Selector Strategy**:
- **Primary Selectors**: Target current LinkedIn structure
- **Fallback Selectors**: Handle structure changes
- **Content Validation**: Verify extracted content quality

**Example Implementation**:
```javascript
function extractJobTitle() {
  // Primary selector
  let title = document.querySelector('.job-details-jobs-unified-top-card__sticky-header-job-title span:first-child')?.textContent?.trim();
  
  // Fallback selectors
  if (!title) {
    title = document.querySelector('[data-automation-id="job-title"]')?.textContent?.trim();
  }
  if (!title) {
    title = document.querySelector('h1')?.textContent?.trim();
  }
  
  return title || '';
}
```

### Anti-Bot Evasion

**Human Behavior Simulation**:
- **Variable Delays**: Random delays between actions (500-2000ms)
- **Progressive Loading**: Wait for dynamic content to load
- **User Agent Preservation**: Uses browser's natural user agent
- **No Bulk Operations**: Extracts one job at a time

**Respectful Usage**:
- **Rate Limiting**: Maximum 1 extraction per 5 seconds
- **User Initiated**: All extractions require user interaction
- **No Automation**: No automatic page navigation or bulk processing

## User Workflow

### Typical Usage Pattern

1. **Navigate**: User browses to LinkedIn job posting
2. **Activate**: User clicks extension icon or uses keyboard shortcut
3. **Extract**: Extension attempts automatic extraction
4. **Validate**: User reviews extracted data in popup
5. **Edit**: User corrects any inaccurate data if needed
6. **Save**: User confirms and saves job data
7. **Export**: Data is sent to filesystem MCP for storage

### Error Handling

**Common Issues and Solutions**:
- **Page Not Loaded**: Extension waits for content to load
- **Structure Changes**: Falls back to manual extraction
- **Network Issues**: Provides retry mechanism
- **Invalid Data**: Shows validation errors with correction guidance

## Integration Points

### Filesystem MCP Integration

**Data Flow**:
```
LinkedIn Page → Content Script → Background Worker → Storage → Filesystem MCP
```

**Storage Format**:
- **Temporary Storage**: Chrome extension storage API
- **Persistent Storage**: Filesystem MCP via `store_job` tool
- **Data Synchronization**: Background worker coordinates between storage layers

### Cross-Extension Communication

**Message Passing**:
```javascript
// Send job data to background worker
chrome.runtime.sendMessage({
  action: 'storeJob',
  jobData: extractedData
});

// Background worker forwards to filesystem MCP
fetch('/mcp-endpoint', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'store_job',
    arguments: jobData
  })
});
```

## Security Considerations

### Data Privacy

- **Local Processing**: All extraction happens locally in browser
- **No External APIs**: No data sent to third-party services
- **User Control**: User reviews all data before storage
- **Temporary Storage**: Chrome storage cleared after successful MCP transfer

### LinkedIn Compliance

- **User-Initiated**: All actions require explicit user interaction
- **Respectful Rate Limits**: No automated bulk extraction
- **Public Data Only**: Only extracts publicly visible job postings
- **No Authentication Bypass**: Uses standard browser session

## Testing and Debugging

### Development Mode

**Local Testing**:
1. Load extension in Chrome Developer Mode
2. Navigate to LinkedIn job posting
3. Open Chrome DevTools to monitor console logs
4. Test extraction with various job posting formats

**Debug Features**:
- Console logging for extraction steps
- Visual indicators for successful/failed extractions
- Error reporting with specific failure reasons

### Extension Packaging

**Build Process**:
```bash
# Package for Chrome Web Store
zip -r cv-project-linkedin-extractor.zip src/browser-plugin/ -x "*.DS_Store"
```

**Version Management**:
- Update `manifest.json` version for each release
- Follow semantic versioning: MAJOR.MINOR.PATCH
- Update CLAUDE.md with new version number

## Known Limitations

1. **LinkedIn Dependency**: Relies on LinkedIn's current page structure
2. **Manual Fallback**: Some extractions require human intervention
3. **Rate Limiting**: Intentionally slow to avoid detection
4. **Single Page**: Processes one job posting at a time
5. **Chrome Only**: Currently supports Chrome/Chromium browsers only

## Future Enhancements

- **Multi-Browser Support**: Firefox, Safari extension versions
- **Bulk Processing**: Batch extraction with proper rate limiting
- **Advanced Parsing**: Better requirement and skill extraction
- **Job Board Expansion**: Support for other job sites beyond LinkedIn
- **AI Enhancement**: LLM-powered data cleaning and standardization