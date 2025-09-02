#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { CVOptimizer } from './cv-optimizer.js';
import { JobClusterAnalyzer } from './job-cluster-analyzer.js';
import { CVVariantGenerator } from './cv-variant-generator.js';

// Configuration constants
const SERVICE_NAME = 'cv-generation-mcp';
const SERVICE_VERSION = '1.0.0';

class CVGenerationServer {
  private server: Server;
  private cvOptimizer: CVOptimizer;
  private jobClusterAnalyzer: JobClusterAnalyzer;
  private cvVariantGenerator: CVVariantGenerator;

  constructor() {
    this.server = new Server(
      {
        name: SERVICE_NAME,
        version: SERVICE_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.cvOptimizer = new CVOptimizer();
    this.jobClusterAnalyzer = new JobClusterAnalyzer();
    this.cvVariantGenerator = new CVVariantGenerator();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_job_clusters',
            description: 'Analyze job opportunities to identify distinct clusters for targeted CV optimization',
            inputSchema: {
              type: 'object',
              properties: {
                jobMatches: {
                  type: 'array',
                  description: 'Array of job match results from matrix analysis',
                  items: {
                    type: 'object',
                    properties: {
                      jobId: { type: 'string' },
                      jobTitle: { type: 'string' },
                      company: { type: 'string' },
                      overallScore: { type: 'number' },
                      categoryScores: { type: 'object' },
                      gaps: { type: 'array', items: { type: 'string' } },
                      strengths: { type: 'array', items: { type: 'string' } }
                    }
                  }
                }
              },
              required: ['jobMatches']
            }
          },
          {
            name: 'optimize_cv_for_cluster',
            description: 'Generate an optimized CV variant targeting a specific job cluster',
            inputSchema: {
              type: 'object',
              properties: {
                originalCV: {
                  type: 'string',
                  description: 'Original CV content in markdown format'
                },
                targetCluster: {
                  type: 'object',
                  description: 'Target job cluster information',
                  properties: {
                    name: { type: 'string' },
                    jobs: { type: 'array' },
                    commonRequirements: { type: 'array' },
                    keySkills: { type: 'array' }
                  }
                },
                optimizationLevel: {
                  type: 'string',
                  enum: ['conservative', 'moderate', 'aggressive'],
                  description: 'How extensively to modify the CV'
                }
              },
              required: ['originalCV', 'targetCluster']
            }
          },
          {
            name: 'generate_targeted_summary',
            description: 'Generate a targeted summary statement for specific job requirements',
            inputSchema: {
              type: 'object',
              properties: {
                originalCV: { type: 'string' },
                targetJobs: {
                  type: 'array',
                  description: 'Specific jobs to target',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      company: { type: 'string' },
                      keyRequirements: { type: 'array' }
                    }
                  }
                }
              },
              required: ['originalCV', 'targetJobs']
            }
          },
          {
            name: 'enhance_experience_section',
            description: 'Enhance experience descriptions to better match job requirements',
            inputSchema: {
              type: 'object',
              properties: {
                experienceSection: { type: 'string' },
                targetSkills: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Skills to emphasize in experience descriptions'
                },
                jobContext: {
                  type: 'string',
                  description: 'Job context (e.g., "AI/ML", "E-commerce", "Enterprise")'
                }
              },
              required: ['experienceSection', 'targetSkills']
            }
          },
          {
            name: 'generate_cv_variants',
            description: 'Generate multiple CV variants optimized for different job clusters',
            inputSchema: {
              type: 'object',
              properties: {
                originalCV: { type: 'string' },
                jobClusters: {
                  type: 'array',
                  description: 'Job clusters to generate variants for',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      targetJobs: { type: 'array' },
                      requiredSkills: { type: 'array' }
                    }
                  }
                }
              },
              required: ['originalCV', 'jobClusters']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!args) {
          throw new Error('No arguments provided');
        }

        switch (name) {
          case 'analyze_job_clusters':
            return await this.analyzeJobClusters((args as any).jobMatches);

          case 'optimize_cv_for_cluster':
            return await this.optimizeCVForCluster(
              (args as any).originalCV,
              (args as any).targetCluster,
              (args as any).optimizationLevel || 'moderate'
            );

          case 'generate_targeted_summary':
            return await this.generateTargetedSummary(
              (args as any).originalCV,
              (args as any).targetJobs
            );

          case 'enhance_experience_section':
            return await this.enhanceExperienceSection(
              (args as any).experienceSection,
              (args as any).targetSkills,
              (args as any).jobContext
            );

          case 'generate_cv_variants':
            return await this.generateCVVariants(
              (args as any).originalCV,
              (args as any).jobClusters
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private async analyzeJobClusters(jobMatches: any[]) {
    const clusters = await this.jobClusterAnalyzer.identifyClusters(jobMatches);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(clusters, null, 2)
        }
      ]
    };
  }

  private async optimizeCVForCluster(originalCV: string, targetCluster: any, optimizationLevel: string) {
    const optimizedCV = await this.cvOptimizer.optimizeForCluster(
      originalCV,
      targetCluster,
      optimizationLevel
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(optimizedCV, null, 2)
        }
      ]
    };
  }

  private async generateTargetedSummary(originalCV: string, targetJobs: any[]) {
    const summary = await this.cvOptimizer.generateTargetedSummary(originalCV, targetJobs);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
  }

  private async enhanceExperienceSection(experienceSection: string, targetSkills: string[], jobContext: string) {
    const enhanced = await this.cvOptimizer.enhanceExperienceSection(
      experienceSection,
      targetSkills,
      jobContext
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(enhanced, null, 2)
        }
      ]
    };
  }

  private async generateCVVariants(originalCV: string, jobClusters: any[]) {
    const variants = await this.cvVariantGenerator.generateVariants(originalCV, jobClusters);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(variants, null, 2)
        }
      ]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new CVGenerationServer();
server.start().catch(console.error);