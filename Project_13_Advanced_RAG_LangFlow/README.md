# 3. Advanced RAG — LangFlow & n8n Implementation

## Overview

Advanced RAG adds optimization layers: **pre-retrieval** (query rewriting, semantic chunking), **retrieval** (parent document, sentence window), and **post-retrieval** (re-ranking, compression). This dramatically improves answer quality over Naive RAG.

---

## 🟣 LangFlow Implementation: Advanced RAG with Re-ranking

### Flow Diagram

```
┌────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File     │───→│ Semantic Text    │───→│   Chroma        │
│   Loader   │    │ Splitter         │    │   Vector Store  │
└────────────┘    │ breakpoint=      │    └────────┬────────┘
                  │ "percentile"     │             │
                  └──────────────────┘    ┌────────┴────────┐
                                          │   Retriever     │
┌────────────┐                            │   k=20 (over-   │
│ OpenAI     │───→ (embeddings) ─────────→│   fetch)        │
│ Embeddings │                            └────────┬────────┘
└────────────┘                                     │
                                          ┌────────┴────────┐
                                          │  Cohere Rerank  │
                                          │  top_n=4        │
                                          └────────┬────────┘
                                                   │
┌────────────┐    ┌──────────────────┐    ┌────────┴────────┐
│ Chat       │───→│   Prompt         │───→│   ChatOpenAI    │
│ Input      │    │   Template       │    │   (gpt-4o-mini) │
└────────────┘    │ "Use ONLY the    │    └────────┬────────┘
                  │  context..."     │             ↓
                  └──────────────────┘    ┌─────────────────┐
                                          │   Chat Output   │
                                          └─────────────────┘
```

### Step-by-Step Setup

1. Create a new flow named **"Advanced RAG with Reranking"**.
2. Add **File Loader → Semantic Text Splitter** (set `breakpoint_threshold_type` to "percentile").
3. Connect to **OpenAI Embeddings → Chroma** vector store.
4. For the retrieval chain, add a **"Retriever"** with `k=20` (over-fetch).
5. Add a **"Cohere Rerank"** component after the retriever. Set `top_n=4` and connect your Cohere API key.
6. Add a **"Prompt"** node with template:
   ```
   Use ONLY the following context to answer.
   Context: {context}
   Question: {question}
   If the answer is not in the context, say so.
   ```
7. Connect **ChatOpenAI → Prompt → Chat Output**.
8. For HyDE: Add a separate ChatOpenAI node that generates a hypothetical answer, then feed that into the embedding/retrieval step instead of the raw query.
9. Test by comparing retrieval quality with and without re-ranking using the same queries.

### 📥 Import the Flow

Import the pre-built flow: **[advanced_rag_langflow.json](./advanced_rag_langflow.json)**

---

## 🔶 n8n Implementation: Advanced RAG

### n8n Flow Diagram

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Webhook     │───→│ OpenAI (HyDE     │───→│ AI Agent         │
│ (trigger)   │    │ query rewrite)   │    │ (with reranker)  │
└─────────────┘    └──────────────────┘    └────────┬─────────┘
                                                    │
                                           ┌────────┴─────────┐
                                           │ Vector Store      │
                                           │ Retriever (k=20)  │
                                           └──────────────────┘
                                                    │
                                           ┌────────┴─────────┐
                                           │ HTTP Request      │
                                           │ (Cohere Rerank    │
                                           │  API)             │
                                           └──────────────────┘
                                                    │
                                           ┌────────┴─────────┐
                                           │ Respond to        │
                                           │ Webhook           │
                                           └──────────────────┘
```

### 📥 Import the Flow

Import the pre-built n8n flow: **[advanced_rag_n8n_flow.json](./advanced_rag_n8n_flow.json)**

---

## 🧪 QA Testing Points

| # | Test Scenario | What to Check |
|---|---|---|
| 1 | Compare retrieval precision before/after reranking | Measure improvement with test queries |
| 2 | Test HyDE with ambiguous queries | Does it improve or degrade results? |
| 3 | Measure latency impact of re-ranking | Adds ~200–500ms |
| 4 | Semantic chunking edge cases | Test with code snippets, tables, mixed-language |
| 5 | Parent-child retrieval | Verify correct parent document is returned |

---

**Next:** [Modular RAG Flow →](../04_Modular_RAG_Flow/)
