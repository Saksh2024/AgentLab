import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore';
import { 
  GitCommit,
  Play,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpRight,
  Activity,
  FileCode,
  AlertTriangle,
  ChevronRight,
  Terminal,
  BarChart3
} from 'lucide-react';


// --- Dummy Data Models for SaaS Analytics Dashboard ---
interface PromptVersionItem {
  id: string;
  versionNumber: number;
  title: string;
  timestamp: string;
  summary: string;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  scoreGain: string;
}

interface TranscriptAnalysisItem {
  id: string;
  customerProfile: string;
  failureType: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | 'None';
  successScore: number;
  latencyMs: number;
  costUsd: number;
  timestamp: string;
}


const DUMMY_RECENT_ANALYSES: TranscriptAnalysisItem[] = [
  {
    id: 'run_9482',
    customerProfile: 'Angry Traveler (No PNR Code)',
    failureType: 'Ignored customer statement',
    severity: 'High',
    successScore: 68,
    latencyMs: 640,
    costUsd: 0.0084,
    timestamp: '12 mins ago'
  },
  {
    id: 'run_9481',
    customerProfile: 'Sophia Lin (Rebooking Request)',
    failureType: null,
    severity: 'None',
    successScore: 98,
    latencyMs: 520,
    costUsd: 0.0062,
    timestamp: '45 mins ago'
  },
  {
    id: 'run_9480',
    customerProfile: 'Arthur Pendelton (Refund Policy)',
    failureType: 'Hallucination',
    severity: 'Critical',
    successScore: 42,
    latencyMs: 890,
    costUsd: 0.0112,
    timestamp: '1 hour ago'
  },
  {
    id: 'run_9479',
    customerProfile: 'Elena Rostova (Flight Delay Inquiry)',
    failureType: 'Overly verbose',
    severity: 'Medium',
    successScore: 82,
    latencyMs: 710,
    costUsd: 0.0079,
    timestamp: '3 hours ago'
  },
  {
    id: 'run_9478',
    customerProfile: 'Marcus Vance (Baggage Claim)',
    failureType: null,
    severity: 'None',
    successScore: 100,
    latencyMs: 480,
    costUsd: 0.0055,
    timestamp: '5 hours ago'
  }
];

const FAILURE_BREAKDOWN = [
  { label: 'Ignored Customer Statement', percentage: 34, count: 48, color: 'bg-rose-500', text: 'text-rose-400' },
  { label: 'Hallucination (Policy/Refund)', percentage: 26, count: 37, color: 'bg-amber-500', text: 'text-amber-400' },
  { label: 'Overly Verbose Reply', percentage: 22, count: 31, color: 'bg-yellow-500', text: 'text-yellow-400' },
  { label: 'Missed Escalation Protocol', percentage: 18, count: 25, color: 'bg-indigo-500', text: 'text-indigo-400' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { versions } = useAppStore();

  const displayVersions: PromptVersionItem[] = [...versions].reverse().slice(0, 4).map(v => {
    let title = "Custom System Instructions";
    let scoreGain = "+5.0%";
    let addedCount = 1;
    let removedCount = 0;
    let modifiedCount = 1;
    if (v.versionNumber === 1) {
      title = "Initial Base System Instructions";
      scoreGain = "Base";
      addedCount = 6;
      removedCount = 0;
      modifiedCount = 0;
    } else if (v.versionNumber === 2) {
      title = "Airline Identity & Greeting Protocol";
      scoreGain = "+5.7%";
      addedCount = 2;
      removedCount = 2;
      modifiedCount = 0;
    } else if (v.versionNumber === 3) {
      title = "PNR & Mobile Verification Fallback";
      scoreGain = "+8.5%";
      addedCount = 3;
      removedCount = 0;
      modifiedCount = 1;
    } else if (v.versionNumber === 4) {
      title = "Senior Support Specialist Guardrails";
      scoreGain = "+14.2%";
      addedCount = 4;
      removedCount = 1;
      modifiedCount = 3;
    } else if (v.versionNumber > 4) {
      title = `Evolved Instructions Branch v${v.versionNumber}`;
      scoreGain = `+${(14.2 + (v.versionNumber - 4) * 2.1).toFixed(1)}%`;
      addedCount = 2;
      removedCount = 1;
      modifiedCount = 2;
    }

    let timestampText = "Just now";
    try {
      const elapsedMs = Date.now() - new Date(v.createdAt).getTime();
      const mins = Math.floor(elapsedMs / 60000);
      if (mins < 1) timestampText = "Just now";
      else if (mins < 60) timestampText = `${mins} mins ago`;
      else {
        const hours = Math.floor(mins / 60);
        if (hours < 24) timestampText = `${hours} hours ago`;
        else timestampText = `${Math.floor(hours / 24)} days ago`;
      }
    } catch (e) {
      timestampText = "Recently";
    }

    return {
      id: v.id,
      versionNumber: v.versionNumber,
      title,
      timestamp: timestampText,
      summary: v.changeDescription,
      addedCount,
      removedCount,
      modifiedCount,
      scoreGain
    };
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ─── Top SaaS Banner & Welcome ────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-[#0d0d12] via-[#0f0f17] to-[#12121d] p-8 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                <Sparkles className="w-3 h-3" />
                AI AGENT EVALUATION & PROMPT EVOLUTION ENGINE
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Prompt Evolution & Analytics Dashboard
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl">
                Monitor system prompt versions, track simulation performance gains, diagnose transcript failure modes, and evolve AI agent instructions in real-time.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/simulator')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Run Simulation
              </button>
              <button
                onClick={() => navigate('/evolution')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <GitCommit className="w-3.5 h-3.5" />
                View Prompt Evolution
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4 Top KPI Metric Cards ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Number of Prompt Versions */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt Versions</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <GitCommit className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">{versions.length}</span>
                <span className="ml-2 text-xs text-zinc-500">versions</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Active Registry
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              {versions.length} active instructions across airline & booking personas
            </p>
          </div>

          {/* Card 2: Number of Simulations */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Simulations Run</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Play className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">1,284</span>
                <span className="ml-2 text-xs text-zinc-500">runs</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                +18% MoM
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              142 automated regression suite executions
            </p>
          </div>

          {/* Card 3: Average Improvement Score */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Avg Improvement Score</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">+28.4%</span>
                <span className="ml-2 text-xs text-zinc-500">gain</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                v1 → v4
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Mean score increased from 64.0% to 92.4%
            </p>
          </div>

          {/* Card 4: Most Common Failure Type */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Failure Mode</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-white tracking-tight block truncate">
                Ignored Customer Statement
              </span>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-rose-400 font-semibold">34% of failures</span>
                <span className="text-[10px] font-mono text-zinc-500">48 occurrences</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Middle Section: Analytics Charts & Failure Breakdown ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Prompt Evolution Accuracy Gain Over Time */}
          <div className="lg:col-span-2 border border-zinc-850 bg-[#0c0c0e] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Prompt Version Score Trajectory
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Regression success score across prompt evolution generations
                </p>
              </div>
              <button
                onClick={() => navigate('/evolution')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                Explore Timeline <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Bar / Progression Chart */}
            <div className="space-y-4 pt-2">
              {[
                { ver: 'Version v4 (Latest)', score: 92.4, color: 'bg-emerald-500', badge: '+28.4% vs base', desc: 'Added full name & phone fallback + refund guardrails' },
                { ver: 'Version v3', score: 85.0, color: 'bg-indigo-500', badge: '+21.0% vs base', desc: 'Added empathy constraints & brevity limits' },
                { ver: 'Version v2', score: 78.5, color: 'bg-blue-500', badge: '+14.5% vs base', desc: 'Introduced mandatory 6-digit PNR verification' },
                { ver: 'Version v1 (Base)', score: 64.0, color: 'bg-zinc-600', badge: 'Baseline', desc: 'Initial airline support prompt without guardrails' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{item.ver}</span>
                      <span className="text-[11px] text-zinc-500 hidden sm:inline">— {item.desc}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-zinc-400">{item.badge}</span>
                      <span className="font-extrabold text-white text-sm">{item.score}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Failure Type Distribution */}
          <div className="border border-zinc-850 bg-[#0c0c0e] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="border-b border-zinc-850 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Most Common Failure Types
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Analyzed from customer dialogue transcripts
                </p>
              </div>

              <div className="space-y-4">
                {FAILURE_BREAKDOWN.map((fail, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">{fail.label}</span>
                      <span className={`font-mono font-bold ${fail.text}`}>
                        {fail.percentage}% <span className="text-zinc-600 font-normal">({fail.count})</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800/80">
                      <div
                        className={`h-full rounded-full ${fail.color}`}
                        style={{ width: `${fail.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-zinc-400 flex items-center justify-between">
              <span>Auto-evolve prompt to fix top errors</span>
              <button
                onClick={() => navigate('/analyzer')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Analyze Now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Recent Prompt Versions & Recent Analyses ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Prompt Versions Table */}
          <div className="border border-zinc-850 bg-[#0c0c0e] rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-indigo-400" />
                    Recent Prompt Versions
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Latest evolved system prompt iterations
                  </p>
                </div>
                <button
                  onClick={() => navigate('/studio')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  View All ({versions.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {displayVersions.map((ver, idx) => (
                  <div
                    key={ver.id}
                    onClick={() => navigate('/studio')}
                    className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/60 hover:border-zinc-750 hover:bg-zinc-900/60 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                          v{ver.versionNumber} — {ver.title}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                            LATEST
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{ver.summary}</p>
                      
                      {/* Diff Badge Counters */}
                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                        {ver.addedCount > 0 && (
                          <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            +{ver.addedCount} added
                          </span>
                        )}
                        {ver.removedCount > 0 && (
                          <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            -{ver.removedCount} removed
                          </span>
                        )}
                        {ver.modifiedCount > 0 && (
                          <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            ~{ver.modifiedCount} modified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 block font-mono">
                        {ver.scoreGain}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {ver.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/studio')}
              className="w-full mt-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Open Prompt Studio
            </button>
          </div>

          {/* Recent Transcript Analyses Table */}
          <div className="border border-zinc-850 bg-[#0c0c0e] rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Recent Transcript Analyses
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    LLM evaluation & failure classification logs
                  </p>
                </div>
                <button
                  onClick={() => navigate('/analyzer')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  View All ({DUMMY_RECENT_ANALYSES.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {DUMMY_RECENT_ANALYSES.map((run) => {
                  const isPassed = run.successScore >= 80;
                  return (
                    <div
                      key={run.id}
                      onClick={() => navigate('/analyzer')}
                      className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/60 hover:border-zinc-750 hover:bg-zinc-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          {isPassed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                              {run.customerProfile}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-600">{run.id}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {run.failureType ? (
                              <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                {run.failureType}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                No Failures Detected
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {run.latencyMs}ms | ${run.costUsd.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-sm font-extrabold font-mono block ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {run.successScore}%
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {run.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => navigate('/analyzer')}
              className="w-full mt-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Analyze Complete Conversation Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
