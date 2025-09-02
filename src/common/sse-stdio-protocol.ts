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

export class SSEStdioReporter {
  private eventId: number = 0;

  /**
   * Send progress event via stderr
   */
  sendProgress(event: string, data: any, id?: string): void {
    const progressEvent: SSEProgressEvent = {
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
  startProgress(operation: string, totalSteps?: number): void {
    this.sendProgress('progress_start', { 
      operation, 
      totalSteps,
      status: 'started' 
    });
  }

  /**
   * Send progress update event
   */
  updateProgress(operation: string, currentStep: number, totalSteps: number, message?: string): void {
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
  completeProgress(operation: string, result?: any): void {
    this.sendProgress('progress_complete', { 
      operation, 
      result,
      status: 'completed' 
    });
  }

  /**
   * Send progress error event
   */
  errorProgress(operation: string, error: string): void {
    this.sendProgress('progress_error', { 
      operation, 
      error,
      status: 'error' 
    });
  }

  /**
   * Send generic status event
   */
  status(message: string, data?: any): void {
    this.sendProgress('status', { message, ...data });
  }
}

/**
 * CLI Parser for SSE-over-stdio events
 */
export class SSEStdioParser {
  private eventHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Parse stderr line and emit events if SSE format
   */
  parseLine(line: string): boolean {
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
    } catch (error) {
      console.error('Failed to parse SSE event:', error);
      return false;
    }
  }

  /**
   * Register event handler
   */
  on(event: string, handler: (data: any) => void): void {
    this.eventHandlers.set(event, handler);
  }

  /**
   * Remove event handler
   */
  off(event: string): void {
    this.eventHandlers.delete(event);
  }
}

// Export singleton instances
export const sseReporter = new SSEStdioReporter();
export const sseParser = new SSEStdioParser();