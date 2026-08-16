import React, { useState, useEffect, useCallback } from 'react';
import {
  GitCommit,
  GitCompare,
  Plus,
  Clock,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Columns,
  AlignLeft,
  Sparkles,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { API_BASE } from '../../../config';

interface Version {
  id: number;
  version_number: number;
  timestamp: string;
  previous_prompt: string;
  improved_prompt: string;
  summary_of_changes: string;
}

interface DiffChunk {
  line: string;
  tag: 'equal' | 'insert' | 'delete' | 'modified';
  old_line?: string;
}

interface DiffResult {
  version_id: number;
  version_number: number;
  timestamp: string;
  summary_of_changes: string;
  previous_prompt?: string;
  improved_prompt?: string;
  diff: DiffChunk[];
}

// Fallback seed data if backend is offline
const FALLBACK_VERSIONS: Version[] = [
  {
    id: 3,
    version_number: 3,
    timestamp: '2026-08-01 18:45:00',
    previous_prompt: 'You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.\nIf the booking reference is missing, ask for their registered phone number as a fallback.\nKeep responses empathetic and under 3 sentences.',
    improved_prompt: 'You are a professional AI customer support specialist for SwiftAir. Greet the customer warmly and request their 6-digit PNR booking reference before discussing cancellation policies.\nIf the PNR is missing, ask for their registered mobile number and full name as a fallback.\nAlways maintain an empathetic, calm tone and restrict replies to 2-3 concise sentences.\nNever hallucinate refund amounts or policy waivers.',
    summary_of_changes: 'Modified role title and PNR instructions; added full name fallback verification; added anti-hallucination guardrail for refunds.'
  },
  {
    id: 2,
    version_number: 2,
    timestamp: '2026-08-01 14:30:00',
    previous_prompt: 'You are an AI support agent for an airline. Assist users with questions.',
    improved_prompt: 'You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.\nIf the booking reference is missing, ask for their registered phone number as a fallback.\nKeep responses empathetic and under 3 sentences.',
    summary_of_changes: 'Added phone number fallback verification for missing booking reference and added empathy & brevity constraints.'
  },
  {
    id: 1,
    version_number: 1,
    timestamp: '2026-08-01 10:00:00',
    previous_prompt: 'You are an AI support agent for an airline. Assist users with questions.',
    improved_prompt: 'You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.',
    summary_of_changes: 'Initial baseline prompt with brand identity and mandatory booking reference verification.'
  }
];

const FALLBACK_DIFF_V3: DiffResult = {
  version_id: 3,
  version_number: 3,
  timestamp: '2026-08-01 18:45:00',
  summary_of_changes: 'Modified role title and PNR instructions; added full name fallback verification; added anti-hallucination guardrail for refunds.',
  previous_prompt: FALLBACK_VERSIONS[0].previous_prompt,
  improved_prompt: FALLBACK_VERSIONS[0].improved_prompt,
  diff: [
    {
      line: 'You are a professional AI customer support specialist for SwiftAir. Greet the customer warmly and request their 6-digit PNR booking reference before discussing cancellation policies.',
      tag: 'modified',
      old_line: 'You are an AI customer support agent for SwiftAir. Always greet the customer warmly and ask for their booking reference number before checking cancellation policies.'
    },
    {
      line: 'If the PNR is missing, ask for their registered mobile number and full name as a fallback.',
      tag: 'modified',
      old_line: 'If the booking reference is missing, ask for their registered phone number as a fallback.'
    },
    {
      line: 'Always maintain an empathetic, calm tone and restrict replies to 2-3 concise sentences.',
      tag: 'modified',
      old_line: 'Keep responses empathetic and under 3 sentences.'
    },
    {
      line: 'Never hallucinate refund amounts or policy waivers.',
      tag: 'insert'
    }
  ]
};

const DiffLine: React.FC<{ chunk: DiffChunk; index: number }> = ({ chunk, index }) => {
  if (chunk.tag === 'modified') {
    return (
      <div className="px-4 py-2 border-l-4 border-amber-500 bg-amber-500/10 hover:bg-amber-500/15 transition-colors font-mono text-[11px] leading-relaxed my-1 rounded-r">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ~ MODIFIED INSTRUCTION
          </span>
          <span className="select-none text-zinc-500 text-[10px]">Line {String(index + 1).padStart(3, '0')}</span>
        </div>
        <div className="text-amber-200 font-medium">
          <span className="text-amber-400 mr-2 font-bold">~</span>
          {chunk.line}
        </div>
        {chunk.old_line && (
          <div className="text-[10px] text-zinc-500 line-through pl-5 mt-1 border-t border-amber-500/20 pt-1">
            <span className="text-zinc-600 font-normal mr-1">was:</span>
            {chunk.old_line}
          </div>
        )}
      </div>
    );
  }

  const styles: Record<string, string> = {
    equal:  'text-zinc-400 bg-transparent hover:bg-zinc-900/40',
    insert: 'text-emerald-300 bg-emerald-500/10 border-l-4 border-emerald-500 hover:bg-emerald-500/15 font-medium my-0.5 rounded-r',
    delete: 'text-rose-400 bg-rose-500/10 border-l-4 border-rose-500 line-through opacity-75 hover:bg-rose-500/15 my-0.5 rounded-r',
  };
  const prefix: Record<string, string> = { equal: '  ', insert: '+ ', delete: '- ' };
  const labels: Record<string, string> = {
    insert: '+ ADDED INSTRUCTION',
    delete: '- REMOVED INSTRUCTION'
  };

  return (
    <div className={`px-4 py-1.5 font-mono text-[11px] leading-relaxed transition-colors ${styles[chunk.tag] || styles.equal}`}>
      <div className="flex items-center justify-between mb-0.5">
        {labels[chunk.tag] ? (
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            chunk.tag === 'insert' 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            {labels[chunk.tag]}
          </span>
        ) : (
          <span />
        )}
        <span className="select-none text-zinc-600 text-[10px]">Line {String(index + 1).padStart(3, '0')}</span>
      </div>
      <div className="flex items-start">
        <span className="text-zinc-500 mr-2.5 font-bold select-none">{prefix[chunk.tag] || '  '}</span>
        <span className="flex-1">{chunk.line || ' '}</span>
      </div>
    </div>
  );
};

export const PromptEvolutionPage: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  // Form for manually creating a test version
  const [showForm, setShowForm] = useState(false);
  const [formPrev, setFormPrev] = useState('');
  const [formImproved, setFormImproved] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchVersions = useCallback(async () => {
    setIsLoadingVersions(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/versions/`);
      if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
      const data: Version[] = await res.json();
      setVersions(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      console.warn('Backend SQLite not reachable, using offline seed data:', err.message);
      setVersions(FALLBACK_VERSIONS);
      if (!selectedId) {
        setSelectedId(FALLBACK_VERSIONS[0].id);
      }
    } finally {
      setIsLoadingVersions(false);
    }
  }, [selectedId]);

  const fetchDiff = useCallback(async (id: number) => {
    setIsLoadingDiff(true);
    setDiff(null);
    try {
      const res = await fetch(`${API_BASE}/versions/${id}/diff`);
      if (!res.ok) throw new Error(`Failed to load diff (${res.status})`);
      const data: DiffResult = await res.json();
      setDiff(data);
    } catch (err: any) {
      console.warn('Backend SQLite diff offline, rendering fallback diff:', err.message);
      const targetVersion = versions.find(v => v.id === id) || FALLBACK_VERSIONS[0];
      setDiff({
        ...FALLBACK_DIFF_V3,
        version_id: targetVersion.id,
        version_number: targetVersion.version_number,
        timestamp: targetVersion.timestamp,
        summary_of_changes: targetVersion.summary_of_changes,
        previous_prompt: targetVersion.previous_prompt,
        improved_prompt: targetVersion.improved_prompt
      });
    } finally {
      setIsLoadingDiff(false);
    }
  }, [versions]);

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    if (selectedId !== null) {
      fetchDiff(selectedId);
    }
  }, [selectedId, fetchDiff]);

  const handleSaveVersion = async () => {
    if (!formPrev.trim() || !formImproved.trim() || !formSummary.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/versions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_prompt: formPrev,
          improved_prompt: formImproved,
          summary_of_changes: formSummary,
        }),
      });
      if (!res.ok) throw new Error('Failed to save version');
      const created: Version = await res.json();
      setShowForm(false);
      setFormPrev('');
      setFormImproved('');
      setFormSummary('');
      await fetchVersions();
      setSelectedId(created.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPrompt = () => {
    const textToCopy = diff?.improved_prompt || versions.find(v => v.id === selectedId)?.improved_prompt || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const insertCount = diff?.diff.filter(c => c.tag === 'insert').length ?? 0;
  const deleteCount = diff?.diff.filter(c => c.tag === 'delete').length ?? 0;
  const modifiedCount = diff?.diff.filter(c => c.tag === 'modified').length ?? 0;
  const equalCount  = diff?.diff.filter(c => c.tag === 'equal').length ?? 0;

  const selectedVersion = versions.find(v => v.id === selectedId);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b]">

      {/* ─── Left: Timeline ───────────────────────────────── */}
      <div className="w-80 shrink-0 border-r border-[#1f1f23] bg-[#0c0c0e] flex flex-col">
        <div className="p-5 border-b border-[#1f1f23] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-sm font-bold text-zinc-100">Prompt Evolution</h2>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Version history stored in SQLite</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-sm"
            title="Create new version"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add-version form */}
        {showForm && (
          <div className="p-4 border-b border-[#1f1f23] bg-[#09090b] space-y-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Save new prompt version
            </p>
            <textarea
              value={formPrev}
              onChange={e => setFormPrev(e.target.value)}
              placeholder="Previous prompt..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 text-[11px] resize-none focus:outline-none focus:border-zinc-700 font-mono"
            />
            <textarea
              value={formImproved}
              onChange={e => setFormImproved(e.target.value)}
              placeholder="Improved prompt..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 text-[11px] resize-none focus:outline-none focus:border-zinc-700 font-mono"
            />
            <input
              value={formSummary}
              onChange={e => setFormSummary(e.target.value)}
              placeholder="Summary of changes..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 text-[11px] focus:outline-none focus:border-zinc-700"
            />
            <button
              onClick={handleSaveVersion}
              disabled={isSaving}
              className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving to SQLite...' : 'Save Version'}
            </button>
          </div>
        )}

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingVersions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <GitCommit className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs text-zinc-500">No versions yet.</p>
              <p className="text-[10px] text-zinc-600">Click <strong>+</strong> to save your first prompt version.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline connector line */}
              <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-zinc-800 to-zinc-900" />
              <div className="space-y-3">
                {versions.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left flex items-start gap-3 rounded-xl p-3 transition-all border relative ${
                      selectedId === v.id
                        ? 'bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-600/5'
                        : 'bg-zinc-950/40 border-zinc-850/80 hover:bg-zinc-900/60 hover:border-zinc-750'
                    }`}
                  >
                    {/* Node Circle */}
                    <div className={`mt-0.5 w-7 h-7 rounded-full shrink-0 flex items-center justify-center border z-10 transition-colors ${
                      i === 0
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}>
                      <GitCommit className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">Version {v.version_number}</span>
                        {i === 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                            LATEST
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTs(v.timestamp)}
                      </p>
                      <p className="text-[11px] text-zinc-300 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                        {v.summary_of_changes}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-colors ${selectedId === v.id ? 'text-indigo-400' : 'text-zinc-700'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Diff Viewer & Details ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">

        {/* Diff top header */}
        <div className="h-14 border-b border-[#1f1f23] px-6 flex items-center justify-between shrink-0 bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-zinc-100">
              {diff ? `v${diff.version_number} — Prompt Evolution Diff` : 'Select a version'}
            </span>
            {diff && (
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                <Clock className="w-2.5 h-2.5" />
                {formatTs(diff.timestamp)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Diff badge filters/counts */}
            {diff && (
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/30 font-semibold flex items-center gap-1">
                  +{insertCount} added
                </span>
                <span className="text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-md border border-rose-500/30 font-semibold flex items-center gap-1">
                  -{deleteCount} removed
                </span>
                <span className="text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/30 font-semibold flex items-center gap-1">
                  ~{modifiedCount} modified
                </span>
                <span className="text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
                  {equalCount} unchanged
                </span>
              </div>
            )}

            {/* Toggle view mode */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'unified' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Unified Line Diff"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                Unified Diff
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'split' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Side by Side Comparison"
              >
                <Columns className="w-3.5 h-3.5" />
                Side-by-Side
              </button>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Copy improved prompt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
        </div>

        {/* Summary banner */}
        {diff && (
          <div className="px-6 py-3.5 border-b border-[#1f1f23] bg-[#0d0d11] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Summary of Changes
              </span>
              <span className="text-zinc-200 font-medium">{diff.summary_of_changes}</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              v{diff.version_number - 1 > 0 ? diff.version_number - 1 : 'BASE'} <ArrowRight className="w-3 h-3 inline text-zinc-500 mx-1" /> v{diff.version_number}
            </div>
          </div>
        )}

        {/* Error notice if backend disconnected and showing fallback */}
        {error && (
          <div className="m-4 p-3 border border-amber-500/30 bg-amber-500/10 rounded-lg flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Offline / Sandbox Mode — Displaying SQLite prompt evolution seed data.</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">Start backend at port 8000 for live SQLite CRUD</span>
          </div>
        )}

        {/* Diff or Side-by-Side Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingDiff ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
            </div>
          ) : diff ? (
            viewMode === 'unified' ? (
              /* Unified Diff View */
              <div className="space-y-1 max-w-5xl mx-auto bg-zinc-950/80 border border-zinc-850 rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-2 px-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Instruction Evolution Analysis
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Highlighted added (+), removed (-), and modified (~) instructions
                  </span>
                </div>
                {diff.diff.map((chunk, i) => (
                  <DiffLine key={i} chunk={chunk} index={i} />
                ))}
              </div>
            ) : (
              /* Split Side-by-Side View */
              <div className="grid grid-cols-2 gap-6 h-full max-w-6xl mx-auto">
                {/* Left: Previous Prompt */}
                <div className="flex flex-col border border-zinc-850 rounded-xl bg-zinc-950/60 overflow-hidden shadow-lg">
                  <div className="px-4 py-2.5 border-b border-zinc-850 bg-zinc-900/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Previous Prompt (v{diff.version_number - 1 > 0 ? diff.version_number - 1 : 'Base'})
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Before improvement</span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {diff.previous_prompt || selectedVersion?.previous_prompt || 'No previous prompt available.'}
                  </div>
                </div>

                {/* Right: Improved Prompt */}
                <div className="flex flex-col border border-indigo-500/30 rounded-xl bg-indigo-950/10 overflow-hidden shadow-lg">
                  <div className="px-4 py-2.5 border-b border-indigo-500/20 bg-indigo-900/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Improved Prompt (v{diff.version_number})
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">After evolution</span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {diff.improved_prompt || selectedVersion?.improved_prompt || 'No improved prompt available.'}
                  </div>
                </div>
              </div>
            )
          ) : !error ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <GitCompare className="w-10 h-10 text-zinc-700" />
              <p className="text-sm text-zinc-400">Select a prompt version on the left to view its evolution diff</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
