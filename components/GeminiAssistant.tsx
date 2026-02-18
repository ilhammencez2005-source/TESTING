
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, MessageSquare, ShieldCheck, Zap, Leaf } from 'lucide-react';
import { Message, ContextData } from '../types';
import { generateGeminiResponse } from '../services/geminiService';

interface GeminiAssistantProps {
  onClose: () => void;
  contextData: ContextData;
}

const QUICK_PROMPTS = [
  "How to save energy?",
  "Unlock station help",
  "Turbo vs Eco mode",
  "Nearby stations"
];

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onClose, contextData }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I\'m your Solar Synergy guide. How can I help you optimize your UTP ride today? ✨' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (textToPulse?: string) => {
    const finalInput = textToPulse || input;
    if (!finalInput.trim()) return;

    const userMessage: Message = { role: 'user', text: finalInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiText = await generateGeminiResponse(finalInput, contextData);
    
    setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-slide-up max-w-4xl mx-auto w-full border-x border-gray-100 shadow-sm overflow-hidden relative">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white shadow-lg shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tighter uppercase leading-none mb-1">Synergy AI</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-emerald-100 font-black uppercase tracking-widest opacity-80">FLASH MODE ACTIVE</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-down`}>
            <div className={`max-w-[85%] p-5 text-sm leading-relaxed shadow-sm transition-all ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-3xl rounded-br-none shadow-emerald-100 font-medium' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-3xl rounded-bl-none'
            }`}>
              {msg.text}
              {msg.role === 'model' && idx === 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                   {QUICK_PROMPTS.map(prompt => (
                     <button 
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                     >
                       {prompt}
                     </button>
                   ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-5 rounded-3xl rounded-bl-none border border-gray-100 shadow-sm flex gap-2 items-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-3 max-w-3xl mx-auto items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="How do I use Turbo Charge?"
              className="w-full bg-gray-50 border-gray-100 border rounded-[1.5rem] px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all pr-12 font-medium"
            />
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 text-white p-4 rounded-2xl disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 group"
          >
            <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
        <p className="text-[8px] text-center text-gray-300 font-black uppercase tracking-[0.2em] mt-4">
           AI responses may vary • Solar Synergy Assist v2.1
        </p>
      </div>
    </div>
  );
};
