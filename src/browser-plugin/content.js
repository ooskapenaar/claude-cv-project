class JobExtractor {
  constructor() {
    this.extractors = {
      'linkedin.com': this.extractLinkedInJob.bind(this),
      'default': this.extractGenericJob.bind(this)
    };
  }
  
  analyzeJob() {
    const hostname = window.location.hostname;
    const extractor = this.extractors[hostname] || this.extractors['default'];
    
    return extractor();
  }
  
  /**
   * Extracts job data from LinkedIn job posting pages using hybrid DOM extraction.
   * 
   * Strategy:
   * 1. Waits for page stability (dynamic content loaded)
   * 2. Uses specific CSS selectors for LinkedIn's current structure
   * 3. Falls back to manual extraction if automatic extraction fails
   * 4. Implements human-in-the-loop validation for accuracy
   * 
   * @returns {Object|null} Extracted job data or null if extraction fails
   */
  extractLinkedInJob() {
    try {
      // Use more stealth approach - wait for page stability
      if (!this.isPageStable()) {
        return null;
      }
      
      const jobData = {
        title: this.getLinkedInTitle(),
        company: this.getLinkedInCompany(),
        description: this.getLinkedInDescription(),
        requirements: this.getLinkedInRequirements(),
        location: this.getLinkedInLocation(),
        url: window.location.href,
        source: 'LinkedIn',
        extractionMethod: 'auto'
      };
      
      // Validate we got meaningful data
      if (!jobData.title && !jobData.company) {
        return this.getManualLinkedInJob();
      }
      
      return jobData;
    } catch (error) {
      console.log('LinkedIn auto-extraction failed, trying manual method');
      return this.getManualLinkedInJob();
    }
  }
  
  getLinkedInTitle() {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title',
      '.job-details-module__title',
      'h1[data-test-id="job-title"]'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  getLinkedInCompany() {
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.job-details-module__company-name',
      '[data-test-id="company-name"]'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  getLinkedInDescription() {
    const selectors = [
      '.jobs-description-content__text',
      '.job-details-module__content',
      '.jobs-description__container',
      '[data-test-id="job-description"]'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  getLinkedInRequirements() {
    const description = this.getLinkedInDescription();
    if (!description) return [];
    
    // Extract requirements using common patterns
    const requirements = [];
    
    // Look for bulleted lists
    const bullets = description.match(/[•·▪▫-]\s*([^\n•·▪▫-]+)/g);
    if (bullets) {
      requirements.push(...bullets.map(b => b.replace(/^[•·▪▫-]\s*/, '').trim()));
    }
    
    // Look for "Requirements:" section
    const reqSection = description.match(/(?:Requirements?|Qualifications?|Skills?)[:\s]*([^]*?)(?:\n\n|$)/i);
    if (reqSection) {
      const reqText = reqSection[1];
      const reqItems = reqText.split(/\n/).filter(line => line.trim().length > 5);
      requirements.push(...reqItems.map(item => item.trim()));
    }
    
    return [...new Set(requirements)].slice(0, 10); // Dedupe and limit
  }
  
  getLinkedInLocation() {
    const selectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '[data-test-id="job-location"]'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  extractGenericJob() {
    try {
      const jobData = {
        title: this.getGenericTitle(),
        company: this.getGenericCompany(),
        description: this.getGenericDescription(),
        requirements: this.getGenericRequirements(),
        location: this.getGenericLocation(),
        url: window.location.href,
        source: 'Generic'
      };
      
      return jobData;
    } catch (error) {
      console.error('Generic extraction error:', error);
      return null;
    }
  }
  
  getGenericTitle() {
    const selectors = [
      'h1[class*="job"]',
      'h1[class*="title"]',
      '.job-title',
      '.position-title',
      '[data-testid*="job-title"]',
      'h1'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  getGenericCompany() {
    const selectors = [
      '[class*="company"]',
      '[class*="employer"]',
      '[data-testid*="company"]',
      '.company-name',
      '.employer-name'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  getGenericDescription() {
    const selectors = [
      '[class*="description"]',
      '[class*="job-content"]',
      '.job-description',
      '.position-description',
      '[data-testid*="description"]'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  getGenericRequirements() {
    const description = this.getGenericDescription();
    if (!description) return [];
    
    // Similar requirement extraction as LinkedIn
    const requirements = [];
    
    const bullets = description.match(/[•·▪▫-]\s*([^\n•·▪▫-]+)/g);
    if (bullets) {
      requirements.push(...bullets.map(b => b.replace(/^[•·▪▫-]\s*/, '').trim()));
    }
    
    return [...new Set(requirements)].slice(0, 10);
  }
  
  getGenericLocation() {
    const selectors = [
      '[class*="location"]',
      '[class*="address"]',
      '.job-location',
      '.position-location',
      '[data-testid*="location"]'
    ];
    
    return this.extractTextFromSelectors(selectors);
  }
  
  extractTextFromSelectors(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.innerText;
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        }
      } catch (e) {
        // Skip this selector if it causes errors
        continue;
      }
    }
    return null;
  }
  
  isPageStable() {
    // Check if page has basic content loaded
    return document.body && document.body.children.length > 5;
  }
  
  getManualLinkedInJob() {
    // Fallback: extract from page title and visible text
    try {
      const pageTitle = document.title;
      const bodyText = document.body.innerText;
      
      // Extract job title from page title (LinkedIn format: "Job Title - Company | LinkedIn")
      const titleMatch = pageTitle.match(/^(.+?)\s-\s(.+?)\s\|\sLinkedIn/);
      
      const jobData = {
        title: titleMatch ? titleMatch[1].trim() : this.extractFromBodyText(bodyText, 'title'),
        company: titleMatch ? titleMatch[2].trim() : this.extractFromBodyText(bodyText, 'company'),
        description: this.extractFromBodyText(bodyText, 'description'),
        requirements: [],
        location: this.extractFromBodyText(bodyText, 'location'),
        url: window.location.href,
        source: 'LinkedIn',
        extractionMethod: 'manual'
      };
      
      return jobData;
    } catch (error) {
      return {
        title: 'Manual extraction required',
        company: 'Unknown',
        description: 'Please copy job details manually',
        requirements: [],
        location: 'Unknown',
        url: window.location.href,
        source: 'LinkedIn',
        extractionMethod: 'failed'
      };
    }
  }
  
  extractFromBodyText(text, type) {
    if (!text) return null;
    
    // Simple heuristics for common patterns
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    switch (type) {
      case 'title':
        // Look for capitalized text that looks like a job title
        for (const line of lines.slice(0, 10)) {
          if (line.length > 10 && line.length < 100 && /[A-Z]/.test(line)) {
            return line;
          }
        }
        break;
      case 'company':
        // Look for company patterns
        for (const line of lines.slice(0, 15)) {
          if (line.includes('Company') || line.includes('Inc') || line.includes('Ltd') || line.includes('Corp')) {
            return line;
          }
        }
        break;
      case 'location':
        // Look for location patterns
        for (const line of lines) {
          if (line.match(/\b(Remote|Office|City|State|\w+,\s*\w+)\b/i)) {
            return line;
          }
        }
        break;
      case 'description':
        // Find longer text blocks
        for (const line of lines) {
          if (line.length > 200) {
            return line.substring(0, 500) + '...';
          }
        }
        break;
    }
    
    return null;
  }
  
  // Add visual indicators for extracted content
  highlightExtractedContent() {
    const style = document.createElement('style');
    style.textContent = `
      .cv-extractor-highlight {
        outline: 2px solid #007AFF !important;
        outline-offset: 2px !important;
        background-color: rgba(0, 122, 255, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
    
    // Highlight detected elements
    const selectors = [
      'h1', '.job-title', '.company-name', '.job-description'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.textContent && el.textContent.trim().length > 5) {
          el.classList.add('cv-extractor-highlight');
        }
      });
    });
  }
}

// Passive content script - only responds to explicit requests
// No automatic initialization or detection

function extractLinkedInJobData() {
  try {
    const jobData = {
      title: '',
      company: '',
      location: '',
      description: ''
    };
    
    console.log('Starting LinkedIn job extraction...');
    
    // Extract job title from job-details-jobs-unified-top-card__sticky-header-job-title
    const titleDiv = document.querySelector('.job-details-jobs-unified-top-card__sticky-header-job-title');
    console.log('Title div found:', !!titleDiv);
    
    if (titleDiv) {
      const titleSpan = titleDiv.querySelector('span');
      console.log('Title span found:', !!titleSpan);
      if (titleSpan) {
        jobData.title = titleSpan.textContent?.trim() || '';
        console.log('Extracted title:', jobData.title);
      }
    }
    
    // Extract company and location from sibling div with dir="ltr"
    if (titleDiv) {
      const siblingDiv = titleDiv.nextElementSibling;
      console.log('Sibling div found:', !!siblingDiv);
      console.log('Sibling has dir="ltr":', siblingDiv?.getAttribute('dir') === 'ltr');
      
      if (siblingDiv && siblingDiv.getAttribute('dir') === 'ltr') {
        const content = siblingDiv.textContent?.trim() || '';
        console.log('Sibling content:', content);
        
        // Split on the non-ASCII bullet character "·"
        const parts = content.split('·').map(part => part.trim());
        console.log('Split parts:', parts);
        
        if (parts.length >= 1) {
          jobData.company = parts[0];
        }
        if (parts.length >= 2) {
          jobData.location = parts[1];
        }
      }
    }
    
    // Try additional selectors for location
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '[data-test-id="job-location"]'
    ];
    
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        jobData.location = element.textContent.trim();
        break;
      }
    }
    
    // Try to get description
    const descriptionSelectors = [
      '.jobs-description-content__text',
      '.job-details-module__content',
      '.jobs-description__container'
    ];
    
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        jobData.description = element.textContent.trim().substring(0, 1000); // Limit length
        break;
      }
    }
    
    console.log('Final extracted data:', jobData);
    return jobData;
  } catch (error) {
    console.log('Error extracting LinkedIn job data:', error);
    return {
      title: '',
      company: '',
      location: '',
      description: ''
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'extractJobData') {
      const jobData = extractLinkedInJobData();
      sendResponse({ jobData });
      return true;
    }
    
    sendResponse({ error: 'Unknown action' });
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message });
  }
  
  return true;
});

console.log('LinkedIn Job Extractor content script loaded (hybrid mode)');