import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Lightbulb,
  CornerDownRight
} from 'lucide-react';
import { API_BASE } from '../../../config';

export const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const { conversations } = useAppStore();
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    conversations[0]?.id || ''
  );

  const selectedRun = conversations.find(c => c.id === selectedConversationId) || conversations[0];

  const handleSelectRun = (id: string) => {
    setSelectedConversationId(id);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Runs List (Left Sidebar) */}
      <div className="w-80 border-r border-[#1f1f23] bg-[#0c0c0e] flex flex-col justify-between shrink-0">
        <div className="p-4 border-b border-[#1f1f23]">
          <h2 className="text-xs font-bold text-zinc-350 uppercase tracking-wider">Historical Runs</h2>
          <p className="text-[10px] text-zinc-550 mt-1">Select a past run to view checklist compliance scores.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.map((run) => {
            const isSuccess = run.status === 'completed';
            const date = new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div 
                key={run.id}
                onClick={() => handleSelectRun(run.id)}
                className={`p-3 rounded border text-xs cursor-pointer transition-all space-y-2 ${
                  run.id === selectedRun?.id 
                    ? 'border-indigo-600 bg-indigo-600/[0.02]' 
                    : 'border-zinc-850 bg-zinc-950 hover:border-zinc-850 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">
                    {run.testCaseId === 'tc_angry_no_code' ? 'Angry Traveler' : run.testCaseId === 'tc_polite_rebook' ? 'Sophia Lin' : 'Arthur Pendelton'}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-650">{date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span className={`text-[10px] font-medium ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {run.analysisReport?.successScore || 0}% Success
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                    v{run.promptVersionId === 'ver_v1' ? '1' : '2'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Log (Middle) */}
      <div className="flex-1 flex flex-col justify-between bg-[#09090b]">
        <div className="h-14 border-b border-[#1f1f23] px-6 flex items-center justify-between shrink-0 bg-[#09090b]">
          <h3 className="text-xs font-bold text-zinc-250 uppercase tracking-wider">Conversation Transcript</h3>
          <span className="text-[10px] font-mono text-zinc-500">Run ID: {selectedRun?.id}</span>
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-4">
          {selectedRun ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {selectedRun.messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isOverride = msg.sender === 'engineer_override';
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-md rounded-lg p-4 text-xs leading-relaxed space-y-1.5 ${
                      isAgent 
                        ? 'bg-[#0e0e11] border border-zinc-800 text-zinc-200' 
                        : isOverride
                        ? 'bg-zinc-950 border border-dashed border-indigo-650 text-indigo-300'
                        : 'bg-indigo-600/10 border border-indigo-500/20 text-zinc-200'
                    }`}>
                      <div className="flex items-center justify-between gap-4 border-b border-zinc-850 pb-1 mb-1">
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                          {isAgent ? 'Voice Agent (LLM)' : isOverride ? 'Engineer Override' : 'Customer'}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-650">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-550 text-xs">
              Select a simulation log to read the dialogue.
            </div>
          )}
        </div>
      </div>

      {/* Analysis Report Card (Right Sidebar) */}
      <div className="w-96 border-l border-[#1f1f23] bg-[#0c0c0e] p-6 overflow-y-auto space-y-6 shrink-0">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-150 uppercase tracking-wider">Evaluation Report</h2>
          <p className="text-[10px] text-zinc-550">LLM compiler breakdown against configured checklist guidelines.</p>
        </div>

        {selectedRun?.analysisReport ? (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-zinc-850 rounded bg-[#08080a] space-y-1">
                <span className="text-[9px] font-mono text-zinc-550 block uppercase tracking-wider">Average Latency</span>
                <span className="text-sm font-bold text-zinc-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {selectedRun.analysisReport.latencyMs}ms
                </span>
              </div>
              <div className="p-3 border border-zinc-850 rounded bg-[#08080a] space-y-1">
                <span className="text-[9px] font-mono text-zinc-550 block uppercase tracking-wider">Execution Cost</span>
                <span className="text-sm font-bold text-zinc-200 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                  ${selectedRun.analysisReport.costUsd.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Sentiment Gauge */}
            <div className="p-4 border border-zinc-850 rounded bg-[#08080a] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                <span>Customer Sentiment</span>
                <span className={selectedRun.analysisReport.sentimentScore > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedRun.analysisReport.sentimentScore > 0 ? 'Friendly' : 'Irritated'}
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${selectedRun.analysisReport.sentimentScore > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.round(((selectedRun.analysisReport.sentimentScore + 1) / 2) * 100)}%` }}
                />
              </div>
            </div>

            {/* Checklist results */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Checklist Compliance</h3>
              <div className="space-y-2">
                {selectedRun.analysisReport.checklistResults.map((result, idx) => (
                  <div key={idx} className="p-2.5 border border-zinc-850 rounded bg-zinc-950/40 text-xs flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {result.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-zinc-350">{result.criteria}</span>
                      <p className="text-[10px] text-zinc-550 leading-relaxed">{result.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause Details */}
            <div className="p-4 border border-zinc-850 rounded bg-[#08080a] space-y-2.5">
              <h4 className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Root Cause Analysis
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {selectedRun.analysisReport.rootCauseExplanation}
              </p>
            </div>

            {/* LLM Suggestions */}
            {selectedRun.analysisReport.suggestedPromptImprovement && (
              <div className="p-4 border border-indigo-950/40 rounded bg-indigo-600/[0.01] space-y-2.5">
                <h4 className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                  Auto-evolution Suggestion
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                  "{selectedRun.analysisReport.suggestedPromptImprovement}"
                </p>
                <div className="pt-2">
                  <button 
                    onClick={async () => {
                      try {
                        await fetch(`${API_BASE}/versions/`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            previous_prompt: "You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.\nIf the booking reference is missing, ask for their registered phone number as a fallback.\nKeep responses empathetic and under 3 sentences.",
                            improved_prompt: "You are a professional AI customer support specialist for SwiftAir. Greet the customer warmly and request their 6-digit PNR booking reference before discussing cancellation policies.\nIf the PNR is missing, ask for their registered mobile number and full name as a fallback.\nAlways maintain an empathetic, calm tone and restrict replies to 2-3 concise sentences.\nNever hallucinate refund amounts or policy waivers.\n" + (selectedRun.analysisReport?.suggestedPromptImprovement || ""),
                            summary_of_changes: selectedRun.analysisReport?.suggestedPromptImprovement || "Evolved system prompt based on evaluation report."
                          })
                        });
                      } catch (err) {
                        console.warn('Backend SQLite offline:', err);
                      }
                      navigate('/evolution');
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 group transition-colors"
                  >
                    Evolve system prompt
                    <CornerDownRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 border border-zinc-850 rounded-lg bg-zinc-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <span className="text-[11px] text-zinc-550">This session has no compiled evaluations.</span>
            <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-[10px] text-white font-semibold transition-colors">
              Analyze Transcript
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
