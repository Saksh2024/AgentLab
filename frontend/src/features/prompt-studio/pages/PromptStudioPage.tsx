import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../../../store/useAppStore';
import { FormField, Input, Select } from '../../../components/ui/FormComponents';
import { 
  Sparkles, 
  FileCode, 
  Loader2, 
  AlertTriangle,
  GitCommit
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
  const { versions, createNewPromptVersion, setActiveVersionId, fetchVersions, saveEvolvedVersion } = useAppStore();

  
  // React Hook Form setup
  const { register, handleSubmit, formState: { errors } } = useForm<PromptInputs>({
    defaultValues: {
      useCase: 'travel app- hotel booking end to end support',
      language: 'English',
      tone: 'Empathetic, clear, and professional'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedResult | null>(null);
  const [systemPromptEdit, setSystemPromptEdit] = useState('');
  const [changeNote, setChangeNote] = useState('Evolved via studio compiler.');
  const [apiError, setApiError] = useState<string | null>(null);

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
      const msg = err?.message || '';
      console.warn('Backend API failed:', msg);
      setApiError(msg || 'Generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
                Generate Tailored Prompt
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
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {versions.slice().reverse().map(v => (
              <div key={v.id} className="p-2.5 rounded-lg border border-zinc-850/80 bg-zinc-900/40 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-200">Version v{v.versionNumber}</span>
                  <p className="text-[10px] text-zinc-500 truncate max-w-[280px]">{v.changeDescription}</p>
                </div>
                <span className="text-[9px] font-mono text-zinc-600">{new Date(v.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Output Showcase (Right) */}
      <div className="w-1/2 p-8 overflow-y-auto space-y-6">
        <div className="space-y-1 text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Compiler Outputs</div>
          <h2 className="text-lg font-bold text-zinc-100">Generated Voice Agent Assets</h2>
        </div>

        {generatedData ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* System Prompt Block */}
            <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-950/80 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  Compiled System Instructions
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Ready to Commit
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
              Fill in your target use case domain on the left and click <strong>Generate Tailored Prompt</strong> to compile custom voice instructions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
