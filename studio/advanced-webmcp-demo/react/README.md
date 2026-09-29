# AG Studio + WebMCP

An AG Studio dashboard that publishes its AI tools to the browser through the experimental
[WebMCP](https://github.com/webmachinelearning/webmcp) API (`document.modelContext`), so a browser
agent can read and edit the dashboard directly.

## Running

```sh
npm install
npm run dev
```

The `ask_studio_analyst` handoff tool talks to the AG AI proxy, which accepts requests from
`blog.ag-grid.com` without a key. On localhost, export `AG_AI_API_DEV_TOKEN` and the dev server
passes it through; production builds never include it (see `vite.config.ts`).

The dataset (NOAA GHCN-Daily, 39 world cities) is served from `public/ghcn-cities/`.

## How it fits together

| File | Role |
| --- | --- |
| `src/studioWebMcp.ts` | Mounts Studio and drives the reconcile loop. Framework-agnostic. |
| `src/webmcp/webmcpBridge.ts` | Registers and withdraws tools with `document.modelContext`, re-registering when a schema changes. |
| `src/webmcp/toolRegistry.ts` | Every Studio tool the page could offer, including one `configure_widget__*` per widget. |
| `src/webmcp/toolCatalogue.ts` | The library vs. what is published right now. |
| `src/webmcp/metaTools.ts` | `view_tool_library`, `register_studio_tools`, `unregister_studio_tools`. |
| `src/webmcp/handoffTool.ts` | `ask_studio_analyst`: delegates a question to Studio's own data agent. |
| `src/components/WebMcpPanel.tsx` | Shows what is published and the call log. |

Only two Studio tools plus the meta tools are published up front: Chrome disables WebMCP for the
whole page if the published tools and schemas exceed its budget, so the agent pulls in the rest
by name as it needs them.
