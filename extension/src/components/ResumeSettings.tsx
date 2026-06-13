import { useState, useRef } from 'react';
import { extractResume } from '../lib/api';
import clsx from 'clsx';

interface Props {
  resume: string;
  resumePdf: string;
  setResume: (val: string) => void;
  setResumePdf: (val: string) => void;
  onSave: (resume: string, resumePdf: string) => void;
  resumeSavedMessage: boolean;
}

export function ResumeSettings({ resume, resumePdf, setResume, setResumePdf, onSave, resumeSavedMessage }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed.');
      return;
    }
    
    setIsUploading(true);
    try {
      const text = await extractResume(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setResume(text);
        setResumePdf(base64data);
        onSave(text, base64data);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'Failed to extract resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-[480px]">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <label className="text-sm font-medium text-slate-300">Your Resume</label>
        {resumeSavedMessage && <span className="text-xs text-green-400 font-medium animate-pulse">Saved successfully!</span>}
      </div>

      {!resume ? (
        <div 
          className={clsx(
            "flex-1 relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
            dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 bg-slate-900/50 hover:border-indigo-400/50 hover:bg-slate-800/50"
          )}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-indigo-300">Extracting PDF magically...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-slate-400 hover:text-slate-200 transition-colors">
              <div className="bg-slate-800/80 p-4 rounded-full mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="text-sm font-medium tracking-wide">Click or drag your PDF resume here</span>
              <span className="text-xs text-slate-500">Only PDF files are supported</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-2 text-xs text-slate-400 overflow-hidden mb-4 relative flex flex-col">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/80 px-2 shrink-0">
              <div className="bg-green-500/20 p-1 rounded">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium text-slate-300">Resume Uploaded Successfully</span>
            </div>
            {resumePdf ? (
              <iframe 
                src={`${resumePdf}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full flex-1 rounded bg-white"
                title="Resume PDF"
              />
            ) : (
              <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                <p className="whitespace-pre-wrap leading-relaxed select-text">{resume}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => { setResume(''); setResumePdf(''); onSave('', ''); }}
            className="shrink-0 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all duration-200 border border-slate-700"
          >
            Upload a Different Resume
          </button>
        </div>
      )}
    </div>
  );
}
