
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, MapPin, Globe, ExternalLink, Quote } from 'lucide-react';
import { Message, ContextData } from '../types';
import { generateGeminiResponse } from '../services/geminiService';

interface GeminiAssistantProps {
  onClose: () => void;
  contextData: ContextData;
}

const QUICK_PROMPTS = [
  "Food near Village 3C?",
  "How to save energy?",
  "Turbo vs Eco mode",
  "Nearest synergy hub"
];

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onClose, contextData }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I\'m your Solar Synergy guide. With Maps Grounding active, I can help you find amenities near our charging hubs. How can I assist? 📍' }
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

    const result = await generateGeminiResponse(finalInput, contextData);
    
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: result.text, 
      grounding: result.grounding 
    }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-slide-up max-w-4xl mx-auto w-full border-x border-gray-100 shadow-sm overflow-hidden relative">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 p-6 text-white shadow-lg shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
              <MapPin size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tighter uppercase leading-none mb-1">Synergy AI</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-emerald-100 font-black uppercase tracking-widest opacity-80">MAPS GROUNDING ACTIVE</p>
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
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* Grounding Metadata Rendering */}
              {msg.grounding && msg.grounding.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                   <div className="flex items-center justify-between">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Grounded by Google Maps</p>
                     <img 
                       src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_92x30dp.png" 
                       alt="Google"
                       className="h-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help"
                       title="Powered by Google Grounding"
                     />
                   </div>

                   <div className="space-y-3">
                      {msg.grounding.map((chunk, cIdx) => {
                        const isMap = !!chunk.maps;
                        const data = chunk.maps || chunk.web;
                        if (!data) return null;

                        return (
                          <div key={cIdx} className="space-y-2">
                            <a 
                              href={data.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all group w-fit"
                            >
                              {isMap ? <MapPin size={14} className="text-emerald-500" /> : <Globe size={14} className="text-blue-500" />}
                              <span className="max-w-[200px] truncate">{data.title || (isMap ? "Location" : "Verified Source")}</span>
                              <ExternalLink size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                            </a>

                            {/* Extract and display review snippets if they exist */}
                            {chunk.maps?.placeAnswerSources?.reviewSnippets && chunk.maps.placeAnswerSources.reviewSnippets.length > 0 && (
                              <div className="pl-4 space-y-2">
                                {chunk.maps.placeAnswerSources.reviewSnippets.map((snippet: any, sIdx: number) => (
                                  <div key={sIdx} className="flex gap-2 p-2 bg-emerald-50/30 rounded-xl border border-emerald-50 text-[10px] text-gray-600 italic">
                                    <Quote size={8} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <p>{snippet.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}

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
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Locating & Searching...</span>
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
              placeholder="Find a cafe near Village 3C..."
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
           Grounded by Google Maps & Search • Solar Synergy v2.6
        </p>
      </div>
    </div>
  );
};
