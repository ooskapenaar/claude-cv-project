#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { JobAnalyzer } from '../src/job-analyzer.js';
import { CVAnalyzer } from '../src/cv-analyzer.js';
import { MatrixGenerator } from '../src/matrix-generator.js';

// Configuration constants - use dynamic path detection
const PROJECT_ROOT = process.env.CV_PROJECT_ROOT || path.join(__dirname, '../../..');
const TEST_JOB_FILE = 'job-simon-kucher-head-of-engineering-mefcs9wk.json';
const TEST_CV_FILE = 'ronald-wertlen-2025.md';
const TEST_CV_ID = 'ronald-wertlen-2025';

async function testMatrixAnalysis() {
  console.log('🔍 Testing Matrix Analysis Service...\n');

  const jobAnalyzer = new JobAnalyzer();
  const cvAnalyzer = new CVAnalyzer();
  const matrixGenerator = new MatrixGenerator();

  // Load test data
  console.log('📖 Loading test data...');
  
  // Load job data from top-level data folder
  const jobDataPath = join(PROJECT_ROOT, 'data', 'jobs', TEST_JOB_FILE);
  const jobData = JSON.parse(readFileSync(jobDataPath, 'utf-8'));
  
  // Load CV data from top-level data folder
  const cvDataPath = join(PROJECT_ROOT, 'data', 'cvs', TEST_CV_FILE);
  const cvContent = readFileSync(cvDataPath, 'utf-8');

  console.log('✅ Test data loaded\n');

  // Test 1: Job Analysis
  console.log('🎯 Test 1: Analyzing job...');
  const jobAnalysis = await jobAnalyzer.analyzeJob(jobData);
  
  console.log(`Job: ${jobAnalysis.title} at ${jobAnalysis.company}`);
  console.log(`Seniority: ${jobAnalysis.seniorityLevel}`);
  console.log(`Parameters found: ${jobAnalysis.parameters.length}`);
  console.log('Top parameters:');
  jobAnalysis.parameters.slice(0, 5).forEach(param => {
    console.log(`  - ${param.name} (${param.category}): ${param.weight.toFixed(2)}`);
  });
  console.log('');

  // Test 2: CV Analysis
  console.log('📝 Test 2: Analyzing CV...');
  const cvAnalysis = await cvAnalyzer.analyzeCV(cvContent);
  
  console.log(`CV: ${cvAnalysis.totalExperience} years experience`);
  console.log(`Seniority: ${cvAnalysis.seniorityLevel}`);
  console.log(`Parameters found: ${cvAnalysis.parameters.length}`);
  console.log('Top parameters:');
  cvAnalysis.parameters.slice(0, 5).forEach(param => {
    console.log(`  - ${param.name} (${param.category}): ${param.strength.toFixed(2)}`);
  });
  console.log('');

  // Test 3: Matrix Generation
  console.log('📊 Test 3: Generating matrices...');
  
  const jobMatrix = await matrixGenerator.generateJobMatrix([jobData]);
  console.log(`Job matrix: ${jobMatrix.metadata.jobCount} jobs x ${jobMatrix.metadata.parameterCount} parameters`);
  
  const cvMatrix = await matrixGenerator.generateCVMatrix(cvContent, TEST_CV_ID);
  console.log(`CV matrix: ${cvMatrix.metadata.parameterCount} parameters`);
  console.log('');

  // Test 4: Calculate Match
  console.log('🎯 Test 4: Calculating job-CV match...');
  
  const match = await matrixGenerator.calculateMatch(jobMatrix, cvMatrix);
  const bestMatch = match.matches[0];
  
  console.log(`Overall Score: ${(bestMatch.overallScore * 100).toFixed(1)}%`);
  console.log('Category Scores:');
  Object.entries(bestMatch.categoryScores).forEach(([category, score]) => {
    console.log(`  - ${category}: ${(score * 100).toFixed(1)}%`);
  });
  
  console.log('\nTop Strengths:');
  bestMatch.strengths.slice(0, 3).forEach(strength => {
    console.log(`  ✅ ${strength}`);
  });
  
  console.log('\nMain Gaps:');
  bestMatch.gaps.slice(0, 3).forEach(gap => {
    console.log(`  ❌ ${gap}`);
  });
  
  console.log('\nRecommendations:');
  bestMatch.recommendations.slice(0, 2).forEach(rec => {
    console.log(`  💡 ${rec}`);
  });

  console.log('\n🎉 Matrix analysis test completed successfully!');
}

// Run the test
testMatrixAnalysis().catch(console.error);