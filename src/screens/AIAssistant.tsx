import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { CalendarEvent, Member, ChatMessage } from '../types';
import AIChat from '../components/AIChat';

interface AIAssistantProps {
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
  events: CalendarEvent[];
  members: Member[];
}

export default function AIAssistant({ messages, onUpdateMessages, events, members }: AIAssistantProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex flex-col bg-navy">
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-slate-700 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-card flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-slate-400" aria-hidden="true" />
        </button>
        <h1 className="text-white font-heading font-bold text-lg">AI Assistant</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChat
          messages={messages}
          onNewMessage={onUpdateMessages}
          events={events}
          members={members}
        />
      </div>
    </div>
  );
}
