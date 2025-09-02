# Claude Desktop Workflow Templates

## Setup Instructions

1. **Copy MCP Configuration**:
   ```bash
   cp /Users/rrrw/Projects/ML/CV_Project/conf/claude_desktop_config.json \
      ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Restart Claude Desktop** to load the MCP services

3. **Verify Connection**: Start Claude Desktop and type "list available tools" to confirm all three MCP services are connected

## Workflow Templates

### Template 1: Job Matrix Analysis

**Prompt**:
```
I want to analyze my collected job opportunities. Please:
1. List all available jobs with numbers for selection
2. Show me the matrix analysis options

Use the filesystem-mcp to load job data and matrix-analysis-mcp for analysis.
```

**Expected Flow**:
- Claude lists numbered jobs from `data/jobs/`
- User selects jobs by number (e.g., "1,3")
- Claude runs matrix analysis on selected jobs
- Results show parameter clusters and weights

### Template 2: Complete Optimization Session

**Prompt**:
```
I want to run a complete CV optimization session following the project methodology:

1. First show me all available jobs (numbered list)
2. Then show me all available CVs (numbered list) 
3. After I make selections, run the full optimization workflow:
   - Create job matrix for selected positions
   - Analyze selected CV 
   - Generate optimization recommendations
   - Show me the proposed changes before applying

Please start by listing my options.
```

**Expected Flow**:
- Lists jobs and CVs with numbers
- User selects specific items
- Runs comprehensive analysis pipeline
- Shows detailed optimization proposals
- Applies changes only after user approval

### Template 3: Skills Clustering Analysis (Preferred)

**Prompt**:
```
I want to analyze skills clustering for specific job opportunities. This is my preferred workflow for understanding skill gaps and optimization targets.

1. Show me available jobs (numbered)
2. I'll select 1-2 jobs for focused analysis
3. Extract and cluster the skill requirements
4. Analyze my CV against these skill clusters
5. Provide targeted recommendations

Please start by showing me the available jobs.
```

**Expected Flow**:
- Shows numbered job list
- User selects 1-2 jobs for deep analysis
- Detailed skill cluster extraction
- CV skill strength analysis
- Specific, actionable recommendations

### Template 4: Quick Job Comparison

**Prompt**:
```
I want to quickly compare 2 specific job opportunities and see how they differ in requirements.

1. List available jobs (numbered)
2. After I select 2 jobs, show me:
   - Side-by-side skill requirements comparison
   - Overlapping vs unique requirements
   - Which of my CVs would be best for each

Start with the job list please.
```

### Template 5: CV Variant Generation

**Prompt**:
```
I want to generate optimized CV variants for selected job opportunities.

1. Show me available jobs and CVs (numbered lists)
2. After I select jobs and a base CV:
   - Analyze job clusters
   - Generate targeted CV variants 
   - Show specific optimizations made
   - Save variants with descriptive names

Please start with showing my options.
```

### Template 6: Iteration Session (Advanced)

**Prompt**:
```
I want to run an iterative optimization session where I can refine the CV multiple times:

1. Start with job and CV selection
2. Generate initial optimization
3. Let me review and request modifications
4. Apply changes and re-analyze
5. Continue until I'm satisfied with the result

Begin by showing me available jobs and CVs.
```

## Advanced Usage Patterns

### Multi-Stage Selection Example
```
User: "Start optimization session"
Claude: [Lists 4 jobs, 2 CVs]
User: "Jobs 1,3 and CV 1"
Claude: [Runs analysis, shows results]
User: "Make it more aggressive for the Scale AI position"
Claude: [Adjusts optimization level, re-runs analysis]
```

### Comparative Analysis Example
```
User: "Compare jobs for skills clustering"
Claude: [Lists jobs]
User: "Compare jobs 1 and 2"
Claude: [Shows detailed skill cluster comparison]
User: "Which CV works better for job 1?"
Claude: [Analyzes both CVs against job 1, recommends best fit]
```

## Tips for Best Results

### Effective Prompts
- Always ask for numbered lists for selection
- Be specific about which workflow you want
- Request to see changes before applying them
- Ask for explanations of recommendations

### Selection Syntax
- Single job: "1" or "Job 1"
- Multiple jobs: "1,3" or "Jobs 1 and 3"
- All jobs: "all" or "all jobs"
- Range: "1-3" for jobs 1, 2, and 3

### Session Management
- Start each major workflow with a clear template prompt
- Ask Claude to summarize selections before proceeding
- Request saving of important results
- Use "show me what we've done so far" to track progress

## Common Follow-up Prompts

### After Analysis Results
```
"Can you make the optimization more conservative?"
"Show me exactly what changed in the experience section"
"Generate a second variant with different focus"
"Save this variant as 'ronald-scale-ai-optimized.md'"
```

### During Selection Phase
```
"Show me more details about job 2 before I decide"
"What's the difference between my two CVs?"
"Which jobs are most similar to each other?"
```

### For Iteration
```
"Let's try again with different jobs"
"Apply the changes and run another optimization"
"Compare this result with the previous version"
```

## Troubleshooting

### If MCP Services Don't Connect
1. Check that all services are built: `npm run build` in each MCP directory
2. Verify file paths in configuration match your system
3. Restart Claude Desktop completely
4. Check console logs if available

### If Analysis Seems Incomplete
- Ask Claude to "show me more detail about the analysis"
- Request specific sections: "focus on the technical skills analysis"
- Try with fewer jobs for more detailed analysis

### If Optimizations Seem Wrong
- Ask for explanation: "why did you make these specific changes?"
- Request different optimization level: "try a more conservative approach"
- Ask for alternatives: "show me a different optimization strategy"