/**
 * SSE-over-stdio Protocol for MCP Services
 *
 * Progress events are sent via stderr as JSON messages prefixed with "SSE:"
 * Regular MCP JSON-RPC continues over stdin/stdout unchanged
 */
export interface SSEProgressEvent {
    id?: string;
    event: string;
    data: any;
    timestamp: string;
}
export declare class SSEStdioReporter {
    private eventId;
    /**
     * Send progress event via stderr
     */
    sendProgress(event: string, data: any, id?: string): void;
    /**
     * Send progress start event
     */
    startProgress(operation: string, totalSteps?: number): void;
    /**
     * Send progress update event
     */
    updateProgress(operation: string, currentStep: number, totalSteps: number, message?: string): void;
    /**
     * Send progress complete event
     */
    completeProgress(operation: string, result?: any): void;
    /**
     * Send progress error event
     */
    errorProgress(operation: string, error: string): void;
    /**
     * Send generic status event
     */
    status(message: string, data?: any): void;
}
/**
 * CLI Parser for SSE-over-stdio events
 */
export declare class SSEStdioParser {
    private eventHandlers;
    /**
     * Parse stderr line and emit events if SSE format
     */
    parseLine(line: string): boolean;
    /**
     * Register event handler
     */
    on(event: string, handler: (data: any) => void): void;
    /**
     * Remove event handler
     */
    off(event: string): void;
}
export declare const sseReporter: SSEStdioReporter;
export declare const sseParser: SSEStdioParser;
//# sourceMappingURL=sse-stdio-protocol.d.ts.map