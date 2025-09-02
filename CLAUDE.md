# CV Project Development Guidelines

## Version Management

**IMPORTANT**: Always update version numbers when making changes to any component.

### Semantic Versioning (SemVer)
Use semantic versioning (MAJOR.MINOR.PATCH) for all components:

- **MAJOR**: Breaking changes or major feature overhauls
- **MINOR**: New features, significant improvements 
- **PATCH**: Bug fixes, small improvements

### Components to Version

1. **Browser Extension** (`src/browser-plugin/manifest.json`)
   - Update `version` field when making any changes to extension code
   - Current: 1.1.0

2. **MCP Filesystem Service** (`src/filesystem-mcp/package.json`)
   - Update `version` field when making changes to MCP service
   - Current: 1.1.0

3. **Matrix Analysis MCP Service** (`src/matrix-analysis-mcp/package.json`)
   - Update `version` field when making changes to analysis service
   - Current: 1.1.0

4. **CV Generation MCP Service** (`src/cv-generation-mcp/package.json`)
   - Update `version` field when making changes to CV generation service
   - Current: 1.0.0

5. **Any Future Components**
   - Always include version tracking in package.json, manifest.json, or similar

### Version Update Examples

- Adding hybrid extraction to browser extension: 1.0.2 → 1.1.0 (minor)
- Fixing a bug in content script: 1.1.0 → 1.1.1 (patch)
- Complete rewrite of extraction logic: 1.1.1 → 2.0.0 (major)

### Workflow
1. Make code changes
2. Update appropriate version number
3. Commit with version number in commit message
4. Document changes if significant

## Development Guidelines

### Code Changes
**IMPORTANT**: Do not change code unless explicitly instructed to do so.

- If the user asks "where is X?" or "I don't see Y" - they are asking for information, not requesting changes
- Only modify code when given clear instructions like "please fix", "change this to", "add this feature"
- When in doubt, ask for clarification before making changes
- Questions about code location, structure, or current implementation should be answered without modifications

### Code Quality Standards
**IMPORTANT**: Follow these coding standards in all implementations:

- **No Inline Strings**: Never inline important strings (paths, URLs, configuration values)
- **Extract Constants**: All important strings must be extracted to constants at the top of the file
- **No Relative Paths**: Never use relative paths like `../..` - use explicit configuration
- **Validate Configuration**: Always validate that required paths/resources exist before using them
- **Environment Variables**: Use environment variables for configuration with safe defaults

## Project Structure

This is a comprehensive CV optimization project with all four phases implemented and fully documented.

### Current Status
- **Phase 1**: ✅ Complete and tested - MCP Foundation & Data Models
- **Phase 2**: ✅ Complete - Job Opportunity Processing (browser extension with hybrid extraction)
- **Phase 3**: ✅ Complete - CV Analysis & Matrix Generation (matrix-analysis-mcp service)
- **Phase 4**: ✅ Complete - CV Generation Engine (cv-generation-mcp service)

### Key Components
- **MCP Filesystem Service** (`src/filesystem-mcp/`) - Data storage and file management
- **Browser Extension** (`src/browser-plugin/`) - LinkedIn job extraction (human-in-the-loop)
- **Matrix Analysis MCP** (`src/matrix-analysis-mcp/`) - Job-CV matching and analysis
- **CV Generation MCP** (`src/cv-generation-mcp/`) - CV optimization and variant generation
- **Data Directory** (`data/`) - Centralized storage for jobs, CVs, and analysis results
- **Technical Documentation** (`doc/`) - Comprehensive documentation for each component

## Documentation Structure

### Technical Documentation
All components are fully documented in the `doc/` folder:
- **`doc/README.md`** - Master overview and architecture guide
- **`doc/filesystem-mcp.md`** - Data storage service documentation
- **`doc/matrix-analysis-mcp.md`** - Analysis algorithms and methodology
- **`doc/cv-generation-mcp.md`** - CV optimization strategies and implementation
- **`doc/browser-plugin.md`** - Job extraction methodology and anti-bot evasion

### Code Documentation
Complex algorithms are documented with JSDoc comments in source files:
- Matrix calculation algorithms (`src/matrix-analysis-mcp/src/matrix-generator.ts`)
- CV optimization strategies (`src/cv-generation-mcp/src/cv-variant-generator.ts`) 
- Job clustering logic (`src/cv-generation-mcp/src/job-cluster-analyzer.ts`)
- Browser extraction methods (`src/browser-plugin/content.js`)