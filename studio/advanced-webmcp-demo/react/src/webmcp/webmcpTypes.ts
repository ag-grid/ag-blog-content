/**
 * Types for the experimental WebMCP browser API (`document.modelContext`), which is not yet in
 * `lib.dom`. Covers only what this demo uses.
 */

/**
 * A tool result in the MCP `CallToolResult` shape. The browser renders the `content` array, so a
 * bare string would report success with no output.
 */
export interface WebMcpToolResult {
    content: Array<{ type: 'text'; text: string }>;
}

export interface WebMcpToolDescriptor {
    name: string;
    description: string;
    /** JSON Schema for the tool's arguments. */
    inputSchema: unknown;
    annotations?: { readOnlyHint?: boolean };
    execute(args: Record<string, unknown>): Promise<WebMcpToolResult>;
}

export interface WebMcpModelContext {
    /** Registers a tool until `signal` is aborted. */
    registerTool(descriptor: WebMcpToolDescriptor, options?: { signal?: AbortSignal }): Promise<void>;
    addEventListener(type: 'toolchange', listener: () => void): void;
    removeEventListener(type: 'toolchange', listener: () => void): void;
}

declare global {
    interface Document {
        /** Absent in browsers without WebMCP, which makes this property the feature detection. */
        modelContext?: WebMcpModelContext;
    }
}
