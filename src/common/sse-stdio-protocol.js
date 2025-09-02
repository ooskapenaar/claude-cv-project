"use strict";
/**
 * SSE-over-stdio Protocol for MCP Services
 *
 * Progress events are sent via stderr as JSON messages prefixed with "SSE:"
 * Regular MCP JSON-RPC continues over stdin/stdout unchanged
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseParser = exports.sseReporter = exports.SSEStdioParser = exports.SSEStdioReporter = void 0;
class SSEStdioReporter {
    eventId = 0;
    /**
     * Send progress event via stderr
     */
    sendProgress(event, data, id) {
        const progressEvent = {
            id: id || (++this.eventId).toString(),
            event,
            data,
            timestamp: new Date().toISOString()
        };
        // Send to stderr with SSE prefix for CLI to parse
        console.error(`SSE:${JSON.stringify(progressEvent)}`);
    }
    /**
     * Send progress start event
     */
    startProgress(operation, totalSteps) {
        this.sendProgress('progress_start', {
            operation,
            totalSteps,
            status: 'started'
        });
    }
    /**
     * Send progress update event
     */
    updateProgress(operation, currentStep, totalSteps, message) {
        this.sendProgress('progress_update', {
            operation,
            currentStep,
            totalSteps,
            percentage: totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0,
            message,
            status: 'in_progress'
        });
    }
    /**
     * Send progress complete event
     */
    completeProgress(operation, result) {
        this.sendProgress('progress_complete', {
            operation,
            result,
            status: 'completed'
        });
    }
    /**
     * Send progress error event
     */
    errorProgress(operation, error) {
        this.sendProgress('progress_error', {
            operation,
            error,
            status: 'error'
        });
    }
    /**
     * Send generic status event
     */
    status(message, data) {
        this.sendProgress('status', { message, ...data });
    }
}
exports.SSEStdioReporter = SSEStdioReporter;
/**
 * CLI Parser for SSE-over-stdio events
 */
class SSEStdioParser {
    eventHandlers = new Map();
    /**
     * Parse stderr line and emit events if SSE format
     */
    parseLine(line) {
        if (!line.startsWith('SSE:')) {
            return false;
        }
        try {
            const eventData = JSON.parse(line.substring(4));
            const handler = this.eventHandlers.get(eventData.event);
            if (handler) {
                handler(eventData.data);
            }
            return true;
        }
        catch (error) {
            console.error('Failed to parse SSE event:', error);
            return false;
        }
    }
    /**
     * Register event handler
     */
    on(event, handler) {
        this.eventHandlers.set(event, handler);
    }
    /**
     * Remove event handler
     */
    off(event) {
        this.eventHandlers.delete(event);
    }
}
exports.SSEStdioParser = SSEStdioParser;
// Export singleton instances
exports.sseReporter = new SSEStdioReporter();
exports.sseParser = new SSEStdioParser();
//# sourceMappingURL=sse-stdio-protocol.js.map