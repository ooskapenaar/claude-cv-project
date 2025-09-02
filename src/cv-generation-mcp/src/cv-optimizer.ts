export interface CVSection {
  title: string;
  content: string;
  priority: number; // 1-10, higher = more important for target
}

export interface OptimizationResult {
  optimizedCV: string;
  changes: Array<{
    section: string;
    type: 'reorder' | 'enhance' | 'summarize' | 'emphasize';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  targetScore: number; // Estimated improvement in match score
  confidence: number; // How confident we are in the optimization
}

export interface TargetedSummary {
  summary: string;
  keyPoints: string[];
  emphasizedSkills: string[];
  reasoning: string;
}

export class CVOptimizer {
  // Skill enhancement mappings for different contexts
  private readonly skillEnhancements = {
    'ai_ml': {
      'artificial intelligence': ['AI', 'machine learning', 'generative AI', 'LLMs'],
      'data': ['data-driven', 'analytics', 'big data', 'data science'],
      'automation': ['process automation', 'intelligent automation', 'AI-powered workflows']
    },
    'ecommerce': {
      'cloud': ['cloud-native', 'scalable cloud infrastructure', 'cloud readiness'],
      'microservices': ['microservice architecture', 'containerization', 'service mesh'],
      'performance': ['high-performance systems', 'scalability', 'load optimization']
    },
    'enterprise': {
      'leadership': ['strategic leadership', 'organizational transformation', 'executive presence'],
      'scaling': ['team scaling', 'organizational growth', 'operational excellence'],
      'budget': ['budget management', 'cost optimization', 'resource allocation']
    }
  };

  // Professional language patterns for different seniority levels
  private readonly languagePatterns = {
    'director': ['spearheaded', 'orchestrated', 'architected', 'transformed', 'drove', 'championed', 'master-minded','ideated','oversaw'],
    'senior': ['led', 'implemented', 'designed', 'optimized', 'delivered', 'established','created','conceptualised'],
    'manager': ['managed', 'coordinated', 'supervised', 'guided', 'facilitated', 'executed','controlled','audited','accounted','monitored']
  };

  async optimizeForCluster(
    originalCV: string, 
    targetCluster: any, 
    optimizationLevel: string = 'moderate'
  ): Promise<OptimizationResult> {
    const sections = this.parseCV(originalCV);
    const changes: OptimizationResult['changes'] = [];

    // 1. Generate targeted summary
    const summaryOptimization = await this.optimizeSummary(
      sections.find(s => s.title.toLowerCase().includes('summary'))?.content || '',
      targetCluster,
      optimizationLevel
    );
    
    if (summaryOptimization) {
      changes.push({
        section: 'Summary',
        type: 'summarize',
        description: `Tailored summary to emphasize ${targetCluster.keySkills?.slice(0, 3).join(', ')}`,
        impact: 'high'
      });
    }

    // 2. Reorder and enhance experience section
    const experienceSection = sections.find(s => s.title.toLowerCase().includes('experience'));
    if (experienceSection) {
      const enhancedExperience = await this.enhanceExperienceForCluster(
        experienceSection.content,
        targetCluster,
        optimizationLevel
      );
      
      changes.push({
        section: 'Experience',
        type: 'enhance',
        description: `Enhanced experience descriptions to highlight ${targetCluster.name} relevant skills`,
        impact: 'high'
      });
    }

    // 3. Optimize technical skills section
    const skillsSection = sections.find(s => s.title.toLowerCase().includes('technical') || s.title.toLowerCase().includes('expertise'));
    if (skillsSection) {
      const optimizedSkills = this.optimizeSkillsSection(
        skillsSection.content,
        targetCluster.requiredSkills || [],
        targetCluster.name
      );
      
      changes.push({
        section: 'Technical Skills',
        type: 'emphasize',
        description: 'Reordered skills to prioritize cluster-relevant technologies',
        impact: 'medium'
      });
    }

    // 4. Rebuild optimized CV
    const optimizedCV = this.rebuildCV(sections, summaryOptimization, targetCluster, changes);

    // 5. Calculate estimated improvement
    const targetScore = this.estimateScoreImprovement(changes, targetCluster);
    const confidence = this.calculateConfidence(changes, optimizationLevel);

    return {
      optimizedCV,
      changes,
      targetScore,
      confidence
    };
  }

  async generateTargetedSummary(originalCV: string, targetJobs: any[]): Promise<TargetedSummary> {
    const currentSummary = this.extractSection(originalCV, 'summary');
    const consolidatedRequirements = this.consolidateJobRequirements(targetJobs);
    
    // Extract key professional attributes from current CV
    const experience = this.extractExperienceYears(originalCV);
    const currentRole = this.extractCurrentRole(originalCV);
    const keyAchievements = this.extractKeyAchievements(originalCV);
    
    // Generate targeted summary
    const emphasizedSkills = consolidatedRequirements.slice(0, 6);
    const summary = this.craftTargetedSummary(
      experience,
      currentRole,
      keyAchievements,
      emphasizedSkills,
      targetJobs
    );

    return {
      summary,
      keyPoints: this.extractKeyPoints(summary),
      emphasizedSkills,
      reasoning: `Tailored for ${targetJobs.length} target positions emphasizing ${emphasizedSkills.slice(0, 3).join(', ')}`
    };
  }

  async enhanceExperienceSection(
    experienceSection: string,
    targetSkills: string[],
    jobContext: string = 'general'
  ): Promise<string> {
    const roles = this.parseExperienceRoles(experienceSection);
    const enhancedRoles = roles.map(role => {
      return this.enhanceRoleDescription(role, targetSkills, jobContext);
    });

    return this.rebuildExperienceSection(enhancedRoles);
  }

  // Private helper methods
  private parseCV(cvContent: string): CVSection[] {
    const sections: CVSection[] = [];
    const sectionRegex = /^#+\s*(.+)$/gm;
    let currentSection: CVSection | null = null;
    const lines = cvContent.split('\n');

    for (const line of lines) {
      const sectionMatch = line.match(/^#+\s*(.+)$/);
      
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: sectionMatch[1].trim(),
          content: '',
          priority: 5 // Default priority
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private async optimizeSummary(
    currentSummary: string,
    targetCluster: any,
    optimizationLevel: string
  ): Promise<string | null> {
    if (!currentSummary) return null;

    const clusterContext = this.getClusterContext(targetCluster.name);
    const keySkills = targetCluster.keySkills || [];
    const requiredExperience = targetCluster.commonRequirements || [];

    // Extract core professional identity from current summary
    const coreIdentity = this.extractCoreIdentity(currentSummary);
    const experienceYears = this.extractExperienceFromSummary(currentSummary);
    
    // Build enhanced summary
    let enhancedSummary = coreIdentity;
    
    // Add cluster-specific expertise
    if (clusterContext && keySkills.length > 0) {
      const skillPhrase = this.craftSkillPhrase(keySkills.slice(0, 4), clusterContext);
      enhancedSummary += ` with deep expertise in ${skillPhrase}`;
    }

    // Add experience context
    if (experienceYears && requiredExperience.length > 0) {
      const experiencePhrase = this.craftExperiencePhrase(requiredExperience.slice(0, 3));
      enhancedSummary += `. ${experienceYears} years of proven success in ${experiencePhrase}`;
    }

    // Add value proposition
    const valueProposition = this.generateValueProposition(targetCluster, optimizationLevel);
    if (valueProposition) {
      enhancedSummary += `. ${valueProposition}`;
    }

    return enhancedSummary;
  }

  private enhanceExperienceForCluster(
    experienceContent: string,
    targetCluster: any,
    optimizationLevel: string
  ): string {
    const roles = this.parseExperienceRoles(experienceContent);
    const clusterSkills = new Set<string>(targetCluster.keySkills || []);
    const clusterContext = targetCluster.name.toLowerCase();

    return roles.map(role => {
      const bulletPoints = role.achievements || [];
      const enhancedBullets = bulletPoints.map((bullet: string) => {
        return this.enhanceBulletPoint(bullet, clusterSkills, clusterContext, optimizationLevel);
      });

      return {
        ...role,
        achievements: enhancedBullets
      };
    }).map(role => this.formatRole(role)).join('\n\n');
  }

  private optimizeSkillsSection(
    skillsContent: string,
    requiredSkills: string[],
    clusterName: string
  ): string {
    const skillCategories = this.parseSkillCategories(skillsContent);
    const requiredSkillsSet = new Set(requiredSkills.map(s => s.toLowerCase()));

    // Reorder categories based on cluster relevance
    const categoryPriority = this.getSkillCategoryPriority(clusterName);
    
    const sortedCategories = skillCategories.sort((a, b) => {
      const aPriority = categoryPriority[a.name.toLowerCase()] || 5;
      const bPriority = categoryPriority[b.name.toLowerCase()] || 5;
      return aPriority - bPriority;
    });

    // Within each category, prioritize required skills
    sortedCategories.forEach(category => {
      category.skills.sort((a, b) => {
        const aRequired = requiredSkillsSet.has(a.toLowerCase());
        const bRequired = requiredSkillsSet.has(b.toLowerCase());
        if (aRequired && !bRequired) return -1;
        if (!aRequired && bRequired) return 1;
        return 0;
      });
    });

    return this.rebuildSkillsSection(sortedCategories);
  }

  private rebuildCV(
    sections: CVSection[],
    optimizedSummary: string | null,
    targetCluster: any,
    changes: OptimizationResult['changes']
  ): string {
    let result = '';

    for (const section of sections) {
      result += `### ${section.title}\n\n`;
      
      if (section.title.toLowerCase().includes('summary') && optimizedSummary) {
        result += optimizedSummary + '\n\n';
      } else {
        result += section.content + '\n';
      }
    }

    return result;
  }

  private estimateScoreImprovement(
    changes: OptimizationResult['changes'],
    targetCluster: any
  ): number {
    let improvement = 0;
    
    changes.forEach(change => {
      switch (change.impact) {
        case 'high':
          improvement += 0.15;
          break;
        case 'medium':
          improvement += 0.08;
          break;
        case 'low':
          improvement += 0.03;
          break;
      }
    });

    return Math.min(0.4, improvement); // Cap at 40% improvement
  }

  private calculateConfidence(
    changes: OptimizationResult['changes'],
    optimizationLevel: string
  ): number {
    const baseConfidence = {
      'conservative': 0.85,
      'moderate': 0.75,
      'aggressive': 0.65
    }[optimizationLevel] || 0.75;

    const changeQuality = changes.length > 0 ? 
      changes.reduce((sum, change) => sum + (change.impact === 'high' ? 1 : 0.5), 0) / changes.length : 0;

    return Math.min(0.95, baseConfidence + (changeQuality * 0.1));
  }

  // Additional helper methods would be implemented here...
  private extractSection(cv: string, sectionName: string): string {
    const regex = new RegExp(`###\\s*${sectionName}([^]*?)(?=###|$)`, 'i');
    const match = cv.match(regex);
    return match ? match[1].trim() : '';
  }

  private consolidateJobRequirements(jobs: any[]): string[] {
    const requirements = new Set<string>();
    jobs.forEach(job => {
      if (job.keyRequirements) {
        job.keyRequirements.forEach((req: string) => requirements.add(req));
      }
    });
    return Array.from(requirements);
  }

  private extractExperienceYears(cv: string): string {
    const experienceMatch = cv.match(/(\d+)\+?\s*years?/i);
    return experienceMatch ? experienceMatch[1] + '+ years' : '';
  }

  private extractCurrentRole(cv: string): string {
    const experienceSection = this.extractSection(cv, 'experience');
    const roleMatch = experienceSection.match(/^([^|]+)/);
    return roleMatch ? roleMatch[1].trim() : '';
  }

  private extractKeyAchievements(cv: string): string[] {
    const achievements: string[] = [];
    const bulletPoints = cv.match(/[•*-]\s*([^.\n]+)/g);
    
    if (bulletPoints) {
      achievements.push(...bulletPoints
        .map(bp => bp.replace(/[•*-]\s*/, '').trim())
        .filter(bp => bp.length > 20)
        .slice(0, 5)
      );
    }
    
    return achievements;
  }

  private craftTargetedSummary(
    experience: string,
    currentRole: string,
    achievements: string[],
    skills: string[],
    targetJobs: any[]
  ): string {
    const seniorityLevel = this.determineSeniorityFromJobs(targetJobs);
    const industryContext = this.determineIndustryContext(targetJobs);
    
    let summary = `Seasoned ${seniorityLevel} with ${experience} of progressive leadership`;
    
    if (industryContext) {
      summary += ` in ${industryContext}`;
    }
    
    if (skills.length > 0) {
      summary += `, specializing in ${skills.slice(0, 3).join(', ')}`;
    }

    summary += '. Proven track record of driving organizational transformation and delivering measurable business impact through technology excellence.';

    return summary;
  }

  private extractKeyPoints(summary: string): string[] {
    return summary.split('.').map(s => s.trim()).filter(s => s.length > 10);
  }

  private parseExperienceRoles(content: string): any[] {
    // Implementation would parse role entries
    return [];
  }

  private enhanceRoleDescription(role: any, skills: string[], context: string): any {
    // Implementation would enhance role descriptions
    return role;
  }

  private rebuildExperienceSection(roles: any[]): string {
    // Implementation would rebuild the experience section
    return roles.map(role => `${role.title}\n${role.achievements?.join('\n') || ''}`).join('\n\n');
  }

  private getClusterContext(clusterName: string): string {
    const contexts: Record<string, string> = {
      'ai_innovation': 'AI/ML and generative AI technologies',
      'ecommerce_technical': 'e-commerce platforms and cloud-native architectures',
      'enterprise_leadership': 'enterprise-scale team leadership and strategic transformation'
    };
    return contexts[clusterName.toLowerCase().replace(/\s+/g, '_')] || clusterName;
  }

  private extractCoreIdentity(summary: string): string {
    const identityMatch = summary.match(/^([^,]+)/);
    return identityMatch ? identityMatch[1].trim() : 'Experienced technology leader';
  }

  private extractExperienceFromSummary(summary: string): string {
    const expMatch = summary.match(/(\d+)\+?\s*years?/i);
    return expMatch ? expMatch[1] + '+' : '';
  }

  private craftSkillPhrase(skills: string[], context: string): string {
    return skills.join(', ');
  }

  private craftExperiencePhrase(experiences: string[]): string {
    return experiences.join(', ');
  }

  private generateValueProposition(cluster: any, level: string): string {
    const propositions: Record<string, string> = {
      'conservative': 'Dedicated to driving operational excellence and sustainable growth',
      'moderate': 'Passionate about transforming organizations through innovative technology solutions',
      'aggressive': 'Visionary leader specializing in disruptive technology adoption and exponential business growth'
    };
    return propositions[level] || propositions['moderate'];
  }

  private enhanceBulletPoint(bullet: string, skills: Set<string>, context: string, level: string): string {
    // Simple enhancement - in real implementation would be more sophisticated
    return bullet;
  }

  private formatRole(role: any): string {
    return `${role.title}\n${role.achievements?.join('\n') || ''}`;
  }

  private parseSkillCategories(content: string): Array<{name: string, skills: string[]}> {
    // Implementation would parse skill categories
    return [];
  }

  private getSkillCategoryPriority(clusterName: string): Record<string, number> {
    const priorities: Record<string, Record<string, number>> = {
      'ai_innovation': { 'programming': 1, 'ai/ml': 2, 'cloud': 3, 'leadership': 4 },
      'ecommerce': { 'cloud': 1, 'architecture': 2, 'databases': 3, 'programming': 4 },
      'enterprise': { 'leadership': 1, 'architecture': 2, 'cloud': 3, 'programming': 4 }
    };
    return priorities[clusterName.toLowerCase()] || {};
  }

  private rebuildSkillsSection(categories: Array<{name: string, skills: string[]}>): string {
    return categories.map(cat => `${cat.name}: ${cat.skills.join(', ')}`).join('\n');
  }

  private determineSeniorityFromJobs(jobs: any[]): string {
    const titles = jobs.map(j => j.title?.toLowerCase() || '');
    if (titles.some(t => t.includes('director') || t.includes('head'))) return 'Director';
    if (titles.some(t => t.includes('manager') || t.includes('lead'))) return 'Engineering Manager';
    return 'Senior Technical Leader';
  }

  private determineIndustryContext(jobs: any[]): string {
    const companies = jobs.map(j => j.company?.toLowerCase() || '');
    if (companies.some(c => c.includes('ai') || c.includes('scale'))) return 'AI/ML technology';
    if (companies.some(c => c.includes('commerce') || c.includes('retail'))) return 'e-commerce technology';
    return 'enterprise technology';
  }
}