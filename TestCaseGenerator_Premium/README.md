# AI Test Crafter (Premium Test Case Generator)

This project is a premium version of the AI Test Case Generator, built as a featuring an advanced glassmorphism interface and modular FastAPI backend.

## 🚀 Enhancements
- **Premium UI**: Modern glassmorphism design with animated transitions and a professional tech aesthetic.
- **Improved Prompting**: Advanced system prompt for generating more structured and useful manual test cases.
- **Modular Architecture**: Clean separation between AI logic (`tools/`), API (`backend/`), and the user interface (`frontend/`).
- **Interactive Features**: One-click markdown copy, loading states, and smooth scrolling.

## 🛠️ Tech Stack
- **AI**: Ollama with Llama 3.2 (Local & Private).
- **Backend**: FastAPI (Python).
- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism), Lucide Icons, Marked.js.

## 🏃 How to Run
1. Ensure **Ollama** is installed and running.
2. Pull the required model: `ollama pull llama3.2`.
3. Double-click `run_app.bat` to install dependencies and start both the backend and frontend.

## 📁 Project Structure
- `backend/`: FastAPI server.
- `tools/`: AI interaction logic.
- `frontend/`: UI files (HTML, CSS, Assets).
- `requirements.txt`: Python dependencies.
- `run_app.bat`: Automated startup script.
