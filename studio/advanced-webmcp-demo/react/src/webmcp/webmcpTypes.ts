/**
 * Structural types for the experimental WebMCP browser API (`document.modelContext`), which is
 * absent from `lib.dom`. Covers only what this example calls.
 */
export interface WebMcpToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
}

/**
 * A tool result in the MCP `CallToolResult` shape the browser expects back from `execute`. Returning
 * a bare string instead leaves the browser with no `content` to render, so the call reports success
 * with no output.
 */
export interface WebMcpToolResult {
    content: Array<{ type: 'text'; text: string }>;
}

export interface WebMcpToolDescriptor {
    name: string;
    description: string;
    /** JSON Schema for the tool's arguments. The browser serialises it, so the shape is opaque here. */
    inputSchema: unknown;
    annotations?: WebMcpToolAnnotations;
    execute(args: Record<string, unknown>): WebMcpToolResult | Promise<WebMcpToolResult>;
}

export interface WebMcpRegisterOptions {
    signal?: AbortSignal;
    exposedTo?: string[];
}

/** A tool as reported back by `getTools()`: `inputSchema` arrives as a serialised JSON string. */
export interface WebMcpAdvertisedToolDescriptor {
    name: string;
    description: string;
    inputSchema: string;
}

export interface WebMcpModelContext {
    registerTool(descriptor: WebMcpToolDescriptor, options?: WebMcpRegisterOptions): Promise<void>;
    getTools(options?: { fromOrigins?: string[] }): Promise<WebMcpAdvertisedToolDescriptor[]>;
    executeTool(
        tool: WebMcpAdvertisedToolDescriptor,
        input: string,
        options?: { signal?: AbortSignal }
    ): Promise<WebMcpToolResult | string>;
    addEventListener(type: 'toolchange', listener: () => void): void;
    removeEventListener(type: 'toolchange', listener: () => void): void;
}

declare global {
    interface Document {
        /** Optional by design: the absence of this property is the feature detection for WebMCP. */
        modelContext?: WebMcpModelContext;
    }
}
