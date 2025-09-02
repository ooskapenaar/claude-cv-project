// CV Job Extractor Background Service Worker

class CVJobExtractorBackground {
  constructor() {
    this.mcpPort = 3001;
    this.init();
  }
  
  init() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log('CV Job Extractor installed');
      this.setDefaultSettings();
    });
    
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open
    });
  }
  
  async setDefaultSettings() {
    const settings = await chrome.storage.local.get(['mcpPort', 'jobIdPrefix']);
    
    if (!settings.mcpPort) {
      await chrome.storage.local.set({ mcpPort: 3001 });
    }
    
    if (!settings.jobIdPrefix) {
      await chrome.storage.local.set({ jobIdPrefix: 'job-' });
    }
  }
  
  
  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'extractJob':
        const result = await this.extractJobFromTab(sender.tab.id);
        sendResponse(result);
        break;
        
      case 'checkMCP':
        const mcpStatus = await this.checkMCPConnection();
        sendResponse({ connected: mcpStatus });
        break;
        
      case 'sendToMCP':
        const mcpResult = await this.sendJobToMCP(request.jobId, request.jobData);
        sendResponse(mcpResult);
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }
  
  async extractJobFromTab(tabId) {
    try {
      const results = await chrome.tabs.sendMessage(tabId, { action: 'analyzeJob' });
      return results;
    } catch (error) {
      return { error: error.message };
    }
  }
  
  async checkMCPConnection() {
    try {
      const settings = await chrome.storage.local.get(['mcpPort']);
      const port = settings.mcpPort || 3001;
      
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'GET',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      console.log('MCP connection check failed:', error.message);
      return false;
    }
  }
  
  async sendJobToMCP(jobId, jobData) {
    try {
      const settings = await chrome.storage.local.get(['mcpPort']);
      const port = settings.mcpPort || 3001;
      
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
              extractedBy: 'browser-extension'
            }
          }
        }
      };
      
      const response = await fetch(`http://localhost:${port}/mcp`, {
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
      return { success: !result.error, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Initialize background service
new CVJobExtractorBackground();