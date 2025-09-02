#!/bin/bash

# Test script for CV Filesystem MCP Tool
# Tests the MCP tool functionality via stdio

# Dynamically determine project root (3 levels up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MCP_DIR="$PROJECT_ROOT/src/filesystem-mcp"

echo "Starting CV Filesystem MCP Tool Tests..."
echo "Project Root: $PROJECT_ROOT"
echo "MCP Directory: $MCP_DIR"

# Function to send MCP request from JSON file
send_mcp_request() {
    local json_file="$1"
    local test_name="$2"
    echo "Sending request from: $json_file"
    cd "$MCP_DIR"
    
    # Create a temporary file with single-line JSON
    local temp_file=$(mktemp)
    cat "$MCP_DIR/test/requests/$json_file" | tr -d '\n' > "$temp_file"
    echo "" >> "$temp_file"  # Add newline at end
    
    # Send via stdin redirection and capture output
    echo "Request content:"
    cat "$temp_file"
    echo -e "\nResponse:"
    CV_PROJECT_ROOT="$PROJECT_ROOT" npx tsx src/index.ts < "$temp_file"
    
    # Cleanup
    rm "$temp_file"
}

# Test 1: List tools
echo -e "\n=== Test 1: List available tools ==="
send_mcp_request "list-tools.json" "List Tools"

# Test 2: Store a test CV
echo -e "\n=== Test 2: Store test CV ==="
send_mcp_request "store-cv.json" "Store CV"

# Test 3: Store a test job
echo -e "\n=== Test 3: Store test job ==="
send_mcp_request "store-job.json" "Store Job"

# Test 4: Store a test matrix for CV
echo -e "\n=== Test 4: Store test CV matrix ==="
send_mcp_request "store-cv-matrix.json" "Store CV Matrix"

# Test 5: Store a test matrix for Job
echo -e "\n=== Test 5: Store test Job matrix ==="
send_mcp_request "store-job-matrix.json" "Store Job Matrix"

# Test 6: List all stored CVs
echo -e "\n=== Test 6: List all CVs ==="
send_mcp_request "list-cvs.json" "List CVs"

# Test 7: List all stored jobs
echo -e "\n=== Test 7: List all jobs ==="
send_mcp_request "list-jobs.json" "List Jobs"

# Test 8: Load a specific CV
echo -e "\n=== Test 8: Load specific CV ==="
send_mcp_request "load-cv.json" "Load CV"

# Test 9: Load a specific matrix
echo -e "\n=== Test 9: Load CV matrix ==="
send_mcp_request "load-matrix.json" "Load Matrix"

echo -e "\n=== All tests completed ==="
echo "Check the data/ directory for stored files:"
echo "- data/cvs/ for CV files"
echo "- data/jobs/ for job files" 
echo "- data/matrices/ for matrix files"
echo "- var/ for logs"