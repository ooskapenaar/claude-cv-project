# Matrix Analysis MCP Service Documentation

**Version**: 1.1.0  
**Location**: `src/matrix-analysis-mcp/`  
**Purpose**: Advanced CV-Job matching using mathematical matrix analysis and weighted parameter scoring

## Overview

The Matrix Analysis MCP service provides sophisticated algorithms for analyzing CVs and job requirements, converting them into mathematical matrices, and computing detailed compatibility scores. It uses weighted parameter analysis, category-based scoring, and advanced matching algorithms to provide actionable insights for CV optimization.

## Architecture

### Core Files

#### `src/index.ts`
**Main MCP server implementation**
- **Class**: `MatrixAnalysisServer`
- **Purpose**: Implements MCP protocol handlers for analysis operations
- **Key Tools**: `analyze_job`, `analyze_cv`, `generate_job_matrix`, `generate_cv_matrix`, `calculate_matches`

#### `src/job-analyzer.ts`
**Job requirements analysis engine**
- **Class**: `JobAnalyzer` 
- **Purpose**: Extracts and weights parameters from job postings
- **Key Methods**:
  - `analyzeJob()`: Converts job posting to weighted parameter matrix
  - `extractTechnicalSkills()`: Identifies technical requirements with weights
  - `extractLeadershipTerms()`: Identifies leadership requirements  
  - `extractDomainExperience()`: Identifies industry/domain requirements

#### `src/cv-analyzer.ts`
**CV content analysis engine**
- **Class**: `CVAnalyzer`
- **Purpose**: Extracts and quantifies skills/experience from CV content
- **Key Methods**:
  - `analyzeCV()`: Converts CV to skill strength matrix
  - `calculateExperienceYears()`: Quantifies total and domain-specific experience
  - `assessSkillStrength()`: Determines skill proficiency levels (0-1 scale)
  - `identifySeniorityLevel()`: Determines career level from content

#### `src/matrix-generator.ts`
**Core matching algorithms and matrix operations**
- **Class**: `MatrixGenerator`
- **Purpose**: Performs mathematical matrix operations for job-CV matching
- **Key Methods**:
  - `calculateMatch()`: Main matching algorithm (see JSDoc for detailed methodology)
  - `calculateParameterMatch()`: Core parameter matching algorithm (see JSDoc for scoring formula)
  - `generateJobMatrix()`: Creates jobs × parameters matrix with weights
  - `generateCVMatrix()`: Creates CV parameter strength vector

## Algorithms and Methodology

### Parameter Extraction

**Job Analysis Algorithm**:
1. **Text Processing**: Tokenizes job description into keywords and phrases
2. **Skill Classification**: Categorizes skills into technical/leadership/domain/soft
3. **Weight Assignment**: Assigns importance weights (0-1) based on frequency and context
4. **Seniority Detection**: Analyzes title and requirements for seniority level

**CV Analysis Algorithm**:
1. **Section Parsing**: Extracts structured data from CV sections (experience, skills, education)
2. **Experience Quantification**: Calculates years of experience per technology/domain
3. **Skill Strength Assessment**: Determines proficiency (0-1) based on usage frequency and context
4. **Achievement Analysis**: Identifies leadership indicators and impact statements

### Matrix Generation

**Job Matrix Structure** (M×N where M=jobs, N=parameters):
```
           param1  param2  param3  ...
job1        0.8     0.6     0.0   ...
job2        0.3     0.9     0.7   ...  
job3        0.0     0.4     0.8   ...
```

**CV Matrix Structure** (1×N vector where N=parameters):
```
[cv_strength_param1, cv_strength_param2, cv_strength_param3, ...]
```

### Matching Algorithm

**Core Formula** (see `calculateParameterMatch()` JSDoc):
- Base Match = min(cv_strength / job_weight, 1.0)
- Overqualification Bonus = +0.1 if cv_strength > job_weight
- Critical Gap Penalty = 0.0 if cv_strength = 0 and job_weight > 0.3

**Category Scoring**:
- Technical: Programming languages, frameworks, tools
- Leadership: Team management, strategy, mentoring
- Domain: Industry experience, business knowledge
- Soft Skills: Communication, problem-solving, collaboration

**Overall Score Calculation**:
```
overall_score = Σ(parameter_match_score × job_weight) / Σ(job_weight)
```

## Data Structures

### JobAnalysis Interface
```typescript
{
  jobId: string;
  title: string;
  company: string;
  parameters: Array<{
    name: string;           // e.g., "Python", "Leadership"
    weight: number;         // 0-1, importance to job
    category: string;       // technical/leadership/domain/soft
    context: string[];      // surrounding context
  }>;
  seniorityLevel: string;   // junior/mid/senior/lead/director/executive
  requiredExperience: number; // years
  industry: string;
}
```

### CVAnalysis Interface
```typescript
{
  cvId: string;
  parameters: Array<{
    name: string;           // skill/technology name
    strength: number;       // 0-1, proficiency level
    experienceYears: number; // years of experience
    category: string;       // classification
    evidence: string[];     // supporting context
  }>;
  totalExperience: number;
  seniorityLevel: string;
  achievements: string[];
}
```

### MatchResult Interface
```typescript
{
  jobId: string;
  overallScore: number;     // 0-1, overall compatibility
  categoryScores: {         // scores by category
    technical: number;
    leadership: number;
    domain: number;
    soft: number;
  };
  strengths: string[];      // areas of overqualification
  gaps: string[];          // areas of underqualification  
  recommendations: string[]; // specific improvement suggestions
  details: {
    parameterMatches: Array<{
      parameter: string;
      jobWeight: number;
      cvStrength: number;
      matchScore: number;
    }>;
  };
}
```

## Usage Examples

### Analyzing a Job Posting
```json
{
  "name": "analyze_job",
  "arguments": {
    "jobData": {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "description": "We're looking for a Python expert with AWS experience..."
    }
  }
}
```

### Generating Job-CV Match Matrix
```json
{
  "name": "calculate_matches", 
  "arguments": {
    "jobMatrixId": "job-matrix-1234567890",
    "cvMatrixId": "cv-matrix-ronald-1234567890"
  }
}
```

## Integration Points

- **Filesystem MCP**: Stores/loads analysis matrices via `store_*_matrix` and `load_matrix`
- **CV Generation MCP**: Consumes match results for targeted optimization
- **Browser Plugin**: Provides job data for analysis via filesystem MCP

## Performance Characteristics

- **Job Analysis**: ~500ms for typical job posting (1-2KB text)
- **CV Analysis**: ~2s for full CV (5-10KB markdown)
- **Matrix Generation**: ~100ms for 10 jobs
- **Match Calculation**: ~50ms per job-CV pair

## Testing

Test suite located in `test/test-analysis.ts`:
- Unit tests for parameter extraction algorithms
- Integration tests with real CV and job data
- Performance benchmarks for large datasets
- Accuracy validation against manual assessments

## Tuning Parameters

Key constants that can be adjusted for different use cases:

```typescript
// Skill weight thresholds
TECHNICAL_SKILL_THRESHOLD = 0.3;
LEADERSHIP_TERM_THRESHOLD = 0.4;

// Experience calculation
MIN_EXPERIENCE_YEARS = 0.5;
MAX_EXPERIENCE_YEARS = 20;

// Match scoring
CRITICAL_GAP_THRESHOLD = 0.3;
OVERQUALIFICATION_BONUS = 0.1;
```

## Known Limitations

1. **Language Dependency**: Optimized for English job postings and CVs
2. **Industry Bias**: May favor technical roles over other domains
3. **Context Sensitivity**: Limited understanding of implied skills/experience
4. **Seniority Mapping**: Uses heuristic-based seniority detection

## Future Enhancements

- Machine learning-based parameter weighting
- Industry-specific scoring models
- Multi-language support
- Integration with external skill databases (e.g., O*NET)
- Real-time feedback learning from application outcomes