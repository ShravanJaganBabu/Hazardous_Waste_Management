import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, ArrowRight, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actions?: Array<{ label: string; url: string }>;
  timestamp: Date;
}

export const HazTrackAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am **HazTrack AI Intelligence Assistant**. I monitor real-time shipments, investigations, mass balance metrics, and CPCB compliance across all active corridors. How can I assist you?',
      actions: [
        { label: 'Show Delayed Shipments', url: '/admin/shipments' },
        { label: 'Why is HW-2026-00124 Under Investigation?', url: '/admin/investigations' },
        { label: 'Check CPCB Compliance', url: '/admin/compliance' },
      ],
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customQuery?: string) => {
    const queryToSend = customQuery || inputQuery;
    if (!queryToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/query', { query: queryToSend });

      if (res.data?.success) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.data.response,
          actions: res.data.suggestedActions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered an issue retrieving real-time intelligence data from the HazTrack database. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (url: string) => {
    navigate(url);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-void border border-em text-em shadow-[0_0_30px_rgba(57,255,176,0.4)] flex items-center gap-3 hover:bg-em/15 hover:scale-105 transition-all duration-300 group"
          title="Open HazTrack AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-em group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
          </div>
          <span className="hidden sm:inline font-mono text-xs font-bold text-white tracking-wider">
            HAZTRACK <span className="text-em">AI</span>
          </span>
        </button>
      )}

      {/* AI Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[540px] max-h-[85vh] rounded-2xl bg-panel/95 border border-em/40 shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(57,255,176,0.2)] backdrop-blur-xl flex flex-col overflow-hidden animate-rise">
          {/* Header */}
          <div className="p-4 border-b border-line bg-void/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-em/15 border border-em/40 flex items-center justify-center text-em shadow-[0_0_15px_rgba(57,255,176,0.2)]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  HazTrack AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-cyan" />
                </h4>
                <span className="font-mono text-[9px] text-em tracking-widest block">
                  REAL-TIME DATABASE INTELLIGENCE
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-void border border-line flex items-center justify-center text-mist hover:text-white hover:border-em transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-em text-black font-medium rounded-br-none shadow-[0_0_15px_rgba(57,255,176,0.2)]'
                      : 'bg-void/80 border border-line text-white/90 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>

                {/* Structured Action Buttons */}
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-[90%]">
                    {m.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (act.url.startsWith('/')) handleActionClick(act.url);
                          else handleSend(act.label);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-em/10 border border-em/30 hover:border-em text-em text-[11px] font-mono flex items-center gap-1 transition-all"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] font-mono text-mist mt-1 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-mist font-mono text-[11px] p-2">
                <Loader2 className="w-4 h-4 animate-spin text-em" />
                <span>Querying live database records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-line bg-void/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about delayed shipments, investigations, risk..."
                className="flex-1 bg-panel border border-line rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-mist focus:outline-none focus:border-em"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-em text-black flex items-center justify-center font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
