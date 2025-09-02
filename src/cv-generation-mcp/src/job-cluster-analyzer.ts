export interface JobCluster {
  id: string;
  name: string;
  description: string;
  jobs: Array<{
    jobId: string;
    title: string;
    company: string;
    score: number;
  }>;
  commonRequirements: string[];
  keySkills: string[];
  averageScore: number;
  clusterSize: number;
  characteristics: {
    seniorityLevel: string;
    industryFocus: string;
    technicalDepth: 'high' | 'medium' | 'low';
    leadershipEmphasis: 'high' | 'medium' | 'low';
    customerFacing: boolean;
  };
  optimizationPotential: number; // 0-1, how much CV improvement could help
}

export interface ClusterAnalysis {
  clusters: JobCluster[];
  totalJobs: number;
  recommendedStrategy: string;
  priorityOrder: string[]; // Cluster IDs in order of optimization priority
  insights: string[];
}

export class JobClusterAnalyzer {
  // Job classification patterns
  private readonly jobPatterns = {
    'ai_innovation': {
      titleKeywords: ['ai', 'ml', 'genai', 'machine learning', 'data science', 'artificial intelligence'],
      companyKeywords: ['scale', 'openai', 'anthropic', 'ai', 'data', 'analytics'],
      requirements: ['python', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'deep learning']
    },
    'ecommerce_technical': {
      titleKeywords: ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'commerce'],
      companyKeywords: ['shopify', 'amazon', 'ebay', 'commerce', 'retail'],
      requirements: ['microservices', 'kubernetes', 'aws', 'apis', 'scalability', 'cloud']
    },
    'enterprise_leadership': {
      titleKeywords: ['director', 'head of', 'vp', 'chief', 'executive'],
      companyKeywords: ['enterprise', 'consulting', 'corporation', 'group'],
      requirements: ['leadership', 'strategy', 'transformation', 'scaling', 'budget', 'vision']
    },
    'technical_leadership': {
      titleKeywords: ['technical lead', 'architect', 'principal', 'staff engineer'],
      companyKeywords: ['tech', 'software', 'engineering'],
      requirements: ['architecture', 'system design', 'technical vision', 'mentoring']
    },
    'startup_growth': {
      titleKeywords: ['startup', 'growth', 'scale', 'founding'],
      companyKeywords: ['startup', 'series', 'venture', 'early stage'],
      requirements: ['agility', 'mvp', 'rapid development', 'resource constraints']
    }
  };

  // Industry classification
  private readonly industryPatterns = {
    'technology': ['tech', 'software', 'platform', 'saas', 'ai', 'data'],
    'finance': ['bank', 'finance', 'fintech', 'payment', 'trading'],
    'healthcare': ['health', 'medical', 'pharma', 'biotech', 'clinical'],
    'retail': ['retail', 'commerce', 'shopping', 'marketplace', 'consumer'],
    'consulting': ['consulting', 'advisory', 'services', 'professional']
  };

  /**
   * Identifies distinct job clusters using pattern-based classification.
   * 
   * Algorithm:
   * 1. Classifies each job using keyword matching against predefined patterns
   * 2. Groups jobs by dominant cluster (highest confidence score)
   * 3. Analyzes cluster characteristics (seniority, industry, technical depth)
   * 4. Calculates optimization potential based on current CV scores and cluster requirements
   * 5. Generates strategic recommendations and insights
   * 
   * @param jobMatches - Array of job match results from matrix analysis
   * @returns Comprehensive cluster analysis with strategy and insights
   */
  async identifyClusters(jobMatches: any[]): Promise<ClusterAnalysis> {
    // 1. Classify each job into potential clusters
    const jobClassifications = jobMatches.map(job => ({
      job,
      clusters: this.classifyJob(job)
    }));

    // 2. Group jobs by dominant cluster
    const clusterGroups = this.groupJobsByClusters(jobClassifications);

    // 3. Analyze each cluster
    const clusters = await Promise.all(
      Object.entries(clusterGroups).map(([clusterId, jobs]) => 
        this.analyzeCluster(clusterId, jobs)
      )
    );

    // 4. Filter out small clusters (less than 1 job)
    const significantClusters = clusters.filter(cluster => cluster.clusterSize >= 1);

    // 5. Calculate optimization strategy
    const priorityOrder = this.calculateOptimizationPriority(significantClusters);
    const recommendedStrategy = this.generateRecommendedStrategy(significantClusters, jobMatches);
    const insights = this.generateInsights(significantClusters, jobMatches);

    return {
      clusters: significantClusters,
      totalJobs: jobMatches.length,
      recommendedStrategy,
      priorityOrder,
      insights
    };
  }

  private classifyJob(jobMatch: any): Array<{clusterId: string, confidence: number}> {
    const job = jobMatch;
    const title = (job.jobTitle || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    const requirements = (job.gaps || []).concat(job.strengths || []).map((r: string) => r.toLowerCase());

    const classifications: Array<{clusterId: string, confidence: number}> = [];

    // Score each potential cluster
    for (const [clusterId, pattern] of Object.entries(this.jobPatterns)) {
      let score = 0;
      let totalPossible = 0;

      // Title matching
      const titleMatches = pattern.titleKeywords.filter(keyword => title.includes(keyword)).length;
      score += titleMatches * 0.4;
      totalPossible += pattern.titleKeywords.length * 0.4;

      // Company matching
      const companyMatches = pattern.companyKeywords.filter(keyword => company.includes(keyword)).length;
      score += companyMatches * 0.3;
      totalPossible += pattern.companyKeywords.length * 0.3;

      // Requirements matching
      const reqMatches = pattern.requirements.filter(req => 
        requirements.some((r: string) => r.includes(req.toLowerCase()))
      ).length;
      score += reqMatches * 0.3;
      totalPossible += pattern.requirements.length * 0.3;

      // Calculate confidence
      const confidence = totalPossible > 0 ? score / totalPossible : 0;
      
      if (confidence > 0.1) { // Only include if some relevance
        classifications.push({ clusterId, confidence });
      }
    }

    // Sort by confidence
    return classifications.sort((a, b) => b.confidence - a.confidence);
  }

  private groupJobsByClusters(jobClassifications: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const classification of jobClassifications) {
      // Assign to highest confidence cluster, or 'uncategorized' if no strong match
      const primaryCluster = classification.clusters[0];
      const clusterId = (primaryCluster && primaryCluster.confidence > 0.3) 
        ? primaryCluster.clusterId 
        : 'uncategorized';

      if (!groups[clusterId]) {
        groups[clusterId] = [];
      }
      groups[clusterId].push(classification.job);
    }

    return groups;
  }

  private async analyzeCluster(clusterId: string, jobs: any[]): Promise<JobCluster> {
    const clusterInfo = this.getClusterInfo(clusterId);
    
    // Extract common requirements
    const allRequirements = jobs.flatMap(job => (job.gaps || []).concat(job.strengths || []));
    const requirementCounts = this.countOccurrences(allRequirements);
    const commonRequirements = Object.entries(requirementCounts)
      .filter(([, count]) => count >= Math.ceil(jobs.length * 0.5)) // Appears in 50%+ of jobs
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([req]) => req);

    // Extract key skills (from strengths, more frequently)
    const allStrengths = jobs.flatMap(job => job.strengths || []);
    const strengthCounts = this.countOccurrences(allStrengths);
    const keySkills = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill]) => skill);

    // Calculate average score
    const averageScore = jobs.reduce((sum, job) => sum + (job.overallScore || 0), 0) / jobs.length;

    // Analyze cluster characteristics
    const characteristics = this.analyzeClusterCharacteristics(jobs, clusterId);

    // Calculate optimization potential
    const optimizationPotential = this.calculateOptimizationPotential(jobs, averageScore, commonRequirements);

    return {
      id: clusterId,
      name: clusterInfo.name,
      description: clusterInfo.description,
      jobs: jobs.map(job => ({
        jobId: job.jobId || job.jobTitle,
        title: job.jobTitle,
        company: job.company,
        score: job.overallScore || 0
      })),
      commonRequirements,
      keySkills,
      averageScore,
      clusterSize: jobs.length,
      characteristics,
      optimizationPotential
    };
  }

  private getClusterInfo(clusterId: string): {name: string, description: string} {
    const clusterInfo: Record<string, {name: string, description: string}> = {
      'ai_innovation': {
        name: 'AI/ML Innovation',
        description: 'Roles focused on artificial intelligence, machine learning, and generative AI applications'
      },
      'ecommerce_technical': {
        name: 'E-commerce Technical Leadership',
        description: 'Technical leadership roles in e-commerce platforms and scalable commerce systems'
      },
      'enterprise_leadership': {
        name: 'Enterprise Leadership',
        description: 'Senior leadership positions in large enterprises focused on strategic transformation'
      },
      'technical_leadership': {
        name: 'Technical Leadership',
        description: 'Technical leadership roles focused on architecture, system design, and engineering excellence'
      },
      'startup_growth': {
        name: 'Startup Growth',
        description: 'Growth-stage startup roles requiring agility, rapid development, and scaling'
      },
      'uncategorized': {
        name: 'General Technical Roles',
        description: 'Technical roles that don\'t fit clearly into other categories'
      }
    };

    return clusterInfo[clusterId] || { name: clusterId, description: 'Specialized technical roles' };
  }

  private countOccurrences(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const normalized = item.toLowerCase().trim();
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }

  private analyzeClusterCharacteristics(jobs: any[], clusterId: string): JobCluster['characteristics'] {
    // Analyze seniority level
    const titles = jobs.map(job => job.jobTitle?.toLowerCase() || '');
    const seniorityLevel = this.determineSeniorityLevel(titles);

    // Determine industry focus
    const companies = jobs.map(job => job.company?.toLowerCase() || '');
    const industryFocus = this.determineIndustryFocus(companies);

    // Assess technical depth
    const technicalTerms = ['architecture', 'system design', 'algorithms', 'performance', 'scalability'];
    const allRequirements = jobs.flatMap(job => (job.gaps || []).concat(job.strengths || []));
    const technicalDepth = this.assessTechnicalDepth(allRequirements, technicalTerms);

    // Assess leadership emphasis
    const leadershipTerms = ['team', 'lead', 'manage', 'mentor', 'strategy', 'vision'];
    const leadershipEmphasis = this.assessLeadershipEmphasis(allRequirements, leadershipTerms);

    // Determine if customer-facing
    const customerFacing = this.isCustomerFacing(jobs, clusterId);

    return {
      seniorityLevel,
      industryFocus,
      technicalDepth,
      leadershipEmphasis,
      customerFacing
    };
  }

  private determineSeniorityLevel(titles: string[]): string {
    const seniorityKeywords = {
      'Executive': ['cto', 'vp', 'chief', 'executive'],
      'Director': ['director', 'head of'],
      'Manager': ['manager', 'lead manager'],
      'Lead': ['lead', 'principal', 'staff'],
      'Senior': ['senior', 'sr.']
    };

    for (const [level, keywords] of Object.entries(seniorityKeywords)) {
      if (titles.some(title => keywords.some(keyword => title.includes(keyword)))) {
        return level;
      }
    }

    return 'Senior';
  }

  private determineIndustryFocus(companies: string[]): string {
    for (const [industry, keywords] of Object.entries(this.industryPatterns)) {
      if (companies.some(company => keywords.some(keyword => company.includes(keyword)))) {
        return industry;
      }
    }
    return 'technology';
  }

  private assessTechnicalDepth(requirements: string[], technicalTerms: string[]): 'high' | 'medium' | 'low' {
    const technicalCount = requirements.filter(req => 
      technicalTerms.some(term => req.toLowerCase().includes(term))
    ).length;

    const ratio = technicalCount / Math.max(requirements.length, 1);
    
    if (ratio > 0.4) return 'high';
    if (ratio > 0.2) return 'medium';
    return 'low';
  }

  private assessLeadershipEmphasis(requirements: string[], leadershipTerms: string[]): 'high' | 'medium' | 'low' {
    const leadershipCount = requirements.filter(req => 
      leadershipTerms.some(term => req.toLowerCase().includes(term))
    ).length;

    const ratio = leadershipCount / Math.max(requirements.length, 1);
    
    if (ratio > 0.3) return 'high';
    if (ratio > 0.15) return 'medium';
    return 'low';
  }

  private isCustomerFacing(jobs: any[], clusterId: string): boolean {
    const customerKeywords = ['customer', 'client', 'deployed', 'forward deployed', 'field'];
    const allText = jobs.map(job => 
      `${job.jobTitle} ${job.company} ${(job.gaps || []).join(' ')} ${(job.strengths || []).join(' ')}`
    ).join(' ').toLowerCase();

    return customerKeywords.some(keyword => allText.includes(keyword));
  }

  private calculateOptimizationPotential(jobs: any[], averageScore: number, requirements: string[]): number {
    // Higher potential if:
    // 1. Current scores are low (more room for improvement)
    // 2. Clear, actionable requirements
    // 3. Multiple jobs in cluster

    const scorePotential = Math.max(0, (0.7 - averageScore) / 0.7); // Assume 70% is good target
    const requirementClarity = Math.min(1, requirements.length / 5); // More requirements = clearer optimization path
    const clusterSize = Math.min(1, jobs.length / 3); // More jobs = more value from optimization

    return (scorePotential * 0.5) + (requirementClarity * 0.3) + (clusterSize * 0.2);
  }

  private calculateOptimizationPriority(clusters: JobCluster[]): string[] {
    return clusters
      .sort((a, b) => {
        // Priority formula: (optimization potential * cluster size) + (1 - average score)
        const aPriority = (a.optimizationPotential * a.clusterSize) + (1 - a.averageScore);
        const bPriority = (b.optimizationPotential * b.clusterSize) + (1 - b.averageScore);
        return bPriority - aPriority;
      })
      .map(cluster => cluster.id);
  }

  private generateRecommendedStrategy(clusters: JobCluster[], allJobs: any[]): string {
    if (clusters.length === 0) {
      return 'Focus on general CV improvements targeting technical leadership roles.';
    }

    const topCluster = clusters.sort((a, b) => b.optimizationPotential - a.optimizationPotential)[0];
    const totalJobs = allJobs.length;
    const clusteredJobs = clusters.reduce((sum, cluster) => sum + cluster.clusterSize, 0);

    if (clusteredJobs / totalJobs > 0.7) {
      return `Strong clustering detected. Recommend creating ${clusters.length} targeted CV variants, starting with "${topCluster.name}" cluster (${topCluster.clusterSize} jobs, ${(topCluster.optimizationPotential * 100).toFixed(0)}% optimization potential).`;
    } else {
      return `Mixed job landscape. Focus on optimizing for "${topCluster.name}" cluster first, then create a general-purpose variant for remaining positions.`;
    }
  }

  private generateInsights(clusters: JobCluster[], allJobs: any[]): string[] {
    const insights: string[] = [];

    // Cluster distribution insight
    if (clusters.length > 3) {
      insights.push(`Job opportunities span ${clusters.length} distinct clusters, suggesting diverse career options.`);
    } else if (clusters.length <= 2) {
      insights.push(`Jobs concentrate in ${clusters.length} main areas, allowing for focused CV optimization.`);
    }

    // Score insights
    const avgScore = allJobs.reduce((sum, job) => sum + (job.overallScore || 0), 0) / allJobs.length;
    if (avgScore < 0.4) {
      insights.push(`Current CV scores below 40% average - significant optimization opportunity exists.`);
    } else if (avgScore > 0.7) {
      insights.push(`Strong CV alignment (${(avgScore * 100).toFixed(0)}% average) - minor optimizations needed.`);
    }

    // Top cluster insight
    const topCluster = clusters.sort((a, b) => b.clusterSize - a.clusterSize)[0];
    if (topCluster) {
      insights.push(`"${topCluster.name}" represents ${topCluster.clusterSize} jobs (${((topCluster.clusterSize / allJobs.length) * 100).toFixed(0)}%) - highest optimization impact.`);
    }

    // Skills gap insight
    const commonGaps = allJobs.flatMap(job => job.gaps || []);
    const gapCounts = this.countOccurrences(commonGaps);
    const topGap = Object.entries(gapCounts).sort((a, b) => b[1] - a[1])[0];
    if (topGap && topGap[1] > allJobs.length * 0.4) {
      insights.push(`"${topGap[0]}" appears as a gap in ${topGap[1]} jobs - priority skill for CV enhancement.`);
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  }
}