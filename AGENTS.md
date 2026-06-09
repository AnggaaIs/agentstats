<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AgentStats Project Contract

- Product name: **AgentStats** (`agentstats` in package names, paths, and database identifiers).
- Never introduce any previous product name.
- Runtime framework: Next.js 16.2.7 with React 19. Read the bundled Next.js docs before changing framework behavior.
- Prefer Server Components. Keep client boundaries small and explicit.
- Treat `AGENT_PROMPT.md` as the product specification and `README.md` as the current implementation status.
