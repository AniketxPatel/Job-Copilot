import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { generateAnswer } from '../lib/api';
import type { GenerateRequest } from '../lib/types';

interface Props {
  resume: string;
  initialJd?: string;
  initialQuestion?: string;
  initialCompanyUrl?: string;
  isScraping?: boolean;
  scrapeError?: string;
  onReScrape?: () => void;
}

export function GenerateForm({ 
  resume, 
  initialJd = '', 
  initialQuestion = '', 
  initialCompanyUrl = '', 
  isScraping = false, 
  scrapeError = '',
  onReScrape 
}: Props) {
  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, reset, setValue, getValues } = useForm<GenerateRequest>({
    defaultValues: {
      question: initialQuestion,
      jobDescription: initialJd,
      companyUrl: initialCompanyUrl,
      tone: 'conversational',
      length: 'medium'
    }
  });

  // Load saved state or use initial scraped values
  useEffect(() => {
    storage.getFormState().then(state => {
      if (state) {
        // If we switched to a new job application (detected via company URL change), 
        // completely clear the old form state and generated answer to avoid carrying over old data.
        if (initialCompanyUrl && state.companyUrl && initialCompanyUrl !== state.companyUrl) {
          reset({
            question: initialQuestion,
            jobDescription: initialJd,
            companyUrl: initialCompanyUrl,
            tone: state.tone || 'conversational',
            length: state.length || 'medium'
          });
          setAnswer('');
          storage.saveGeneratedAnswer('');
          storage.saveFormState(null as any);
        } else {
          reset({
            ...state,
            jobDescription: state.jobDescription || initialJd,
            question: state.question || initialQuestion,
            companyUrl: state.companyUrl || initialCompanyUrl
          });
        }
      } else {
        if (initialJd) setValue('jobDescription', initialJd);
        if (initialQuestion) setValue('question', initialQuestion);
        if (initialCompanyUrl) setValue('companyUrl', initialCompanyUrl);
      }
    });

    // Only load saved answer if we didn't switch tabs/URLs
    storage.getFormState().then(state => {
      if (!state || !initialCompanyUrl || state.companyUrl === initialCompanyUrl) {
        storage.getGeneratedAnswer().then(savedAnswer => {
          if (savedAnswer) {
            setAnswer(savedAnswer);
          }
        });
      }
    });
  }, [reset, initialJd, initialQuestion, initialCompanyUrl, setValue]);

  // Update form inputs when scraped data changes dynamically
  useEffect(() => {
    if (initialJd) {
      setValue('jobDescription', initialJd);
    }
  }, [initialJd, setValue]);

  useEffect(() => {
    if (initialQuestion) {
      setValue('question', initialQuestion);
    }
  }, [initialQuestion, setValue]);

  useEffect(() => {
    if (initialCompanyUrl) {
      setValue('companyUrl', initialCompanyUrl);
    }
  }, [initialCompanyUrl, setValue]);

  // Watch form and persist state
  useEffect(() => {
    const subscription = watch((value) => {
      storage.saveFormState(value as any);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: GenerateRequest) => {
    if (!resume) {
      setError('Please add your resume in settings first.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setAnswer('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await generateAnswer({ ...data, resume }, session?.access_token);
      setAnswer(response.answer);
      storage.saveGeneratedAnswer(response.answer);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    onSubmit(getValues());
  };

  const copyToClipboard = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-4">
      
      {/* Scrape Error Warning */}
      {scrapeError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-start gap-2.5 animate-in fade-in duration-300">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="leading-relaxed">{scrapeError}</span>
        </div>
      )}
      
      {/* Manual Input form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Question *</label>
            {onReScrape && (
              <button 
                type="button" 
                onClick={onReScrape} 
                disabled={isScraping || isGenerating}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 disabled:text-indigo-400/50 transition-colors uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                {isScraping && (
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isScraping ? 'Scanning...' : 'Scan Page Details'}
              </button>
            )}
          </div>
          <textarea
            {...register('question', { required: true })}
            disabled={isGenerating}
            placeholder="e.g. Why do you want to work here?"
            className="w-full h-20 bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Description</label>
            <textarea
              {...register('jobDescription')}
              disabled={isGenerating}
              placeholder="Auto-scraped or paste details here..."
              className="w-full h-28 bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company URL</label>
            <input
              {...register('companyUrl')}
              disabled={isGenerating}
              placeholder="https://company.com"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tone</label>
              <div className="relative">
                <select
                  {...register('tone')}
                  disabled={isGenerating}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="conversational">Conversational</option>
                  <option value="technical">Technical</option>
                  <option value="confident">Confident</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Length</label>
              <div className="relative">
                <select
                  {...register('length')}
                  disabled={isGenerating}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 pr-8 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="short">Short (~50 words)</option>
                  <option value="medium">Medium (~150 words)</option>
                  <option value="long">Long (~300 words)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {!answer && !isGenerating && (
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 transform hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            Generate Answer
          </button>
        )}

        {isGenerating && (
          <div className="w-full py-4 border border-indigo-500/30 bg-indigo-500/10 rounded-xl flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-indigo-300">Crafting response...</span>
          </div>
        )}
      </form>

      {answer && !isGenerating && (
         <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs font-medium text-slate-400">
                <span>{answer.split(/\s+/).length} words</span>
                <span>{answer.length} chars</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors text-slate-300 font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy Answer
                  </>
                )}
              </button>
           </div>
           <div className="relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
             <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
             </div>
           </div>
           
           <div className="flex gap-3 pt-1">
             <button
                type="button"
                onClick={handleRegenerate}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                Regenerate
              </button>
              <button
                onClick={() => {
                  setAnswer('');
                  storage.saveGeneratedAnswer('');
                  reset({
                    question: watch('question'),
                    jobDescription: watch('jobDescription'),
                    companyUrl: watch('companyUrl'),
                    tone: watch('tone'),
                    length: watch('length')
                  });
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-colors cursor-pointer"
              >
                Finish
              </button>
           </div>
         </div>
      )}
    </div>
  );
}
