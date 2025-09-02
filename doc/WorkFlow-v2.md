flowchart TD
      A[User: Generate optimized application package] --> B[Claude CLI]
      B --> C{Batch MCP Pipeline}

      C --> D[filesystem-mcp v2.0]
      C --> E[matrix-analysis-mcp v2.0]
      C --> F[cv-generation-mcp v2.0]
      C --> G[cover-letter-mcp v1.0 NEW]

      D --> H[Load jobs + CV in single call]
      E --> I[Parallel job analysis + clustering]
      F --> J[Generate optimized CV variants]
      G --> K[Generate matching cover letters]

      H --> L[Shared Job Data Cache]
      I --> L
      J --> M[CV-Job Match Matrix]
      K --> M

      M --> N[Complete Application Package]
      N --> O[CV + Cover Letter pairs per job cluster]
      O --> P[User receives optimized package]

      style G fill:#66ff66
      style L fill:#ffff66
      style M fill:#ffff66
      style N fill:#66ff66