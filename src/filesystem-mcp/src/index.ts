#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs-extra';
import path from 'path';
import http from 'http';

// Configuration constants - use relative paths from project root
const PROJECT_ROOT_ENV_VAR = 'CV_PROJECT_ROOT';
const DEFAULT_PROJECT_ROOT = process.cwd(); // Use current working directory as default
const SERVICE_NAME = 'cv-filesystem-mcp';
const SERVICE_VERSION = '1.0.1';
const DATA_DIR_NAME = 'data';
const VAR_DIR_NAME = 'var';
const CONF_DIR_NAME = 'conf';
const DEFAULT_HTTP_PORT = 3001;

interface Config {
  projectRoot: string;
  dataDir: string;
  varDir: string;
  confDir: string;
}

class FilesystemMCP {
  private config: Config;
  private server: Server;

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

    // Initialize config
    const projectRoot = process.env[PROJECT_ROOT_ENV_VAR] || DEFAULT_PROJECT_ROOT;
    
    // Validate that the project root exists and contains expected structure
    if (!fs.existsSync(projectRoot)) {
      throw new Error(`Project root does not exist: ${projectRoot}`);
    }
    if (!fs.existsSync(path.join(projectRoot, DATA_DIR_NAME))) {
      throw new Error(`Data directory not found in project root: ${projectRoot}/${DATA_DIR_NAME}`);
    }
    
    this.config = {
      projectRoot,
      dataDir: path.join(projectRoot, DATA_DIR_NAME),
      varDir: path.join(projectRoot, VAR_DIR_NAME),
      confDir: path.join(projectRoot, CONF_DIR_NAME),
    };

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "store_cv",
            description: "Store a CV variant in data/cvs/",
            inputSchema: {
              type: "object",
              properties: {
                filename: {
                  type: "string",
                  description: "CV filename (e.g., 'optimized-for-tech-lead.md')"
                },
                content: {
                  type: "string",
                  description: "CV content in markdown format"
                },
                metadata: {
                  type: "object",
                  description: "CV metadata with matrix linking",
                  properties: {
                    matrixId: { type: "string", description: "ID of associated analysis matrix" },
                    targetJobs: { type: "array", items: { type: "string" } },
                    optimizationScore: { type: "number" },
                    createdAt: { type: "string" },
                    tags: { type: "array", items: { type: "string" } }
                  }
                }
              },
              required: ["filename", "content"],
            },
          },
          {
            name: "load_cv",
            description: "Load a CV variant from data/cvs/",
            inputSchema: {
              type: "object",
              properties: {
                filename: {
                  type: "string",
                  description: "CV filename to load"
                }
              },
              required: ["filename"],
            },
          },
          {
            name: "list_cvs",
            description: "List all stored CV variants with metadata",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "store_job",
            description: "Store a job opportunity in data/jobs/",
            inputSchema: {
              type: "object",
              properties: {
                jobId: {
                  type: "string",
                  description: "Unique job identifier"
                },
                data: {
                  type: "object",
                  description: "Job data with matrix linking",
                  properties: {
                    title: { type: "string" },
                    company: { type: "string" },
                    description: { type: "string" },
                    requirements: { type: "array", items: { type: "string" } },
                    url: { type: "string" },
                    extractedAt: { type: "string" },
                    matrixId: { type: "string", description: "ID of associated analysis matrix" }
                  },
                  required: ["title", "company", "description"]
                }
              },
              required: ["jobId", "data"],
            },
          },
          {
            name: "load_job",
            description: "Load a job opportunity from data/jobs/",
            inputSchema: {
              type: "object",
              properties: {
                jobId: {
                  type: "string",
                  description: "Job identifier to load"
                }
              },
              required: ["jobId"],
            },
          },
          {
            name: "list_jobs",
            description: "List all stored job opportunities",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "store_matrix",
            description: "Store analysis matrices in data/matrices/",
            inputSchema: {
              type: "object",
              properties: {
                matrixId: {
                  type: "string",
                  description: "Matrix identifier"
                },
                data: {
                  type: "object",
                  description: "Matrix data with entity linking",
                  properties: {
                    type: { type: "string", enum: ["CV", "Job"], description: "Entity type this matrix analyzes" },
                    entityId: { type: "string", description: "CV filename or Job ID this matrix belongs to" },
                    parameters: { type: "object", description: "Parameter weights (0-1)" },
                    weights: { type: "object", description: "Additional weighting data" }
                  },
                  required: ["type", "entityId", "parameters"]
                }
              },
              required: ["matrixId", "data"],
            },
          },
          {
            name: "load_matrix",
            description: "Load analysis matrix from data/matrices/",
            inputSchema: {
              type: "object",
              properties: {
                matrixId: {
                  type: "string",
                  description: "Matrix identifier to load"
                }
              },
              required: ["matrixId"],
            },
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "store_cv":
            return await this.storeCv(args?.filename as string, args?.content as string, args?.metadata);
          case "load_cv":
            return await this.loadCv(args?.filename as string);
          case "list_cvs":
            return await this.listCvs();
          case "store_job":
            return await this.storeJob(args?.jobId as string, args?.data);
          case "load_job":
            return await this.loadJob(args?.jobId as string);
          case "list_jobs":
            return await this.listJobs();
          case "store_matrix":
            return await this.storeMatrix(args?.matrixId as string, args?.data);
          case "load_matrix":
            return await this.loadMatrix(args?.matrixId as string);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.log('error', `Tool ${name} failed: ${errorMessage}`);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  private async log(level: string, message: string): Promise<void> {
    const logPath = path.join(this.config.varDir, 'filesystem-mcp.log');
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}\n`;
    
    await this.ensureDir(this.config.varDir);
    await fs.appendFile(logPath, logEntry);
  }

  private async storeCv(filename: string, content: string, metadata?: any) {
    const cvDir = path.join(this.config.dataDir, 'cvs');
    await this.ensureDir(cvDir);

    const cvPath = path.join(cvDir, filename);
    const metaPath = path.join(cvDir, `${filename}.meta.json`);

    await fs.writeFile(cvPath, content);
    
    if (metadata) {
      const enrichedMeta = {
        ...metadata,
        filename,
        storedAt: new Date().toISOString(),
      };
      await fs.writeFile(metaPath, JSON.stringify(enrichedMeta, null, 2));
    }

    await this.log('info', `Stored CV: ${filename}`);
    
    return {
      content: [
        {
          type: "text",
          text: `CV stored successfully: ${filename}`,
        },
      ],
    };
  }

  private async loadCv(filename: string) {
    const cvPath = path.join(this.config.dataDir, 'cvs', filename);
    const metaPath = path.join(this.config.dataDir, 'cvs', `${filename}.meta.json`);

    const content = await fs.readFile(cvPath, 'utf-8');
    let metadata = null;
    
    if (await fs.pathExists(metaPath)) {
      metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
    }

    await this.log('info', `Loaded CV: ${filename}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ filename, content, metadata }, null, 2),
        },
      ],
    };
  }

  private async listCvs() {
    const cvDir = path.join(this.config.dataDir, 'cvs');
    await this.ensureDir(cvDir);

    const files = await fs.readdir(cvDir);
    const cvFiles = files.filter(f => !f.endsWith('.meta.json'));
    
    const cvList = [];
    for (const file of cvFiles) {
      const metaPath = path.join(cvDir, `${file}.meta.json`);
      let metadata = null;
      
      if (await fs.pathExists(metaPath)) {
        metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
      }
      
      cvList.push({ filename: file, metadata });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(cvList, null, 2),
        },
      ],
    };
  }

  private async storeJob(jobId: string, data: any) {
    const jobDir = path.join(this.config.dataDir, 'jobs');
    await this.ensureDir(jobDir);

    const jobPath = path.join(jobDir, `${jobId}.json`);
    const enrichedData = {
      ...data,
      jobId,
      storedAt: new Date().toISOString(),
    };

    await fs.writeFile(jobPath, JSON.stringify(enrichedData, null, 2));
    await this.log('info', `Stored job: ${jobId}`);

    return {
      content: [
        {
          type: "text",
          text: `Job stored successfully: ${jobId}`,
        },
      ],
    };
  }

  private async loadJob(jobId: string) {
    const jobPath = path.join(this.config.dataDir, 'jobs', `${jobId}.json`);
    const data = JSON.parse(await fs.readFile(jobPath, 'utf-8'));

    await this.log('info', `Loaded job: ${jobId}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async listJobs() {
    const jobDir = path.join(this.config.dataDir, 'jobs');
    await this.ensureDir(jobDir);

    const files = await fs.readdir(jobDir);
    const jobFiles = files.filter(f => f.endsWith('.json'));
    
    const jobList = [];
    for (const file of jobFiles) {
      const jobPath = path.join(jobDir, file);
      const data = JSON.parse(await fs.readFile(jobPath, 'utf-8'));
      jobList.push({
        jobId: data.jobId,
        title: data.title,
        company: data.company,
        storedAt: data.storedAt
      });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(jobList, null, 2),
        },
      ],
    };
  }

  private async storeMatrix(matrixId: string, data: any) {
    const matrixDir = path.join(this.config.dataDir, 'matrices');
    await this.ensureDir(matrixDir);

    const matrixPath = path.join(matrixDir, `${matrixId}.json`);
    const enrichedData = {
      ...data,
      matrixId,
      storedAt: new Date().toISOString(),
    };

    await fs.writeFile(matrixPath, JSON.stringify(enrichedData, null, 2));
    await this.log('info', `Stored matrix: ${matrixId}`);

    return {
      content: [
        {
          type: "text",
          text: `Matrix stored successfully: ${matrixId}`,
        },
      ],
    };
  }

  private async loadMatrix(matrixId: string) {
    const matrixPath = path.join(this.config.dataDir, 'matrices', `${matrixId}.json`);
    const data = JSON.parse(await fs.readFile(matrixPath, 'utf-8'));

    await this.log('info', `Loaded matrix: ${matrixId}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  // Helper methods for HTTP mode
  private async handleListTools() {
    return {
      result: {
        tools: [
          {
            name: "store_cv",
            description: "Store a CV variant in data/cvs/",
            inputSchema: {
              type: "object",
              properties: {
                filename: { type: "string", description: "CV filename" },
                content: { type: "string", description: "CV content in markdown" },
                metadata: {
                  type: "object",
                  description: "CV metadata with matrix linking",
                  properties: {
                    matrixId: { type: "string" },
                    targetJobs: { type: "array", items: { type: "string" } },
                    optimizationScore: { type: "number" },
                    createdAt: { type: "string" },
                    tags: { type: "array", items: { type: "string" } }
                  }
                }
              },
              required: ["filename", "content"]
            }
          },
          {
            name: "load_cv",
            description: "Load a CV variant from data/cvs/",
            inputSchema: {
              type: "object",
              properties: { filename: { type: "string" } },
              required: ["filename"]
            }
          },
          {
            name: "list_cvs",
            description: "List all stored CV variants",
            inputSchema: { type: "object", properties: {} }
          },
          {
            name: "store_job",
            description: "Store a job opportunity in data/jobs/",
            inputSchema: {
              type: "object",
              properties: {
                jobId: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    company: { type: "string" },
                    description: { type: "string" },
                    requirements: { type: "array", items: { type: "string" } },
                    url: { type: "string" },
                    extractedAt: { type: "string" },
                    matrixId: { type: "string" }
                  },
                  required: ["title", "company", "description"]
                }
              },
              required: ["jobId", "data"]
            }
          },
          {
            name: "load_job",
            description: "Load a job opportunity",
            inputSchema: {
              type: "object",
              properties: { jobId: { type: "string" } },
              required: ["jobId"]
            }
          },
          {
            name: "list_jobs",
            description: "List all stored jobs",
            inputSchema: { type: "object", properties: {} }
          },
          {
            name: "store_matrix",
            description: "Store analysis matrix",
            inputSchema: {
              type: "object",
              properties: {
                matrixId: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["CV", "Job"] },
                    entityId: { type: "string" },
                    parameters: { type: "object" },
                    weights: { type: "object" }
                  },
                  required: ["type", "entityId", "parameters"]
                }
              },
              required: ["matrixId", "data"]
            }
          },
          {
            name: "load_matrix",
            description: "Load analysis matrix",
            inputSchema: {
              type: "object",
              properties: { matrixId: { type: "string" } },
              required: ["matrixId"]
            }
          }
        ]
      }
    };
  }

  private async handleToolCall(params: any) {
    try {
      const { name, arguments: args } = params;
      let toolResult;

      switch (name) {
        case "store_cv":
          toolResult = await this.storeCv(args.filename, args.content, args.metadata);
          break;
        case "load_cv":
          toolResult = await this.loadCv(args.filename);
          break;
        case "list_cvs":
          toolResult = await this.listCvs();
          break;
        case "store_job":
          toolResult = await this.storeJob(args.jobId, args.data);
          break;
        case "load_job":
          toolResult = await this.loadJob(args.jobId);
          break;
        case "list_jobs":
          toolResult = await this.listJobs();
          break;
        case "store_matrix":
          toolResult = await this.storeMatrix(args.matrixId, args.data);
          break;
        case "load_matrix":
          toolResult = await this.loadMatrix(args.matrixId);
          break;
        default:
          return { error: { code: -32601, message: `Unknown tool: ${name}` } };
      }

      // Convert MCP tool result to JSON-RPC result
      return { result: toolResult };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log('error', `Tool call failed: ${errorMessage}`);
      return { error: { code: -32603, message: errorMessage } };
    }
  }

  async run() {
    const mode = process.env.MCP_TRANSPORT || 'stdio';
    const port = parseInt(process.env.MCP_PORT || DEFAULT_HTTP_PORT.toString());
    
    if (mode === 'http') {
      // Simple HTTP API mode for browser communication
      const httpServer = http.createServer(async (req, res) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        // Handle health check
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', service: 'cv-filesystem-mcp' }));
          return;
        }
        
        // Handle MCP requests directly
        if (req.url === '/mcp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const jsonrpcMessage = JSON.parse(body);
              let result;
              
              // Handle different RPC methods directly
              if (jsonrpcMessage.method === 'tools/list') {
                result = await this.handleListTools();
              } else if (jsonrpcMessage.method === 'tools/call') {
                result = await this.handleToolCall(jsonrpcMessage.params);
              } else {
                result = { error: { code: -32601, message: 'Method not found' } };
              }
              
              const response = {
                jsonrpc: '2.0',
                id: jsonrpcMessage.id,
                ...result
              };
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(response));
            } catch (error) {
              const errorResponse = {
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Parse error' }
              };
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(errorResponse));
            }
          });
          
          return;
        }
        
        res.writeHead(404);
        res.end('Not found');
      });
      
      httpServer.listen(port, () => {
        console.error(`CV Filesystem MCP server running on HTTP port ${port}`);
        console.error(`Connect at: http://localhost:${port}`);
        console.error(`Health check: http://localhost:${port}/health`);
        console.error(`MCP endpoint: http://localhost:${port}/mcp`);
      });
    } else {
      // Default stdio mode for CLI usage
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("CV Filesystem MCP server running on stdio");
    }
  }
}

const server = new FilesystemMCP();
server.run().catch(console.error);