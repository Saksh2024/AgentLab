import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCommit,
  GitCompare,
  Plus,
  Clock,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Columns,
  AlignLeft,
  Sparkles,
  Copy,
  Check,
  Search,
  Play,
  HelpCircle,
  ShieldCheck,
  FileCode,
  X
} from 'lucide-react';
import { API_BASE } from '../../../config';
import { useAppStore } from '../../../store/useAppStore';
import { DOMAINS_CONFIG, detectDomainFromPrompt } from '../../../services/mockDb';

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

/**
 * Clean, readable GitHub/Linear style diff line.
 * Eliminates noisy badges per line in favor of clean gutters and subtle highlights.
 */
const DiffLine: React.FC<{ chunk: DiffChunk; index: number }> = ({ chunk, index }) => {
  const lineNum = String(index + 1).padStart(2, '0');

  if (chunk.tag === 'modified') {
    return (
      <div className="border-l-2 border-amber-500/80 bg-amber-500/5 hover:bg-amber-500/10 transition-colors font-mono text-xs my-1 rounded-r px-3.5 py-2">
        <div className="flex items-start gap-3">
          <span className="select-none text-amber-500/60 font-mono text-[11px] w-6 shrink-0 text-right">{lineNum}</span>
          <span className="select-none text-amber-400 font-bold shrink-0">~</span>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-amber-200 font-medium leading-relaxed break-words">{chunk.line}</p>
            {chunk.old_line && (
              <div className="pt-1.5 border-t border-amber-500/15 flex items-start gap-2 text-[11px] text-zinc-400">
                <span className="text-zinc-500 shrink-0 text-[10px] uppercase tracking-wider font-semibold">Previous:</span>
                <span className="line-through text-zinc-400/80 italic break-words">{chunk.old_line}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (chunk.tag === 'insert') {
    return (
      <div className="border-l-2 border-emerald-500/80 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors font-mono text-xs my-0.5 rounded-r px-3.5 py-1.5">
        <div className="flex items-start gap-3">
          <span className="select-none text-emerald-500/60 font-mono text-[11px] w-6 shrink-0 text-right">{lineNum}</span>
          <span className="select-none text-emerald-400 font-bold shrink-0">+</span>
          <p className="flex-1 text-emerald-200 font-medium leading-relaxed break-words">{chunk.line || ' '}</p>
        </div>
      </div>
    );
  }

  if (chunk.tag === 'delete') {
    return (
      <div className="border-l-2 border-rose-500/80 bg-rose-500/5 hover:bg-rose-500/10 transition-colors font-mono text-xs my-0.5 rounded-r px-3.5 py-1.5 opacity-80">
        <div className="flex items-start gap-3">
          <span className="select-none text-rose-500/60 font-mono text-[11px] w-6 shrink-0 text-right">{lineNum}</span>
          <span className="select-none text-rose-400 font-bold shrink-0">-</span>
          <p className="flex-1 text-rose-300 line-through leading-relaxed break-words">{chunk.line || ' '}</p>
        </div>
      </div>
    );
  }

  // Equal / Unchanged line
  return (
    <div className="hover:bg-zinc-900/40 transition-colors font-mono text-xs py-1 px-3.5">
      <div className="flex items-start gap-3">
        <span className="select-none text-zinc-600 font-mono text-[11px] w-6 shrink-0 text-right">{lineNum}</span>
        <span className="select-none text-zinc-700 shrink-0 w-3 text-center">&nbsp;</span>
        <p className="flex-1 text-zinc-400 leading-relaxed break-words">{chunk.line || ' '}</p>
      </div>
    </div>
  );
};

export const PromptEvolutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeVersionId, setActiveVersionId, selectedDomainId, selectDomain, fetchVersions: storeFetchVersions } = useAppStore();

  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>(selectedDomainId || 'all');
  const [showPurposeGuide, setShowPurposeGuide] = useState(true);

  // Form for manually saving a new version
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
      if (data.length > 0) {
        // If activeVersionId matches one of the versions, prefer selecting it
        const targetVerNum = activeVersionId ? parseInt(activeVersionId.replace('ver_v', ''), 10) : null;
        const matched = targetVerNum ? data.find(v => v.version_number === targetVerNum) : null;
        setSelectedId(matched ? matched.id : data[0].id);
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
  }, [activeVersionId]);

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
      await storeFetchVersions();
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

  const selectedVersion = versions.find(v => v.id === selectedId);
  const isVersionActive = selectedVersion ? activeVersionId === `ver_v${selectedVersion.version_number}` : false;

  const handleDeployToSimulator = () => {
    if (selectedVersion) {
      setActiveVersionId(`ver_v${selectedVersion.version_number}`);
      navigate('/simulator');
    }
  };

  const handleSetActiveOnly = () => {
    if (selectedVersion) {
      setActiveVersionId(`ver_v${selectedVersion.version_number}`);
    }
  };

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Diff metrics
  const insertCount = diff?.diff.filter(c => c.tag === 'insert').length ?? 0;
  const deleteCount = diff?.diff.filter(c => c.tag === 'delete').length ?? 0;
  const modifiedCount = diff?.diff.filter(c => c.tag === 'modified').length ?? 0;
  const equalCount = diff?.diff.filter(c => c.tag === 'equal').length ?? 0;

  // Search & domain filtered versions
  const filteredVersions = useMemo(() => {
    let result = versions;
    if (domainFilter !== 'all') {
      result = result.filter(v => {
        const dId = detectDomainFromPrompt(v.improved_prompt || v.previous_prompt);
        return dId === domainFilter;
      });
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(v =>
      `v${v.version_number}`.includes(q) ||
      (v.summary_of_changes && v.summary_of_changes.toLowerCase().includes(q))
    );
  }, [versions, domainFilter, searchQuery]);

  // Derive human-friendly purpose context
  const getContextualImpact = (summary: string) => {
    const s = (summary || '').toLowerCase();
    if (s.includes('phone') || s.includes('pnr') || s.includes('fallback') || s.includes('verification') || s.includes('name')) {
      return 'Prevents interaction dead-ends: When callers lack their primary booking or reference code, the voice agent smoothly falls back to verified name and phone lookup instead of failing the conversation.';
    }
    if (s.includes('cancellation') || s.includes('refund') || s.includes('fee') || s.includes('policy')) {
      return 'Policy transparency & refund guardrail: Discloses strict policy windows and fees upfront to eliminate customer misunderstandings and prevent hallucinations.';
    }
    if (s.includes('hotel') || s.includes('book at $0') || s.includes('concierge')) {
      return 'Hospitality workflow optimization: Ensures callers understand payment deadlines, free cancellation windows, and 24/7 keyless check-in rules.';
    }
    if (s.includes('empathy') || s.includes('brevity') || s.includes('sentence') || s.includes('tone')) {
      return 'Speech synthesis delivery: Restricts replies to 2-3 concise sentences for natural conversational cadence, avoiding monologue fatigue.';
    }
    return 'Quality assurance guardrail: Automatically synthesized from test evaluations to harden agent reliability against edge-case failures.';
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b]">

      {/* ─── Left Pane: Version History Timeline ───────────────────────────────── */}
      <div className="w-84 shrink-0 border-r border-[#1f1f23] bg-[#0c0c0e] flex flex-col justify-between">
        
        {/* Top Header */}
        <div>
          <div className="p-4 border-b border-[#1f1f23] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitCompare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Prompt Evolution</h2>
                <p className="text-[10px] text-zinc-400">Version History ({versions.length})</p>
              </div>
            </div>

            <button
              onClick={() => setShowForm(v => !v)}
              className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
              title="Create new prompt version manually"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search / Filter Box */}
          <div className="px-4 py-2.5 border-b border-[#1f1f23] bg-[#09090b]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search versions by note or #..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Domain Quick Filters */}
          <div className="px-3 py-2 border-b border-[#1f1f23] bg-[#0c0c0e] flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setDomainFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap font-medium transition-all cursor-pointer ${
                domainFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              All Domains
            </button>
            {DOMAINS_CONFIG.map(d => (
              <button
                key={d.id}
                onClick={() => setDomainFilter(d.id)}
                className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  domainFilter === d.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>{d.emoji}</span>
                <span>{d.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add-version Form (Collapsible) */}
        {showForm && (
          <div className="p-4 border-b border-[#1f1f23] bg-[#09090b] space-y-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <p className="text-zinc-200 font-semibold flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Create New Version
              </p>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-3 h-3" />
              </button>
            </div>
            <textarea
              value={formPrev}
              onChange={e => setFormPrev(e.target.value)}
              placeholder="Baseline / Previous prompt..."
              className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 text-[11px] resize-none focus:outline-none focus:border-indigo-500 font-mono"
            />
            <textarea
              value={formImproved}
              onChange={e => setFormImproved(e.target.value)}
              placeholder="Improved prompt..."
              className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 text-[11px] resize-none focus:outline-none focus:border-indigo-500 font-mono"
            />
            <input
              value={formSummary}
              onChange={e => setFormSummary(e.target.value)}
              placeholder="Summary of changes & purpose..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 text-[11px] focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveVersion}
              disabled={isSaving}
              className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving to SQLite...' : 'Save Version'}
            </button>
          </div>
        )}

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoadingVersions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : filteredVersions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <GitCommit className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs text-zinc-400">No versions match your search.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            filteredVersions.map((v, i) => {
              const isSelected = selectedId === v.id;
              const isActive = activeVersionId === `ver_v${v.version_number}`;
              const isLatest = i === 0;
              const domId = detectDomainFromPrompt(v.improved_prompt || v.previous_prompt);
              const domObj = DOMAINS_CONFIG.find(d => d.id === domId);

              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedId(v.id);
                    if (domObj) {
                      selectDomain(domObj.id);
                    }
                  }}
                  className={`w-full text-left rounded-xl p-3 transition-all border relative flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/60 shadow-md shadow-indigo-600/5'
                      : 'bg-zinc-950/50 border-zinc-850 hover:bg-zinc-900/60 hover:border-zinc-750'
                  }`}
                >
                  {/* Left indicator dot */}
                  <div className={`mt-0.5 w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[11px] font-bold ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/30'
                      : isActive
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    {v.version_number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-zinc-100">Version {v.version_number}</span>
                      
                      {domObj && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-750">
                          {domObj.emoji} {domObj.shortName}
                        </span>
                      )}

                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ACTIVE
                        </span>
                      )}

                      {isLatest && !isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                          LATEST
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTs(v.timestamp)}
                    </p>

                    <p className="text-[11px] text-zinc-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {v.summary_of_changes}
                    </p>
                  </div>

                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 transition-colors ${
                    isSelected ? 'text-indigo-400' : 'text-zinc-600'
                  }`} />
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Quick Educational Card */}
        <div className="p-3.5 border-t border-[#1f1f23] bg-[#0c0c0e]/90">
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>How Evolution Works</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              When tests reveal agent errors, QA auto-optimizes prompt instructions and creates an immutable snapshot here to audit and deploy.
            </p>
          </div>
        </div>

      </div>

      {/* ─── Right Pane: Diff Viewer & Purpose Details ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">

        {/* Top Control Bar: De-clustered, Spacious & Clean */}
        <div className="min-h-14 border-b border-[#1f1f23] px-6 py-2.5 flex items-center justify-between shrink-0 bg-[#0c0c0e] gap-4 flex-wrap">
          
          {/* Left: Version Title, Comparison & Active Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-zinc-100">
                {diff ? `Version ${diff.version_number}` : 'Select a Version'}
              </span>
            </div>

            {diff && (
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                v{diff.version_number - 1 > 0 ? diff.version_number - 1 : 'Base'} → v{diff.version_number}
              </span>
            )}

            {diff && isVersionActive ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active in Simulator
              </span>
            ) : diff ? (
              <button
                onClick={handleSetActiveOnly}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium transition-colors cursor-pointer"
                title="Use this version for simulator turns"
              >
                Set as Active
              </button>
            ) : null}

            {diff && (
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                <Clock className="w-2.5 h-2.5 text-zinc-500" />
                {formatTs(diff.timestamp)}
              </span>
            )}
          </div>

          {/* Right: Mode Switcher & Primary Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'unified'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Unified Line Diff"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Unified Diff</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Side by Side Comparison"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>

            {/* Test in Simulator Button */}
            <button
              onClick={handleDeployToSimulator}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Activate this version and open in Simulator"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test in Simulator</span>
            </button>

            {/* Copy Prompt Button */}
            <button
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-750 cursor-pointer"
              title="Copy improved prompt instructions"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
            </button>

            {/* Guide Toggle */}
            <button
              onClick={() => setShowPurposeGuide(v => !v)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                showPurposeGuide
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-750 hover:text-zinc-200'
              }`}
              title={showPurposeGuide ? "Hide purpose guide" : "Show purpose guide"}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Purpose Guide Banner (Dismissible & Toggleable) */}
          {showPurposeGuide && (
            <div className="bg-[#0e0e14] border border-indigo-900/40 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-300 shrink-0 mt-0.5 border border-indigo-500/25">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-zinc-100">
                      Purpose of Prompt Evolution
                    </p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Workflow Guide</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed max-w-4xl">
                    As you test customer personas in the Conversation Simulator or analyze transcripts in the Analyzer, AgentLab detects missing policies, rigid loops, or hallucinations. Each prompt improvement is captured here as an immutable snapshot in SQLite so you can audit the exact diff, understand why the fix was made, and deploy proven versions with 1 click.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPurposeGuide(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Dismiss guide"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ─── Hero Purpose & Evolution Context Card ─── */}
          {diff && (
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 shadow-lg space-y-4">
              
              {/* Card Header: Purpose Title & Clean Non-Zero Diff Counts */}
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Evolution Objective
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">
                    Version {diff.version_number} Updates
                  </span>
                </div>

                {/* Clean, Non-Zero Diff Metrics (No noisy red/amber zeros!) */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {insertCount > 0 && (
                    <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 font-semibold">
                      +{insertCount} added
                    </span>
                  )}
                  {modifiedCount > 0 && (
                    <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 font-semibold">
                      ~{modifiedCount} modified
                    </span>
                  )}
                  {deleteCount > 0 && (
                    <span className="text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/25 font-semibold">
                      -{deleteCount} removed
                    </span>
                  )}
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {equalCount} unchanged · {diff.diff.length} lines total
                  </span>
                </div>
              </div>

              {/* Main Summary & Real-World Impact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Summary of Changes (2 cols) */}
                <div className="md:col-span-2 space-y-1.5 bg-[#0e0e12] border border-zinc-800/80 rounded-lg p-3.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-indigo-400" />
                    What Changed in Prompt Instructions:
                  </span>
                  <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                    {diff.summary_of_changes}
                  </p>
                </div>

                {/* Production Impact Explanation (1 col) */}
                <div className="space-y-1.5 bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-3.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    Why This Matters:
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {getContextualImpact(diff.summary_of_changes)}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Error Notice if Offline */}
          {error && (
            <div className="p-3 border border-amber-500/30 bg-amber-500/10 rounded-lg flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Offline mode — Displaying SQLite prompt evolution seed data.</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">Backend port 8000</span>
            </div>
          )}

          {/* ─── Diff or Side-by-Side Content ─── */}
          {isLoadingDiff ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
            </div>
          ) : diff ? (
            viewMode === 'unified' ? (
              
              /* Unified Diff View */
              <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl overflow-hidden shadow-xl">
                {/* Header with Color Legend */}
                <div className="px-4 py-3 border-b border-zinc-850 bg-zinc-900/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Instruction Evolution Analysis
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      + Added
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      ~ Modified
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      - Removed
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-0.5 divide-y divide-zinc-900/40">
                  {diff.diff.map((chunk, i) => (
                    <DiffLine key={i} chunk={chunk} index={i} />
                  ))}
                </div>
              </div>

            ) : (

              /* Split Side-by-Side View */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                {/* Left: Previous Prompt */}
                <div className="flex flex-col border border-zinc-850 rounded-xl bg-zinc-950/70 overflow-hidden shadow-lg">
                  <div className="px-4 py-3 border-b border-zinc-850 bg-zinc-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Previous Prompt (v{diff.version_number - 1 > 0 ? diff.version_number - 1 : 'Base'})
                      </span>
                      <p className="text-[10px] text-zinc-500">Baseline before evolution</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      v{diff.version_number - 1 > 0 ? diff.version_number - 1 : 'Base'}
                    </span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30">
                    {diff.previous_prompt || selectedVersion?.previous_prompt || 'No previous prompt recorded.'}
                  </div>
                </div>

                {/* Right: Improved Prompt */}
                <div className="flex flex-col border border-indigo-500/30 rounded-xl bg-indigo-950/10 overflow-hidden shadow-lg">
                  <div className="px-4 py-3 border-b border-indigo-500/20 bg-indigo-900/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Improved Prompt (v{diff.version_number})
                        </span>
                        {isVersionActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-400/80">Evolved instructions with guardrails</p>
                    </div>
                    <button
                      onClick={handleCopyPrompt}
                      className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30">
                    {diff.improved_prompt || selectedVersion?.improved_prompt || 'No improved prompt available.'}
                  </div>
                </div>
              </div>

            )
          ) : !error ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <GitCompare className="w-10 h-10 text-zinc-700" />
              <p className="text-sm text-zinc-400">Select a prompt version on the left to inspect its evolution diff</p>
            </div>
          ) : null}

        </div>

      </div>

    </div>
  );
};
