class CVJobExtractorPopup {
  constructor() {
    this.mcpPort = 3001;
    this.jobIdPrefix = 'job-';
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    await this.checkMCPConnection();
    this.showReadyState();
  }
  
  async loadSettings() {
    const settings = await chrome.storage.local.get(['mcpPort', 'jobIdPrefix']);
    this.mcpPort = settings.mcpPort || 3001;
    this.jobIdPrefix = settings.jobIdPrefix || 'job-';
    
    document.getElementById('mcp-port').value = this.mcpPort;
    document.getElementById('job-id-prefix').value = this.jobIdPrefix;
  }
  
  setupEventListeners() {
    document.getElementById('manual-extract').addEventListener('click', () => {
      this.startManualExtraction();
    });
    
    document.getElementById('view-extracted').addEventListener('click', () => {
      this.viewExtractedJobs();
    });
    
    document.getElementById('mcp-port').addEventListener('change', (e) => {
      this.mcpPort = parseInt(e.target.value);
      chrome.storage.local.set({ mcpPort: this.mcpPort });
      this.checkMCPConnection();
    });
    
    document.getElementById('job-id-prefix').addEventListener('change', (e) => {
      this.jobIdPrefix = e.target.value;
      chrome.storage.local.set({ jobIdPrefix: this.jobIdPrefix });
    });
  }
  
  async checkMCPConnection() {
    const statusEl = document.getElementById('mcp-status');
    
    try {
      const response = await fetch(`http://localhost:${this.mcpPort}/health`, {
        method: 'GET',
        mode: 'cors'
      });
      if (response.ok) {
        statusEl.textContent = `MCP Connection: Connected (Port ${this.mcpPort})`;
        statusEl.className = 'status connected';
        return true;
      }
    } catch (error) {
      console.log('MCP health check failed:', error.message);
    }
    
    statusEl.textContent = `MCP Connection: Disconnected (Port ${this.mcpPort})`;
    statusEl.className = 'status disconnected';
    return false;
  }
  
  showReadyState() {
    const jobInfoEl = document.getElementById('job-info');
    jobInfoEl.innerHTML = `
      <div style="text-align: center; padding: 8px;">
        <strong>Ready to extract</strong><br>
        <small>Click "Extract This Job" when you're on a LinkedIn job page</small>
      </div>
    `;
  }
  
  async startManualExtraction() {
    const jobInfoEl = document.getElementById('job-info');
    const extractBtn = document.getElementById('manual-extract');
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url || !tab.url.includes('linkedin.com/jobs')) {
        alert('Please navigate to a LinkedIn job page first');
        return;
      }
      
      extractBtn.disabled = true;
      extractBtn.textContent = 'Detecting...';
      
      // First try to auto-extract data
      let autoData = { title: '', company: '', location: '', description: '' };
      try {
        const results = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });
        if (results && results.jobData) {
          autoData = results.jobData;
        }
      } catch (error) {
        console.log('Auto-extraction failed, using manual mode');
      }
      
      const hasAutoData = autoData.title || autoData.company;
      const modeText = hasAutoData ? 'Hybrid Extraction' : 'Manual Extraction';
      const helpText = hasAutoData ? 'Pre-filled data detected. Edit as needed:' : 'Copy the job details and paste below:';
      
      jobInfoEl.innerHTML = `
        <div style="background-color: ${hasAutoData ? '#d1ecf1' : '#fff3cd'}; color: ${hasAutoData ? '#0c5460' : '#856404'}; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <strong>${modeText}</strong><br>
          ${helpText}
        </div>
        <div style="margin: 8px 0;">
          <input type="text" id="job-title" placeholder="Job Title" value="${autoData.title}" style="width: 100%; margin: 2px 0; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
          <input type="text" id="job-company" placeholder="Company Name" value="${autoData.company}" style="width: 100%; margin: 2px 0; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
          <input type="text" id="job-location" placeholder="Location" value="${autoData.location}" style="width: 100%; margin: 2px 0; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
          <textarea id="job-description" placeholder="Job Description" style="width: 100%; height: 80px; margin: 2px 0; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">${autoData.description}</textarea>
        </div>
        <button id="save-job" style="width: 100%; padding: 8px; background-color: #28a745; color: white; border: none; border-radius: 4px; margin-top: 4px;">
          Save Job
        </button>
        <button id="cancel-extract" style="width: 100%; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; margin-top: 4px;">
          Cancel
        </button>
      `;
      
      extractBtn.textContent = 'Extract This Job';
      
      document.getElementById('save-job').addEventListener('click', () => {
        this.saveManualJob(tab.url);
      });
      
      document.getElementById('cancel-extract').addEventListener('click', () => {
        this.showReadyState();
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract This Job';
      });
      
    } catch (error) {
      alert('Error starting extraction: ' + error.message);
      extractBtn.disabled = false;
      extractBtn.textContent = 'Extract This Job';
    }
  }
  
  generateJobId(jobData) {
    // Create unique ID from company and title
    const company = (jobData.company || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const title = (jobData.title || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    
    return `${this.jobIdPrefix}${company}-${title}-${timestamp}`;
  }
  
  async sendToMCP(jobId, jobData) {
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "store_job",
          arguments: {
            jobId: jobId,
            data: {
              ...jobData,
              extractedAt: new Date().toISOString(),
              url: jobData.url || window.location.href
            }
          }
        }
      };
      
      const response = await fetch(`http://localhost:${this.mcpPort}/mcp`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mcpRequest)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return !result.error;
    } catch (error) {
      console.error('MCP request failed:', error);
      return false;
    }
  }
  
  async viewExtractedJobs() {
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "list_jobs",
          arguments: {}
        }
      };
      
      const response = await fetch(`http://localhost:${this.mcpPort}/mcp`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mcpRequest)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Extracted jobs:', result);
        // Could open a new tab with job management interface
        alert('Check console for extracted jobs list');
      }
    } catch (error) {
      alert('Error fetching jobs: ' + error.message);
    }
  }
  
  async saveManualJob(url) {
    const title = document.getElementById('job-title').value.trim();
    const company = document.getElementById('job-company').value.trim();
    const location = document.getElementById('job-location').value.trim();
    const description = document.getElementById('job-description').value.trim();
    
    if (!title || !company || !description) {
      alert('Please fill in at least the job title, company, and description');
      return;
    }
    
    const extractBtn = document.getElementById('manual-extract');
    extractBtn.textContent = 'Saving...';
    
    try {
      const jobData = {
        title: title,
        company: company,
        location: location,
        description: description,
        requirements: [],
        url: url,
        source: 'LinkedIn',
        extractionMethod: 'manual',
        extractedAt: new Date().toISOString()
      };
      
      const jobId = this.generateJobId(jobData);
      const success = await this.sendToMCP(jobId, jobData);
      
      if (success) {
        document.getElementById('job-info').innerHTML = `
          <div style="background-color: #d4edda; color: #155724; padding: 8px; border-radius: 4px; text-align: center;">
            <strong>✓ Job Saved Successfully!</strong><br>
            <small>${title} at ${company}</small>
          </div>
        `;
        
        setTimeout(() => {
          this.showReadyState();
          extractBtn.disabled = false;
          extractBtn.textContent = 'Extract This Job';
        }, 3000);
      } else {
        throw new Error('Failed to save to MCP service');
      }
    } catch (error) {
      alert('Error saving job: ' + error.message);
      extractBtn.disabled = false;
      extractBtn.textContent = 'Extract This Job';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CVJobExtractorPopup();
});