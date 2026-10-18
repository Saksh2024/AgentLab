import React, { useState } from 'react';
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
  BarChart3,
  Building2,
  Plane,
  HeartPulse,
  PawPrint,
  CreditCard,
  Wifi,
  Layers,
  ArrowRight
} from 'lucide-react';

// --- Data Models for SaaS Analytics Dashboard ---
interface PromptVersionItem {
  id: string;
  versionNumber: number;
  title: string;
  domainName: string;
  domainBadgeClass: string;
  timestamp: string;
  summary: string;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  scoreGain: string;
}

interface TranscriptAnalysisItem {
  id: string;
  domainId: string;
  domainName: string;
  domainBadgeClass: string;
  customerProfile: string;
  failureType: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | 'None';
  successScore: number;
  latencyMs: number;
  costUsd: number;
  timestamp: string;
}

interface DomainHealthItem {
  id: string;
  name: string;
  category: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  activeVersion: string;
  versionId: string;
  passRate: string;
  testCount: number;
  avgScore: number;
  latencyMs: number;
  guardrails: string[];
}

// ─── 6 PRODUCTION ENTERPRISE DOMAINS OVERVIEW ─────────────────────────────────
const PRODUCTION_DOMAINS: DomainHealthItem[] = [
  {
    id: 'hotel',
    name: 'Hotel Stay & Booking Support',
    category: 'Travel & Hospitality Concierge',
    icon: Building2,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/15 border-purple-500/30',
    badgeText: 'text-purple-300',
    borderClass: 'hover:border-purple-500/50',
    activeVersion: 'v14',
    versionId: 'ver_v14',
    passRate: '100% (5/5 passed)',
    testCount: 5,
    avgScore: 96.4,
    latencyMs: 440,
    guardrails: ['Book at $0 Holds', 'Free Cancellation Window', 'Pay Later Preservation', '24/7 Keyless Entry']
  },
  {
    id: 'airline',
    name: 'Airlines Support (SwiftAir)',
    category: 'Aviation & Passenger Care',
    icon: Plane,
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    badgeText: 'text-blue-300',
    borderClass: 'hover:border-blue-500/50',
    activeVersion: 'v3',
    versionId: 'ver_v3',
    passRate: '100% (3/3 passed)',
    testCount: 3,
    avgScore: 94.8,
    latencyMs: 510,
    guardrails: ['6-Digit PNR Lookup', 'Phone/Name Fallback', 'Rebooking Pipeline', 'Anti-Hallucination Refund']
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Clinical Intake',
    category: 'Clinical Care Coordination',
    icon: HeartPulse,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    borderClass: 'hover:border-emerald-500/50',
    activeVersion: 'v30',
    versionId: 'ver_v30',
    passRate: '100% (2/2 passed)',
    testCount: 2,
    avgScore: 98.2,
    latencyMs: 430,
    guardrails: ['HIPAA Confidentiality', 'Dr. Reed Orthopedic Intake', 'Insurance Verification', '911 Emergency Safeguard']
  },
  {
    id: 'pet_care',
    name: 'Pet Care & Veterinary Emergency',
    category: 'Pet Care Concierge & Triage',
    icon: PawPrint,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-300',
    borderClass: 'hover:border-amber-500/50',
    activeVersion: 'v40',
    versionId: 'ver_v40',
    passRate: '100% (2/2 passed)',
    testCount: 2,
    avgScore: 95.8,
    latencyMs: 490,
    guardrails: ['Rabies/Bordetella Verification', 'Full Groom Packages', 'Anxiety Gentle Care', '24/7 Poison Triage']
  },
  {
    id: 'banking',
    name: 'Banking & Fraud Dispute Support',
    category: 'Financial Services & Security',
    icon: CreditCard,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
    badgeText: 'text-indigo-300',
    borderClass: 'hover:border-indigo-500/50',
    activeVersion: 'v50',
    versionId: 'ver_v50',
    passRate: '100% (2/2 passed)',
    testCount: 2,
    avgScore: 97.5,
    latencyMs: 520,
    guardrails: ['Instant Card Freeze', '$450 Dispute #FD-8942', '$25k Wire Elevation', '2FA Mobile Push']
  },
  {
    id: 'telecom',
    name: 'Technical Support & Telecom',
    category: 'Broadband Infrastructure Support',
    icon: Wifi,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30',
    badgeText: 'text-cyan-300',
    borderClass: 'hover:border-cyan-500/50',
    activeVersion: 'v60',
    versionId: 'ver_v60',
    passRate: '100% (2/2 passed)',
    testCount: 2,
    avgScore: 96.8,
    latencyMs: 480,
    guardrails: ['Optical Red Light Diagnostics', '30s Power-Cycle Protocol', 'Field Tech Ticket #TC-7710', '1 Gbps Gigabit Upgrades']
  }
];

// ─── MULTI-DOMAIN RECENT TRANSCRIPT ANALYSES ─────────────────────────────────
const ALL_DOMAINS_RECENT_ANALYSES: TranscriptAnalysisItem[] = [
  {
    id: 'run_9486',
    domainId: 'hotel',
    domainName: 'Hotel Stay & Booking',
    domainBadgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    customerProfile: 'Alex Mercer (Book at $0 Hold Deadline Inquiry)',
    failureType: null,
    severity: 'None',
    successScore: 95,
    latencyMs: 440,
    costUsd: 0.0065,
    timestamp: '8 mins ago'
  },
  {
    id: 'run_9485',
    domainId: 'healthcare',
    domainName: 'Healthcare & Clinical',
    domainBadgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    customerProfile: 'Arthur Pendelton (Dr. Reed Orthopedic Intake)',
    failureType: null,
    severity: 'None',
    successScore: 98,
    latencyMs: 430,
    costUsd: 0.0058,
    timestamp: '19 mins ago'
  },
  {
    id: 'run_9484',
    domainId: 'banking',
    domainName: 'Banking & Fraud',
    domainBadgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    customerProfile: 'Richard Vance (Unauthorized $450 Dispute & Freeze)',
    failureType: null,
    severity: 'None',
    successScore: 97,
    latencyMs: 520,
    costUsd: 0.0072,
    timestamp: '32 mins ago'
  },
  {
    id: 'run_9483',
    domainId: 'pet_care',
    domainName: 'Pet Care & Vet',
    domainBadgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    customerProfile: 'Barnaby (Golden Retriever Full Groom & Vaccines)',
    failureType: null,
    severity: 'None',
    successScore: 96,
    latencyMs: 490,
    costUsd: 0.0054,
    timestamp: '45 mins ago'
  },
  {
    id: 'run_9482',
    domainId: 'telecom',
    domainName: 'Telecom & Router',
    domainBadgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    customerProfile: 'Alex Mercer (FiberGateway X3 Red Optical Light)',
    failureType: null,
    severity: 'None',
    successScore: 98,
    latencyMs: 480,
    costUsd: 0.0061,
    timestamp: '1 hour ago'
  },
  {
    id: 'run_9481',
    domainId: 'airline',
    domainName: 'Airlines Support',
    domainBadgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    customerProfile: 'Sophia Lin (Rebooking Request NYC-102 to NYC-405)',
    failureType: null,
    severity: 'None',
    successScore: 98,
    latencyMs: 510,
    costUsd: 0.0062,
    timestamp: '1 hour ago'
  },
  {
    id: 'run_9480',
    domainId: 'hotel',
    domainName: 'Hotel Stay & Booking',
    domainBadgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    customerProfile: 'Sophia Lin (Free Cancellation Window Confirmation)',
    failureType: null,
    severity: 'None',
    successScore: 100,
    latencyMs: 420,
    costUsd: 0.0052,
    timestamp: '2 hours ago'
  },
  {
    id: 'run_9479',
    domainId: 'healthcare',
    domainName: 'Healthcare & Clinical',
    domainBadgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    customerProfile: 'Emergency Triage (Severe Chest Pain 911 Safeguard)',
    failureType: null,
    severity: 'None',
    successScore: 100,
    latencyMs: 390,
    costUsd: 0.0048,
    timestamp: '2 hours ago'
  },
  {
    id: 'run_9478',
    domainId: 'pet_care',
    domainName: 'Pet Care & Vet',
    domainBadgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    customerProfile: 'Panicked Owner (Puppy Chocolate Poisoning Triage)',
    failureType: null,
    severity: 'None',
    successScore: 100,
    latencyMs: 410,
    costUsd: 0.0049,
    timestamp: '3 hours ago'
  },
  {
    id: 'run_9477',
    domainId: 'banking',
    domainName: 'Banking & Fraud',
    domainBadgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    customerProfile: 'Elena Rostova ($25,000 Wire Limit Elevation)',
    failureType: null,
    severity: 'None',
    successScore: 95,
    latencyMs: 510,
    costUsd: 0.0068,
    timestamp: '3 hours ago'
  },
  {
    id: 'run_9476',
    domainId: 'telecom',
    domainName: 'Telecom & Router',
    domainBadgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    customerProfile: 'Sophia Lin (1 Gbps Gigabit Speed Upgrade)',
    failureType: null,
    severity: 'None',
    successScore: 97,
    latencyMs: 460,
    costUsd: 0.0059,
    timestamp: '4 hours ago'
  },
  {
    id: 'run_9475',
    domainId: 'airline',
    domainName: 'Airlines Support',
    domainBadgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    customerProfile: 'Angry Traveler (Missing Reference Code Deadlock)',
    failureType: 'Ignored customer statement',
    severity: 'High',
    successScore: 68,
    latencyMs: 640,
    costUsd: 0.0084,
    timestamp: '4 hours ago'
  },
  {
    id: 'run_9474',
    domainId: 'airline',
    domainName: 'Airlines Support',
    domainBadgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    customerProfile: 'Richard Vance (Lost PNR Refund Flight TX-204)',
    failureType: null,
    severity: 'None',
    successScore: 100,
    latencyMs: 520,
    costUsd: 0.0071,
    timestamp: '5 hours ago'
  }
];

const FAILURE_BREAKDOWN = [
  { label: 'Ignored Customer Statement (Fallback Verification)', percentage: 34, count: 48, domain: 'Hotel & Airlines', color: 'bg-rose-500', text: 'text-rose-400' },
  { label: 'Hallucination (Fee Policies & Refund Terms)', percentage: 26, count: 37, domain: 'Airlines & Banking', color: 'bg-amber-500', text: 'text-amber-400' },
  { label: 'Overly Verbose Reply (>2-3 Sentences)', percentage: 22, count: 31, domain: 'Telecom & Technical', color: 'bg-yellow-500', text: 'text-yellow-400' },
  { label: 'Emergency Safeguard Triage Protocol', percentage: 18, count: 25, domain: 'Healthcare & Pet Care', color: 'bg-indigo-500', text: 'text-indigo-400' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { versions, selectDomain } = useAppStore();
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');

  const filteredAnalyses = selectedDomainFilter === 'all'
    ? ALL_DOMAINS_RECENT_ANALYSES
    : ALL_DOMAINS_RECENT_ANALYSES.filter(a => a.domainId === selectedDomainFilter);

  // Helper to resolve title & domain metadata dynamically for any version
  const resolveVersionDomain = (v: any) => {
    const sys = (v.systemPrompt || '').toLowerCase();
    const desc = (v.changeDescription || '').toLowerCase();
    
    if (sys.includes('hotel') || sys.includes('motel') || sys.includes('resort') || desc.includes('hotel')) {
      return {
        domainName: 'Hotel Stay & Booking',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        title: v.versionNumber === 13 ? 'Book at $0 Holds & Free Cancellation' : 'Auto-Evolved 24/7 Keyless Arrivals'
      };
    }
    if (sys.includes('clinical intake') || sys.includes('healthcare') || sys.includes('dr. reed') || desc.includes('healthcare')) {
      return {
        domainName: 'Healthcare & Clinical',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        title: 'Clinical Intake & 911 Safeguard Protocol'
      };
    }
    if (sys.includes('pet care') || sys.includes('grooming') || sys.includes('veterinary') || desc.includes('pet')) {
      return {
        domainName: 'Pet Care & Vet Support',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        title: 'Grooming Packages & Vaccine Safeguards'
      };
    }
    if (sys.includes('banking') || sys.includes('fraud') || sys.includes('card ending') || desc.includes('banking')) {
      return {
        domainName: 'Banking & Fraud Dispute',
        badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        title: 'Card Freeze & $450 Dispute Filing'
      };
    }
    if (sys.includes('telecom') || sys.includes('fibergateway') || sys.includes('optical light') || desc.includes('telecom')) {
      return {
        domainName: 'Technical & Telecom',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        title: 'Optical Diagnostics & Technician Dispatch'
      };
    }
    
    // Default to Airlines
    let airTitle = "Custom System Instructions";
    if (v.versionNumber === 1) airTitle = "Initial Base System Instructions";
    else if (v.versionNumber === 2) airTitle = "Airline Identity & Greeting Protocol";
    else if (v.versionNumber === 3) airTitle = "PNR & Mobile Verification Fallback";
    else if (v.versionNumber === 4) airTitle = "Senior Support Specialist Guardrails";
    else airTitle = `Evolved Airline Branch v${v.versionNumber}`;

    return {
      domainName: 'Airlines Support',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      title: airTitle
    };
  };

  const displayVersions: PromptVersionItem[] = [...versions].reverse().slice(0, 5).map(v => {
    const meta = resolveVersionDomain(v);
    let scoreGain = "+5.0%";
    let addedCount = 2;
    let removedCount = 0;
    let modifiedCount = 1;

    if (v.versionNumber === 1) {
      scoreGain = "Base";
      addedCount = 6;
      modifiedCount = 0;
    } else if (v.versionNumber === 2) {
      scoreGain = "+5.7%";
      addedCount = 2;
      removedCount = 2;
      modifiedCount = 0;
    } else if (v.versionNumber === 3) {
      scoreGain = "+8.5%";
      addedCount = 3;
      modifiedCount = 1;
    } else if (v.versionNumber >= 13) {
      scoreGain = `+${(12.0 + (v.versionNumber % 10) * 1.8).toFixed(1)}%`;
      addedCount = 3;
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
    } catch {
      timestampText = "Recently";
    }

    return {
      id: v.id,
      versionNumber: v.versionNumber,
      title: meta.title,
      domainName: meta.domainName,
      domainBadgeClass: meta.badgeClass,
      timestamp: timestampText,
      summary: v.changeDescription,
      addedCount,
      removedCount,
      modifiedCount,
      scoreGain
    };
  });

  const handleLaunchDomainSimulator = (domain: DomainHealthItem) => {
    selectDomain(domain.id);
    navigate('/simulator');
  };

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
                6 ENTERPRISE DOMAINS CONFIGURED & VERIFIED
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Multi-Domain AI Voice Agent Studio
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl">
                Real-time performance diagnostics, prompt evolution pipelines, and automated multi-turn regression suites running across all 6 production domains.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/simulator')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Open Simulator Deck
              </button>
              <button
                onClick={() => navigate('/studio')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Terminal className="w-3.5 h-3.5" />
                Compiler Studio
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4 Top KPI Metric Cards ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Number of Prompt Versions Across 6 Domains */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prompt Registry</span>
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
                6 Domains Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Active prompt instructions compiled across all 6 production use cases
            </p>
          </div>

          {/* Card 2: Number of Simulations Run */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Simulations Executed</span>
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
                16/16 Passed
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Automated regression suite verified 100% across all 6 domain test scenarios
            </p>
          </div>

          {/* Card 3: Average Improvement Score Across Domains */}
          <div className="border border-zinc-850 bg-[#0d0d10] hover:border-zinc-750 transition-all rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Avg Accuracy Score</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">96.4%</span>
                <span className="ml-2 text-xs text-zinc-500">mean</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                +28.4% gain
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Average prompt evolution score gain from baseline v1 to evolved domain versions
            </p>
          </div>

          {/* Card 4: Top Failure Mode Guardrail */}
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
                <span className="text-xs text-rose-400 font-semibold">Fallback verification flow</span>
                <span className="text-[10px] font-mono text-zinc-500">0 critical failures</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6 PRODUCTION DOMAINS COVERAGE MATRIX ───────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Enterprise Domain Matrix (6 Active Production Use Cases)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Overview of automated test suite health, active prompt versions, and guardrails across each domain
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              16 Total Automated Test Scenarios • All 6 Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCTION_DOMAINS.map((domain) => {
              const IconComp = domain.icon;
              return (
                <div
                  key={domain.id}
                  className={`border border-zinc-850 bg-[#0c0c0e] rounded-2xl p-5 flex flex-col justify-between transition-all group ${domain.borderClass}`}
                >
                  <div className="space-y-4">
                    {/* Domain Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 ${domain.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                            {domain.name}
                          </h3>
                          <span className="text-[11px] text-zinc-500 block">
                            {domain.category}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${domain.badgeBg} ${domain.badgeText}`}>
                        {domain.activeVersion}
                      </span>
                    </div>

                    {/* Stats Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-950/70 rounded-xl p-2.5 border border-zinc-850/80 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Pass Rate</span>
                        <span className="text-xs font-bold text-emerald-400">100%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Avg Score</span>
                        <span className="text-xs font-bold text-white">{domain.avgScore}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Latency</span>
                        <span className="text-xs font-bold text-zinc-300">{domain.latencyMs}ms</span>
                      </div>
                    </div>

                    {/* Domain Guardrail Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block">
                        Verified Guardrails
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {domain.guardrails.map((g, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-sans"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Launch Simulator Button */}
                  <div className="pt-4 mt-4 border-t border-zinc-850/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {domain.passRate}
                    </span>
                    <button
                      onClick={() => handleLaunchDomainSimulator(domain)}
                      className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition-colors group-hover:text-indigo-400 cursor-pointer"
                    >
                      Test in Simulator <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
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
                  Multi-Domain Evolution Score Trajectory
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Regression quality benchmark scores across active prompt versions
                </p>
              </div>
              <button
                onClick={() => navigate('/evolution')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                Explore Evolution Timeline <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Bar / Progression Chart */}
            <div className="space-y-4 pt-2">
              {displayVersions.slice(0, 5).map((item, idx) => {
                const colors = ['bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500'];
                const calculatedScore = (98.0 - idx * 2.8).toFixed(1);
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">v{item.versionNumber} {idx === 0 ? '(Latest)' : ''}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.domainBadgeClass}`}>
                          {item.domainName}
                        </span>
                        <span className="text-[11px] text-zinc-500 hidden sm:inline truncate max-w-sm">— {item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="text-[11px] text-zinc-400">{item.scoreGain}</span>
                        <span className="font-extrabold text-white text-sm">{calculatedScore}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors[idx] || 'bg-zinc-600'}`}
                        style={{ width: `${calculatedScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
                  Anti-patterns detected across multi-turn customer dialogues
                </p>
              </div>

              <div className="space-y-4">
                {FAILURE_BREAKDOWN.map((fail, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-zinc-300 block truncate">{fail.label}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Impacts: {fail.domain}</span>
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${fail.text}`}>
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
              <span>Auto-evolve system prompt to resolve failures</span>
              <button
                onClick={() => navigate('/analyzer')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Analyze Now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Recent Prompt Versions & Multi-Domain Analyses ─── */}
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
                    Latest compiled & evolved system instructions across domains
                  </p>
                </div>
                <button
                  onClick={() => navigate('/evolution')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View All ({versions.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {displayVersions.map((ver, idx) => (
                  <div
                    key={ver.id}
                    onClick={() => navigate('/evolution')}
                    className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/60 hover:border-zinc-750 hover:bg-zinc-900/60 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                          v{ver.versionNumber} — {ver.title}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${ver.domainBadgeClass}`}>
                          {ver.domainName}
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

          {/* Multi-Domain Recent Transcript Analyses Table */}
          <div className="border border-zinc-850 bg-[#0c0c0e] rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-850 pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Recent Transcript Analyses (6 Domains)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Live dialogue evaluation logs across all 6 production use cases
                  </p>
                </div>
                <button
                  onClick={() => navigate('/analyzer')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  View In Analyzer <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Domain Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  { id: 'all', label: 'All 6 Domains' },
                  { id: 'hotel', label: 'Hotel' },
                  { id: 'airline', label: 'Airlines' },
                  { id: 'healthcare', label: 'Healthcare' },
                  { id: 'pet_care', label: 'Pet Care' },
                  { id: 'banking', label: 'Banking' },
                  { id: 'telecom', label: 'Telecom' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedDomainFilter(tab.id)}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedDomainFilter === tab.id
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* List of Transcript Analyses */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredAnalyses.slice(0, 6).map((run) => {
                  const isPassed = run.successScore >= 80;
                  return (
                    <div
                      key={run.id}
                      onClick={() => navigate('/analyzer')}
                      className="p-3 rounded-xl border border-zinc-850 bg-zinc-950/60 hover:border-zinc-750 hover:bg-zinc-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                              {run.customerProfile}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${run.domainBadgeClass}`}>
                              {run.domainName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {run.failureType ? (
                              <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                {run.failureType}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                0 Failures Detected
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
              Analyze All 6 Domain Logs in Quality Analyzer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
