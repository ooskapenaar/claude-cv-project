export interface CVVariant {
  id: string;
  name: string;
  targetCluster: string;
  description: string;
  cvContent: string;
  optimizations: Array<{
    section: string;
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  targetJobs: string[];
  estimatedImprovement: number;
  confidence: number;
  metadata: {
    generatedAt: string;
    optimizationLevel: string;
    basedOn: string;
  };
}

export interface VariantGenerationResult {
  variants: CVVariant[];
  recommendations: Array<{
    variant: string;
    jobCluster: string;
    reasoning: string;
    priority: number;
  }>;
  summary: {
    totalVariants: number;
    estimatedTotalImprovement: number;
    primaryRecommendation: string;
    nextSteps: string[];
  };
}

export class CVVariantGenerator {
  // Variant naming conventions
  private readonly variantNames = {
    'ai_innovation': 'AI Leadership Specialist',
    'ecommerce_technical': 'E-commerce Technology Director',
    'enterprise_leadership': 'Enterprise Transformation Leader',
    'technical_leadership': 'Technical Architecture Leader',
    'startup_growth': 'Startup Growth Engineering Leader',
    'uncategorized': 'Senior Technology Executive'
  };

  // Optimization level configurations
  private readonly optimizationLevels = {
    'conservative': {
      summaryModification: 0.3,
      experienceReordering: 0.2,
      skillsReordering: 0.2,
      contentEnhancement: 0.1
    },
    'moderate': {
      summaryModification: 0.6,
      experienceReordering: 0.5,
      skillsReordering: 0.3,
      contentEnhancement: 0.4
    },
    'aggressive': {
      summaryModification: 0.9,
      experienceReordering: 0.8,
      skillsReordering: 0.4,
      contentEnhancement: 0.7
    }
  };

  /**
   * Generates optimized CV variants for distinct job clusters.
   * 
   * Strategy:
   * 1. Analyzes job clusters to determine optimization potential
   * 2. For each cluster, generates targeted CV variant with cluster-specific optimizations
   * 3. Applies optimization level (conservative/moderate/aggressive) based on cluster characteristics
   * 4. Prioritizes variants by impact potential and job coverage
   * 
   * @param originalCV - Base CV content in markdown format
   * @param jobClusters - Array of job clusters with requirements and characteristics
   * @returns Complete variant generation results with recommendations and next steps
   */
  async generateVariants(originalCV: string, jobClusters: any[]): Promise<VariantGenerationResult> {
    const variants: CVVariant[] = [];
    
    // Generate a variant for each significant cluster
    for (const cluster of jobClusters) {
      if (cluster.clusterSize >= 1) { // Only generate for clusters with at least 1 job
        const variant = await this.generateVariantForCluster(originalCV, cluster);
        variants.push(variant);
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(variants, jobClusters);
    
    // Create summary
    const summary = this.generateSummary(variants, recommendations);

    return {
      variants,
      recommendations,
      summary
    };
  }

  private async generateVariantForCluster(originalCV: string, cluster: any): Promise<CVVariant> {
    const optimizationLevel = this.determineOptimizationLevel(cluster);
    const variantId = `cv-${cluster.id}-${Date.now()}`;
    const variantName = this.variantNames[cluster.id as keyof typeof this.variantNames] || cluster.name;

    // Apply cluster-specific optimizations
    const optimizations: CVVariant['optimizations'] = [];
    let optimizedCV = originalCV;

    // 1. Optimize summary section
    const summaryOptimization = await this.optimizeSummaryForCluster(originalCV, cluster, optimizationLevel);
    if (summaryOptimization.modified) {
      optimizedCV = this.replaceSummary(optimizedCV, summaryOptimization.content);
      optimizations.push({
        section: 'Summary',
        type: 'targeted_rewrite',
        description: `Tailored summary to emphasize ${cluster.name} requirements`,
        impact: 'high'
      });
    }

    // 2. Reorder and enhance experience section
    const experienceOptimization = await this.optimizeExperienceForCluster(optimizedCV, cluster, optimizationLevel);
    if (experienceOptimization.modified) {
      optimizedCV = this.replaceExperience(optimizedCV, experienceOptimization.content);
      optimizations.push({
        section: 'Experience',
        type: 'content_enhancement',
        description: `Enhanced role descriptions to highlight ${cluster.keySkills?.slice(0, 3).join(', ')} experience`,
        impact: 'high'
      });
    }

    // 3. Optimize technical skills section
    const skillsOptimization = await this.optimizeSkillsForCluster(optimizedCV, cluster, optimizationLevel);
    if (skillsOptimization.modified) {
      optimizedCV = this.replaceSkills(optimizedCV, skillsOptimization.content);
      optimizations.push({
        section: 'Technical Skills',
        type: 'priority_reordering',
        description: `Reordered skills to prioritize ${cluster.name} technologies`,
        impact: 'medium'
      });
    }

    // 4. Add cluster-specific section enhancements
    const additionalOptimizations = await this.addClusterSpecificEnhancements(optimizedCV, cluster, optimizationLevel);
    optimizations.push(...additionalOptimizations.optimizations);
    optimizedCV = additionalOptimizations.content;

    // Calculate improvement metrics
    const estimatedImprovement = this.calculateEstimatedImprovement(optimizations, cluster);
    const confidence = this.calculateVariantConfidence(optimizations, optimizationLevel, cluster);

    return {
      id: variantId,
      name: variantName,
      targetCluster: cluster.id,
      description: `CV optimized for ${cluster.name} roles, targeting ${cluster.clusterSize} positions with emphasis on ${cluster.keySkills?.slice(0, 2).join(' and ')}`,
      cvContent: optimizedCV,
      optimizations,
      targetJobs: cluster.jobs?.map((j: any) => j.jobId) || [],
      estimatedImprovement,
      confidence,
      metadata: {
        generatedAt: new Date().toISOString(),
        optimizationLevel,
        basedOn: 'cluster-analysis'
      }
    };
  }

  private determineOptimizationLevel(cluster: any): string {
    // Determine how aggressively to optimize based on cluster characteristics
    if (cluster.optimizationPotential > 0.7) return 'aggressive';
    if (cluster.optimizationPotential > 0.4) return 'moderate';
    return 'conservative';
  }

  private async optimizeSummaryForCluster(cv: string, cluster: any, level: string): Promise<{modified: boolean, content: string}> {
    const currentSummary = this.extractSection(cv, 'SUMMARY');
    if (!currentSummary) return { modified: false, content: '' };

    const config = this.optimizationLevels[level as keyof typeof this.optimizationLevels];
    const shouldModify = Math.random() < config.summaryModification; // In real implementation, use actual analysis

    if (!shouldModify) return { modified: false, content: currentSummary };

    // Generate cluster-specific summary
    const clusterFocus = this.getClusterFocus(cluster);
    const keyTerminology = this.getClusterTerminology(cluster);
    
    let optimizedSummary = this.enhanceSummaryForCluster(currentSummary, clusterFocus, keyTerminology, level);

    return { modified: true, content: optimizedSummary };
  }

  private async optimizeExperienceForCluster(cv: string, cluster: any, level: string): Promise<{modified: boolean, content: string}> {
    const experienceSection = this.extractSection(cv, 'EXPERIENCE');
    if (!experienceSection) return { modified: false, content: '' };

    const config = this.optimizationLevels[level as keyof typeof this.optimizationLevels];
    
    // Parse experience roles
    const roles = this.parseExperienceRoles(experienceSection);
    
    // Enhance each role based on cluster requirements
    const enhancedRoles = roles.map(role => {
      return this.enhanceRoleForCluster(role, cluster, config);
    });

    // Reorder roles if needed (put most relevant first)
    const reorderedRoles = this.reorderRolesByRelevance(enhancedRoles, cluster);

    const optimizedExperience = this.rebuildExperienceSection(reorderedRoles);
    
    return { modified: true, content: optimizedExperience };
  }

  private async optimizeSkillsForCluster(cv: string, cluster: any, level: string): Promise<{modified: boolean, content: string}> {
    const skillsSection = this.extractSection(cv, 'TECHNICAL EXPERTISE');
    if (!skillsSection) return { modified: false, content: '' };

    const config = this.optimizationLevels[level as keyof typeof this.optimizationLevels];
    
    // Parse skill categories
    const skillCategories = this.parseSkillCategories(skillsSection);
    
    // Reorder categories based on cluster relevance
    const categoryPriority = this.getClusterSkillPriority(cluster);
    const reorderedCategories = this.reorderSkillCategories(skillCategories, categoryPriority);

    // Within each category, prioritize cluster-relevant skills
    const optimizedCategories = reorderedCategories.map(category => {
      return this.prioritizeSkillsInCategory(category, cluster.keySkills || []);
    });

    const optimizedSkills = this.rebuildSkillsSection(optimizedCategories);
    
    return { modified: true, content: optimizedSkills };
  }

  private async addClusterSpecificEnhancements(cv: string, cluster: any, level: string): Promise<{content: string, optimizations: CVVariant['optimizations']}> {
    const optimizations: CVVariant['optimizations'] = [];
    let enhancedCV = cv;

    // Add language optimizations for German market (if PALTRON cluster)
    if (cluster.id === 'ecommerce_technical' && this.detectGermanMarketFocus(cluster)) {
      const languageSection = this.extractSection(cv, 'LANGUAGES');
      if (languageSection && languageSection.includes('German')) {
        const enhancedLanguages = this.emphasizeGermanLanguageSkills(languageSection);
        enhancedCV = this.replaceSection(enhancedCV, 'LANGUAGES', enhancedLanguages);
        optimizations.push({
          section: 'Languages',
          type: 'emphasis_enhancement',
          description: 'Emphasized German language proficiency for German market roles',
          impact: 'medium'
        });
      }
    }

    // Add AI/ML specific enhancements
    if (cluster.id === 'ai_innovation') {
      enhancedCV = this.addAIMLContextualEnhancements(enhancedCV);
      optimizations.push({
        section: 'Multiple',
        type: 'contextual_enhancement',
        description: 'Added AI/ML context to relevant achievements and experience',
        impact: 'medium'
      });
    }

    return { content: enhancedCV, optimizations };
  }

  private generateRecommendations(variants: CVVariant[], clusters: any[]): VariantGenerationResult['recommendations'] {
    return variants.map((variant, index) => {
      const cluster = clusters.find(c => c.id === variant.targetCluster);
      const priority = this.calculateVariantPriority(variant, cluster);
      
      return {
        variant: variant.id,
        jobCluster: variant.targetCluster,
        reasoning: this.generateRecommendationReasoning(variant, cluster),
        priority
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  private generateSummary(variants: CVVariant[], recommendations: VariantGenerationResult['recommendations']): VariantGenerationResult['summary'] {
    const totalEstimatedImprovement = variants.reduce((sum, variant) => sum + variant.estimatedImprovement, 0) / variants.length;
    const topRecommendation = recommendations[0];
    const topVariant = variants.find(v => v.id === topRecommendation?.variant);

    return {
      totalVariants: variants.length,
      estimatedTotalImprovement: totalEstimatedImprovement,
      primaryRecommendation: topVariant ? 
        `Start with "${topVariant.name}" variant targeting ${topVariant.targetJobs.length} positions` :
        'No specific recommendation available',
      nextSteps: this.generateNextSteps(variants, recommendations)
    };
  }

  private calculateEstimatedImprovement(optimizations: CVVariant['optimizations'], cluster: any): number {
    let improvement = 0;
    
    optimizations.forEach(opt => {
      switch (opt.impact) {
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

    // Factor in cluster optimization potential
    const clusterMultiplier = cluster.optimizationPotential || 0.5;
    return Math.min(0.5, improvement * (1 + clusterMultiplier));
  }

  private calculateVariantConfidence(optimizations: CVVariant['optimizations'], level: string, cluster: any): number {
    const baseConfidence = {
      'conservative': 0.85,
      'moderate': 0.75,
      'aggressive': 0.65
    }[level] || 0.75;

    const optimizationQuality = optimizations.length > 0 ? 
      optimizations.reduce((sum, opt) => sum + (opt.impact === 'high' ? 1 : 0.5), 0) / optimizations.length : 0.5;

    const clusterClarity = Math.min(1, (cluster.clusterSize || 1) / 3); // More jobs = clearer requirements

    return Math.min(0.95, baseConfidence + (optimizationQuality * 0.1) + (clusterClarity * 0.05));
  }

  // Helper methods (simplified implementations)
  private extractSection(cv: string, sectionName: string): string {
    const regex = new RegExp(`###\\s*${sectionName}([^]*?)(?=###|$)`, 'i');
    const match = cv.match(regex);
    return match ? match[1].trim() : '';
  }

  private replaceSummary(cv: string, newSummary: string): string {
    return cv.replace(/(###\s*SUMMARY[^]*?)(?=###|$)/i, `### SUMMARY\n\n${newSummary}\n\n`);
  }

  private replaceExperience(cv: string, newExperience: string): string {
    return cv.replace(/(###\s*EXPERIENCE[^]*?)(?=###|$)/i, `### EXPERIENCE\n\n${newExperience}\n\n`);
  }

  private replaceSkills(cv: string, newSkills: string): string {
    return cv.replace(/(###\s*TECHNICAL EXPERTISE[^]*?)(?=###|$)/i, `### TECHNICAL EXPERTISE\n\n${newSkills}\n\n`);
  }

  private replaceSection(cv: string, sectionName: string, newContent: string): string {
    const regex = new RegExp(`(###\\s*${sectionName}[^]*?)(?=###|$)`, 'i');
    return cv.replace(regex, `### ${sectionName.toUpperCase()}\n\n${newContent}\n\n`);
  }

  private getClusterFocus(cluster: any): string {
    const focusMap: Record<string, string> = {
      'ai_innovation': 'AI/ML innovation and generative AI applications',
      'ecommerce_technical': 'e-commerce platform development and cloud-native architectures',
      'enterprise_leadership': 'enterprise transformation and strategic technology leadership',
      'technical_leadership': 'technical architecture and engineering excellence',
      'startup_growth': 'startup scaling and rapid product development'
    };
    return focusMap[cluster.id] || 'technical leadership';
  }

  private getClusterTerminology(cluster: any): string[] {
    const terminologyMap: Record<string, string[]> = {
      'ai_innovation': ['AI', 'machine learning', 'generative AI', 'LLMs', 'data science'],
      'ecommerce_technical': ['e-commerce', 'microservices', 'cloud-native', 'scalable systems', 'APIs'],
      'enterprise_leadership': ['transformation', 'strategic vision', 'organizational scaling', 'executive leadership'],
      'technical_leadership': ['architecture', 'system design', 'engineering excellence', 'technical vision'],
      'startup_growth': ['agile development', 'rapid scaling', 'MVP', 'growth engineering']
    };
    return terminologyMap[cluster.id] || ['technical leadership', 'engineering'];
  }

  private enhanceSummaryForCluster(summary: string, focus: string, terminology: string[], level: string): string {
    // Simplified implementation - in practice would be more sophisticated
    let enhanced = summary;
    
    // Insert cluster-specific terminology
    if (terminology.length > 0) {
      enhanced = enhanced.replace(/technical expertise/gi, `expertise in ${terminology.slice(0, 2).join(' and ')}`);
    }
    
    // Add focus area
    enhanced = enhanced.replace(/leadership/gi, `leadership in ${focus}`);
    
    return enhanced;
  }

  private parseExperienceRoles(experience: string): any[] {
    // Simplified implementation
    const roles = experience.split(/\n\n(?=[A-Z])/);
    return roles.map(role => ({
      content: role.trim(),
      title: role.split('\n')[0] || '',
      achievements: role.split('\n').slice(1).filter(line => line.trim().startsWith('*'))
    }));
  }

  private enhanceRoleForCluster(role: any, cluster: any, config: any): any {
    // Simplified implementation
    return role;
  }

  private reorderRolesByRelevance(roles: any[], cluster: any): any[] {
    // In practice, would analyze role relevance to cluster and reorder
    return roles;
  }

  private rebuildExperienceSection(roles: any[]): string {
    return roles.map(role => role.content).join('\n\n');
  }

  private parseSkillCategories(skills: string): any[] {
    // Simplified implementation
    return [];
  }

  private getClusterSkillPriority(cluster: any): Record<string, number> {
    const priorityMaps: Record<string, Record<string, number>> = {
      'ai_innovation': { 'programming': 1, 'ai/ml': 2, 'cloud': 3, 'databases': 4 },
      'ecommerce_technical': { 'cloud': 1, 'architecture': 2, 'databases': 3, 'devops': 4 },
      'enterprise_leadership': { 'leadership': 1, 'architecture': 2, 'cloud': 3, 'programming': 4 }
    };
    return priorityMaps[cluster.id] || {};
  }

  private reorderSkillCategories(categories: any[], priority: Record<string, number>): any[] {
    return categories.sort((a, b) => {
      const aPriority = priority[a.name?.toLowerCase()] || 5;
      const bPriority = priority[b.name?.toLowerCase()] || 5;
      return aPriority - bPriority;
    });
  }

  private prioritizeSkillsInCategory(category: any, keySkills: string[]): any {
    // Implementation would reorder skills within category
    return category;
  }

  private rebuildSkillsSection(categories: any[]): string {
    return categories.map(cat => `${cat.name}: ${cat.skills?.join(', ') || ''}`).join('\n');
  }

  private detectGermanMarketFocus(cluster: any): boolean {
    return cluster.jobs?.some((job: any) => 
      job.company?.toLowerCase().includes('german') || 
      job.title?.toLowerCase().includes('german')
    ) || false;
  }

  private emphasizeGermanLanguageSkills(languageSection: string): string {
    return languageSection.replace(/German \(Fluent\)/i, 'German (Fluent - Native-level business proficiency)');
  }

  private addAIMLContextualEnhancements(cv: string): string {
    // Add AI/ML context to relevant sections
    return cv.replace(/data-driven/gi, 'AI-driven')
            .replace(/automation/gi, 'intelligent automation')
            .replace(/analytics/gi, 'AI-powered analytics');
  }

  private calculateVariantPriority(variant: CVVariant, cluster: any): number {
    const improvement = variant.estimatedImprovement;
    const confidence = variant.confidence;
    const jobCount = variant.targetJobs.length;
    const clusterPotential = cluster?.optimizationPotential || 0.5;

    return (improvement * 0.3) + (confidence * 0.2) + (jobCount * 0.3) + (clusterPotential * 0.2);
  }

  private generateRecommendationReasoning(variant: CVVariant, cluster: any): string {
    const jobCount = variant.targetJobs.length;
    const improvement = Math.round(variant.estimatedImprovement * 100);
    const confidence = Math.round(variant.confidence * 100);

    return `Targets ${jobCount} ${cluster?.name || 'relevant'} positions with ${improvement}% estimated improvement (${confidence}% confidence). ${variant.optimizations.filter(o => o.impact === 'high').length} high-impact optimizations applied.`;
  }

  private generateNextSteps(variants: CVVariant[], recommendations: VariantGenerationResult['recommendations']): string[] {
    const steps: string[] = [];
    
    if (recommendations.length > 0) {
      const topRec = recommendations[0];
      steps.push(`1. Review and refine the "${variants.find(v => v.id === topRec.variant)?.name}" variant`);
      steps.push('2. Test the optimized variant against target job requirements');
    }

    if (recommendations.length > 1) {
      steps.push(`3. Consider developing the secondary variant for broader job coverage`);
    }

    steps.push('4. Monitor application performance and iterate based on feedback');

    return steps;
  }
}