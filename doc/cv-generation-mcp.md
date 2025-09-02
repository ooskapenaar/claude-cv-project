# CV Generation MCP Service Documentation

**Version**: 1.0.0  
**Location**: `src/cv-generation-mcp/`  
**Purpose**: AI-powered CV optimization and variant generation for targeted job applications

## Overview

The CV Generation MCP service provides advanced algorithms for creating optimized CV variants based on job cluster analysis. It uses intelligent clustering, content optimization strategies, and targeted enhancement techniques to maximize job application success rates.

## Architecture

### Core Files

#### `src/index.ts`
**Main MCP server implementation**
- **Class**: `CVGenerationServer`
- **Purpose**: Implements MCP protocol handlers for CV generation operations
- **Key Tools**: `analyze_job_clusters`, `optimize_cv_for_cluster`, `generate_targeted_summary`, `enhance_experience_section`, `generate_cv_variants`

#### `src/job-cluster-analyzer.ts`
**Job clustering and classification engine**
- **Class**: `JobClusterAnalyzer`
- **Purpose**: Groups similar jobs for targeted CV optimization
- **Key Method**: `identifyClusters()` (see JSDoc for detailed algorithm)
- **Clustering Patterns**:
  - **AI/Innovation**: AI, ML, GenAI, data science roles
  - **E-commerce Technical**: E-commerce platforms, cloud-native architectures  
  - **Enterprise Leadership**: Director/VP level enterprise transformation roles
  - **Technical Leadership**: Principal/Staff engineer, architect roles
  - **Startup Growth**: Early-stage, rapid scaling environment roles

#### `src/cv-optimizer.ts`
**Core CV content optimization engine**
- **Class**: `CVOptimizer`
- **Purpose**: Applies cluster-specific optimizations to CV content
- **Key Methods**:
  - `optimizeForCluster()`: Main optimization pipeline
  - `generateTargetedSummary()`: Creates cluster-focused summary statements
  - `enhanceExperienceSection()`: Reorders and enhances experience descriptions
  - `optimizeSkillsSection()`: Prioritizes relevant skills for cluster

#### `src/cv-variant-generator.ts`
**CV variant generation and management**
- **Class**: `CVVariantGenerator` 
- **Purpose**: Creates multiple CV variants for different job clusters
- **Key Method**: `generateVariants()` (see JSDoc for detailed strategy)

## Algorithms and Strategies

### Job Clustering Algorithm

**Pattern-Based Classification** (see `identifyClusters()` JSDoc):
1. **Keyword Matching**: Scores jobs against predefined cluster patterns
2. **Multi-factor Scoring**: Considers title keywords (40%), company keywords (30%), requirements (30%)
3. **Confidence Thresholds**: Groups jobs only with >30% confidence score
4. **Cluster Analysis**: Extracts common requirements, key skills, and characteristics

**Cluster Characteristics Analysis**:
- **Seniority Level**: Executive > Director > Manager > Lead > Senior
- **Technical Depth**: High/Medium/Low based on technical requirement density
- **Leadership Emphasis**: High/Medium/Low based on leadership term frequency
- **Industry Focus**: Technology, Finance, Healthcare, Retail, Consulting

### CV Optimization Strategies

**Optimization Levels**:
```typescript
'conservative': {
  summaryModification: 0.3,    // 30% chance of summary changes
  experienceReordering: 0.2,   // 20% chance of experience reordering
  skillsReordering: 0.4,       // 40% chance of skills reordering
  contentEnhancement: 0.1      // 10% chance of content enhancement
},
'moderate': {
  summaryModification: 0.6,    // More aggressive optimization
  experienceReordering: 0.5,
  skillsReordering: 0.7,
  contentEnhancement: 0.4
},
'aggressive': {
  summaryModification: 0.9,    // Maximum optimization
  experienceReordering: 0.8,
  skillsReordering: 0.9,
  contentEnhancement: 0.7
}
```

**Content Enhancement Techniques**:

1. **Summary Optimization**:
   - Injects cluster-specific terminology (AI/ML, e-commerce, enterprise transformation)
   - Adjusts professional language patterns by seniority level
   - Emphasizes relevant value propositions

2. **Experience Enhancement**:
   - Reorders roles by relevance to target cluster
   - Enhances bullet points with cluster-relevant keywords
   - Strengthens achievement language using seniority-appropriate action words

3. **Skills Optimization**:
   - Reorders skill categories by cluster relevance priority
   - Within categories, prioritizes cluster-required skills
   - Adds contextual enhancements (e.g., "cloud-native" vs "cloud")

### Variant Generation Strategy

**Multi-Variant Approach** (see `generateVariants()` JSDoc):
1. **Cluster Analysis**: Determines optimization potential per cluster
2. **Variant Creation**: Generates one variant per significant cluster (≥1 job)
3. **Impact Estimation**: Calculates expected improvement and confidence levels
4. **Prioritization**: Orders variants by priority score (improvement × confidence × job count)

**Optimization Impact Calculation**:
```typescript
estimatedImprovement = Σ(optimization_impact) × cluster_potential
- High impact optimizations: +15%
- Medium impact optimizations: +8%  
- Low impact optimizations: +3%
- Capped at 50% maximum improvement
```

## Data Structures

### CVVariant Interface
```typescript
{
  id: string;                   // Unique variant identifier
  name: string;                 // Human-readable variant name
  targetCluster: string;        // Target job cluster ID
  description: string;          // Variant purpose and target
  cvContent: string;           // Optimized CV content
  optimizations: Array<{       // Applied optimizations
    section: string;           // CV section modified
    type: string;              // Type of modification
    description: string;       // What was changed
    impact: 'low'|'medium'|'high'; // Expected impact level
  }>;
  targetJobs: string[];        // Job IDs this variant targets
  estimatedImprovement: number; // 0-1, expected score improvement
  confidence: number;          // 0-1, confidence in optimization
  metadata: {
    generatedAt: string;
    optimizationLevel: string;
    basedOn: string;
  };
}
```

### JobCluster Interface
```typescript
{
  id: string;                  // Cluster identifier
  name: string;                // Display name
  description: string;         // Cluster description
  jobs: Array<{               // Jobs in this cluster
    jobId: string;
    title: string;
    company: string;
    score: number;
  }>;
  commonRequirements: string[]; // Frequently required skills
  keySkills: string[];         // Most important skills
  averageScore: number;        // Current CV compatibility
  clusterSize: number;         // Number of jobs
  characteristics: {
    seniorityLevel: string;
    industryFocus: string;
    technicalDepth: 'high'|'medium'|'low';
    leadershipEmphasis: 'high'|'medium'|'low';
    customerFacing: boolean;
  };
  optimizationPotential: number; // 0-1, improvement opportunity
}
```

## Usage Examples

### Analyzing Job Clusters
```json
{
  "name": "analyze_job_clusters",
  "arguments": {
    "jobMatches": [
      {
        "jobTitle": "AI Engineering Manager",
        "company": "Scale AI", 
        "overallScore": 0.65,
        "gaps": ["MLOps", "LLM deployment"],
        "strengths": ["Python", "Leadership"]
      }
    ]
  }
}
```

### Generating CV Variants
```json
{
  "name": "generate_cv_variants",
  "arguments": {
    "originalCV": "# Ronald Wertlen\n## Summary\n...",
    "jobClusters": [
      {
        "name": "AI/ML Innovation",
        "requiredSkills": ["Python", "Machine Learning", "LLMs"],
        "targetJobs": ["job-scale-ai", "job-openai"]
      }
    ]
  }
}
```

## Optimization Methodologies

### Cluster-Specific Enhancements

**AI/Innovation Cluster**:
- Emphasizes: AI, machine learning, generative AI, data science terminology
- Enhances: Data-driven → AI-driven, automation → intelligent automation
- Prioritizes: Programming languages, AI/ML frameworks, cloud platforms

**E-commerce Technical Cluster**:
- Emphasizes: Scalable systems, microservices, cloud-native architecture
- Enhances: Performance → high-performance systems, APIs → scalable APIs
- Prioritizes: Cloud technologies, architecture patterns, database systems

**Enterprise Leadership Cluster**:
- Emphasizes: Strategic leadership, organizational transformation, executive presence
- Enhances: Leadership → strategic leadership, scaling → organizational scaling
- Prioritizes: Leadership skills, strategy, budget management

### Language Pattern Optimization

**Seniority-Based Action Words**:
- **Director Level**: "spearheaded", "orchestrated", "architected", "transformed"
- **Senior Level**: "led", "implemented", "designed", "optimized", "delivered"
- **Manager Level**: "managed", "coordinated", "supervised", "guided"

## Integration Points

- **Matrix Analysis MCP**: Consumes job match results and cluster analysis data
- **Filesystem MCP**: Loads original CV content and stores generated variants
- **External Tools**: Can be integrated with document generation tools

## Performance Characteristics

- **Cluster Analysis**: ~200ms for 10 jobs
- **CV Optimization**: ~500ms per variant generation
- **Variant Generation**: ~1s for 3 clusters with full optimization
- **Memory Usage**: ~50MB for typical workload

## Testing and Validation

Integration test suite in `/test/test-cv-generation.ts`:
- End-to-end workflow testing with real job data
- Cluster identification accuracy validation
- Optimization impact measurement
- Variant quality assessment

## Quality Assurance

**Content Validation**:
- Preserves original CV structure and formatting
- Maintains factual accuracy of experience and achievements
- Ensures grammatically correct optimizations
- Validates markdown syntax integrity

**Optimization Limits**:
- Maximum 50% estimated improvement to prevent over-optimization
- Confidence scores factor in optimization aggressiveness
- Conservative defaults for unknown job patterns

## Future Enhancements

- **Machine Learning Integration**: Train models on application success rates
- **A/B Testing Framework**: Compare variant performance systematically  
- **Industry Customization**: Specialized optimization for different industries
- **Real-time Feedback**: Learn from application outcomes to improve algorithms
- **Template System**: Pre-built variants for common career transitions