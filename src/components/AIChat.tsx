import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, X } from 'lucide-react';
import type { ChatMessage, CalendarEvent, Member } from '../types';
import { useClaude } from '../hooks/useClaude';

const SUGGESTED_PROMPTS = [
  'Any conflicts this week?',
  'Find time for a family dinner',
  'When is everyone free Saturday?',
  'Plan a hike for the group',
];

interface AIChatProps {
  messages: ChatMessage[];
  onNewMessage: (messages: ChatMessage[]) => void;
  events: CalendarEvent[];
  members: Member[];
  onClose?: () => void;
}

export default function AIChat({ messages, onNewMessage, events, members, onClose }: AIChatProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading } = useClaude();

  const recognition = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    onNewMessage(updatedMessages);

    try {
      const response = await sendMessage(messageText, { events, members });
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      onNewMessage([...updatedMessages, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: "Sorry, I couldn't connect to the AI service. Please check your API key in .env.local.",
        timestamp: new Date().toISOString(),
      };
      onNewMessage([...updatedMessages, errorMsg]);
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      window.alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec: SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    recognition.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
    setIsListening(true);
  };

  return (
    <div className="flex flex-col h-full bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-soft">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal rounded-full flex items-center justify-center">
            <Bot size={18} className="text-text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-text-primary font-semibold font-heading text-base">TimeMesh AI</h2>
            <p className="text-teal-deep text-xs font-body">Family calendar helper</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-card text-slate-400"
            aria-label="Close chat"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot size={32} className="text-teal" aria-hidden="true" />
            </div>
            <h3 className="text-text-primary font-heading text-lg mb-2">Hi! I'm TimeMesh AI 👋</h3>
            <p className="text-slate-400 text-sm font-body mb-6 leading-relaxed">
              I can help you find overlaps, open time, and plan events. What do you need?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="bg-slate-card hover:bg-[#F5F5F3] text-slate-300 text-sm font-body py-3 px-4 rounded-xl text-left transition-colors min-h-[44px]"
                  aria-label={`Suggested prompt: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-teal rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <Bot size={14} className="text-text-primary" aria-hidden="true" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-teal text-text-primary rounded-br-sm'
                  : 'bg-slate-card text-slate-200 rounded-bl-sm'
              }`}
              aria-label={`${msg.role === 'user' ? 'You' : 'TimeMesh AI'}: ${msg.content}`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-teal rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
              <Bot size={14} className="text-text-primary" aria-hidden="true" />
            </div>
            <div className="bg-slate-card rounded-2xl rounded-bl-sm px-4 py-3" aria-live="polite" aria-label="TimeMesh AI is typing">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts (when there are messages) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {SUGGESTED_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="flex-shrink-0 bg-slate-card text-teal-deep text-xs font-body px-3 py-2 rounded-full border border-teal-500/30 whitespace-nowrap min-h-[36px]"
              aria-label={`Quick prompt: ${prompt}`}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border-soft">
        <div className="flex gap-2 items-end">
          <button
            onClick={toggleVoice}
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              isListening ? 'bg-red-500 text-text-primary' : 'bg-slate-card text-slate-400'
            }`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isListening ? 'Listening...' : 'Ask about your schedule...'}
            className="flex-1 bg-slate-card text-text-primary placeholder-slate-400 text-sm font-body rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            disabled={isListening}
            aria-label="Message input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-teal flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
            aria-label="Send message"
          >
            <Send size={18} className="text-text-primary" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
