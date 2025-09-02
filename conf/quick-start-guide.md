# Quick Start Guide: CV Optimization with Claude Desktop

## 🚀 Initial Setup (One-time)

1. **Run the setup script**:
   ```bash
   cd /Users/rrrw/Projects/ML/CV_Project
   ./bin/setup-claude-desktop.sh
   ```

2. **Restart Claude Desktop** completely (Quit and relaunch)

3. **Verify connection** - In Claude Desktop, type:
   ```
   List available tools
   ```
   You should see tools from filesystem-mcp, matrix-analysis-mcp, and cv-generation-mcp

## 📋 Your Three Main Workflows

### Workflow 1: Quick Job Analysis
**When to use**: You want to see what jobs you have and understand their requirements

**Prompt**:
```
I want to analyze my collected job opportunities. Please:
1. List all available jobs with numbers for selection
2. Show me the matrix analysis options
```

**What happens**: Claude shows numbered job list, you select jobs, get detailed analysis

---

### Workflow 2: Skills Clustering (Your Preferred)
**When to use**: You want deep insight into 1-2 specific jobs and skill gaps

**Prompt**:
```
I want to analyze skills clustering for specific job opportunities. This is my preferred workflow for understanding skill gaps.

1. Show me available jobs (numbered)
2. I'll select 1-2 jobs for focused analysis
3. Extract and cluster the skill requirements
4. Analyze my CV against these skill clusters
5. Provide targeted recommendations

Please start by showing me the available jobs.
```

**What happens**: Deep skill analysis, cluster identification, specific recommendations

---

### Workflow 3: Complete CV Optimization
**When to use**: You want to generate optimized CV variants for specific jobs

**Prompt**:
```
I want to run a complete CV optimization session:

1. Show me all available jobs (numbered list)
2. Show me all available CVs (numbered list) 
3. After I make selections, run the full optimization workflow
4. Show me the proposed changes before applying

Please start by listing my options.
```

**What happens**: Full pipeline from job selection to optimized CV variants

## 🎯 Selection Examples

### Single Job Analysis
```
You: "Skills clustering workflow"
Claude: [Shows jobs 1-4]
You: "Analyze job 1"
Claude: [Deep analysis of Scale AI position]
```

### Multiple Job Comparison
```
You: "Quick job analysis"
Claude: [Shows jobs 1-4]
You: "Jobs 1 and 3"
Claude: [Compares Scale AI and Simon Kucher positions]
```

### Complete Optimization
```
You: "Complete optimization workflow"
Claude: [Shows jobs 1-4 and CVs 1-2]
You: "Jobs 1,3 and CV 1"
Claude: [Runs full optimization pipeline]
```

## 💡 Pro Tips

### Getting Better Results
- **Be specific**: "Analyze job 1 for technical skills only"
- **Ask for details**: "Show me exactly what changed in the summary section"
- **Iterate**: "Make it more conservative" or "Try aggressive optimization"

### Common Follow-ups
- "Save this variant as 'ronald-scale-ai-2025.md'"
- "Compare this with my original CV"
- "What's the biggest skill gap for this job?"
- "Generate a second variant with different focus"

### Managing Sessions
- Each workflow can be run independently
- Ask "What have we done so far?" to track progress
- Use "Start fresh" to begin a new session

## 🔧 Troubleshooting

### MCP Services Not Working
```bash
# Rebuild services
cd src/filesystem-mcp && npm run build
cd ../matrix-analysis-mcp && npm run build  
cd ../cv-generation-mcp && npm run build

# Re-run setup
./bin/setup-claude-desktop.sh
```

### No Jobs/CVs Found
- Check that data exists: `ls data/jobs/` and `ls data/cvs/`
- Use browser plugin to extract more jobs if needed

### Claude Seems Confused
- Start with a clear workflow template prompt
- Ask Claude to "list available tools" to verify MCP connection
- Be explicit: "Use filesystem-mcp to load jobs"

## 📚 Next Steps

Once you're comfortable with the basic workflows:

1. **Experiment with optimization levels**: Ask for "conservative", "moderate", or "aggressive" optimization
2. **Compare multiple CV variants**: Generate several versions and compare them
3. **Iterate on specific sections**: "Only optimize the experience section"
4. **Track improvements**: Save multiple versions and compare match scores

## 🎪 Ready to Start?

Try this first prompt in Claude Desktop:
```
I want to analyze my collected job opportunities. Please list all available jobs with numbers for selection.
```

This will verify everything is working and show you what job data you have to work with!