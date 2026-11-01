# Project Constitution (gemini.md)

## Data Schemas

### 1. Generation Request (Frontend -> Backend)
```json
{
  "user_input": "string",  // The code or requirement provided by the user
  "context": "string"      // Optional: Language preference, testing framework preference (e.g., 'python pytest')
}
```

### 2. Ollama Prompt Payload (Backend -> Ollama)
```json
{
  "model": "llama3.2",
  "prompt": "string",      // System Template + User Input
  "stream": false
}
```

### 3. Generation Response (Backend -> Frontend)
```json
{
  "test_code": "string",
  "explanation": "string",
  "status": "success | error"
}
```

## Behavioral Rules
1.  **Strict Adherence to BLAST**: Follow the protocol defined in BLAST.md.
2.  **Local First**: Rely on local Ollama instance running `llama3.2`.
3.  **Deterministic Output**: Ensure test cases are reproducible where possible.
4.  **UI-First**: The primary interface is a Chat UI.
5.  **Templated Generation**: Use a fixed, high-quality system prompt template stored in code.

## Architectural Invariants
1.  **Zero-Backend**: Application is a static HTML/JS file suitable for local execution.
2.  **Direct-to-Ollama**: Frontend `fetch()` connects directly to `localhost:11434`.
3.  **CORS**: Depends on `OLLAMA_ORIGINS="*"` configuration on host.
4.  **No Mocking Localhost**: Assume the user has Ollama running on `localhost:11434`.

