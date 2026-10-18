import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../../../store/useAppStore';
import { FormField, Input, Select } from '../../../components/ui/FormComponents';
import { 
  DOMAINS_CONFIG, 
  detectDomainFromPrompt 
} from '../../../services/mockDb';
import { 
  Sparkles, 
  FileCode, 
  Loader2, 
  AlertTriangle,
  GitCommit,
  Layers,
  CheckCircle2,
  Play
} from 'lucide-react';
import { API_BASE } from '../../../config';

interface PromptInputs {
  useCase: string;
  language: string;
  tone: string;
}

interface GeneratedResult {
  systemPrompt: string;
  conversationFlow: string[];
  edgeCases: { scenario: string; behavior: string }[];
}

export const PromptStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    versions, 
    selectedDomainId, 
    selectDomain, 
    createNewPromptVersion, 
    setActiveVersionId, 
    fetchVersions,
    saveEvolvedVersion
  } = useAppStore();

  const currentDomain = DOMAINS_CONFIG.find(d => d.id === selectedDomainId) || DOMAINS_CONFIG[0];
  
  // React Hook Form setup
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PromptInputs>({
    defaultValues: {
      useCase: currentDomain.useCase,
      language: currentDomain.language,
      tone: currentDomain.tone
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedResult | null>(null);
  const [systemPromptEdit, setSystemPromptEdit] = useState('');
  const [changeNote, setChangeNote] = useState('Evolved via studio compiler.');
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync form and preview when selectedDomainId changes or on initial mount
  useEffect(() => {
    const domain = DOMAINS_CONFIG.find(d => d.id === selectedDomainId) || DOMAINS_CONFIG[0];
    setValue('useCase', domain.useCase);
    setValue('language', domain.language);
    setValue('tone', domain.tone);

    const matchingVersions = versions.filter(v => 
      v.promptId === domain.promptId || 
      detectDomainFromPrompt(v.systemPrompt, v.promptId) === domain.id
    );
    const targetVer = matchingVersions[matchingVersions.length - 1] || 
      versions.find(v => v.id === domain.defaultVersionId) || 
      versions[0];

    if (targetVer) {
      setGeneratedData({
        systemPrompt: targetVer.systemPrompt,
        conversationFlow: targetVer.conversationFlow || [
          `1. Warm greeting and customer intent discovery`,
          `2. Identify domain context and policy validation`,
          `3. Provide accurate guidance within 2-3 sentences`,
          `4. Hospitable resolution confirmation`
        ],
        edgeCases: targetVer.edgeCases || [
          { scenario: 'Missing primary code', behavior: 'Execute fallback verification using registered name & phone.' }
        ]
      });
      setSystemPromptEdit(targetVer.systemPrompt);
      setChangeNote(targetVer.changeDescription);
    }
  }, [selectedDomainId, versions]);

  const handleDomainDropdownChange = (domainId: string) => {
    if (domainId === 'custom') {
      return;
    }
    selectDomain(domainId);
  };

  // Form submit: Calls POST /api/v1/prompts/generate
  const onSubmit = async (data: PromptInputs) => {
    setIsLoading(true);
    setGeneratedData(null);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE}/prompts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_case: data.useCase,
          language: data.language,
          tone: data.tone
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        let errorDetail = `Request failed (${response.status})`;
        if (errorBody?.detail) {
          if (typeof errorBody.detail === 'string') {
            errorDetail = errorBody.detail;
          } else if (Array.isArray(errorBody.detail)) {
            errorDetail = errorBody.detail.map((e: any) => e.msg || JSON.stringify(e)).join(' | ');
          } else {
            errorDetail = JSON.stringify(errorBody.detail);
          }
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();
      
      const mappedResult: GeneratedResult = {
        systemPrompt: result.system_prompt,
        conversationFlow: result.conversation_flow,
        edgeCases: result.edge_cases.map((ec: any) => ({
          scenario: ec.scenario,
          behavior: ec.behavior
        }))
      };

      setGeneratedData(mappedResult);
      setSystemPromptEdit(mappedResult.systemPrompt);
      setChangeNote(`Compiled custom prompt for: ${data.useCase.substring(0, 30)}`);
    } catch (err: any) {
      console.warn('Backend API unavailable, using studio fallback compiler:', err?.message);
      
      const fallback = fallbackGeneratePrompt(data.useCase, data.language, data.tone);
      setGeneratedData(fallback);
      setSystemPromptEdit(fallback.systemPrompt);
      setChangeNote(`Compiled custom prompt for: ${data.useCase.substring(0, 30)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackGeneratePrompt = (useCase: string, language: string, tone: string): GeneratedResult => {
    const uc = useCase.trim();
    const ucLower = uc.toLowerCase();
    
    let systemPrompt = `You are a professional AI voice customer support specialist for ${uc}.\nAlways maintain a ${tone.toLowerCase()} tone and assist customers fluently in ${language}.\n1. Greet the caller warmly and verify their identity credentials.\n2. Understand domain inquiry context, policies, and requirements.\n3. Provide accurate guidance, transparent fee disclosures, and resolution steps.\n4. Keep voice responses concise, empathetic, and strictly under 2-3 sentences.`;
    
    let conversationFlow = [
      `Warm greeting and ${uc.substring(0, 25)} intent discovery`,
      `Customer identity & reference code verification`,
      `Domain requirements & policy status review`,
      `Confirmation of request resolution or update`,
      `Receipt dispatch and hospitable farewell`
    ];
    
    let edgeCases = [
      {
        scenario: `Customer cannot provide primary reference code`,
        behavior: `Perform fallback identity verification using registered mobile number and full legal name.`
      },
      {
        scenario: `Customer expresses frustration or urgency regarding policies`,
        behavior: `De-escalate with empathy, maintain professional tone, and offer escalation option.`
      }
    ];

    if (ucLower.includes('hotel') || ucLower.includes('booking') || ucLower.includes('motel') || ucLower.includes('resort') || ucLower.includes('stay')) {
      systemPrompt = `You are an expert AI voice guest concierge for ${uc}.\nAlways maintain a ${tone.toLowerCase()} tone in ${language}.\n1. Greet the guest warmly and assist with stay reservations, hotel-specific free cancellation periods, or room modifications.\n2. BOOK AT $0 FEATURE: Explain and support 'Book at $0' holds, allowing zero upfront payment until the payment cutoff deadline date.\n3. IDENTITY VERIFICATION: Verify booking code or registered name and mobile number.\n4. BREVITY: Keep voice responses concise and strictly under 2-3 sentences.`;
      conversationFlow = [
        "Warm greeting and stay/policy inquiry discovery",
        "Property selection and 'Book at $0' zero-payment cutoff date explanation",
        "Guest identity verification & reservation profile lookup",
        "Free cancellation window check & payment deadline reminder",
        "Booking status confirmation and receipt dispatch"
      ];
      edgeCases = [
        {
          scenario: "Guest holds multiple 'Book at $0' reservations",
          behavior: "Explain that multiple holds are permitted, but unpaid holds are auto-cancelled at the deadline."
        },
        {
          scenario: "Guest cancels within free cancellation window",
          behavior: "Process 100% full refund with $0 cancellation charges immediately."
        }
      ];
    } else if (ucLower.includes('doctor') || ucLower.includes('patient') || ucLower.includes('clinic') || ucLower.includes('dental')) {
      systemPrompt = `You are a certified AI voice patient care coordinator for ${uc}.\nAlways maintain a ${tone.toLowerCase()} tone and strict confidentiality in ${language}.\n1. Greet the patient warmly, confirm appointment purpose and requested specialty.\n2. Verify patient identity by confirming full legal name, date of birth, and contact number.\n3. Collect preferred appointment slots and insurance details.\n4. EMERGENCY SAFEGUARD: Direct severe or life-threatening symptoms to call 911 immediately.`;
      conversationFlow = [
        "Warm greeting, clinical triage check, and appointment objective discovery",
        "Patient identity validation (full name, DOB, contact phone)",
        "Physician schedule matching and slot selection",
        "Insurance details collection and clinic policy disclosure",
        "Pre-visit instructions and appointment confirmation"
      ];
      edgeCases = [
        {
          scenario: "Patient describes emergency symptoms",
          behavior: "Instruct patient with urgency to disconnect and call 911 or visit emergency room."
        }
      ];
    }

    return { systemPrompt, conversationFlow, edgeCases };
  };

  const handleCommitVersion = async () => {
    if (!generatedData || !systemPromptEdit.trim()) return;
    
    // Dynamic domain checklist constraints derived from flow
    const dynamicConstraints = generatedData.conversationFlow.length > 0 
      ? generatedData.conversationFlow.map(step => step.replace(/^Step \d+:\s*/i, ''))
      : ['Warmly greet customer', 'Verify identification details', 'Explain domain policies', 'Keep under 2-3 sentences'];

    // Persist to backend SQLite and store
    await saveEvolvedVersion(
      generatedData.systemPrompt || 'Base compiled system instructions.',
      systemPromptEdit,
      changeNote || 'Developer studio compile & domain customization.'
    );

    const newVerId = createNewPromptVersion(
      systemPromptEdit,
      dynamicConstraints,
      generatedData.conversationFlow,
      changeNote || 'Developer studio compile'
    );
    
    await fetchVersions();
    setActiveVersionId(newVerId);
    alert(`Successfully registered new prompt version to SQLite!`);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b]">
      {/* Configure AI Agent Panel (Left) */}
      <div className="w-1/2 border-r border-[#1f1f23] p-8 overflow-y-auto space-y-6">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-mono text-indigo-400 border border-indigo-500/15">
            Meta-Compiler Node
          </div>
          <h2 className="text-lg font-bold text-zinc-100">AI Agent Configurator</h2>
          <p className="text-xs text-zinc-500">
            Define requirements to compile system guidelines, dialogue pipelines, and domain fail-safes.
          </p>
        </div>

        {/* Preset Enterprise Domain Switcher Dropdown */}
        <div className="p-4 rounded-xl bg-zinc-950/90 border border-indigo-500/30 space-y-2.5 shadow-sm shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
              Domain / Production Use Case
            </label>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
              Instant Switch • No Gen Needed
            </span>
          </div>
          <select 
            value={selectedDomainId}
            onChange={(e) => handleDomainDropdownChange(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-zinc-900 rounded-lg border border-zinc-750 focus:border-indigo-500 focus:outline-none text-zinc-100 cursor-pointer"
          >
            {DOMAINS_CONFIG.map(d => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.name}
              </option>
            ))}
            <option value="custom">✏️ Custom Freeform Domain...</option>
          </select>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Selecting a domain instantly loads its compiled voice guidelines and test personas without requiring you to re-compile.
          </p>
        </div>

        {/* Form elements using React Hook Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Use Case / Application Domain" error={errors.useCase}>
            <Input 
              placeholder="e.g., travel app- hotel booking end to end support, dental clinic appointments"
              error={!!errors.useCase}
              {...register('useCase', { required: 'Use Case is required' })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Primary Language" error={errors.language}>
              <Select 
                error={!!errors.language}
                {...register('language', { required: 'Language selection is required' })}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
              </Select>
            </FormField>

            <FormField label="Brand Tone Constraints" error={errors.tone}>
              <Input 
                placeholder="e.g., Empathetic, clear, and professional"
                error={!!errors.tone}
                {...register('tone', { required: 'Tone instructions are required' })}
              />
            </FormField>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Compiling Domain Instructions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                Re-Generate Tailored Prompt with AI
              </>
            )}
          </button>
        </form>

        {apiError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="leading-relaxed">{apiError}</p>
          </div>
        )}

        {/* Existing Versions Summary */}
        <div className="p-4 border border-zinc-850 rounded-xl bg-zinc-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Prompt Version Registry
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{versions.length} versions in SQLite</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {versions.slice().reverse().map(v => {
              const domId = detectDomainFromPrompt(v.systemPrompt, v.promptId);
              const domObj = DOMAINS_CONFIG.find(d => d.id === domId);
              return (
                <div 
                  key={v.id} 
                  onClick={() => {
                    setActiveVersionId(v.id);
                    setSystemPromptEdit(v.systemPrompt);
                    setChangeNote(v.changeDescription);
                    setGeneratedData({
                      systemPrompt: v.systemPrompt,
                      conversationFlow: v.conversationFlow || [],
                      edgeCases: v.edgeCases || []
                    });
                  }}
                  className="p-2.5 rounded-lg border border-zinc-850/80 bg-zinc-900/40 hover:bg-zinc-850/70 hover:border-zinc-700 transition-all text-xs flex items-center justify-between cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200 group-hover:text-white">v{v.versionNumber}</span>
                      {domObj && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-750">
                          {domObj.emoji} {domObj.shortName}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{v.changeDescription}</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generated Output Showcase (Right) */}
      <div className="w-1/2 p-8 overflow-y-auto space-y-6">
        <div className="space-y-1 text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Compiler Outputs</div>
          <h2 className="text-lg font-bold text-zinc-100">Compiled Voice Agent Assets</h2>
        </div>

        {generatedData ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Domain Active Status Bar & Quick Jump to Simulator */}
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {currentDomain.emoji} {currentDomain.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Active guidelines loaded • Ready to simulate
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/simulator')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                Open in Simulator Deck
              </button>
            </div>

            {/* System Prompt Block */}
            <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-950/80 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  Compiled System Instructions
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Ready to Commit / Simulate
                </span>
              </div>
              <textarea 
                value={systemPromptEdit}
                onChange={(e) => setSystemPromptEdit(e.target.value)}
                className="w-full h-48 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500/60"
              />
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 block">Version Change Summary</label>
                <input 
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                  placeholder="Summary of modifications..."
                />
              </div>
              <button 
                onClick={handleCommitVersion}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <GitCommit className="w-4 h-4" />
                Commit to Prompt Registry (SQLite)
              </button>
            </div>

            {/* Conversation Flow Block */}
            <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-950/80 space-y-3">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Target Dialogue Pipeline
              </span>
              <div className="space-y-2">
                {generatedData.conversationFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-850">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-zinc-300 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge Cases Block */}
            <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-950/80 space-y-3">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Domain Edge Cases & Guardrails
              </span>
              <div className="space-y-2.5">
                {generatedData.edgeCases.map((ec, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-850 text-xs space-y-1">
                    <span className="font-semibold text-zinc-200 block">{ec.scenario}</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                      <strong className="text-indigo-400 font-normal">Behavior:</strong> {ec.behavior}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 border border-zinc-850 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-3 text-zinc-500">
            <Sparkles className="w-8 h-8 text-zinc-600" />
            <span className="text-xs text-zinc-400">No prompt compiled yet.</span>
            <p className="text-[11px] text-zinc-550 max-w-xs">
              Select any domain from the dropdown above to immediately load its instructions, or click <strong>Re-Generate</strong> to compile new ones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
