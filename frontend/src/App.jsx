import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://b-tranz.onrender.com/api';

// ── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 12L22 2L14 22L11 13L2 12Z"/>
  </svg>
);
const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconStop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconChat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconAttach = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).slice(2);
const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const WELCOME_PROMPTS = [
  { icon: '🏢', text: 'What services does bTranz offer?' },
  { icon: '☁️', text: 'Tell me about Oracle Fusion Cloud' },
  { icon: '📱', text: 'What mobile apps do you develop?' },
  { icon: '🌍', text: 'Where are your global offices?' },
];

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`msg-row ${msg.role}`}>
      {msg.role === 'assistant' && (
        <div className="avatar-bot">
          <span>b</span>
        </div>
      )}
      <div className="msg-content">
        {msg.file && (
          <div className="file-pill">
            <span>{msg.fileType?.startsWith('image/') ? '🖼️' : '📄'}</span>
            <span>{msg.file}</span>
          </div>
        )}
        {msg.preview && (
          <img src={msg.preview} alt="uploaded" className="msg-img-preview" />
        )}
        <div className="msg-bubble">
          <div className="msg-text">{msg.text}</div>
        </div>
        <div className="msg-meta">
          <span className="msg-time">{formatTime(msg.ts)}</span>
          {msg.role === 'assistant' && (
            <button className="copy-btn" onClick={copy} title="Copy">
              <IconCopy /> {copied ? 'Copied!' : ''}
            </button>
          )}
        </div>
      </div>
      {msg.role === 'user' && <div className="avatar-user">U</div>}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="msg-row assistant">
      <div className="avatar-bot"><span>b</span></div>
      <div className="msg-content">
        <div className="msg-bubble">
          <div className="typing-dots">
            <span/><span/><span/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [conversations, setConversations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('btranz_convos') || '[]'); } catch { return []; }
  });
  const [activeCid, setActiveCid] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId] = useState(() => generateId());

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Save convos to localStorage
  useEffect(() => {
    localStorage.setItem('btranz_convos', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // ── Conversation management ─────────────────────────────────────────────
  const newChat = useCallback(() => {
    setActiveCid(null);
    setMessages([]);
    setInput('');
    setUploadedFile(null);
    setUploadPreview(null);
  }, []);

  const loadConvo = (cid) => {
    const c = conversations.find(c => c.id === cid);
    if (c) { setActiveCid(cid); setMessages(c.messages); }
  };

  const deleteConvo = (e, cid) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== cid));
    if (activeCid === cid) newChat();
  };

  const saveMessages = useCallback((msgs) => {
    if (!msgs.length) return;
    const title = msgs[0]?.text?.slice(0, 40) || 'New conversation';
    setConversations(prev => {
      const existing = prev.find(c => c.id === activeCid);
      if (existing) {
        return prev.map(c => c.id === activeCid ? { ...c, messages: msgs, updatedAt: Date.now() } : c);
      } else {
        const newCid = generateId();
        setActiveCid(newCid);
        return [{ id: newCid, title, messages: msgs, createdAt: Date.now(), updatedAt: Date.now() }, ...prev];
      }
    });
  }, [activeCid]);

  // ── Send message ────────────────────────────────────────────────────────
  const send = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    const userMsg = {
      id: generateId(), role: 'user', text: question,
      file: uploadedFile?.name, fileType: uploadedFile?.type,
      preview: uploadPreview, ts: Date.now(),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      let answer = '';

      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('question', question);
        const res = await axios.post(`${API_URL}/upload-and-ask`, formData);
        answer = res.data.answer;
        setUploadedFile(null); setUploadPreview(null);
      } else {
        const res = await axios.post(`${API_URL}/ask`, { question, session_id: sessionId });
        answer = res.data.answer;
      }

      const botMsg = { id: generateId(), role: 'assistant', text: answer, ts: Date.now() };
      const finalMsgs = [...newMsgs, botMsg];
      setMessages(finalMsgs);
      saveMessages(finalMsgs);
    } catch (err) {
      const errMsg = {
        id: generateId(), role: 'assistant',
        text: `❌ ${err.response?.data?.detail || 'Error connecting to server. Is the backend running?'}`,
        ts: Date.now(),
      };
      const finalMsgs = [...newMsgs, errMsg];
      setMessages(finalMsgs);
      saveMessages(finalMsgs);
    } finally {
      setLoading(false);
    }
  };

  // ── File upload ─────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) { alert('Only PDF, JPG, PNG supported.'); return; }
    setUploadedFile(file);
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = ev => setUploadPreview(ev.target.result);
      r.readAsDataURL(file);
    } else setUploadPreview(null);
    textareaRef.current?.focus();
  };

  // ── Voice ───────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('audio', blob, 'recording.webm');
        fd.append('session_id', sessionId);
        try {
          const res = await axios.post(`${API_URL}/voice-to-text`, fd);
          const { transcript, answer } = res.data;
          const userMsg = { id: generateId(), role: 'user', text: `🎙️ "${transcript}"`, ts: Date.now() };
          const botMsg = { id: generateId(), role: 'assistant', text: answer, ts: Date.now() };
          const finalMsgs = [...messages, userMsg, botMsg];
          setMessages(finalMsgs);
          saveMessages(finalMsgs);
        } catch (err) {
          const errMsg = { id: generateId(), role: 'assistant', text: `❌ Voice error: ${err.response?.data?.detail || err.message}`, ts: Date.now() };
          setMessages(prev => [...prev, errMsg]);
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(t => t.stop());
        }
      };
      mr.start();
      setIsRecording(true);
    } catch { alert('Microphone access denied.'); }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Group convos by date ────────────────────────────────────────────────
  const groupedConvos = conversations.reduce((acc, c) => {
    const label = formatDate(c.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(c);
    return acc;
  }, {});

  const isEmpty = messages.length === 0;

  return (
    <div className="app-root">
      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-top">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {sidebarOpen && (
            <button className="new-chat-btn" onClick={newChat}>
              <IconPlus /> New chat
            </button>
          )}
        </div>

        {sidebarOpen && (
          <>
            <div className="sidebar-brand">
              <div className="brand-logo"><span>b</span>Tranz</div>
              <div className="brand-sub">AI Assistant</div>
            </div>

            <div className="convo-list">
              {Object.keys(groupedConvos).length === 0 ? (
                <div className="no-history">No conversations yet</div>
              ) : (
                Object.entries(groupedConvos).map(([label, convos]) => (
                  <div key={label} className="convo-group">
                    <div className="convo-group-label">{label}</div>
                    {convos.map(c => (
                      <div
                        key={c.id}
                        className={`convo-item ${activeCid === c.id ? 'active' : ''}`}
                        onClick={() => loadConvo(c.id)}
                      >
                        <IconChat />
                        <span className="convo-title">{c.title}</span>
                        <button className="convo-delete" onClick={e => deleteConvo(e, c.id)}>
                          <IconTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="sidebar-bottom">
              <button className="settings-btn" onClick={() => setShowSettings(s => !s)}>
                <IconSettings /> Settings
              </button>
              {showSettings && (
                <div className="settings-panel">
                  <div className="settings-title">Settings</div>
                  <div className="settings-item">
                    <span>Backend URL</span>
                    <code>{API_URL}</code>
                  </div>
                  <div className="settings-item">
                    <span>Session ID</span>
                    <code>{sessionId.slice(0, 8)}...</code>
                  </div>
                  <button className="clear-all-btn" onClick={() => {
                    setConversations([]); newChat(); setShowSettings(false);
                  }}>
                    🗑 Clear all history
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main className="main">
        {/* Header */}
        <div className="topbar">
          {!sidebarOpen && (
            <button className="sidebar-toggle topbar-toggle" onClick={() => setSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div className="topbar-title">
            {activeCid
              ? conversations.find(c => c.id === activeCid)?.title || 'Conversation'
              : 'bTranz AI'}
          </div>
          <div className="topbar-status">
            <span className="status-dot" />
            <span>Online</span>
          </div>
        </div>

        {/* Chat or Welcome */}
        <div className="chat-scroll">
          {isEmpty ? (
            <div className="welcome">
              <div className="welcome-logo"><span>b</span></div>
              <h1 className="welcome-title">How can I help you?</h1>
              <p className="welcome-sub">Ask about bTranz services, upload documents, or use voice input</p>
              <div className="prompt-grid">
                {WELCOME_PROMPTS.map((p, i) => (
                  <button key={i} className="prompt-card" onClick={() => send(p.text)}>
                    <span className="prompt-icon">{p.icon}</span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-wrap">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="input-section">
          {/* File preview bar */}
          {uploadedFile && (
            <div className="file-preview-bar">
              <span>{uploadedFile.type.startsWith('image/') ? '🖼️' : '📄'}</span>
              <span className="file-preview-name">{uploadedFile.name}</span>
              {uploadPreview && <img src={uploadPreview} alt="" className="thumb" />}
              <button className="remove-file" onClick={() => { setUploadedFile(null); setUploadPreview(null); }}>
                <IconClose />
              </button>
            </div>
          )}

          {/* Recording bar */}
          {(isRecording || isTranscribing) && (
            <div className="recording-bar">
              {isRecording ? (
                <><span className="rec-dot" />Recording... click stop when done</>
              ) : (
                <><span className="spin">⏳</span> Transcribing your voice...</>
              )}
            </div>
          )}

          <div className="input-box">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFile}
              style={{ display: 'none' }}
            />

            {/* Attach button */}
            <button
              className={`input-icon-btn ${uploadedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="Attach PDF or Image"
            >
              <IconAttach />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="input-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                isRecording ? '🔴 Recording...' :
                isTranscribing ? '⏳ Transcribing...' :
                uploadedFile ? 'Ask about your file...' :
                'Message bTranz AI...'
              }
              disabled={isRecording || isTranscribing}
              rows={1}
            />

            {/* Voice button */}
            <button
              className={`input-icon-btn voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isTranscribing ? <span className="spin-icon">⏳</span> : isRecording ? <IconStop /> : <IconMic />}
            </button>

            {/* Send button */}
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || (!input.trim() && !uploadedFile) || isRecording || isTranscribing}
            >
              <IconSend />
            </button>
          </div>

          <div className="input-hint">
            Press Enter to send · Shift+Enter for new line · 📎 attach files · 🎙️ voice input
          </div>
        </div>
      </main>
    </div>
  );
}
