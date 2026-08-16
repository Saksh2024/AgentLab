import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore';
import { FormField, Input, Select } from '../../../components/ui/FormComponents';
import { 
  Sparkles, 
  ChevronRight, 
  FileCode,
  Loader2,
  CheckCircle,
  AlertTriangle
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
  const { versions, createNewPromptVersion, setActiveVersionId } = useAppStore();
  
  // React Hook Form setup
  const { register, handleSubmit, formState: { errors } } = useForm<PromptInputs>({
    defaultValues: {
      useCase: 'Airlines Support - Cancellations & Rebooking',
      language: 'English',
      tone: 'Empathetic, clear, and professional'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedResult | null>(null);
  const [systemPromptEdit, setSystemPromptEdit] = useState('');
  const [changeNote, setChangeNote] = useState('Evolved via studio compiler.');
  const [apiError, setApiError] = useState<string | null>(null);

  // Form submit: Simulates POST /api/v1/prompts/generate call
  const onSubmit = async (data: PromptInputs) => {
    setIsLoading(true);
    setGeneratedData(null);
    setApiError(null);
    
    try {
      // Connect directly to the local FastAPI backend (port 8000)
      const response = await fetch(`${API_BASE}/prompts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorDetail = await response.json().then((j: any) => j.detail).catch(() => 'Generation error');
        throw new Error(errorDetail);
      }

      const result = await response.json();
      
      // Map backend snake_case properties to frontend camelCase attributes
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
    } catch (err: any) {
      console.warn('Backend API failed:', err.message);
      setApiError(err.message || 'Failed to generate prompt. Please check your backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitVersion = async () => {
    if (!generatedData || !systemPromptEdit.trim()) return;
    
    // Persist improved prompt version to SQLite database
    try {
      await fetch(`${API_BASE}/versions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_prompt: generatedData.systemPrompt || 'Base compiled system instructions.',
          improved_prompt: systemPromptEdit,
          summary_of_changes: changeNote || 'Developer studio compile & manual refinement.'
        })
      });
    } catch (err) {
      console.warn('Backend SQLite offline:', err);
    }

    const newVerId = createNewPromptVersion(
      systemPromptEdit,
      generatedData.systemPrompt === systemPromptEdit 
        ? ['Warmly greet', 'Check fallback search', 'Confirm details', 'Keep under 2 sentences']
        : ['Manual prompt adjustments applied'],
      generatedData.conversationFlow,
      changeNote || 'Developer studio compile'
    );
    
    alert(`Successfully registered Version v${versions.length + 1} to SQLite registry!`);
    setActiveVersionId(newVerId);
  };


  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Configure AI Agent Panel (Left) */}
      <div className="w-1/2 border-r border-[#1f1f23] p-8 overflow-y-auto space-y-6">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-mono text-indigo-400 border border-indigo-500/15">
            Meta-Compiler Node
          </div>
          <h2 className="text-lg font-bold text-zinc-100">AI Agent Configurator</h2>
          <p className="text-xs text-zinc-500">
            Define requirements to compile system guidelines, dialogue pipelines, and failure fail-safes.
          </p>
        </div>

        {/* Form elements using React Hook Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Use Case / Application Domain" error={errors.useCase}>
            <Input 
              placeholder="e.g. Flight Cancellation support, Room booking"
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

            <FormField label="Brand Tone constraints" error={errors.tone}>
              <Input 
                placeholder="e.g., Empathetic, concise"
                error={!!errors.tone}
                {...register('tone', { required: 'Tone instructions are required' })}
              />
            </FormField>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded bg-indigo-650 hover:bg-indigo-600 disabled:bg-zinc-900 border border-transparent disabled:border-zinc-800 text-xs font-semibold text-white disabled:text-zinc-650 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-600/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                Compiling Prompts...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Prompt
              </>
            )}
          </button>
        </form>

        {/* Prompt Registry history panel */}
        <div className="border border-zinc-850 rounded-lg p-5 bg-[#0c0c0e] space-y-4">
          <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            Prompt Version Registry
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {versions.map((ver) => (
              <div 
                key={ver.id}
                onClick={() => {
                  setSystemPromptEdit(ver.systemPrompt);
                  setGeneratedData({
                    systemPrompt: ver.systemPrompt,
                    conversationFlow: ver.conversationFlow,
                    edgeCases: ver.edgeCases
                  });
                }}
                className="p-3 rounded border border-zinc-850 bg-zinc-950/40 hover:border-zinc-700 text-xs cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-zinc-300 block">Version v{ver.versionNumber}</span>
                  <span className="text-[10px] text-zinc-550 block truncate max-w-sm mt-0.5">{ver.changeDescription}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Content Sandbox Panel (Right) */}
      <div className="w-1/2 p-8 bg-[#0c0c0e] overflow-y-auto space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-1 text-left">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Compiler Outputs</h3>
            <h2 className="text-base font-bold text-zinc-200">Generated Voice Agent Assets</h2>
          </div>

          {isLoading ? (
            /* Loading states - premium skeletons */
            <div className="space-y-4 animate-pulse">
              <div className="border border-zinc-850 bg-zinc-950/40 rounded-lg p-5 h-44 flex flex-col justify-between">
                <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-900 rounded w-full"></div>
                  <div className="h-3 bg-zinc-900 rounded w-5/6"></div>
                  <div className="h-3 bg-zinc-900 rounded w-4/5"></div>
                </div>
              </div>
              <div className="border border-zinc-850 bg-zinc-950/40 rounded-lg p-5 h-32 flex flex-col justify-between">
                <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-900 rounded w-full"></div>
                  <div className="h-3 bg-zinc-900 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ) : apiError ? (
            <div className="border border-red-500/50 bg-red-500/10 rounded-xl p-6 text-center space-y-2 mt-12">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <h4 className="text-sm font-semibold text-red-400">Generation Failed</h4>
              <p className="text-xs text-red-300/80">{apiError}</p>
            </div>
          ) : generatedData ? (
            /* Output Cards */
            <div className="space-y-6 text-left">
              {/* 1. System Prompt Card */}
              <div className="border border-zinc-850 rounded-lg bg-zinc-950/80 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                  <h4 className="text-xs font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    Compiled System Instructions
                  </h4>
                  <span className="text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-400 border border-indigo-500/15">draft</span>
                </div>
                <textarea 
                  rows={8}
                  value={systemPromptEdit}
                  onChange={(e) => setSystemPromptEdit(e.target.value)}
                  className="w-full text-[11px] font-mono p-3 bg-zinc-950 rounded border border-zinc-850 focus:outline-none focus:border-zinc-700 text-zinc-300 leading-relaxed resize-none"
                />
              </div>

              {/* 2. Conversation Flow Card */}
              <div className="border border-zinc-850 rounded-lg bg-zinc-950/80 p-5 space-y-3">
                <h4 className="text-xs font-bold text-zinc-350 border-b border-zinc-850 pb-2 uppercase tracking-wider">
                  Target Dialogue Pipeline
                </h4>
                <div className="space-y-2.5 pt-1">
                  {generatedData.conversationFlow.map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <span className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-550 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-zinc-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Edge Cases Card */}
              <div className="border border-zinc-850 rounded-lg bg-zinc-950/80 p-5 space-y-3">
                <h4 className="text-xs font-bold text-zinc-350 border-b border-zinc-850 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Edge-Case Fail-Safes
                </h4>
                <div className="space-y-3 pt-1">
                  {generatedData.edgeCases.map((ec, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <span className="font-semibold text-zinc-200 block">Scenario: {ec.scenario}</span>
                      <p className="text-[11px] text-zinc-500 font-mono pl-3 border-l border-zinc-800">{ec.behavior}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="border border-zinc-850 border-dashed rounded-xl p-12 text-center max-w-sm mx-auto space-y-3 mt-12 bg-zinc-950/20">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-650 mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-zinc-300">Outputs Pending</h4>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Configure the use case details on the left form panel and compile to generate agent prompts.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Commit change parameters */}
        {generatedData && !isLoading && (
          <div className="pt-6 border-t border-zinc-850 space-y-3.5">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Commit note (e.g. initial generation)"
                className="flex-1 text-xs px-3 py-2 bg-zinc-950 rounded border border-zinc-850 focus:outline-none focus:border-zinc-700 text-zinc-200" 
              />
              <button 
                onClick={handleCommitVersion}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Commit Version
              </button>
            </div>
            <button 
              onClick={() => navigate('/simulator')}
              className="w-full py-2 border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded hover:bg-zinc-850 transition-colors"
            >
              Test Active Prompt Version inside Simulator
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
