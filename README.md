# CV_Project: Ronald Wertlen (Human)

## Overview 
This project exists to optimise Ronald Wertlen's CV against one or more Job 
Opportunities. It allows him to produce a broad-spectrum CV to display on LinkedIn,
and to produce focused CV's with highly targeted blurbs, for direct submission
to the hiring agency.

## Rationale
There are a high number of very interesting job opportunities. Each has a high number
of parameters. Ron has a very long career with a multitude of experience. He can optimise
his CV to address different job parameters.

## Methodology
This multi-variate problem should be solved using the following methodology:
1. All interesting job opportunities will be downloaded and summarised
2. These summaries will be stored
3. A matrix of job opportunities and their parameters will be drawn up; it
   will contain weights assigned by text analysis and ordering of parameters
   in the job opportunity; the weights will be between 0 and 1, 1 being most 
   important.
4. A matrix of weights and parameters will be drawn up from Ron's CV; the 
   calculation and form of the matrix will be similar to the above.
5. A Claude-based incremental reverse inference engine will be able to generate
   a new CV produced from the job opportunities matrix in 3; most likely this
   step will work incrementally, producing new CVs, and checking the vector
   distance to the target matrix by using Step 4. to evaluate the newly produced
   CV.
6. A manager process will allow high level control of the process, supporting the 
   following functions: 6.1. Defining the set of Job opportunities to include in the 
   next iteration of the system; 6.2. Visualization of the Matrices; 6.3. Production 
   of the CV text as Markdown, preferably using as much original text from the CV 
   as possible.

## Typical workflow

1. Job description collection
   1.2. Matrix analysis of all jobs
2. Analysis and Optimisation Session
   2.1. The user selects the Jobs to use or (all)
   2.2. A 2D matrix is created
   2.3. 2D matrix is clustered
   2.4. The user selects a CV to match with
   2.5. The CV is analysed
   2.6. The CV is transformed to fit the Job matrix
   2.7. The result can be saved, or a further transformation can be run, using the resulting CV
   2.8. The session is completed. Temporary info can be flushed.
3. CV Reconstruction
   3.1. User selects CV metadata (matrix)
   3.2. The CV is created in Human readable markdown

Workflow steps 1, 2 and 3 can be run independently of each other. 

## Project Plan

### Phase 1: MCP Foundation & Data Models
1. Setup Claude-CLI + MCP Development Environment
2. Design Storage MCP Tool with Data Models
3. Create Manager MCP Tool for Orchestration

### Phase 2: Job Opportunity Processing
4. Browser Plugin MCP Tool for Job Extraction
5. Parameter Extraction via Claude + Storage MCP

### Phase 3: CV Analysis & Matrix Generation
6. CV Parameter Extraction via Claude
7. Matrix creation via Claude
7. WONTDO:  _Matrix Engine MCP Tool (Python-based for performance)_

### Phase 4: CV Generation Engine
8. Claude-based CV Generator with Storage Integration
9. Optimization Loop via Manager MCP Tool 

### Phase 5: Visualization & Control
10. Display Manager MCP Tool (Claude CLI)
11. CV Output Generation via Storage MCP (Claude CLI)

### Phase 6: Testing & Documentation
12. MCP Tool Testing Framework
13. Documentation & User Guides

