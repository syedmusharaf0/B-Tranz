# 🤖 bTranz AI Assistant — RAG-Powered Chatbot

> An intelligent, production-ready AI assistant built for **bTranz Software Solutions** using Retrieval-Augmented Generation (RAG). It answers queries about bTranz's services, supports voice input, document uploads, and maintains multi-session conversation memory.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Workflow](#architecture--workflow)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Frontend Setup](#frontend-setup)
- [How It Works](#how-it-works)
- [About bTranz](#about-btranz)

---

## Overview

The **bTranz AI Assistant** is a full-stack RAG (Retrieval-Augmented Generation) application that provides an intelligent conversational interface for bTranz Software Solutions. Users can ask questions about the company's services, upload documents for analysis, and use voice input — all powered by cutting-edge LLM and vector search technology.

The system combines **LangChain**, **Pinecone vector database**, **Groq LLM inference**, and **HuggingFace embeddings** on the backend, with a sleek **React** frontend featuring a modern dark-mode chat UI.

---

## Live Demo

| Component | URL |
|-----------|-----|
| Frontend  | https://b-tranz-ai.vercel.app |
| Backend API | https://b-tranz-backend.onrender.com/api |

---

## Features

| Feature | Description |
|---------|-------------|
| 💬 **RAG Q&A** | Ask anything about bTranz — answers grounded in the company knowledge base |
| 📄 **Document Upload** | Upload PDFs or images (JPG/PNG) and ask questions about them |
| 🎙️ **Voice Input** | Record voice queries transcribed via Whisper (Groq) and answered in real time |
| 🧠 **Conversation Memory** | Per-session memory with a sliding window of the last 5 exchanges |
| 🗂️ **Chat History** | Persistent conversation history stored in browser localStorage |
| 🌐 **General Knowledge** | Falls back to general LLM knowledge for non-bTranz queries |
| 📊 **LangSmith Tracing** | Full LLM call observability via LangSmith integration |
| 🔒 **CORS-Protected API** | Configured for secure cross-origin requests from the frontend |

---

## Tech Stack

### Backend

| Technology | Role |
|------------|------|
| **FastAPI** | High-performance Python web framework for the REST API |
| **LangChain** | Orchestration framework for RAG chains, prompts, and memory |
| **Pinecone** | Managed vector database for semantic similarity search |
| **Groq (LLaMA 3.1 8B Instant)** | Ultra-fast LLM inference for generating responses |
| **HuggingFace Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` for text vectorization |
| **Groq Whisper Large V3** | Speech-to-text transcription for voice input |
| **LangSmith** | Tracing, monitoring, and observability for LLM chains |
| **pypdf** | PDF text extraction for document upload feature |
| **Pillow + pytesseract** | OCR for image-based document uploads |
| **Uvicorn** | ASGI server for production deployment |

### Frontend

| Technology | Role |
|------------|------|
| **React 18** | Component-based UI framework |
| **Axios** | HTTP client for API communication |
| **CSS3 / Sora Font** | Custom dark-mode design with `JetBrains Mono` for code |
| **Web Speech / MediaRecorder API** | Browser-native audio recording for voice input |
| **localStorage** | Client-side persistence for conversation history |

### Infrastructure

| Service | Role |
|---------|------|
| **Render** | Backend hosting (Python/FastAPI) |
| **Vercel** | Frontend hosting (React) |
| **Pinecone (AWS us-east-1)** | Serverless vector index |

---

## Architecture & Workflow

```
User Input (Text / Voice / File)
         │
         ▼
  ┌─────────────┐
  │  React UI   │  ◄── localStorage (chat history)
  └──────┬──────┘
         │ HTTP (Axios)
         ▼
  ┌─────────────────────────────────┐
  │        FastAPI Backend          │
  │                                 │
  │  /ask ──────────────────────►  │
  │    └─ Session Memory (k=5)      │
  │    └─ LangChain Retrieval Chain │
  │         │                       │
  │         ▼                       │
  │   Pinecone Vector DB            │
  │   (similarity search, k=5)      │
  │         │                       │
  │         ▼                       │
  │   Context + History + Prompt    │
  │         │                       │
  │         ▼                       │
  │   Groq LLaMA 3.1 8B Instant    │
  │         │                       │
  │         ▼                       │
  │     Answer ◄────────────────── │
  │                                 │
  │  /voice-to-text ─────────────► │
  │    └─ Groq Whisper V3          │
  │    └─ Transcription → /ask     │
  │                                 │
  │  /upload-and-ask ────────────► │
  │    └─ pypdf / pytesseract      │
  │    └─ Direct LLM (no RAG)      │
  └─────────────────────────────────┘
         │
         ▼
  LangSmith (Tracing & Monitoring)
```

### RAG Pipeline Detail

1. **Embedding**: User query is converted to a 384-dimensional vector using `all-MiniLM-L6-v2`
2. **Retrieval**: Top-5 most semantically similar chunks are fetched from Pinecone (`btranz-docs` namespace)
3. **Augmentation**: Retrieved context is injected into a structured system prompt alongside conversation history
4. **Generation**: Groq's LLaMA 3.1 8B Instant generates a grounded, professional response
5. **Memory**: The exchange is saved to the session's `ConversationBufferWindowMemory` (last 5 turns)

---

## Project Structure

```
btranz-ai/
│
├── backend/
│   ├── app.py                  # Main FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component (chat UI)
│   │   └── App.css             # Dark-mode styling
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### `POST /ask`
General question answering with RAG and session memory.

**Request:**
```json
{
  "question": "What Oracle services does bTranz offer?",
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "answer": "bTranz offers Oracle Fusion Cloud ERP, Oracle EBS, OBIEE...",
  "session_id": "abc123"
}
```

---

### `POST /upload-and-ask`
Upload a PDF or image and ask a question about its contents.

**Request:** `multipart/form-data`
- `file`: PDF, JPG, or PNG file
- `question`: Question string (default: `"Summarize this document"`)

**Response:**
```json
{
  "answer": "The document covers..."
}
```

---

### `POST /voice-to-text`
Record and transcribe audio, then answer via RAG.

**Request:** `multipart/form-data`
- `audio`: WebM audio blob
- `session_id`: Session identifier

**Response:**
```json
{
  "session_id": "abc123",
  "transcript": "What mobile apps do you develop?",
  "answer": "bTranz develops iPhone, iPad, Android, and Flutter apps..."
}
```

---

### `GET /health`
Health check endpoint.

**Response:** `{ "status": "ok" }`

---

## Environment Variables

Create a `.env` file in the backend directory:

```env
PINECONE_API_KEY=your_pinecone_api_key
GROQ_API_KEY=your_groq_api_key
LANGCHAIN_API_KEY=your_langsmith_api_key       # Optional: for tracing
LANGCHAIN_TRACING_V2=true                      # Optional: enable LangSmith
LANGCHAIN_PROJECT=btranz-rag                   # Optional: project name
PORT=10000                                     # Deployment port
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Pinecone account (free tier works)
- Groq API key (free at console.groq.com)

### Backend

```bash
# Clone the repository
git clone https://github.com/your-username/btranz-ai.git
cd btranz-ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run the server
uvicorn app:app --reload --port 10000
```

The API will be available at `http://localhost:10000/api`

### Knowledge Base Initialization

On first run, the backend **automatically** detects if the Pinecone namespace is empty and uploads the bTranz knowledge base (12 curated document chunks covering services, offices, mission, vision, and client testimonials). Subsequent restarts skip the upload entirely.

---

## Frontend Setup

```bash
cd btranz-ai/frontend

# Install dependencies
npm install

# Set API URL (optional — defaults to production)
# Edit src/App.jsx: const API_URL = "http://localhost:10000/api"

# Start development server
npm run dev
```

The UI will be available at `http://localhost:5173`

---

## How It Works

### Knowledge Base
The bTranz knowledge base consists of 12 hand-crafted document chunks covering:
- Company overview and history
- Mission and vision statements
- Oracle Fusion Cloud ERP services
- Oracle EBS, OBIEE, VAT Compliance, E-Invoicing
- Web development technologies
- Mobile and CMS development
- Core capabilities and go-to-market strategy
- All three global office locations and contact details

### Smart Upload Logic
The backend checks the Pinecone vector count on startup. If vectors already exist, the upload step is skipped — preventing duplicate data and reducing cold-start time.

### Prompt Design
The system prompt instructs the AI to:
- Use **only** the retrieved context for bTranz-specific questions
- Fall back to **general knowledge** for non-bTranz queries
- Never hallucinate company-specific details
- Respond professionally with structured formatting

### Session Memory
Each client receives a unique `session_id` (UUID) generated on page load. The backend maintains a `ConversationBufferWindowMemory` per session, retaining the last 5 message pairs to enable coherent multi-turn conversations.

---

## About bTranz

**bTranz Software Solutions** is a leading IT service provider specializing in Custom Software Development, Testing, Oracle Implementations, IoT, and Web & Mobile App development.

| | |
|-|-|
| 🏢 **HQ** | Riyadh, Kingdom of Saudi Arabia |
| 🇮🇳 **India Office** | Hyderabad (Banjara Hills) |
| 🇦🇪 **UAE Office** | Ajman Media City |
| 📅 **Experience** | 10+ Years |
| 😊 **Employee Satisfaction** | 95% |
| 👥 **Talent Pool** | 100,000+ candidates |
| 🌐 **Website** | [www.btranz.com](https://www.btranz.com) |
| 📧 **Email** | info@btranz.com |

---

## License

© 2024 bTranz Software Solutions. All rights reserved.