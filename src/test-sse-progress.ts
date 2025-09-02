#!/usr/bin/env tsx

/**
 * Test script to demonstrate SSE over stdio progress reporting
 * Shows how Claude CLI can monitor real-time progress from MCP services
 */

import { spawn } from 'child_process';
import { sseParser } from './common/sse-stdio-protocol.js';

console.log('🚀 Testing SSE Progress Reporting over stdio\n');

// Spawn the matrix-analysis-mcp service
const mcpProcess = spawn('node', ['dist/index.js'], {
  cwd: '/Users/rrrw/Projects/ML/CV_Project/src/matrix-analysis-mcp',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Setup progress event handlers
sseParser.on('progress_start', (data) => {
  console.log(`📋 Starting: ${data.operation} (${data.totalSteps} steps)`);
});

sseParser.on('progress_update', (data) => {
  const bar = '█'.repeat(Math.floor(data.percentage / 5)) + '░'.repeat(20 - Math.floor(data.percentage / 5));
  console.log(`⚡ [${bar}] ${data.percentage}% - ${data.message || data.operation}`);
});

sseParser.on('status', (data) => {
  console.log(`   💡 ${data.message}`);
});

sseParser.on('progress_complete', (data) => {
  console.log(`✅ Completed: ${data.operation}`);
  if (data.result) {
    console.log(`   📊 Result: ${JSON.stringify(data.result, null, 2)}`);
  }
});

sseParser.on('progress_error', (data) => {
  console.log(`❌ Error in ${data.operation}: ${data.error}`);
});

// Handle stderr for SSE events
mcpProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const isSSE = sseParser.parseLine(line.trim());
      if (!isSSE) {
        // Regular stderr output
        console.log(`🔧 ${line.trim()}`);
      }
    }
  }
});

// Handle stdout for JSON-RPC responses
let responseBuffer = '';
mcpProcess.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse complete JSON responses
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line.trim());
        console.log(`📥 JSON-RPC Response:`, response);
      } catch (e) {
        console.log(`📄 ${line.trim()}`);
      }
    }
  }
});

// Handle process events
mcpProcess.on('close', (code) => {
  console.log(`\n🔚 MCP service exited with code ${code}`);
});

mcpProcess.on('error', (error) => {
  console.error(`❌ Process error:`, error);
});

// Wait for service to start
setTimeout(() => {
  console.log('💫 Sending batch analysis request...\n');
  
  // Send JSON-RPC request for batch analysis
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'analyze_jobs_batch_with_progress',
      arguments: {
        jobIds: [
          'job-123',
          'job-delivery-hero-vice-president--developer-platform--all-genders--mf2bavmu',
          'job-paltron-director-software---web-development--m-w-d--meffezib',
          'job-scale-ai-forward-deployed-engineering-manager--genai-applications-meffma2p'
        ]
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Cleanup after 15 seconds
setTimeout(() => {
  console.log('\n⏰ Test complete, cleaning up...');
  mcpProcess.kill();
  process.exit(0);
}, 15000);