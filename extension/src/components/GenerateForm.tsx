import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { generateAnswer } from '../lib/api';
import { storage } from '../lib/storage';
import type { GenerateRequest } from '../lib/types';

interface Props {
  resume: string;
}

export function GenerateForm({ resume }: Props) {
  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, reset } = useForm<GenerateRequest>({
    defaultValues: {
      question: '',
      jobDescription: '',
      companyUrl: '',
      tone: 'conversational',
      length: 'medium'
    }
  });

  useEffect(() => {
    storage.getFormState().then(state => {
      if (state) {
        reset(state);
      }
    });
    storage.getGeneratedAnswer().then(savedAnswer => {
      if (savedAnswer) {
        setAnswer(savedAnswer);
      }
    });
  }, [reset]);

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
      const response = await generateAnswer({ ...data, resume });
      setAnswer(response.answer);
      storage.saveGeneratedAnswer(response.answer);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Question *</label>
          <textarea
            {...register('question', { required: true })}
            placeholder="Why do you want to work here?"
            className="w-full h-20 bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Description</label>
            <textarea
              {...register('jobDescription')}
              placeholder="Paste JD details..."
              className="w-full h-24 bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company URL</label>
              <input
                {...register('companyUrl')}
                placeholder="https://company.com"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-2">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tone</label>
                <select
                  {...register('tone')}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                >
                  <option value="conversational">Conversational</option>
                  <option value="technical">Technical</option>
                  <option value="confident">Confident</option>
                </select>
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Length</label>
                <select
                  {...register('length')}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
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
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
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
         <div className="mt-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs font-medium text-slate-400">
                <span>{answer.split(/\s+/).length} words</span>
                <span>{answer.length} chars</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors text-slate-300 font-medium"
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
             <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
             </div>
           </div>
           
           <div className="flex gap-3 pt-2">
             <button
                onClick={handleSubmit(onSubmit)}
                className="flex-1 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
              >
                Regenerate
              </button>
              <button
                onClick={() => {
                  setAnswer('');
                  storage.saveGeneratedAnswer('');
                  reset({
                    question: '',
                    jobDescription: '',
                    companyUrl: '',
                    tone: 'conversational',
                    length: 'medium'
                  });
                }}
                className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-colors"
              >
                Finish
              </button>
           </div>
         </div>
      )}
    </div>
  );
}
