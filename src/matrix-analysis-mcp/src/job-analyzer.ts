export interface JobParameter {
  name: string;
  category: 'technical' | 'leadership' | 'domain' | 'soft' | 'location' | 'company';
  weight: number; // 0-1, where 1 is most important
  value: string;
  confidence: number; // 0-1, how confident we are about this parameter
}

export interface JobAnalysis {
  jobId?: string;
  title: string;
  company: string;
  parameters: JobParameter[];
  keyRequirements: string[];
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'executive';
  analysisMetadata: {
    analyzedAt: string;
    parameterCount: number;
    primaryCategory: string;
  };
}

export class JobAnalyzer {
  // Technical skills with relative importance weights
  private readonly technicalSkills = {
    // Programming Languages
    'javascript': 0.8, 'typescript': 0.85, 'python': 0.8, 'java': 0.7, 'golang': 0.75,
    'c#': 0.7, 'c++': 0.7, 'php': 0.6, 'ruby': 0.6, 'scala': 0.6, 'kotlin': 0.6,
    
    // Cloud & Infrastructure
    'aws': 0.9, 'azure': 0.9, 'gcp': 0.85, 'kubernetes': 0.9, 'docker': 0.85,
    'terraform': 0.8, 'helm': 0.7, 'ansible': 0.7,
    
    // Databases
    'mongodb': 0.7, 'postgresql': 0.75, 'mysql': 0.7, 'redis': 0.6, 'elasticsearch': 0.7,
    
    // Frameworks & Tools
    'react': 0.8, 'angular': 0.7, 'vue': 0.7, 'node.js': 0.8, 'express': 0.6,
    'gitlab': 0.7, 'jenkins': 0.7, 'grafana': 0.6, 'prometheus': 0.6,
    
    // Architectures
    'microservices': 0.85, 'api': 0.8, 'rest': 0.7, 'graphql': 0.6, 'oauth2': 0.6,
    'ci/cd': 0.85, 'devops': 0.8
  };

  private readonly leadershipTerms = {
    'lead': 0.9, 'manage': 0.85, 'mentor': 0.8, 'coach': 0.7, 'supervise': 0.75,
    'team building': 0.8, 'hiring': 0.7, 'performance management': 0.75,
    'strategic': 0.85, 'vision': 0.8, 'roadmap': 0.75
  };

  private readonly domainTerms = {
    'adtech': 0.8, 'medtech': 0.8, 'fintech': 0.8, 'e-commerce': 0.7,
    'healthcare': 0.8, 'education': 0.7, 'automotive': 0.7, 'gaming': 0.6
  };

  async analyzeJob(jobData: any): Promise<JobAnalysis> {
    const text = `${jobData.title} ${jobData.description}`.toLowerCase();
    const parameters: JobParameter[] = [];

    // Extract technical parameters
    parameters.push(...this.extractTechnicalParameters(text));
    
    // Extract leadership parameters
    parameters.push(...this.extractLeadershipParameters(text));
    
    // Extract domain parameters
    parameters.push(...this.extractDomainParameters(text));
    
    // Extract soft skills
    parameters.push(...this.extractSoftSkills(text));
    
    // Add location and company parameters
    if (jobData.location) {
      parameters.push({
        name: 'location',
        category: 'location',
        weight: this.calculateLocationWeight(jobData.location),
        value: jobData.location,
        confidence: 1.0
      });
    }

    parameters.push({
      name: 'company_size',
      category: 'company',
      weight: this.estimateCompanyWeight(jobData.company),
      value: jobData.company,
      confidence: 0.7
    });

    // Determine seniority level
    const seniorityLevel = this.determineSeniorityLevel(text, jobData.title);
    
    // Extract key requirements
    const keyRequirements = this.extractKeyRequirements(jobData.description);

    // Apply seniority-based weight adjustments
    this.adjustWeightsForSeniority(parameters, seniorityLevel);

    return {
      jobId: jobData.jobId,
      title: jobData.title,
      company: jobData.company,
      parameters: parameters.sort((a, b) => b.weight - a.weight), // Sort by weight descending
      keyRequirements,
      seniorityLevel,
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        parameterCount: parameters.length,
        primaryCategory: this.determinePrimaryCategory(parameters)
      }
    };
  }

  private extractTechnicalParameters(text: string): JobParameter[] {
    const parameters: JobParameter[] = [];
    
    for (const [skill, baseWeight] of Object.entries(this.technicalSkills)) {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        const frequency = matches.length;
        const confidence = Math.min(0.9, 0.6 + (frequency * 0.1));
        
        parameters.push({
          name: skill,
          category: 'technical',
          weight: baseWeight * this.calculateFrequencyMultiplier(frequency),
          value: skill,
          confidence
        });
      }
    }
    
    return parameters;
  }

  private extractLeadershipParameters(text: string): JobParameter[] {
    const parameters: JobParameter[] = [];
    
    for (const [term, baseWeight] of Object.entries(this.leadershipTerms)) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        parameters.push({
          name: term.replace(' ', '_'),
          category: 'leadership',
          weight: baseWeight,
          value: term,
          confidence: 0.8
        });
      }
    }

    // Special patterns for team size
    const teamSizeMatch = text.match(/(\d+)\+?\s*(?:member|people|developer|engineer)/i);
    if (teamSizeMatch) {
      const teamSize = parseInt(teamSizeMatch[1]);
      parameters.push({
        name: 'team_size',
        category: 'leadership',
        weight: Math.min(0.9, 0.6 + (teamSize / 50)), // Larger teams = higher weight
        value: `${teamSize}+ team members`,
        confidence: 0.9
      });
    }

    return parameters;
  }

  private extractDomainParameters(text: string): JobParameter[] {
    const parameters: JobParameter[] = [];
    
    for (const [domain, weight] of Object.entries(this.domainTerms)) {
      if (text.includes(domain)) {
        parameters.push({
          name: domain,
          category: 'domain',
          weight,
          value: domain,
          confidence: 0.8
        });
      }
    }
    
    return parameters;
  }

  private extractSoftSkills(text: string): JobParameter[] {
    const softSkills = {
      'communication': 0.7, 'collaboration': 0.6, 'problem solving': 0.7,
      'analytical': 0.7, 'creative': 0.5, 'agile': 0.8, 'scrum': 0.7
    };

    const parameters: JobParameter[] = [];
    
    for (const [skill, weight] of Object.entries(softSkills)) {
      if (text.includes(skill)) {
        parameters.push({
          name: skill.replace(' ', '_'),
          category: 'soft',
          weight,
          value: skill,
          confidence: 0.6
        });
      }
    }
    
    return parameters;
  }

  private determineSeniorityLevel(text: string, title: string): JobAnalysis['seniorityLevel'] {
    const seniorityKeywords = {
      'executive': ['cto', 'ceo', 'vp', 'vice president'],
      'director': ['director', 'head of'],
      'lead': ['lead', 'principal', 'staff', 'architect'],
      'senior': ['senior', 'sr.', 'expert'],
      'mid': ['mid', 'intermediate'],
      'junior': ['junior', 'jr.', 'entry', 'graduate']
    };

    const titleLower = title.toLowerCase();
    
    for (const [level, keywords] of Object.entries(seniorityKeywords)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return level as JobAnalysis['seniorityLevel'];
      }
    }

    // Default based on years of experience mentioned
    const yearsMatch = text.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 10) return 'director';
      if (years >= 7) return 'lead';
      if (years >= 4) return 'senior';
      if (years >= 2) return 'mid';
      return 'junior';
    }

    return 'mid'; // Default
  }

  private extractKeyRequirements(description: string): string[] {
    const requirements: string[] = [];
    
    // Look for bulleted lists and "must have" sections
    const bulletPattern = /[•·▪▫-]\s*([^\n•·▪▫-]+)/g;
    const mustHavePattern = /(?:must have|required|essential)[:\s]*([^]*?)(?:\n\n|\n[A-Z]|$)/i;
    
    let match;
    while ((match = bulletPattern.exec(description)) !== null) {
      const requirement = match[1].trim();
      if (requirement.length > 10 && requirement.length < 200) {
        requirements.push(requirement);
      }
    }

    const mustHaveMatch = mustHavePattern.exec(description);
    if (mustHaveMatch) {
      const mustHaveText = mustHaveMatch[1];
      requirements.push(...mustHaveText.split('\n').map(r => r.trim()).filter(r => r.length > 10));
    }

    return requirements.slice(0, 10); // Limit to top 10
  }

  private calculateLocationWeight(location: string): number {
    const remote = location.toLowerCase().includes('remote');
    const berlin = location.toLowerCase().includes('berlin');
    const germany = location.toLowerCase().includes('germany');
    
    if (remote) return 0.9; // High preference for remote
    if (berlin) return 0.8;  // High preference for Berlin
    if (germany) return 0.7; // Good for Germany
    return 0.5; // Other locations
  }

  private estimateCompanyWeight(company: string): number {
    // This could be enhanced with a company database
    // For now, use simple heuristics
    const companyLower = company.toLowerCase();
    
    if (companyLower.includes('startup')) return 0.6;
    if (companyLower.includes('gmbh')) return 0.7; // German companies
    if (companyLower.length > 20) return 0.5; // Very long names might be less established
    
    return 0.6; // Default company weight
  }

  private calculateFrequencyMultiplier(frequency: number): number {
    // More mentions = higher importance, but with diminishing returns
    return Math.min(1.2, 1 + (frequency - 1) * 0.1);
  }

  private adjustWeightsForSeniority(parameters: JobParameter[], seniority: JobAnalysis['seniorityLevel']) {
    const adjustments = {
      'junior': { technical: 1.1, leadership: 0.7 },
      'mid': { technical: 1.0, leadership: 0.8 },
      'senior': { technical: 0.9, leadership: 0.9 },
      'lead': { technical: 0.8, leadership: 1.1 },
      'director': { technical: 0.7, leadership: 1.2 },
      'executive': { technical: 0.6, leadership: 1.3 }
    };

    const adjustment = adjustments[seniority];
    
    parameters.forEach(param => {
      if (param.category === 'technical') {
        param.weight *= adjustment.technical;
      } else if (param.category === 'leadership') {
        param.weight *= adjustment.leadership;
      }
      
      // Ensure weight stays within bounds
      param.weight = Math.min(1.0, Math.max(0.0, param.weight));
    });
  }

  private determinePrimaryCategory(parameters: JobParameter[]): string {
    const categoryWeights = parameters.reduce((acc, param) => {
      acc[param.category] = (acc[param.category] || 0) + param.weight;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryWeights)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'technical';
  }
}