import { JobAnalyzer, JobAnalysis } from './job-analyzer.js';
import { CVAnalyzer, CVAnalysis } from './cv-analyzer.js';

export interface JobMatrix {
  matrixId: string;
  jobs: JobAnalysis[];
  parameters: string[]; // All unique parameters across jobs
  weightMatrix: number[][]; // jobs x parameters matrix
  metadata: {
    generatedAt: string;
    jobCount: number;
    parameterCount: number;
    averageSeniority: string;
  };
}

export interface CVMatrix {
  matrixId: string;
  cvAnalysis: CVAnalysis;
  parameters: string[]; // Parameters from CV
  strengthVector: number[]; // CV strength for each parameter
  metadata: {
    generatedAt: string;
    parameterCount: number;
    totalExperience: number;
  };
}

export interface MatchResult {
  jobId: string;
  jobTitle: string;
  company: string;
  overallScore: number; // 0-1, higher is better match
  categoryScores: {
    technical: number;
    leadership: number;
    domain: number;
    soft: number;
  };
  strengths: string[]; // Areas where CV strongly matches job
  gaps: string[]; // Areas where CV lacks job requirements
  recommendations: string[]; // Suggestions for CV optimization
  details: {
    parameterMatches: Array<{
      parameter: string;
      jobWeight: number;
      cvStrength: number;
      matchScore: number;
    }>;
  };
}

export interface ComprehensiveMatch {
  cvId: string;
  totalJobs: number;
  matches: MatchResult[];
  summary: {
    averageScore: number;
    bestMatch: MatchResult;
    topSkills: string[];
    commonGaps: string[];
    recommendations: string[];
  };
  generatedAt: string;
}

export class MatrixGenerator {
  private jobAnalyzer: JobAnalyzer;
  private cvAnalyzer: CVAnalyzer;

  constructor() {
    this.jobAnalyzer = new JobAnalyzer();
    this.cvAnalyzer = new CVAnalyzer();
  }

  async generateJobMatrix(jobs: any[]): Promise<JobMatrix> {
    // Analyze all jobs
    const jobAnalyses: JobAnalysis[] = [];
    for (const job of jobs) {
      const analysis = await this.jobAnalyzer.analyzeJob(job);
      jobAnalyses.push(analysis);
    }

    // Extract all unique parameters
    const allParameters = new Set<string>();
    jobAnalyses.forEach(job => {
      job.parameters.forEach(param => allParameters.add(param.name));
    });
    
    const parameters = Array.from(allParameters).sort();

    // Build weight matrix (jobs x parameters)
    const weightMatrix: number[][] = [];
    
    for (const jobAnalysis of jobAnalyses) {
      const jobWeights: number[] = [];
      
      for (const param of parameters) {
        const jobParam = jobAnalysis.parameters.find(p => p.name === param);
        jobWeights.push(jobParam ? jobParam.weight : 0);
      }
      
      weightMatrix.push(jobWeights);
    }

    // Calculate average seniority
    const seniorityLevels = ['junior', 'mid', 'senior', 'lead', 'director', 'executive'];
    const avgSeniorityIndex = Math.round(
      jobAnalyses.reduce((sum, job) => 
        sum + seniorityLevels.indexOf(job.seniorityLevel), 0
      ) / jobAnalyses.length
    );

    return {
      matrixId: `job-matrix-${Date.now()}`,
      jobs: jobAnalyses,
      parameters,
      weightMatrix,
      metadata: {
        generatedAt: new Date().toISOString(),
        jobCount: jobAnalyses.length,
        parameterCount: parameters.length,
        averageSeniority: seniorityLevels[avgSeniorityIndex] || 'mid'
      }
    };
  }

  async generateCVMatrix(cvContent: string, cvId: string): Promise<CVMatrix> {
    const cvAnalysis = await this.cvAnalyzer.analyzeCV(cvContent);
    cvAnalysis.cvId = cvId;
    
    // Extract parameters and their strengths
    const parameters = cvAnalysis.parameters.map(p => p.name);
    const strengthVector = cvAnalysis.parameters.map(p => p.strength);

    return {
      matrixId: `cv-matrix-${cvId}-${Date.now()}`,
      cvAnalysis,
      parameters,
      strengthVector,
      metadata: {
        generatedAt: new Date().toISOString(),
        parameterCount: parameters.length,
        totalExperience: cvAnalysis.totalExperience
      }
    };
  }

  /**
   * Calculates comprehensive matching between a CV and multiple job opportunities.
   * 
   * Methodology:
   * 1. For each job, computes parameter-by-parameter match scores
   * 2. Aggregates scores by category (technical, leadership, domain, soft skills)
   * 3. Identifies strengths (CV overqualified) and gaps (CV underqualified)
   * 4. Generates targeted recommendations for improvement
   * 
   * @param jobMatrix - Matrix containing analyzed job requirements and weights
   * @param cvMatrix - Matrix containing CV skills and strength levels
   * @returns Comprehensive match analysis with scores, recommendations, and insights
   */
  async calculateMatch(jobMatrix: JobMatrix, cvMatrix: CVMatrix): Promise<ComprehensiveMatch> {
    const matches: MatchResult[] = [];

    for (let jobIndex = 0; jobIndex < jobMatrix.jobs.length; jobIndex++) {
      const job = jobMatrix.jobs[jobIndex];
      const jobWeights = jobMatrix.weightMatrix[jobIndex];
      
      const matchResult = this.calculateJobCVMatch(
        job,
        jobWeights,
        jobMatrix.parameters,
        cvMatrix
      );
      
      matches.push(matchResult);
    }

    // Sort matches by overall score (best first)
    matches.sort((a, b) => b.overallScore - a.overallScore);

    // Calculate summary statistics
    const averageScore = matches.reduce((sum, match) => sum + match.overallScore, 0) / matches.length;
    const bestMatch = matches[0];
    
    // Identify top skills (skills that consistently score well)
    const topSkills = this.identifyTopSkills(matches, cvMatrix);
    
    // Identify common gaps (parameters that consistently have low scores)
    const commonGaps = this.identifyCommonGaps(matches);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(matches, cvMatrix, commonGaps);

    return {
      cvId: cvMatrix.cvAnalysis.cvId,
      totalJobs: jobMatrix.jobs.length,
      matches,
      summary: {
        averageScore,
        bestMatch,
        topSkills,
        commonGaps,
        recommendations
      },
      generatedAt: new Date().toISOString()
    };
  }

  private calculateJobCVMatch(
    job: JobAnalysis,
    jobWeights: number[],
    jobParameters: string[],
    cvMatrix: CVMatrix
  ): MatchResult {
    const parameterMatches: Array<{
      parameter: string;
      jobWeight: number;
      cvStrength: number;
      matchScore: number;
    }> = [];

    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    const categoryScores = {
      technical: 0,
      leadership: 0,
      domain: 0,
      soft: 0
    };
    
    const categoryCounts = {
      technical: 0,
      leadership: 0,
      domain: 0,
      soft: 0
    };

    // Calculate match for each parameter
    for (let i = 0; i < jobParameters.length; i++) {
      const parameter = jobParameters[i];
      const jobWeight = jobWeights[i];
      
      if (jobWeight === 0) continue; // Skip parameters not relevant to this job
      
      // Find corresponding CV strength
      const cvParamIndex = cvMatrix.parameters.indexOf(parameter);
      const cvStrength = cvParamIndex >= 0 ? cvMatrix.strengthVector[cvParamIndex] : 0;
      
      // Calculate match score (considering both job weight and CV strength)
      const matchScore = this.calculateParameterMatch(jobWeight, cvStrength);
      
      parameterMatches.push({
        parameter,
        jobWeight,
        cvStrength,
        matchScore
      });
      
      // Accumulate weighted score
      totalWeightedScore += matchScore * jobWeight;
      totalWeight += jobWeight;
      
      // Accumulate category scores
      const jobParam = job.parameters.find(p => p.name === parameter);
      if (jobParam) {
        const category = jobParam.category as keyof typeof categoryScores;
        if (categoryScores.hasOwnProperty(category)) {
          categoryScores[category] += matchScore;
          categoryCounts[category]++;
        }
      }
    }

    // Calculate overall score
    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Calculate average category scores
    Object.keys(categoryScores).forEach(category => {
      const key = category as keyof typeof categoryScores;
      const count = categoryCounts[key];
      categoryScores[key] = count > 0 ? categoryScores[key] / count : 0;
    });

    // Identify strengths and gaps
    const strengths = parameterMatches
      .filter(pm => pm.matchScore > 0.7 && pm.jobWeight > 0.5)
      .map(pm => pm.parameter)
      .slice(0, 5);

    const gaps = parameterMatches
      .filter(pm => pm.matchScore < 0.3 && pm.jobWeight > 0.6)
      .map(pm => pm.parameter)
      .slice(0, 5);

    // Generate recommendations for this specific job
    const recommendations = this.generateJobSpecificRecommendations(
      parameterMatches,
      job,
      cvMatrix.cvAnalysis
    );

    return {
      jobId: job.jobId || job.title,
      jobTitle: job.title,
      company: job.company,
      overallScore,
      categoryScores,
      strengths,
      gaps,
      recommendations,
      details: {
        parameterMatches: parameterMatches
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10) // Top 10 parameter matches
      }
    };
  }

  /**
   * Core algorithm for calculating parameter-level match scores.
   * 
   * Algorithm:
   * - Base match = min(cvStrength / jobWeight, 1.0)
   * - Applies overqualification bonus (+0.1) when CV exceeds requirements
   * - Returns 0.0 for critical gaps (CV=0, job requirement > 0.3)
   * - Returns 1.0 for perfect matches or when job doesn't require the parameter
   * 
   * @param jobWeight - How important this parameter is for the job (0-1)
   * @param cvStrength - How strong the CV is in this parameter (0-1)
   * @returns Match score between 0-1, where 1 is perfect match
   */
  private calculateParameterMatch(jobWeight: number, cvStrength: number): number {
    // If job doesn't care about this parameter (weight = 0), perfect match
    if (jobWeight === 0) return 1.0;
    
    // If CV has no strength in this area but job requires it, poor match
    if (cvStrength === 0 && jobWeight > 0.3) return 0.0;
    
    // Calculate match based on how well CV strength satisfies job requirement
    // This creates a curve where:
    // - High CV strength + High job weight = excellent match
    // - Low CV strength + Low job weight = good match  
    // - High CV strength + Low job weight = good match (overqualified but fine)
    // - Low CV strength + High job weight = poor match
    
    const baseMatch = Math.min(cvStrength / jobWeight, 1.0);
    
    // Bonus for exceeding requirements (but capped)
    const bonus = cvStrength > jobWeight ? 0.1 : 0;
    
    return Math.min(1.0, baseMatch + bonus);
  }

  private identifyTopSkills(matches: MatchResult[], cvMatrix: CVMatrix): string[] {
    const skillScores: Record<string, number[]> = {};
    
    // Collect scores for each skill across all jobs
    matches.forEach(match => {
      match.details.parameterMatches.forEach(pm => {
        if (!skillScores[pm.parameter]) {
          skillScores[pm.parameter] = [];
        }
        skillScores[pm.parameter].push(pm.matchScore);
      });
    });
    
    // Calculate average score for each skill
    const avgSkillScores = Object.entries(skillScores)
      .map(([skill, scores]) => ({
        skill,
        avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        cvStrength: cvMatrix.parameters.includes(skill) ? 
          cvMatrix.strengthVector[cvMatrix.parameters.indexOf(skill)] : 0
      }))
      .filter(item => item.avgScore > 0.6 && item.cvStrength > 0.5) // Only include strong matches
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8)
      .map(item => item.skill);
    
    return avgSkillScores;
  }

  private identifyCommonGaps(matches: MatchResult[]): string[] {
    const gapCounts: Record<string, number> = {};
    
    // Count how often each parameter appears as a gap
    matches.forEach(match => {
      match.gaps.forEach(gap => {
        gapCounts[gap] = (gapCounts[gap] || 0) + 1;
      });
    });
    
    // Return parameters that are gaps in at least 30% of jobs
    const threshold = Math.ceil(matches.length * 0.3);
    
    return Object.entries(gapCounts)
      .filter(([, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([gap]) => gap);
  }

  private generateRecommendations(
    matches: MatchResult[],
    cvMatrix: CVMatrix,
    commonGaps: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Recommendations based on common gaps
    if (commonGaps.length > 0) {
      recommendations.push(
        `Consider adding experience with: ${commonGaps.slice(0, 3).join(', ')} - these skills are frequently required but missing from your CV`
      );
    }
    
    // Seniority-based recommendations
    const avgSeniority = this.calculateAverageJobSeniority(matches);
    const cvSeniority = cvMatrix.cvAnalysis.seniorityLevel;
    
    if (this.getSeniorityLevel(avgSeniority) > this.getSeniorityLevel(cvSeniority)) {
      recommendations.push(
        'Consider emphasizing leadership experience and strategic initiatives to match the seniority level of target positions'
      );
    }
    
    // Category-based recommendations
    const weakestCategory = this.identifyWeakestCategory(matches);
    if (weakestCategory) {
      recommendations.push(
        `Focus on strengthening ${weakestCategory} skills to improve overall job matches`
      );
    }
    
    // Score-based recommendations
    const avgScore = matches.reduce((sum, match) => sum + match.overallScore, 0) / matches.length;
    if (avgScore < 0.6) {
      recommendations.push(
        'Consider targeting roles that better align with your current skillset, or focus on developing the most commonly required skills'
      );
    }
    
    return recommendations.slice(0, 5);
  }

  private generateJobSpecificRecommendations(
    parameterMatches: Array<{parameter: string, jobWeight: number, cvStrength: number, matchScore: number}>,
    job: JobAnalysis,
    cvAnalysis: CVAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    // Find high-value gaps (high job weight, low CV strength)
    const highValueGaps = parameterMatches
      .filter(pm => pm.jobWeight > 0.7 && pm.cvStrength < 0.3)
      .sort((a, b) => b.jobWeight - a.jobWeight)
      .slice(0, 3);
    
    if (highValueGaps.length > 0) {
      recommendations.push(
        `For this role, prioritize gaining experience in: ${highValueGaps.map(g => g.parameter).join(', ')}`
      );
    }
    
    // Seniority mismatch
    const jobSeniorityLevel = this.getSeniorityLevel(job.seniorityLevel);
    const cvSeniorityLevel = this.getSeniorityLevel(cvAnalysis.seniorityLevel);
    
    if (jobSeniorityLevel > cvSeniorityLevel + 1) {
      recommendations.push(
        'This role requires more senior experience - consider highlighting leadership achievements and strategic impact'
      );
    }
    
    return recommendations.slice(0, 3);
  }

  private calculateAverageJobSeniority(matches: MatchResult[]): string {
    // This would need to access job data - simplified for now
    return 'senior';
  }

  private getSeniorityLevel(seniority: string): number {
    const levels = ['junior', 'mid', 'senior', 'lead', 'director', 'executive'];
    return levels.indexOf(seniority);
  }

  private identifyWeakestCategory(matches: MatchResult[]): string | null {
    const categoryAverages = {
      technical: 0,
      leadership: 0,
      domain: 0,
      soft: 0
    };
    
    // Calculate average scores for each category
    matches.forEach(match => {
      Object.keys(categoryAverages).forEach(category => {
        const key = category as keyof typeof categoryAverages;
        categoryAverages[key] += match.categoryScores[key];
      });
    });
    
    Object.keys(categoryAverages).forEach(category => {
      const key = category as keyof typeof categoryAverages;
      categoryAverages[key] /= matches.length;
    });
    
    // Find the category with the lowest average score
    const weakest = Object.entries(categoryAverages)
      .sort((a, b) => a[1] - b[1])[0];
    
    return weakest[1] < 0.5 ? weakest[0] : null;
  }
}