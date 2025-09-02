# Filesystem MCP Service Documentation

**Version**: 1.1.0  
**Location**: `src/filesystem-mcp/`  
**Purpose**: MCP (Model Context Protocol) service for centralized data storage and file management

## Overview

The Filesystem MCP service provides a standardized interface for storing and retrieving CV Project data including CVs, job postings, analysis matrices, and metadata. It implements the MCP protocol to enable seamless integration with AI tools and other services.

## Architecture

### Core Files

#### `src/index.ts`
**Main MCP server implementation**
- **Class**: `FilesystemServer`
- **Purpose**: Implements MCP protocol handlers for file operations
- **Key Methods**:
  - `setupToolHandlers()`: Configures available MCP tools
  - Tool handlers for: `store_cv`, `load_cv`, `store_job`, `load_job`, `store_cv_matrix`, `store_job_matrix`, `load_matrix`

### Configuration Constants
```typescript
const DEFAULT_PROJECT_ROOT = '/Users/rrrw/Projects/ML/CV_Project';
const PROJECT_ROOT_ENV_VAR = 'CV_PROJECT_ROOT';
const DATA_DIR_NAME = 'data';
const CV_SUBDIR = 'cvs';
const JOBS_SUBDIR = 'jobs';
const MATRICES_SUBDIR = 'matrices';
```

## Available Tools

### CV Operations
- **`store_cv`**: Stores CV content in markdown format with automatic metadata generation
- **`load_cv`**: Retrieves CV content and metadata by filename
- **`list_cvs`**: Lists all available CV files with metadata

### Job Operations  
- **`store_job`**: Stores job posting data in JSON format with metadata
- **`load_job`**: Retrieves job data by job ID
- **`list_jobs`**: Lists all available job postings with metadata

### Matrix Operations
- **`store_cv_matrix`**: Stores CV analysis matrices (skills, experience, categories)
- **`store_job_matrix`**: Stores job analysis matrices (requirements, scoring)
- **`load_matrix`**: Retrieves analysis matrices by type and identifier

## Data Structure

### Directory Layout
```
data/
├── cvs/                    # CV files (.md)
│   ├── *.md               # CV content in markdown
│   └── *.md.meta.json     # CV metadata
├── jobs/                   # Job postings (.json)
│   ├── job-*.json         # Job data
│   └── job-*.json.meta.json # Job metadata
└── matrices/              # Analysis results (.json)
    ├── *-cv-*.json        # CV analysis matrices
    └── *-job-*.json       # Job analysis matrices
```

### Metadata Format
All files include automatically generated metadata:
```json
{
  "created": "ISO timestamp",
  "modified": "ISO timestamp", 
  "size": "file size in bytes",
  "source": "filesystem-mcp",
  "version": "service version"
}
```

## Usage Examples

### Storing a CV
```json
{
  "name": "store_cv",
  "arguments": {
    "filename": "ronald-wertlen-2025.md",
    "content": "# CV Content...",
    "metadata": {"role": "Director of Engineering"}
  }
}
```

### Loading a Job
```json
{
  "name": "load_job", 
  "arguments": {
    "jobId": "job-scale-ai-forward-deployed"
  }
}
```

## Error Handling

- **File Not Found**: Returns structured error messages with suggestions
- **Invalid Paths**: Validates and sanitizes all file paths
- **Metadata Corruption**: Gracefully handles missing or invalid metadata
- **Permissions**: Validates directory access and creation permissions

## Integration Points

- **Matrix Analysis MCP**: Receives analysis results via `store_*_matrix` tools
- **CV Generation MCP**: Retrieves data via `load_cv`, `load_job`, `load_matrix` tools  
- **Browser Plugin**: Stores extracted job data via `store_job` tool

## Configuration

### Environment Variables
- `CV_PROJECT_ROOT`: Override default project root directory
- Standard MCP environment variables for transport configuration

### Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- Node.js built-in modules: `fs`, `path` for file operations

## Testing

Test suite located in `test/`:
- **`test-mcp.sh`**: Integration tests using MCP client
- **`requests/*.json`**: Test request examples for all tools
- **Manual testing**: Use provided JSON files with MCP client

## Security Considerations

- **Path Validation**: All file paths are validated and sanitized
- **Directory Restriction**: Operations restricted to configured data directory
- **No External Access**: Service only accesses local filesystem within project scope
- **Metadata Integrity**: Automatic metadata generation prevents tampering