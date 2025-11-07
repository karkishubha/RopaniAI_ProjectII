import React, { useState, useRef, useEffect } from 'react';
import { chatAPI, ingestAPI } from '../services/api';
import './Chatbot.css';
import { FaPaperPlane, FaUpload, FaFile, FaTrash, FaRobot, FaUser } from 'react-icons/fa';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to chatbot
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendQuery(sessionId, input);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.answer || response.response || 'I received your message.',
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.detail || error.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const response = await ingestAPI.uploadDocument(file);
      
      setDocuments(prev => [...prev, {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        uploadedAt: new Date().toLocaleString()
      }]);

      const systemMessage = {
        role: 'system',
        content: `Document "${file.name}" uploaded successfully! You can now ask questions about it.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = {
        role: 'system',
        content: `Failed to upload "${file.name}". Please try again.`,
        timestamp: new Date().toLocaleTimeString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  // Clear conversation
  const handleClearConversation = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([]);
      setSessionId(`session_${Date.now()}`);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-container">
        {/* Sidebar with documents */}
        <div className="chatbot-sidebar">
          <div className="sidebar-header">
            <h3>📚 Documents</h3>
            <button
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
            >
              <FaUpload /> {uploadingDoc ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className="documents-list">
            {documents.length === 0 ? (
              <div className="no-documents">
                <FaFile />
                <p>No documents uploaded yet</p>
                <small>Upload PDF or TXT files to get started</small>
              </div>
            ) : (
              documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <FaFile className="doc-icon" />
                  <div className="doc-info">
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-meta">{doc.size} • {doc.uploadedAt}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chatbot-main">
          <div className="chat-header">
            <div className="chat-header-content">
              <FaRobot className="header-icon" />
              <div>
                <h2>Ropani AI Assistant</h2>
                <p>Ask me anything about land prices, documents, or real estate</p>
              </div>
            </div>
            <button
              className="btn-clear"
              onClick={handleClearConversation}
              disabled={messages.length === 0}
            >
              <FaTrash /> Clear
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-icon">🏡</div>
                <h3>Welcome to Ropani AI!</h3>
                <p>I'm your intelligent assistant for land and real estate queries.</p>
                <div className="suggested-questions">
                  <p><strong>Try asking:</strong></p>
                  <button onClick={() => setInput('What are the current land prices in Kathmandu?')} className="suggestion-btn">
                    What are the current land prices in Kathmandu?
                  </button>
                  <button onClick={() => setInput('How can I verify land ownership documents?')} className="suggestion-btn">
                    How can I verify land ownership documents?
                  </button>
                  <button onClick={() => setInput('What factors affect land prices in Nepal?')} className="suggestion-btn">
                    What factors affect land prices in Nepal?
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message message-${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="message-sources">
                        <strong>Sources:</strong>
                        <ul>
                          {msg.sources.map((source, idx) => (
                            <li key={idx}>
                              {typeof source === 'string' 
                                ? source 
                                : `Document Chunk ${source.metadata?.chunk_id || idx + 1} (Score: ${source.score?.toFixed(2) || 'N/A'})`
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="message-time">{msg.timestamp}</div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message message-assistant">
                <div className="message-avatar">
                  <FaRobot />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about land prices, documents, or real estate..."
                rows="1"
                disabled={loading}
              />
              <button
                className="btn-send"
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
