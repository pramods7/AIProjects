# Static App Architecture SOP

## Goal
Provide a Premium Chat UI that interacts directly with a local Ollama instance to generate test cases.

## Inputs
- **User Message**: Code snippet or test requirement.
- **Context Config**: Model selection (fixed to `llama3.2`).

## Logic Flow (Layer 2: Navigation - app.js)
1.  **Initialize**:
    -   Check if Ollama is reachable (fetch `http://localhost:11434`).
    -   If not, show error overlay.
2.  **User Input**:
    -   User types code/prompt -> Click "Generate".
    -   UI shows loading state (premium micro-animation).
3.  **Prompt Construction**:
    -   Wrap user input in the "System Prompt Template" defined in `gemini.md`.
4.  **Execution (Layer 3: Tools - inside app.js)**:
    -   `fetch('http://localhost:11434/api/generate', ...)`
    -   Handle streaming response (if desired) or wait for full response.
    -   **Edge Case**: CORS error -> Display help modal about `OLLAMA_ORIGINS`.
5.  **Output Rendering**:
    -   Parse Markdown from LLM response.
    -   Render Code Blocks with syntax highlighting.

## Directory Structure
- `frontend/index.html`: Main entry.
- `frontend/styles.css`: CSS Variables + Glassmorphism.
- `frontend/app.js`: Logic + API Calls.
