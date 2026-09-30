# AG Studio + WebMCP

An AG Studio dashboard that publishes its AI tools to the browser through the experimental
[WebMCP](https://github.com/webmachinelearning/webmcp) API (`document.modelContext`), so a browser
agent can read and edit the dashboard directly.

## Running

```sh
npm install
npm run dev
```

In a browser without WebMCP the demo still runs, and the side panel shows what would be published.

## Connecting an LLM

The `ask_studio_analyst` tool needs an OpenAI-compatible
[Responses API](https://platform.openai.com/docs/api-reference/responses). Everything else works
without one. Configure it with two environment variables:

| Variable       | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `AI_API_URL`   | Base URL of the API, e.g. `https://api.openai.com/v1`.        |
| `AI_API_TOKEN` | API key, sent as a Bearer token. Used by the dev server only. |

Either copy `.env.example` to `.env.local` (gitignored) and fill it in:

```sh
AI_API_URL=https://api.openai.com/v1
AI_API_TOKEN=sk-...
```

or export them from your shell before running `npm run dev`:

```sh
export AI_API_URL=https://api.openai.com/v1
export AI_API_TOKEN=sk-...
```

The model defaults to `gpt-5.4-mini`; change it in `src/studio/mountStudio.ts` by passing `model`
to `openaiAdapter`.

### Deploying

`npm run build` never includes `AI_API_TOKEN`, because anything in the bundle can be read by every
visitor. To keep the analyst working on a deployed page, set `AI_API_URL` at build time to a proxy
that adds the key on the server side.

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
