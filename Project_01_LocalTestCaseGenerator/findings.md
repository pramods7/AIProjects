# Findings & Research

## Constraints
- **CRITICAL**: No Python or Node.js runtime found in environment.
- Must use Ollama for local LLM inference.
- Model: `llama3.2`
- Search for external resources failed (API error).

## Tech Stack Pivot (Static Web App)
- Due to missing backend runtime, we must build a **Static Single Page Application (SPA)**.
- **Frontend**: HTML5 + CSS3 + Vanilla JS.
- **Connectivity**: JS `fetch()` directly to Ollama (`http://localhost:11434`).
- **CORS Requirement**: User MUST start Ollama with `OLLAMA_ORIGINS="*"` environment variable to allow browser requests.
