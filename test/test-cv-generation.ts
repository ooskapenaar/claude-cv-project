#!/usr/bin/env ts-node

/**
 * Integration test for CV Generation Engine (Phase 4)
 * Tests the complete CV optimization workflow using real job data
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration constants
const PROJECT_ROOT = '/Users/rrrw/Projects/ML/CV_Project';
const DATA_DIR = join(PROJECT_ROOT, 'data');
const JOBS_DIR = join(DATA_DIR, 'jobs');
const CV_DIR = join(DATA_DIR, 'cvs');

interface JobData {
  jobId: string;
  jobTitle: string;
  company: string;
  overallScore?: number;
  categoryScores?: any;
  gaps?: string[];
  strengths?: string[];
}

async function loadJobData(): Promise<JobData[]> {
  console.log('🔍 Loading job data from', JOBS_DIR);
  
  if (!existsSync(JOBS_DIR)) {
    throw new Error(`Jobs directory not found: ${JOBS_DIR}`);
  }

  const jobFiles = readdirSync(JOBS_DIR).filter(file => file.endsWith('.json'));
  console.log(`📂 Found ${jobFiles.length} job files`);

  const jobs: JobData[] = [];
  
  for (const file of jobFiles) {
    try {
      const content = readFileSync(join(JOBS_DIR, file), 'utf-8');
      const jobData = JSON.parse(content);
      
      jobs.push({
        jobId: file.replace('.json', ''),
        jobTitle: jobData.title || jobData.jobTitle || 'Unknown Title',
        company: jobData.company || 'Unknown Company',
        overallScore: jobData.overallScore || 0.5,
        categoryScores: jobData.categoryScores || {},
        gaps: jobData.gaps || [],
        strengths: jobData.strengths || []
      });
    } catch (error) {
      console.warn(`⚠️  Failed to parse job file ${file}:`, error);
    }
  }

  return jobs;
}

async function loadCV(): Promise<string> {
  console.log('📄 Loading CV from', CV_DIR);
  
  if (!existsSync(CV_DIR)) {
    throw new Error(`CV directory not found: ${CV_DIR}`);
  }

  const cvFiles = readdirSync(CV_DIR).filter(file => file.endsWith('.md'));
  
  if (cvFiles.length === 0) {
    throw new Error('No CV markdown files found in data/cvs/');
  }

  const cvFile = cvFiles[0]; // Use first CV file found
  console.log(`📋 Using CV file: ${cvFile}`);
  
  return readFileSync(join(CV_DIR, cvFile), 'utf-8');
}

async function testJobClustering(jobs: JobData[]): Promise<any> {
  console.log('\n🎯 Testing Job Cluster Analysis...');
  
  // Simulate job cluster analysis
  const { JobClusterAnalyzer } = await import('../src/cv-generation-mcp/src/job-cluster-analyzer.js');
  const analyzer = new JobClusterAnalyzer();
  
  const clusterAnalysis = await analyzer.identifyClusters(jobs);
  
  console.log(`📊 Cluster Analysis Results:`);
  console.log(`   - Total Jobs: ${clusterAnalysis.totalJobs}`);
  console.log(`   - Clusters Found: ${clusterAnalysis.clusters.length}`);
  console.log(`   - Strategy: ${clusterAnalysis.recommendedStrategy}`);
  
  clusterAnalysis.clusters.forEach((cluster, index) => {
    console.log(`   ${index + 1}. ${cluster.name} (${cluster.clusterSize} jobs, ${(cluster.optimizationPotential * 100).toFixed(0)}% potential)`);
  });

  console.log('\n💡 Insights:');
  clusterAnalysis.insights.forEach((insight, index) => {
    console.log(`   ${index + 1}. ${insight}`);
  });

  return clusterAnalysis;
}

async function testCVOptimization(cv: string, clusterAnalysis: any): Promise<any> {
  console.log('\n🔧 Testing CV Optimization...');
  
  if (clusterAnalysis.clusters.length === 0) {
    console.log('❌ No clusters found for optimization');
    return null;
  }

  const { CVOptimizer } = await import('../src/cv-generation-mcp/src/cv-optimizer.js');
  const optimizer = new CVOptimizer();
  
  const topCluster = clusterAnalysis.clusters[0];
  console.log(`🎯 Optimizing for cluster: ${topCluster.name}`);
  
  const optimizationResult = await optimizer.optimizeForCluster(cv, topCluster, 'moderate');
  
  console.log(`📈 Optimization Results:`);
  console.log(`   - Changes Applied: ${optimizationResult.changes.length}`);
  console.log(`   - Estimated Score Improvement: ${(optimizationResult.targetScore * 100).toFixed(1)}%`);
  console.log(`   - Confidence: ${(optimizationResult.confidence * 100).toFixed(1)}%`);
  
  console.log('\n🔄 Changes Made:');
  optimizationResult.changes.forEach((change, index) => {
    console.log(`   ${index + 1}. ${change.section}: ${change.description} (${change.impact} impact)`);
  });

  return optimizationResult;
}

async function testVariantGeneration(cv: string, clusterAnalysis: any): Promise<any> {
  console.log('\n🎨 Testing CV Variant Generation...');
  
  const { CVVariantGenerator } = await import('../src/cv-generation-mcp/src/cv-variant-generator.js');
  const generator = new CVVariantGenerator();
  
  const variantResult = await generator.generateVariants(cv, clusterAnalysis.clusters);
  
  console.log(`🎯 Variant Generation Results:`);
  console.log(`   - Variants Created: ${variantResult.variants.length}`);
  console.log(`   - Total Estimated Improvement: ${(variantResult.summary.estimatedTotalImprovement * 100).toFixed(1)}%`);
  console.log(`   - Primary Recommendation: ${variantResult.summary.primaryRecommendation}`);
  
  console.log('\n📋 Generated Variants:');
  variantResult.variants.forEach((variant, index) => {
    console.log(`   ${index + 1}. ${variant.name}`);
    console.log(`      - Target Cluster: ${variant.targetCluster}`);
    console.log(`      - Target Jobs: ${variant.targetJobs.length}`);
    console.log(`      - Estimated Improvement: ${(variant.estimatedImprovement * 100).toFixed(1)}%`);
    console.log(`      - Confidence: ${(variant.confidence * 100).toFixed(1)}%`);
    console.log(`      - Optimizations: ${variant.optimizations.length}`);
  });

  console.log('\n🎯 Recommendations:');
  variantResult.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec.reasoning} (Priority: ${rec.priority.toFixed(2)})`);
  });

  console.log('\n📝 Next Steps:');
  variantResult.summary.nextSteps.forEach((step, index) => {
    console.log(`   ${step}`);
  });

  return variantResult;
}

async function main() {
  console.log('🚀 Starting CV Generation Engine Integration Test');
  console.log('=' .repeat(60));

  try {
    // 1. Load test data
    const jobs = await loadJobData();
    const cv = await loadCV();
    
    console.log(`✅ Loaded ${jobs.length} jobs and CV (${cv.length} characters)`);

    // 2. Test job clustering
    const clusterAnalysis = await testJobClustering(jobs);

    // 3. Test CV optimization
    const optimizationResult = await testCVOptimization(cv, clusterAnalysis);

    // 4. Test variant generation
    const variantResult = await testVariantGeneration(cv, clusterAnalysis);

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Integration Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Jobs Analyzed: ${jobs.length}`);
    console.log(`   - Clusters Identified: ${clusterAnalysis.clusters.length}`);
    console.log(`   - CV Variants Generated: ${variantResult.variants.length}`);
    console.log(`   - Overall System: ✅ WORKING`);

  } catch (error) {
    console.error('\n❌ Integration Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);