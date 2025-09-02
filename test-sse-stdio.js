#!/usr/bin/env node

/**
 * Simple test of SSE over stdio without the complexity of the full test
 */

const { spawn } = require('child_process');

console.log('🚀 Testing SSE Progress Reporting over stdio\n');

// Simple SSE parser
function parseSSELine(line) {
  if (!line.startsWith('SSE:')) return false;
  
  try {
    const event = JSON.parse(line.substring(4));
    console.log(`📡 SSE Event: ${event.event}`, event.data);
    return true;
  } catch (e) {
    return false;
  }
}

// Spawn matrix-analysis-mcp
const mcpProcess = spawn('node', ['dist/index.js'], {
  cwd: './src/matrix-analysis-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle stderr for SSE events
mcpProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const isSSE = parseSSELine(line.trim());
      if (!isSSE) {
        console.log(`🔧 ${line.trim()}`);
      }
    }
  }
});

// Handle stdout
mcpProcess.stdout.on('data', (data) => {
  console.log(`📥 Response:`, data.toString().trim());
});

// Wait for service to start then send request
setTimeout(() => {
  console.log('💫 Sending batch analysis request...\n');
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'analyze_jobs_batch_with_progress',
      arguments: {
        jobIds: ['job-1', 'job-2', 'job-3']
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Cleanup
setTimeout(() => {
  console.log('\n✅ Test complete');
  mcpProcess.kill();
}, 8000);