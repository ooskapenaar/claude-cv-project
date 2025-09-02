#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { JobAnalyzer } from './job-analyzer.js';
import { sseReporter } from './sse-stdio-protocol.js';
import { CVAnalyzer } from './cv-analyzer.js';
import { MatrixGenerator } from './matrix-generator.js';

class MatrixAnalysisServer {
  private server: Server;
  private jobAnalyzer: JobAnalyzer;
  private cvAnalyzer: CVAnalyzer;
  private matrixGenerator: MatrixGenerator;

  constructor() {
    this.server = new Server(
      {
        name: 'cv-matrix-analysis-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.jobAnalyzer = new JobAnalyzer();
    this.cvAnalyzer = new CVAnalyzer();
    this.matrixGenerator = new MatrixGenerator();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_job_parameters',
            description: 'Extract and weight parameters from a job description',
            inputSchema: {
              type: 'object',
              properties: {
                jobData: {
                  type: 'object',
                  description: 'Job data object with title, company, description, etc.',
                  properties: {
                    title: { type: 'string' },
                    company: { type: 'string' },
                    description: { type: 'string' },
                    location: { type: 'string' }
                  },
                  required: ['title', 'description']
                }
              },
              required: ['jobData']
            }
          },
          {
            name: 'analyze_cv_parameters',
            description: 'Extract and weight parameters from a CV',
            inputSchema: {
              type: 'object',
              properties: {
                cvContent: {
                  type: 'string',
                  description: 'CV content in markdown or text format'
                }
              },
              required: ['cvContent']
            }
          },
          {
            name: 'generate_job_matrix',
            description: 'Generate parameter matrix for multiple jobs',
            inputSchema: {
              type: 'object',
              properties: {
                jobs: {
                  type: 'array',
                  description: 'Array of job data objects',
                  items: {
                    type: 'object',
                    properties: {
                      jobId: { type: 'string' },
                      title: { type: 'string' },
                      company: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                }
              },
              required: ['jobs']
            }
          },
          {
            name: 'generate_cv_matrix',
            description: 'Generate parameter matrix for a CV',
            inputSchema: {
              type: 'object',
              properties: {
                cvContent: { type: 'string' },
                cvId: { type: 'string' }
              },
              required: ['cvContent', 'cvId']
            }
          },
          {
            name: 'calculate_job_cv_match',
            description: 'Calculate match score between job and CV matrices',
            inputSchema: {
              type: 'object',
              properties: {
                jobMatrix: { type: 'object' },
                cvMatrix: { type: 'object' }
              },
              required: ['jobMatrix', 'cvMatrix']
            }
          },
          {
            name: 'analyze_jobs_batch_with_progress',
            description: 'Batch analyze multiple jobs with real-time progress reporting via SSE',
            inputSchema: {
              type: 'object',
              properties: {
                jobIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of job IDs to analyze'
                }
              },
              required: ['jobIds']
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
          case 'analyze_job_parameters':
            return await this.analyzeJobParameters((args as any).jobData);

          case 'analyze_cv_parameters':
            return await this.analyzeCVParameters((args as any).cvContent);

          case 'generate_job_matrix':
            return await this.generateJobMatrix((args as any).jobs);

          case 'generate_cv_matrix':
            return await this.generateCVMatrix((args as any).cvContent, (args as any).cvId);

          case 'calculate_job_cv_match':
            return await this.calculateJobCVMatch((args as any).jobMatrix, (args as any).cvMatrix);

          case 'analyze_jobs_batch_with_progress':
            return await this.analyzeJobsBatchWithProgress((args as any).jobIds);

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

  private async analyzeJobParameters(jobData: any) {
    const analysis = await this.jobAnalyzer.analyzeJob(jobData);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private async analyzeCVParameters(cvContent: string) {
    const analysis = await this.cvAnalyzer.analyzeCV(cvContent);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private async generateJobMatrix(jobs: any[]) {
    const matrix = await this.matrixGenerator.generateJobMatrix(jobs);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(matrix, null, 2)
        }
      ]
    };
  }

  private async generateCVMatrix(cvContent: string, cvId: string) {
    const matrix = await this.matrixGenerator.generateCVMatrix(cvContent, cvId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(matrix, null, 2)
        }
      ]
    };
  }

  private async calculateJobCVMatch(jobMatrix: any, cvMatrix: any) {
    const matchScore = await this.matrixGenerator.calculateMatch(jobMatrix, cvMatrix);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(matchScore, null, 2)
        }
      ]
    };
  }

  /**
   * Batch analyze multiple jobs with real-time progress reporting
   */
  async analyzeJobsBatchWithProgress(jobIds: string[]): Promise<any> {
    const operation = 'batch_job_analysis';
    const totalJobs = jobIds.length;
    
    sseReporter.startProgress(operation, totalJobs);
    sseReporter.status(`Starting batch analysis of ${totalJobs} jobs`);

    const results: any[] = [];
    
    try {
      for (let i = 0; i < jobIds.length; i++) {
        const jobId = jobIds[i];
        const currentStep = i + 1;
        
        sseReporter.updateProgress(operation, currentStep, totalJobs, `Analyzing job ${jobId}`);
        
        // Simulate loading job from filesystem-mcp
        // In real implementation, this would call filesystem-mcp.load_job
        sseReporter.status(`Loading job data for ${jobId}`);
        
        // Simulate job analysis
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        
        const mockJobData = {
          title: `Job ${currentStep}`,
          company: `Company ${currentStep}`,
          description: `Mock job description for ${jobId}`,
          requirements: [`Requirement 1 for ${jobId}`, `Requirement 2 for ${jobId}`]
        };
        
        sseReporter.status(`Analyzing parameters for ${jobId}`);
        const analysisResult = await this.jobAnalyzer.analyzeJob(mockJobData);
        
        results.push({
          jobId,
          analysis: analysisResult
        });
        
        sseReporter.updateProgress(operation, currentStep, totalJobs, `Completed analysis for ${jobId}`);
      }
      
      // Generate comparison matrix
      sseReporter.status('Generating comparison matrix');
      const matrix = await this.matrixGenerator.generateJobMatrix(results.map(r => r.analysis));
      
      const finalResult = {
        batchAnalysis: results,
        comparisonMatrix: matrix,
        summary: {
          totalJobs: totalJobs,
          processedAt: new Date().toISOString()
        }
      };
      
      sseReporter.completeProgress(operation, { processedJobs: totalJobs });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(finalResult, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      sseReporter.errorProgress(operation, errorMessage);
      throw error;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new MatrixAnalysisServer();
server.start().catch(console.error);