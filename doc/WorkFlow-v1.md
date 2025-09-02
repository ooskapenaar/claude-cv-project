flowchart TD
      A[User: "List jobs available"] --> B[Claude Code CLI]
      B --> C[Task Agent spawn]
      C --> D[Task Agent: Use filesystem-mcp MCP tool]
      D --> E[MCP Protocol: list_jobs call]
      E --> F[filesystem-mcp service]
      F --> G[Read data/jobs/ directory]
      G --> H[Return job metadata]
      H --> I[Task Agent processes response]
      I --> J[Task Agent returns to Claude Code]
      J --> K[Claude Code formats for user]
      K --> L[User sees numbered job list]

      L --> M[User: "1,2,3,4,5,6"]
      M --> N[Claude Code CLI]
      N --> O[Task Agent spawn #2]
      O --> P[Task Agent: Use matrix-analysis-mcp]
      P --> Q[MCP Protocol: analyze_jobs_batch]
      Q --> R[matrix-analysis-mcp service]

      R --> S[Load Job #1 via filesystem-mcp]
      S --> T[Analyze Job #1 parameters]
      T --> U[Load Job #2 via filesystem-mcp]
      U --> V[Analyze Job #2 parameters]
      V --> W[... repeat for jobs 3-6]
      W --> X[Generate matrix comparison]
      X --> Y[Create clustering analysis]
      Y --> Z[Return comprehensive report]
      Z --> AA[Task Agent processes response]
      AA --> BB[Task Agent returns to Claude Code]
      BB --> CC[Claude Code formats for user]
      CC --> DD[User sees analysis results]

      style C fill:#ff9999
      style O fill:#ff9999
      style S fill:#ffcc99
      style U fill:#ffcc99
      style W fill:#ffcc99