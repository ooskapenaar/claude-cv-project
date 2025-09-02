CV Structure:
  {
    filename: "optimized-for-tech-lead.md",
    content: "...",
    metadata: {
      matrixId: "cv-tech-lead-2025-01-15",  // Links to analysis matrix
      targetJobs: ["job-123", "job-456"],
      optimizationScore: 0.87,
      createdAt: "2025-01-15T10:30:00Z"
    }
  }

  Job Structure:
  {
    jobId: "job-123",
    data: {
      title: "Senior Engineering Director",
      company: "TechCorp",
      description: "...",
      matrixId: "job-tech-director-requirements",  // Links to analysis matrix
      url: "...",
      extractedAt: "2025-01-15T09:00:00Z"
    }
  }

  Matrix Structure:
  {
    matrixId: "cv-tech-lead-2025-01-15",
    type: "CV" | "Job",                    // Entity type
    entityId: "optimized-for-tech-lead.md", // CV filename or Job ID
    parameters: {
      "leadership": 0.9,
      "kubernetes": 0.8,
      "team-building": 0.95
    },
    weights: {...},
    storedAt: "2025-01-15T10:30:00Z"
  }
