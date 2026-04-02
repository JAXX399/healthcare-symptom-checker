# 🩺 Healthcare Symptom Checker

> A secure, multi-turn clinical symptom-checking web application powered by **Gemini 2.5 Flash** and built with a Python/Flask backend and a vanilla JavaScript frontend.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.2-000000?style=flat&logo=flask&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat&logo=google&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/Use-Educational%20Only-orange?style=flat)

---

## 🎬 Demo

https://github.com/JAXX399/healthcare-symptom-checker/assets/tutorial.mp4

> **Note:** If the video does not play above, [click here to download and watch the tutorial](./tutorial.mp4).

---

## Overview

Healthcare Symptom Checker provides an educational environment for exploring potential medical conditions based on described symptoms. It maintains full multi-turn conversational context, enabling a persistent dialogue with the AI model across an entire session.

> ⚠️ **Disclaimer:** This application is strictly for educational and academic purposes. It does **not** constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.

---

## Architecture

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, Flask 3.0.2 |
| **LLM** | Google Gemini 2.5 Flash (`google-generativeai`) |
| **Database** | SQLite — `chats` + `messages` relational schema |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Config** | `python-dotenv` for environment variable management |

---

## Features

- 🔄 **Multi-Turn Context** — Conversational memory is maintained natively via relational chat identification, fed back into every Gemini request.
- 📌 **Session Management** — Pin, rename, and delete chat histories with cascade deletion support.
- 🚨 **Emergency Protocol** — The model is system-prompted to immediately flag life-threatening symptom patterns and advise emergency services.
- 🎯 **Scope Enforcement** — Off-topic queries are politely declined; the model stays focused on health-related questions only.
- 🖥️ **Responsive UI** — Custom EKG loading animations, SVG mapping, auto-scrolling interfaces, and responsive grid/flex layouts.

---

## Project Structure

```
healthcare-symptom-checker/
├── app.py              # Flask application & API route definitions
├── database.py         # SQLite schema, init, and CRUD helpers
├── llm_service.py      # Gemini model config, system prompt, multi-turn logic
├── requirements.txt    # Python dependencies
├── .env                # API key configuration (not committed)
├── static/             # Frontend assets (HTML, CSS, JS)
└── symptom_checker.sqlite  # Local SQLite database (auto-created, not committed)
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the frontend |
| `POST` | `/api/check-symptoms` | Submit symptoms, returns AI analysis |
| `GET` | `/api/history` | Fetch all chat sessions |
| `GET` | `/api/history/<id>` | Fetch messages for a single chat |
| `PUT/PATCH` | `/api/history/<id>` | Rename a chat session |
| `PATCH` | `/api/history/<id>/pin` | Toggle pin on a chat session |
| `DELETE` | `/api/history/<id>` | Delete a chat and all its messages |
| `GET` | `/api/config` | Returns the active model name |

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JAXX399/healthcare-symptom-checker.git
cd healthcare-symptom-checker
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run the Server

```bash
python app.py
```

The app will be available at **http://localhost:5000**.

---

## Notice

This repository is developed strictly for **educational and academic use**. It does **not** constitute valid medical advice. In a real emergency, always call your local emergency services immediately.
