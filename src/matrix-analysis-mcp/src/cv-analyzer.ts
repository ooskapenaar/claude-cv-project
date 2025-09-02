import { JobParameter } from './job-analyzer.js';

export interface CVParameter {
  name: string;
  category: 'technical' | 'leadership' | 'domain' | 'soft' | 'experience' | 'education';
  strength: number; // 0-1, how strong this skill/experience is in the CV
  value: string;
  evidence: string[]; // Supporting evidence from CV
  yearsOfExperience?: number;
}

export interface CVAnalysis {
  cvId: string;
  totalExperience: number; // Years
  parameters: CVParameter[];
  keyStrengths: string[];
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'executive';
  currentRole?: string;
  analysisMetadata: {
    analyzedAt: string;
    parameterCount: number;
    strongestCategory: string;
  };
}

export class CVAnalyzer {
  // Technical skills mapping with strength indicators
  private readonly technicalSkills = {
    // Programming Languages
    'javascript': ['js', 'javascript', 'node.js', 'nodejs'],
    'typescript': ['typescript', 'ts'],
    'python': ['python', 'django', 'flask', 'pandas'],
    'java': ['java', 'spring', 'hibernate'],
    'golang': ['golang', 'go'],
    'c#': ['c#', 'csharp', '.net', 'dotnet'],
    'c++': ['c++', 'cpp'],
    'php': ['php', 'laravel', 'symfony'],
    
    // Cloud & Infrastructure  
    'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
    'azure': ['azure', 'az', 'azure kubernetes service', 'aks'],
    'gcp': ['gcp', 'google cloud', 'gke'],
    'kubernetes': ['kubernetes', 'k8s', 'kubectl'],
    'docker': ['docker', 'containerization'],
    'terraform': ['terraform', 'tf', 'infrastructure as code'],
    'helm': ['helm', 'helm charts'],
    
    // Databases
    'mongodb': ['mongodb', 'mongo', 'mongoose'],
    'postgresql': ['postgresql', 'postgres', 'psql'],
    'mysql': ['mysql'],
    'mssql': ['mssql', 'sql server'],
    'redis': ['redis'],
    
    // DevOps & Tools
    'gitlab': ['gitlab', 'gitlab ci'],
    'jenkins': ['jenkins'],
    'git': ['git', 'version control'],
    'grafana': ['grafana'],
    'jira': ['jira'],
    'confluence': ['confluence']
  };

  private readonly leadershipIndicators = [
    'led', 'managed', 'supervised', 'mentored', 'coached', 'directed',
    'spearheaded', 'orchestrated', 'oversaw', 'guided', 'built team',
    'scaled team', 'hired', 'recruited', 'performance management',
    'team lead', 'head of', 'director', 'cto', 'vp'
  ];

  private readonly domainExperience = {
    'adtech': ['adtech', 'advertising technology', 'programmatic', 'rtb', 'vast', 'vpaid'],
    'medtech': ['medtech', 'healthcare', 'medical', 'fhir', 'hl7', 'hipaa'],
    'fintech': ['fintech', 'financial', 'banking', 'payment', 'blockchain'],
    'ecommerce': ['e-commerce', 'ecommerce', 'retail', 'shopping', 'marketplace']
  };

  async analyzeCV(cvContent: string): Promise<CVAnalysis> {
    const parameters: CVParameter[] = [];
    
    // Extract technical parameters
    parameters.push(...this.extractTechnicalParameters(cvContent));
    
    // Extract leadership parameters  
    parameters.push(...this.extractLeadershipParameters(cvContent));
    
    // Extract domain parameters
    parameters.push(...this.extractDomainParameters(cvContent));
    
    // Extract soft skills
    parameters.push(...this.extractSoftSkills(cvContent));
    
    // Extract education parameters
    parameters.push(...this.extractEducation(cvContent));
    
    // Calculate total experience
    const totalExperience = this.calculateTotalExperience(cvContent);
    
    // Determine seniority level
    const seniorityLevel = this.determineSeniorityLevel(cvContent, totalExperience);
    
    // Extract key strengths
    const keyStrengths = this.extractKeyStrengths(parameters);
    
    // Get current role
    const currentRole = this.extractCurrentRole(cvContent);

    return {
      cvId: 'ronald-wertlen-2025', // Default, should be passed in
      totalExperience,
      parameters: parameters.sort((a, b) => b.strength - a.strength),
      keyStrengths,
      seniorityLevel,
      currentRole,
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        parameterCount: parameters.length,
        strongestCategory: this.determineStrongestCategory(parameters)
      }
    };
  }

  private extractTechnicalParameters(cvContent: string): CVParameter[] {
    const parameters: CVParameter[] = [];
    const lowerContent = cvContent.toLowerCase();
    
    for (const [skill, variants] of Object.entries(this.technicalSkills)) {
      const evidence: string[] = [];
      let maxStrength = 0;
      let yearsExperience = 0;
      
      for (const variant of variants) {
        const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = lowerContent.match(regex);
        
        if (matches) {
          // Find context around mentions
          const contexts = this.findContexts(cvContent, variant, 50);
          evidence.push(...contexts);
          
          // Calculate strength based on frequency and context
          const frequency = matches.length;
          const contextStrength = this.assessTechnicalContext(contexts);
          const calculatedStrength = Math.min(1.0, (frequency * 0.2) + contextStrength);
          
          maxStrength = Math.max(maxStrength, calculatedStrength);
          
          // Try to extract years of experience
          const years = this.extractYearsForSkill(contexts, variant);
          yearsExperience = Math.max(yearsExperience, years);
        }
      }
      
      if (maxStrength > 0.2) { // Only include if there's significant evidence
        parameters.push({
          name: skill,
          category: 'technical',
          strength: maxStrength,
          value: skill,
          evidence: evidence.slice(0, 3), // Top 3 pieces of evidence
          yearsOfExperience: yearsExperience || undefined
        });
      }
    }
    
    return parameters;
  }

  private extractLeadershipParameters(cvContent: string): CVParameter[] {
    const parameters: CVParameter[] = [];
    const evidence: string[] = [];
    
    for (const indicator of this.leadershipIndicators) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = cvContent.match(regex);
      
      if (matches) {
        const contexts = this.findContexts(cvContent, indicator, 100);
        evidence.push(...contexts);
      }
    }
    
    if (evidence.length > 0) {
      // Analyze team sizes mentioned
      const teamSizes = this.extractTeamSizes(cvContent);
      const leadershipYears = this.extractLeadershipYears(cvContent);
      
      parameters.push({
        name: 'team_leadership',
        category: 'leadership',
        strength: Math.min(1.0, 0.5 + (evidence.length * 0.1)),
        value: 'Team Leadership',
        evidence: evidence.slice(0, 5),
        yearsOfExperience: leadershipYears
      });
      
      if (teamSizes.length > 0) {
        const maxTeamSize = Math.max(...teamSizes);
        parameters.push({
          name: 'team_management',
          category: 'leadership',
          strength: Math.min(1.0, 0.6 + (maxTeamSize / 50)),
          value: `Team Management (up to ${maxTeamSize} people)`,
          evidence: [`Managed teams of up to ${maxTeamSize} people`]
        });
      }
    }
    
    // Check for specific leadership roles
    const seniorRoles = this.extractSeniorRoles(cvContent);
    for (const role of seniorRoles) {
      parameters.push({
        name: 'senior_leadership',
        category: 'leadership', 
        strength: 0.9,
        value: role.title,
        evidence: [role.context],
        yearsOfExperience: role.years
      });
    }
    
    return parameters;
  }

  private extractDomainParameters(cvContent: string): CVParameter[] {
    const parameters: CVParameter[] = [];
    const lowerContent = cvContent.toLowerCase();
    
    for (const [domain, indicators] of Object.entries(this.domainExperience)) {
      const evidence: string[] = [];
      let strength = 0;
      
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator.toLowerCase())) {
          const contexts = this.findContexts(cvContent, indicator, 80);
          evidence.push(...contexts);
          strength += 0.2;
        }
      }
      
      if (strength > 0) {
        parameters.push({
          name: domain,
          category: 'domain',
          strength: Math.min(1.0, strength),
          value: domain,
          evidence: evidence.slice(0, 3)
        });
      }
    }
    
    return parameters;
  }

  private extractSoftSkills(cvContent: string): CVParameter[] {
    const softSkills = {
      'communication': ['communication', 'stakeholder', 'collaboration', 'alignment'],
      'problem_solving': ['problem solving', 'optimization', 'troubleshooting', 'debugging'],
      'mentoring': ['mentored', 'coaching', 'guided', 'developed'],
      'agile': ['agile', 'scrum', 'kanban', 'sprint']
    };
    
    const parameters: CVParameter[] = [];
    const lowerContent = cvContent.toLowerCase();
    
    for (const [skill, indicators] of Object.entries(softSkills)) {
      const evidence: string[] = [];
      let strength = 0;
      
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          const contexts = this.findContexts(cvContent, indicator, 60);
          evidence.push(...contexts);
          strength += 0.15;
        }
      }
      
      if (strength > 0.2) {
        parameters.push({
          name: skill,
          category: 'soft',
          strength: Math.min(0.8, strength), // Cap soft skills at 0.8
          value: skill.replace('_', ' '),
          evidence: evidence.slice(0, 2)
        });
      }
    }
    
    return parameters;
  }

  private extractEducation(cvContent: string): CVParameter[] {
    const parameters: CVParameter[] = [];
    const educationSection = this.extractSection(cvContent, 'education');
    
    if (educationSection) {
      const degrees = educationSection.match(/(m\.?s\.?c?\.?|master|b\.?s\.?c?\.?|bachelor|phd|doctorate)/gi);
      const fields = educationSection.match(/(computer science|engineering|mathematics|physics)/gi);
      
      if (degrees && fields) {
        const highestDegree = degrees[0];
        const relevantField = fields[0];
        
        let strength = 0.6; // Base education strength
        if (highestDegree.toLowerCase().includes('master') || highestDegree.toLowerCase().includes('m.s')) {
          strength = 0.7;
        }
        if (highestDegree.toLowerCase().includes('phd')) {
          strength = 0.8;
        }
        
        parameters.push({
          name: 'education',
          category: 'education',
          strength,
          value: `${highestDegree} in ${relevantField}`,
          evidence: [educationSection.substring(0, 100)]
        });
      }
    }
    
    return parameters;
  }

  private calculateTotalExperience(cvContent: string): number {
    const experienceSection = this.extractSection(cvContent, 'experience');
    if (!experienceSection) return 0;
    
    // Look for year ranges like "2020 - 2023" or "2020 – present"
    const yearRanges = experienceSection.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/gi);
    
    if (!yearRanges) return 0;
    
    const currentYear = new Date().getFullYear();
    let totalYears = 0;
    
    for (const range of yearRanges) {
      const match = range.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/i);
      if (match) {
        const startYear = parseInt(match[1]);
        const endYear = match[2].toLowerCase() === 'present' ? currentYear : parseInt(match[2]);
        totalYears += (endYear - startYear);
      }
    }
    
    return totalYears;
  }

  private determineSeniorityLevel(cvContent: string, totalExperience: number): CVAnalysis['seniorityLevel'] {
    const title = this.extractCurrentRole(cvContent) || '';
    const titleLower = title.toLowerCase();
    
    // Check title-based seniority
    if (titleLower.includes('cto') || titleLower.includes('vp')) return 'executive';
    if (titleLower.includes('director') || titleLower.includes('head of')) return 'director';
    if (titleLower.includes('lead') || titleLower.includes('principal')) return 'lead';
    if (titleLower.includes('senior') || titleLower.includes('sr.')) return 'senior';
    
    // Fallback to experience-based
    if (totalExperience >= 15) return 'director';
    if (totalExperience >= 10) return 'lead';
    if (totalExperience >= 7) return 'senior';
    if (totalExperience >= 3) return 'mid';
    return 'junior';
  }

  private extractKeyStrengths(parameters: CVParameter[]): string[] {
    return parameters
      .filter(p => p.strength > 0.7)
      .slice(0, 8)
      .map(p => p.value);
  }

  private extractCurrentRole(cvContent: string): string | undefined {
    const experienceSection = this.extractSection(cvContent, 'experience');
    if (!experienceSection) return undefined;
    
    // Look for the first role (most recent)
    const roleMatch = experienceSection.match(/^([^|]+)/);
    return roleMatch ? roleMatch[1].trim() : undefined;
  }

  // Helper methods
  private findContexts(content: string, term: string, contextLength: number): string[] {
    const regex = new RegExp(`(.{0,${contextLength}}\\b${term}\\b.{0,${contextLength}})`, 'gi');
    const matches = content.match(regex);
    return matches ? matches.map(m => m.trim()) : [];
  }

  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`###\\s*${sectionName}([^]*?)(?=###|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private assessTechnicalContext(contexts: string[]): number {
    let strength = 0;
    const strongIndicators = ['implemented', 'architected', 'built', 'designed', 'led', 'expertise'];
    const mediumIndicators = ['used', 'worked with', 'experience', 'knowledge'];
    
    for (const context of contexts) {
      const lowerContext = context.toLowerCase();
      if (strongIndicators.some(indicator => lowerContext.includes(indicator))) {
        strength += 0.3;
      } else if (mediumIndicators.some(indicator => lowerContext.includes(indicator))) {
        strength += 0.1;
      }
    }
    
    return Math.min(0.8, strength);
  }

  private extractYearsForSkill(contexts: string[], skill: string): number {
    for (const context of contexts) {
      const yearMatch = context.match(/(\d+)\+?\s*years?/i);
      if (yearMatch) {
        return parseInt(yearMatch[1]);
      }
    }
    return 0;
  }

  private extractTeamSizes(content: string): number[] {
    const teamSizeMatches = content.match(/(\d+)\+?\s*(?:employees|people|developers|engineers|members)/gi);
    return teamSizeMatches ? teamSizeMatches.map(match => {
      const num = match.match(/(\d+)/);
      return num ? parseInt(num[1]) : 0;
    }).filter(n => n > 0) : [];
  }

  private extractLeadershipYears(content: string): number {
    const leadershipRoles = content.match(/(director|head of|lead|manager|cto)[^]*?(\d{4})\s*[-–]\s*(\d{4}|present)/gi);
    if (!leadershipRoles) return 0;
    
    const currentYear = new Date().getFullYear();
    let totalLeadershipYears = 0;
    
    for (const role of leadershipRoles) {
      const yearMatch = role.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/i);
      if (yearMatch) {
        const startYear = parseInt(yearMatch[1]);
        const endYear = yearMatch[2].toLowerCase() === 'present' ? currentYear : parseInt(yearMatch[2]);
        totalLeadershipYears += (endYear - startYear);
      }
    }
    
    return totalLeadershipYears;
  }

  private extractSeniorRoles(content: string): Array<{title: string, context: string, years: number}> {
    const seniorTitles = ['director', 'head of', 'cto', 'vp', 'chief'];
    const roles: Array<{title: string, context: string, years: number}> = [];
    
    for (const title of seniorTitles) {
      const regex = new RegExp(`([^\\n]*${title}[^\\n]*)`, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        for (const match of matches) {
          roles.push({
            title: match.trim(),
            context: match,
            years: this.extractYearsForSkill([match], title)
          });
        }
      }
    }
    
    return roles;
  }

  private determineStrongestCategory(parameters: CVParameter[]): string {
    const categoryStrengths = parameters.reduce((acc, param) => {
      acc[param.category] = (acc[param.category] || 0) + param.strength;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryStrengths)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'technical';
  }
}