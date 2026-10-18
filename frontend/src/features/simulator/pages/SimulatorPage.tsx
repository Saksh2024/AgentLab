import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore';
import { 
  DOMAINS_CONFIG, 
  detectDomainFromPrompt, 
  getDomainCustomerProfiles 
} from '../../../services/mockDb';
import { 
  Send, 
  Settings, 
  Mic,
  Sparkles,
  User,
  Bot,
  Layers
} from 'lucide-react';

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\*\*.*?\*\*|\n)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />;
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-zinc-100 font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    versions,
    testCases,
    selectedDomainId,
    selectDomain,
    activeVersionId,
    activeTestCaseId,
    activeConversation,
    isSimulating,
    isAgentTyping,
    setActiveVersionId,
    setActiveTestCaseId,
    startSimulation,
    stopSimulation,
    sendMessage,
    addConversation
  } = useAppStore();

  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [inputText, setInputText] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length, activeConversation?.messages]);

  // Auto-focus input when simulation starts or agent finishes turn
  useEffect(() => {
    if (isSimulating && !isAgentTyping) {
      inputRef.current?.focus();
    }
  }, [isSimulating, isAgentTyping]);

  const handleStart = () => {
    startSimulation(activeVersionId, activeTestCaseId);
  };

  const handleSendMessage = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isAgentTyping) {
      sendMessage(inputText.trim());
      setInputText('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  };

  const currentDomain = DOMAINS_CONFIG.find(d => d.id === selectedDomainId) || DOMAINS_CONFIG[0];
  const selectedVersion = versions.find(v => v.id === activeVersionId) || versions[0];
  const domainProfiles = getDomainCustomerProfiles(selectedVersion?.systemPrompt, currentDomain.id);
  const displayProfiles = domainProfiles.length > 0 ? domainProfiles : testCases;
  const selectedTestCase = displayProfiles.find(tc => tc.id === activeTestCaseId) || displayProfiles[0];

  // Group prompt versions for current domain vs other domains
  const domainVersions = versions.filter(v => 
    v.promptId === currentDomain.promptId || 
    detectDomainFromPrompt(v.systemPrompt) === currentDomain.id
  );
  const otherVersions = versions.filter(v => 
    !domainVersions.some(dv => dv.id === v.id)
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Simulation Setup Control Pod (Left) */}
      <div className="w-80 border-r border-[#1f1f23] bg-[#0c0c0e] p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-150 uppercase tracking-wider">Simulator Deck</h2>
            <p className="text-[11px] text-zinc-550">Mount target prompts and customer behaviors to run live turn-based audio sandboxing.</p>
          </div>

          {/* Domain / Production Use Case Dropdown */}
          <div className="space-y-1.5 p-3 rounded-xl bg-zinc-950/80 border border-indigo-500/30 shadow-sm shadow-indigo-500/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
                <Layers className="w-3.5 h-3.5" />
                Domain / Use Case
              </label>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
                6 Active
              </span>
            </div>
            <select 
              value={selectedDomainId}
              onChange={(e) => selectDomain(e.target.value)}
              disabled={isSimulating}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-zinc-900 rounded-lg border border-zinc-750 focus:border-indigo-500 focus:outline-none text-zinc-100 cursor-pointer disabled:opacity-50"
            >
              {DOMAINS_CONFIG.map(d => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
              <span>Active: <strong className="text-zinc-300 font-medium">{currentDomain.shortName}</strong></span>
              <span className="font-mono text-indigo-400 font-semibold">v{selectedVersion?.versionNumber}</span>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3 h-3 text-zinc-500" />
              Target Model Provider
            </label>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-zinc-950 rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 text-zinc-300 font-mono cursor-pointer"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Google Free)</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Google Free)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Google Free)</option>
            </select>
          </div>

          {/* Prompt Version selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Target Prompt Version
              </label>
              <span className="text-[9px] font-mono text-zinc-500">
                {domainVersions.length} in this domain
              </span>
            </div>
            <select 
              value={activeVersionId}
              onChange={(e) => setActiveVersionId(e.target.value)}
              disabled={isSimulating}
              className="w-full text-xs px-3 py-2 bg-zinc-950 rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 text-zinc-300 font-mono disabled:opacity-50 cursor-pointer"
            >
              <optgroup label={`── ${currentDomain.shortName} Versions ──`}>
                {domainVersions.map(v => (
                  <option key={v.id} value={v.id}>
                    Version v{v.versionNumber} ({v.changeDescription.substring(0, 22)}...)
                  </option>
                ))}
              </optgroup>
              {otherVersions.length > 0 && (
                <optgroup label="── Other Domains ──">
                  {otherVersions.map(v => (
                    <option key={v.id} value={v.id}>
                      Version v{v.versionNumber} ({v.changeDescription.substring(0, 22)}...)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Test Case Persona Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              Customer Profile
              <span className="text-[9px] text-zinc-650 font-mono cursor-pointer hover:underline" onClick={() => navigate('/studio')}>Edit Library</span>
            </label>
            <div className="space-y-2">
              {displayProfiles.map((tc) => (
                <div 
                  key={tc.id} 
                  onClick={() => !isSimulating && setActiveTestCaseId(tc.id)}
                  className={`p-3 rounded border text-xs text-left cursor-pointer transition-all ${
                    isSimulating 
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    tc.id === (activeTestCaseId || selectedTestCase?.id)
                      ? 'border-indigo-600 bg-indigo-600/[0.02] text-zinc-200' 
                      : 'border-zinc-850 bg-zinc-950 hover:border-zinc-850 hover:bg-zinc-900/60 text-zinc-400'
                  }`}
                >
                  <span className="font-semibold block text-zinc-350">{tc.name}</span>
                  <span className="text-[10px] text-zinc-550 mt-1 block truncate">{tc.customerProfile}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trigger controls */}
        <div className="space-y-3 pt-6 border-t border-zinc-850">
          {isSimulating ? (
            <button 
              onClick={stopSimulation}
              className="w-full py-2.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 flex items-center justify-center transition-colors"
            >
              End Conversation
            </button>
          ) : (
            <button 
              onClick={handleStart}
              className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/15"
            >
              <Mic className="w-4 h-4" />
              Initiate Simulation Run
            </button>
          )}

          {/* Quick instructions indicator */}
          {selectedTestCase && (
            <div className="p-3 bg-[#08080a] border border-zinc-850 rounded text-[10px] text-zinc-500 space-y-1">
              <span className="font-semibold text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Active Scenario Parameters
              </span>
              <p className="leading-relaxed">
                <strong>Goal:</strong> {selectedTestCase.goal}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Dialogue Console (Center/Right) */}
      <div className="flex-1 flex flex-col justify-between bg-[#09090b]">
        {/* Top bar indicating active parameters */}
        <div className="h-14 border-b border-[#1f1f23] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-200">Session Workspace</span>
            {isSimulating && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Websocket Open
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeConversation && activeConversation.messages.length > 1 && (
              <button
                onClick={() => {
                  if (activeConversation) {
                    addConversation(activeConversation);
                  }
                  navigate('/analyzer');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze & Evolve Prompt
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                {currentDomain.emoji} {currentDomain.shortName}
              </span>
              <div className="text-[10px] font-mono text-zinc-500">
                Prompt: v{selectedVersion?.versionNumber} | Persona: {selectedTestCase?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Message bubble stream */}
        <div className="flex-1 p-8 overflow-y-auto space-y-4">
          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {activeConversation.messages.map((msg, idx) => {
                const isAgent = msg.sender === 'agent';
                const isLastAgentMsg = isAgent && idx === activeConversation.messages.length - 1;
                
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-2xl rounded-xl p-5 text-[13px] leading-relaxed shadow-sm ${
                      isAgent 
                        ? 'bg-[#18181b] border border-zinc-800/50 text-zinc-300' 
                        : 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isAgent ? <Bot className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-indigo-400" />}
                        <span className="font-semibold text-zinc-200">
                          {isAgent ? 'Voice Agent' : 'You'}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-600 ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-zinc-300 whitespace-pre-wrap">
                        <SimpleMarkdown content={msg.content} />
                        {isLastAgentMsg && isAgentTyping && (
                          <span className="inline-block w-2 h-3.5 bg-zinc-400 ml-1 animate-pulse align-middle"></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Agent Typing Indicator (before first chunk) */}
              {isAgentTyping && activeConversation.messages[activeConversation.messages.length - 1]?.sender !== 'agent' && (
                <div className="flex justify-start">
                  <div className="bg-[#18181b] border border-zinc-800/50 rounded-xl p-5 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-zinc-200 text-[13px] mr-2">Voice Agent</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Mic className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-zinc-300">Ready to Sandbox</h3>
                <p className="text-[11px] text-zinc-550 leading-relaxed">
                  Select a prompt version and customer behavior profile, then hit <strong>Initiate</strong> to launch a simulated turn-by-turn phone conversation script.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input panel */}
        <div className="p-6 bg-[#0c0c0e]">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-[#18181b] border border-zinc-800 rounded-2xl p-2 shadow-sm focus-within:border-zinc-700 transition-colors">
              <textarea 
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={!isSimulating || isAgentTyping}
                placeholder={isSimulating ? "Message the agent..." : "Start the simulation to begin chatting..."}
                className="flex-1 max-h-32 min-h-[44px] text-[13px] px-3 py-3 bg-transparent focus:outline-none text-zinc-200 disabled:opacity-50 placeholder:text-zinc-500 resize-none"
                rows={1}
              />
              <button 
                type="submit"
                onClick={handleSendMessage}
                disabled={!isSimulating || !inputText.trim() || isAgentTyping}
                className="h-[44px] w-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none shrink-0"
              >
                <Send className="w-4 h-4 ml-1 flex-shrink-0" />
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-zinc-600">The agent is driven by the compiled System Prompt configuration.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
