# 🤖 AI Test Automation & Quality Engineering Suite

<div align="center">

[![AI Testing Suite](https://img.shields.io/badge/AI_Testing-Project_Suite-blueviolet?style=for-the-badge&logo=robot)](#)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![DeepEval](https://img.shields.io/badge/DeepEval-LLM_Evaluation-10B981?style=for-the-badge)](https://confident-ai.com)
[![LangFlow](https://img.shields.io/badge/LangFlow-Visual_RAG-7C3AED?style=for-the-badge)](https://langflow.org)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black?style=for-the-badge&logo=ollama)](https://ollama.com)

**A comprehensive repository of production-ready, hands-on implementations for AI-powered Quality Engineering, Autonomous Agents, and LLM Evaluation.**

*Focusing on local-first LLM orchestration, privacy-preserving test generators, advanced RAG architectures, and multimodal evaluation frameworks.*

---

[🚀 Projects Catalog](#-projects-catalog) • [🌐 Architecture & Workflows](#-architecture--workflows) • [📦 Standalone Repositories](#-standalone-repositories) • [🛠️ Getting Started](#️-getting-started)

</div>

---

## 📚 Projects Catalog

| Project Name | Primary Focus | Tech Stack | Highlights |
|---|---|---|---|
| [**Local Test Case Generator**](./LocalTestCaseGenerator) | Local LLM Test Generation | Python, Ollama, Llama 3.2, Vanilla JS | 100% private execution, B.L.A.S.T prompt protocol, streaming output |
| [**AI Test Crafter (Premium)**](./TestCaseGenerator_Premium) | Full-Stack Test Generator | FastAPI, HTML5/CSS, Llama 3.2, Marked.js | Glassmorphism UI, modular API structure, markdown export |
| [**Advanced RAG with LangFlow & n8n**](./Advanced_RAG_LangFlow) | Retrieval-Augmented Generation | LangFlow, n8n, ChromaDB, Cohere Rerank | Pre/post-retrieval optimization, semantic chunking, flow JSONs |
| [**Python AI Foundations**](./Python_AI) | Multi-Agent Foundations | Python 3.10+, CrewAI, LangChain | Role-based agent configuration, tool calling, execution loops |
| [**Multimodal DeepEval Framework**](./Multimodal_DeepEval_Framework) | Multimodal LLM Evaluation | DeepEval, Pytest, FastAPI, Groq/OpenAI | Evaluates Text + Voice + Video chatbots with 10 automated quality gates |

---

## 🌟 Deep Dives into Core Implementations

### 🔹 Local Test Case Generator (`LocalTestCaseGenerator`)
- **Objective**: Generate exhaustive, structured functional & edge test cases from User Stories and PRDs.
- **Privacy First**: Uses local inference via Ollama (`llama3.2`) — zero data leaves the infrastructure.
- **B.L.A.S.T Protocol**: Enforces context constraints, input bounds, and negative scenarios.

### 🔹 AI Test Crafter — Premium (`TestCaseGenerator_Premium`)
- **Objective**: Production-grade test generation interface featuring modern glassmorphism aesthetics.
- **Architecture**: Decoupled FastAPI backend routing AI queries to local LLMs with Markdown parsing and real-time responsiveness.

### 🔹 Advanced RAG with LangFlow & n8n (`Advanced_RAG_LangFlow`)
- **Objective**: Production-grade Retrieval-Augmented Generation with pre-retrieval and post-retrieval optimization layers.
- **Key Techniques**:
  - Semantic Text Splitting with percentile breakpoint thresholds.
  - Vector search over Chroma with over-fetch ($k=20$).
  - Post-retrieval re-ranking via **Cohere Rerank** to compress top $n=4$ high-relevance chunks.
  - Complete importable flow definitions for both **LangFlow** and **n8n**.

### 🔹 Multimodal DeepEval Testing Framework (`Multimodal_DeepEval_Framework`)
- **Objective**: End-to-end automated testing for AI chatbots across **Text**, **Voice**, and **Video**.
- **Architecture**:
  - **Native Mode**: For chatbots with native audio/video endpoints.
  - **Pipeline Mode**: Integrated STT (Whisper), frame extraction & vision models (GPT-4o/Claude) to evaluate text-only bots.
- **Evaluation Checks**:
  1. *Answer Relevancy & Faithfulness* (Text)
  2. *Prompt Injection & PII Leak Defense* (G-Eval / Safety)
  3. *Word Error Rate (WER) & Latency* (Voice)
  4. *Visual Task Completion & Frame Grounding* (Video)

---

## 📦 Standalone Repositories

Explore the dedicated repositories for related AI testing architectures:

* 🤖 [**CREW_AI_AGENT**](https://github.com/pramods7/CREW_AI_AGENT) — Autonomous multi-agent QA system integrating Jira APIs, bug triage, and test plan synthesis using CrewAI.
* 📊 [**Vector_Embeddings_Visualizer**](https://github.com/pramods7/Vector_Embeddings_Visualizer) — Interactive chunking, similarity analysis, and 2D/3D vector space explorer.
* ⚡ [**RAG_VIBE_CODING**](https://github.com/pramods7/RAG_VIBE_CODING) — End-to-end fullstack RAG web application with ChromaDB ingestion and intelligent domain routing.
* 🔄 [**SeleniumToPlaywright**](https://github.com/pramods7/SeleniumToPlaywright) — AI-powered privacy-first converter that migrates legacy Selenium Java suites to modern Playwright TypeScript.
* 🎯 [**deepEvalFramework**](https://github.com/pramods7/deepEvalFramework) — Production LLM evaluation suite for e-commerce chatbots with 22 custom DeepEval metric gates.
* 🐞 [**n8n-automated-bug-report-generator**](https://github.com/pramods7/n8n-automated-bug-report-generator) — Automated error log listener and Jira bug report creator using n8n workflows.

---

## 🛠️ Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Ollama** installed with models:
  ```bash
  ollama pull llama3.2
  ollama pull codellama
  ```

### Cloning & Running
```bash
git clone https://github.com/pramods7/AIProjects.git
cd AIProjects

# Example: Navigate to Local Test Case Generator
cd LocalTestCaseGenerator/frontend
node server.js
```

---

<div align="center">
  <sub>Maintained by <a href="https://github.com/pramods7">Pramod S.</a> • AI QA Automation Architect</sub>
</div>
