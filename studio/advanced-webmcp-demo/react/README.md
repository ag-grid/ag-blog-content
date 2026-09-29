# AG Studio + WebMCP

An AG Studio dashboard that publishes its AI tools to the browser through the experimental
[WebMCP](https://github.com/webmachinelearning/webmcp) API (`document.modelContext`), so a browser
agent can read and edit the dashboard directly.

## Running

```sh
npm install
npm run dev
```

The `ask_studio_analyst` tool talks to the AG AI proxy, which accepts requests from
`blog.ag-grid.com` without a key. On localhost, export `AG_AI_API_DEV_TOKEN` and the dev server
passes it through. Production builds never include it (see `vite.config.ts`).

In a browser without WebMCP the demo still runs, and the side panel shows what would be published.

## How it works

Chrome disables WebMCP for the whole page if the tools and schemas it publishes exceed the
browser's budget, and Studio's widget-configuration schemas are large. So the page publishes only
a few tools up front and lets the agent register the rest by name:

1. **Always published:** `view_schema` and `view_report`, plus meta tools to browse the library
   (`view_tool_library`) and register or withdraw tools from it.
2. **In the library:** every other Studio tool, including one `configure_widget__*` tool per
   widget, bound to that widget's config schema.
3. **Handoff:** `ask_studio_analyst` hands a question to Studio's own data agent, which writes its
   own queries and returns a written answer.

Each tool is called as itself rather than through a dispatcher, so the browser validates arguments
against the tool's real schema.

## Project layout

| Path                             | Role                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `src/studio/mountStudio.ts`      | Creates Studio and keeps the published tools in sync with it.                     |
| `src/webmcp/webmcpBridge.ts`     | Registers tools with `document.modelContext`; re-registers when a schema changes. |
| `src/webmcp/toolRegistry.ts`     | Every Studio tool the page can offer.                                             |
| `src/webmcp/toolCatalogue.ts`    | The library versus what is published right now.                                   |
| `src/webmcp/metaTools.ts`        | `view_tool_library`, `register_studio_tools`, `unregister_studio_tools`.          |
| `src/webmcp/handoffTool.ts`      | `ask_studio_analyst`.                                                             |
| `src/ai/openaiAdapter.ts`        | Connects Studio's AI harness to an OpenAI-compatible Responses API.               |
| `src/data/`                      | Data source definitions and the starting dashboard.                               |
| `src/components/WebMcpPanel.tsx` | Side panel showing published tools and the call log.                              |

## Data

Daily weather for 39 world cities from
[NOAA GHCN-Daily](https://www.ncei.noaa.gov/products/land-based-station/global-historical-climatology-network-daily),
served from `public/ghcn-cities/`.
