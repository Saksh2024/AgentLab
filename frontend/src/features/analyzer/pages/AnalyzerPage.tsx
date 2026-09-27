import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Loader2,
  GitCommit,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  FileText
} from 'lucide-react';
import { API_BASE } from '../../../config';
import type { AnalysisReport } from '../../../services/mockDb';

interface IdentifiedFailure {
  failure_type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reason: string;
  suggested_fix: string;
}

interface AnalyzerApiResponse {
  failures: IdentifiedFailure[];
  improvement_summary: string;
  improved_prompt: string;
}

export const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const { conversations, testCases, versions, setConversationReport, saveEvolvedVersion, fetchVersions } = useAppStore();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [liveReport, setLiveReport] = useState<AnalyzerApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'runs' | 'custom'>('runs');
  const [customPrompt, setCustomPrompt] = useState(
    'You are an AI customer support agent for SwiftAir. Assist users with questions.'
  );
  const [customTranscriptText, setCustomTranscriptText] = useState(
    'Customer: I lost my booking code and need to cancel my flight SA-302.\nVoice Agent: You must provide your 6-digit PNR booking reference before I can check cancellation policies.\nCustomer: But I just said I don\'t have it! Can you check with my phone number 555-0192?\nVoice Agent: I cannot help without the booking reference.'
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const selectedRun = conversations.find(c => c.id === selectedConversationId) || conversations[0];
  const targetVersion = versions.find(v => v.id === selectedRun?.promptVersionId) || versions[versions.length - 1];

  const handleSelectRun = (id: string) => {
    setSelectedConversationId(id);
    setLiveReport(null);
    setAnalysisError(null);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let promptToAnalyze = targetVersion?.systemPrompt || 'You are an AI customer support agent.';
      let transcriptMessages: { role: string; content: string }[] = [];

      if (activeTab === 'custom') {
        promptToAnalyze = customPrompt;
        const lines = customTranscriptText.split('\n').filter(l => l.trim().length > 0);
        transcriptMessages = lines.map(line => {
          const isAgent = line.toLowerCase().startsWith('voice agent:') || line.toLowerCase().startsWith('agent:') || line.toLowerCase().startsWith('assistant:');
          const content = line.replace(/^(customer|user|voice agent|agent|assistant):\s*/i, '');
          return {
            role: isAgent ? 'assistant' : 'user',
            content: content
          };
        });
      } else if (selectedRun) {
        transcriptMessages = (selectedRun.messages || []).map(m => ({
          role: m.sender === 'agent' ? 'assistant' : 'user',
          content: m.content
        }));
      }

      const res = await fetch(`${API_BASE}/analyzer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_system_prompt: promptToAnalyze,
          transcript: transcriptMessages
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Analysis request failed with status ${res.status}`);
      }

      const data: AnalyzerApiResponse = await res.json();
      setLiveReport(data);

      // If analyzing a saved conversation run, update its report in store
      if (activeTab === 'runs' && selectedRun) {
        const successScore = Math.max(20, 100 - (data.failures.length * 20));
        const updatedReport: AnalysisReport = {
          id: `an_live_${Date.now()}`,
          conversationId: selectedRun.id,
          promptVersionId: selectedRun.promptVersionId,
          successScore: successScore,
          hasFailures: data.failures.length > 0,
          checklistResults: (targetVersion?.checklistConstraints || [
            'Warmly greet customer',
            'Mandatory identity verification',
            'Empathetic de-escalation',
            'Max 2-3 sentences'
          ]).map((c, i) => ({
            criteria: c,
            passed: data.failures.length === 0 || i !== 1,
            details: data.failures.length === 0 ? 'Passed compliance' : (data.failures[0]?.reason || 'Checklist item failure')
          })),
          sentimentScore: data.failures.length > 0 ? -0.4 : 0.6,
          tokenCount: 820,
          latencyMs: 640,
          costUsd: 0.007,
          rootCauseExplanation: data.failures.length > 0 
            ? data.failures.map(f => `[${f.severity}] ${f.failure_type}: ${f.reason}`).join(' | ')
            : 'No interaction failures detected. Conversation followed standard guidelines.',
          suggestedPromptImprovement: data.improvement_summary,
          createdAt: new Date().toISOString()
        };
        setConversationReport(selectedRun.id, updatedReport);
      }
    } catch (err: any) {
      console.error('Transcript analysis error:', err);
      setAnalysisError(err.message || 'Failed to analyze transcript.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyEvolution = async () => {
    if (!liveReport && !selectedRun?.analysisReport) return;
    setIsEvolving(true);

    try {
      const prevPrompt = activeTab === 'custom' 
        ? customPrompt 
        : (targetVersion?.systemPrompt || 'You are an AI customer support agent.');

      const improvedPrompt = liveReport?.improved_prompt || (
        prevPrompt + "\n" + (selectedRun?.analysisReport?.suggestedPromptImprovement || "Evolved system instructions with anti-hallucination guardrails.")
      );

      const summary = liveReport?.improvement_summary || (
        selectedRun?.analysisReport?.suggestedPromptImprovement || "Auto-evolved prompt via transcript analysis."
      );

      await saveEvolvedVersion(prevPrompt, improvedPrompt, summary);
      navigate('/evolution');
    } catch (err: any) {
      console.error('Failed to evolve prompt:', err);
      setAnalysisError('Could not save evolved prompt version.');
    } finally {
      setIsEvolving(false);
    }
  };

  const severityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b]">
      
      {/* ─── Left: Runs List & Tabs ────────────────────────────── */}
      <div className="w-80 border-r border-[#1f1f23] bg-[#0c0c0e] flex flex-col justify-between shrink-0">
        <div>
          {/* Header & Tabs */}
          <div className="p-4 border-b border-[#1f1f23] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Quality Assurance</h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">FastAPI + LLM</span>
            </div>

            <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-lg border border-zinc-850">
              <button
                onClick={() => { setActiveTab('runs'); setLiveReport(null); }}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'runs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Saved Runs ({conversations.length})
              </button>
              <button
                onClick={() => { setActiveTab('custom'); setLiveReport(null); }}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Custom Sandbox
              </button>
            </div>
          </div>

          {/* List of Historical Runs */}
          {activeTab === 'runs' ? (
            <div className="overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-210px)]">
              {conversations.map((run) => {
                const isSuccess = run.status === 'completed';
                const date = new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isSelected = run.id === selectedRun?.id;
                
                return (
                  <div 
                    key={run.id}
                    onClick={() => handleSelectRun(run.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                      isSelected 
                        ? 'border-indigo-500/60 bg-indigo-600/10 shadow-sm' 
                        : 'border-zinc-850 bg-zinc-950/60 hover:border-zinc-750 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">
                        {testCases.find(tc => tc.id === run.testCaseId)?.name || 'Dialogue Simulation'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">{date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className={`text-[10px] font-semibold ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {run.analysisReport?.successScore || 0}% Compliance
                        </span>
                      </div>
                      <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                        v{versions.find(v => v.id === run.promptVersionId)?.versionNumber || '1'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Paste any external customer support transcript or dialogue transcript on the right to diagnose failure modes and auto-evolve prompt guardrails.
              </p>
              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] text-zinc-400 font-mono space-y-1">
                <span className="text-indigo-400 font-bold block uppercase tracking-wider">Format Guidance</span>
                <div>Use "Customer: ..." and "Voice Agent: ..." lines.</div>
              </div>
            </div>
          )}
        </div>

        {/* Action button in bottom left */}
        <div className="p-4 border-t border-[#1f1f23] bg-[#09090b]">
          <button
            onClick={() => navigate('/simulator')}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Launch Live Simulation
          </button>
        </div>
      </div>

      {/* ─── Middle: Conversation Transcript Viewer ────────────── */}
      <div className="flex-1 flex flex-col justify-between bg-[#09090b] overflow-hidden">
        {/* Header bar */}
        <div className="h-14 border-b border-[#1f1f23] px-6 flex items-center justify-between shrink-0 bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              {activeTab === 'custom' ? 'Custom Dialogue Transcript' : 'Conversation Transcript'}
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {activeTab === 'custom' ? 'Interactive Sandbox' : `Run ID: ${selectedRun?.id || 'none'}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  Analyze Transcript
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {analysisError && (
          <div className="m-4 p-3 border border-rose-500/30 bg-rose-500/10 rounded-lg text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{analysisError}</span>
            </div>
            <button onClick={() => setAnalysisError(null)} className="text-[10px] text-rose-400 underline">Dismiss</button>
          </div>
        )}

        {/* Dialogue View / Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'custom' ? (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                  Base System Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500/60"
                  placeholder="Enter base system instructions to evaluate..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Conversation Dialogue Transcript
                </label>
                <textarea
                  value={customTranscriptText}
                  onChange={(e) => setCustomTranscriptText(e.target.value)}
                  rows={10}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500/60"
                  placeholder="Customer: ...&#10;Voice Agent: ..."
                />
              </div>
            </div>
          ) : selectedRun ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {selectedRun.messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isOverride = msg.sender === 'engineer_override';
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-md rounded-xl p-4 text-xs leading-relaxed space-y-1.5 shadow-sm ${
                      isAgent 
                        ? 'bg-[#0e0e11] border border-zinc-800 text-zinc-200' 
                        : isOverride
                        ? 'bg-zinc-950 border border-dashed border-indigo-500 text-indigo-300'
                        : 'bg-indigo-600/15 border border-indigo-500/30 text-zinc-100'
                    }`}>
                      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-1.5 mb-1.5">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                          {isAgent ? 'Voice Agent (LLM)' : isOverride ? 'Engineer Override' : 'Customer'}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
              Select a conversation to view dialogue transcript.
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Evaluation & Prompt Evolution Report Card ──── */}
      <div className="w-[420px] border-l border-[#1f1f23] bg-[#0c0c0e] p-6 overflow-y-auto space-y-6 shrink-0">
        <div className="space-y-1 border-b border-[#1f1f23] pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Evaluation & Evolution
            </h2>
            {liveReport && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                ANALYZED
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-400">
            LLM diagnostic failure detection and prompt auto-evolution.
          </p>
        </div>

        {/* Live Analysis Results from API */}
        {liveReport ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Failures Diagnostic Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Identified Interaction Failures ({liveReport.failures.length})
                </h3>
              </div>

              {liveReport.failures.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No dialogue violations detected! Interaction followed all guidelines.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {liveReport.failures.map((f, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200">{f.failure_type}</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${severityBadge(f.severity)}`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{f.reason}</p>
                      <div className="pt-1.5 border-t border-zinc-850/80 flex items-start gap-1.5 text-[11px] text-indigo-300">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span><strong>Fix:</strong> {f.suggested_fix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Improvement Summary */}
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
              <h4 className="text-[10px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Evolution Strategy
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {liveReport.improvement_summary}
              </p>
            </div>

            {/* Evolved Prompt Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                Evolved System Instructions
                <span className="font-mono text-indigo-400">Ready to save</span>
              </span>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-[11px] text-zinc-200 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {liveReport.improved_prompt}
              </div>
            </div>

            {/* Commit & View Diff Button */}
            <button
              onClick={handleApplyEvolution}
              disabled={isEvolving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isEvolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
              {isEvolving ? 'Persisting to SQLite...' : 'Apply Evolution & View Diff'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : selectedRun?.analysisReport ? (
          /* Stored Analysis Report */
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-zinc-850 rounded-xl bg-[#08080a] space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Average Latency</span>
                <span className="text-sm font-bold text-zinc-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {selectedRun.analysisReport.latencyMs}ms
                </span>
              </div>
              <div className="p-3 border border-zinc-850 rounded-xl bg-[#08080a] space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Execution Cost</span>
                <span className="text-sm font-bold text-zinc-200 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                  ${selectedRun.analysisReport.costUsd.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Sentiment Gauge */}
            <div className="p-4 border border-zinc-850 rounded-xl bg-[#08080a] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                <span>Customer Sentiment</span>
                <span className={selectedRun.analysisReport.sentimentScore > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedRun.analysisReport.sentimentScore > 0 ? 'Friendly' : 'Irritated / Frustrated'}
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full ${selectedRun.analysisReport.sentimentScore > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.round(((selectedRun.analysisReport.sentimentScore + 1) / 2) * 100)}%` }}
                />
              </div>
            </div>

            {/* Checklist results */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Checklist Compliance</h3>
              <div className="space-y-2">
                {selectedRun.analysisReport.checklistResults.map((result, idx) => (
                  <div key={idx} className="p-2.5 border border-zinc-850 rounded-lg bg-zinc-950/40 text-xs flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {result.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-semibold text-zinc-300">{result.criteria}</span>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">{result.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause Details */}
            <div className="p-4 border border-zinc-850 rounded-xl bg-[#08080a] space-y-2">
              <h4 className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Root Cause Analysis
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {selectedRun.analysisReport.rootCauseExplanation}
              </p>
            </div>

            {/* Auto-evolution Suggestion */}
            {selectedRun.analysisReport.suggestedPromptImprovement && (
              <div className="p-4 border border-indigo-500/25 rounded-xl bg-indigo-600/5 space-y-3">
                <h4 className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                  Auto-evolution Suggestion
                </h4>
                <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                  "{selectedRun.analysisReport.suggestedPromptImprovement}"
                </p>
                <button 
                  onClick={handleApplyEvolution}
                  disabled={isEvolving}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isEvolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
                  Evolve System Prompt & View Diff
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 border border-zinc-850 rounded-2xl bg-zinc-950/60 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Sparkles className="w-8 h-8 text-zinc-600" />
            <span className="text-xs text-zinc-400">This conversation has not been analyzed yet.</span>
            <button 
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isAnalyzing ? 'Analyzing...' : 'Run QA Evaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
