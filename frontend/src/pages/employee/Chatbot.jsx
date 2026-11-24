import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { 
  Send, 
  Sparkles, 
  Brain, 
  ShieldCheck, 
  User, 
  Bot, 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';

export default function Chatbot({ initialQuery }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mementoStatus, setMementoStatus] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What is the latest regulatory update?",
    "What changes do I need to follow?",
    "What is the deadline?",
    "What are the important compliance requirements?",
    "Explain this regulation in simple language.",
    "What did we discuss earlier?",
    "Can you remind me what we discussed earlier?"
  ];

  // Load prior conversation memory from Memento on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getChatHistory();
        if (res.history && res.history.length > 0) {
          setMessages(res.history.map(item => ({
            role: item.role,
            content: item.content,
            timestamp: item.created_at,
            isHistorical: true
          })));
        } else {
          // Welcome greeting
          setMessages([
            {
              role: 'assistant',
              content: `Hello ${user?.name || 'Employee'}, I am your AI Regulatory Compliance Assistant.\n\nI answer questions grounded strictly on our organization's published compliance circulars and directives. I also use **Memento Persistent Memory** to remember your questions across login sessions.\n\nHow can I assist you with regulatory guidelines today?`,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        // Fallback welcome message
        setMessages([
          {
            role: 'assistant',
            content: `Hello ${user?.name || 'Employee'}, I am your AI Compliance Assistant. Ask me anything about our approved regulatory guidelines.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }
    loadHistory();
  }, [user]);

  // Handle pre-filled question if passed
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [initialQuery]);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const queryToSend = questionText || input;
    if (!queryToSend.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: queryToSend.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await api.sendChatMessage(queryToSend.trim(), 'default');
      const botMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        mementoMemoryUsed: response.memento_memory_used,
        mementoContext: response.memento_context,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError(err.message || 'Chatbot service error');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to generate response. Please verify that LLM credentials are configured.'}`,
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200/80 shadow-card overflow-hidden fade-in">
      
      {/* Chatbot Header */}
      <div className="px-6 py-4 bg-navy-dark text-white flex items-center justify-between border-b border-navy-secondary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-accent text-navy-dark flex items-center justify-center font-bold shadow-md">
            <Bot className="w-6 h-6 text-navy-dark" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-tight">AI Compliance Assistant</h2>
              <span className="text-[10px] font-bold bg-teal-accent/20 text-teal-accent px-2 py-0.5 rounded-full border border-teal-accent/30">
                Grounded & Authoritative
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Only answers using approved regulatory circulars • Powered by Memento Persistent Memory
            </p>
          </div>
        </div>

        {/* Memory Partition Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-secondary/80 border border-white/10 text-xs">
          <Brain className="w-4 h-4 text-teal-accent" />
          <div className="text-left text-[11px]">
            <span className="text-slate-300 block">Memento Memory:</span>
            <span className="font-semibold text-teal-accent">Employee #{user?.id} (Private Partition)</span>
          </div>
        </div>
      </div>

      {/* Persistent Memory Continuity Notice */}
      <div className="bg-teal-light/20 px-6 py-2 border-b border-teal-accent/20 flex items-center justify-between text-xs text-navy-dark">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-accent" />
          <span className="font-medium text-[11px]">
            Conversational continuity active: You can ask "What did we discuss earlier?" even after logging out.
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-secondary hidden md:inline">
          data/memento/memento_employee_{user?.id}.db
        </span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-bg-light/60">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-navy-secondary text-white'
                    : 'bg-navy-dark text-teal-accent'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-navy-dark text-white rounded-tr-xs'
                    : msg.isError
                    ? 'bg-red-50 text-status-error border border-red-200 rounded-tl-xs'
                    : 'bg-white text-text-primary border border-gray-200/90 rounded-tl-xs'
                }`}
              >
                {/* Historical Marker */}
                {msg.isHistorical && (
                  <div className="text-[10px] text-teal-accent font-semibold flex items-center gap-1 mb-1.5 opacity-90">
                    <Brain className="w-3 h-3" />
                    <span>Recalled from Memento Memory</span>
                  </div>
                )}

                {/* Content */}
                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {/* Memento Context Badge on Assistant */}
                {msg.mementoMemoryUsed && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-teal-accent font-semibold">
                    <Brain className="w-3.5 h-3.5 text-teal-accent" />
                    <span>Incorporated prior conversational memory context from Memento</span>
                  </div>
                )}

                {/* Cited Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
                      Cited Regulatory Sources
                    </span>
                    <div className="space-y-1">
                      {msg.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-teal-accent hover:text-navy-dark font-medium underline break-all"
                        >
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span>{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`mt-2 text-[9px] text-right ${isUser ? 'text-slate-300' : 'text-gray-400'}`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-navy-dark text-teal-accent flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-xs p-4 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-secondary font-medium">Consulting regulatory documents & Memento memory...</span>
                <div className="flex gap-1 ml-2">
                  <div className="w-2 h-2 rounded-full bg-teal-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-teal-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-teal-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Carousel / Pills */}
      <div className="px-6 py-2.5 bg-gray-50/80 border-t border-gray-200 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-accent" />
            Suggested:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 hover:border-teal-accent hover:bg-teal-light/20 text-navy-dark font-medium transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about regulatory directives or previous discussions..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl text-xs text-text-primary focus:ring-2 focus:ring-teal-accent focus:border-teal-accent outline-none shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-2xl bg-teal-accent hover:bg-teal-hover text-navy-dark font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-4 h-4 text-navy-dark" />
          </button>
        </form>
        <p className="mt-2 text-[10px] text-center text-text-muted">
          AI generated responses are grounded on official published regulatory circulars. Memento persists your conversation privately.
        </p>
      </div>

    </div>
  );
}
