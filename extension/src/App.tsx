import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { storage } from './lib/storage';
import { ResumeSettings } from './components/ResumeSettings';
import { GenerateForm } from './components/GenerateForm';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'settings'>('generate');
  const [resume, setResume] = useState('');
  const [resumePdf, setResumePdf] = useState('');
  const [resumeSavedMessage, setResumeSavedMessage] = useState(false);

  useEffect(() => {
    Promise.all([storage.getResume(), storage.getResumePdf()]).then(([savedResume, savedResumePdf]) => {
      if (savedResume) {
        setResume(savedResume);
        if (savedResumePdf) setResumePdf(savedResumePdf);
      } else {
        setActiveTab('settings');
      }
    });
  }, []);

  const handleSaveResume = async (newResume: string, newResumePdf: string) => {
    await Promise.all([
      storage.saveResume(newResume),
      storage.saveResumePdf(newResumePdf)
    ]);
    setResumeSavedMessage(true);
    setTimeout(() => setResumeSavedMessage(false), 2000);
  };

  return (
    <div className="w-[450px] min-h-[550px] bg-slate-950 text-slate-100 font-sans p-4 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent -z-10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-600/20 to-transparent -z-10 blur-3xl rounded-full" />

      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
            Job Copilot
          </h1>
        </div>
        <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('generate')}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
              activeTab === 'generate' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
              activeTab === 'settings' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            Resume
          </button>
        </div>
      </header>

      {activeTab === 'settings' ? (
        <ResumeSettings 
          resume={resume} 
          resumePdf={resumePdf}
          setResume={setResume} 
          setResumePdf={setResumePdf}
          onSave={handleSaveResume} 
          resumeSavedMessage={resumeSavedMessage} 
        />
      ) : (
        <GenerateForm resume={resume} />
      )}
    </div>
  );
}
