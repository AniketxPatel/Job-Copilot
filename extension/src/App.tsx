import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { storage } from './lib/storage';
import { supabase } from './lib/supabase';
import { ResumeSettings } from './components/ResumeSettings';
import { GenerateForm } from './components/GenerateForm';
import { Auth } from './components/Auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'settings'>('generate');
  const [resume, setResume] = useState('');
  const [resumePdf, setResumePdf] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [resumeSavedMessage, setResumeSavedMessage] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const loadResume = async () => {
      // 1. Check local storage first
      const [savedResume, savedResumePdf, savedResumeName] = await Promise.all([
        storage.getResume(),
        storage.getResumePdf(),
        storage.getResumeName()
      ]);

      if (savedResume && savedResumeName) {
        setResume(savedResume);
        if (savedResumePdf) setResumePdf(savedResumePdf);
        setResumeName(savedResumeName);
        return;
      }

      // 2. Local storage empty, fetch from backend API (bypasses Supabase client-side RLS)
      try {
        const res = await fetch('http://localhost:3000/api/get-resume', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (res.ok) {
          const profile = await res.json();
          if (profile?.resume_text) {
            let base64Pdf = '';
            let extractedName = '';

            if (profile.resume_pdf_url) {
              // Extract original filename from storage URL path
              const urlParts = profile.resume_pdf_url.split('/');
              const lastPart = urlParts[urlParts.length - 1];
              const underscoreIdx = lastPart.indexOf('_');
              if (underscoreIdx !== -1) {
                extractedName = decodeURIComponent(lastPart.substring(underscoreIdx + 1));
              } else {
                extractedName = 'resume.pdf';
              }

              try {
                const pdfRes = await fetch(profile.resume_pdf_url);
                if (pdfRes.ok) {
                  const blob = await pdfRes.blob();
                  base64Pdf = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                }
              } catch (e) {
                console.error('Error fetching resume PDF:', e);
              }
            }

            await Promise.all([
              storage.saveResume(profile.resume_text),
              storage.saveResumePdf(base64Pdf),
              storage.saveResumeName(extractedName)
            ]);

            setResume(profile.resume_text);
            if (base64Pdf) setResumePdf(base64Pdf);
            if (extractedName) setResumeName(extractedName);
          } else {
            setActiveTab('settings');
          }
        } else {
          setActiveTab('settings');
        }
      } catch (err) {
        console.error('Error syncing resume from backend API:', err);
        setActiveTab('settings');
      }
    };

    loadResume();
  }, [session]);

  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapingStatus, setScrapingStatus] = useState('Initializing scan...');

  const scrapeActiveTab = async () => {
    setIsScraping(true);
    setScrapeError('');
    setScrapingStatus('Connecting to active page...');
    const startTime = Date.now();

    const finishScraping = (errorMsg = '', finalStatus = '') => {
      if (errorMsg) {
        setScrapeError(errorMsg);
      }
      if (finalStatus) {
        setScrapingStatus(finalStatus);
      }
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 1500 - elapsed);
      setTimeout(() => {
        setIsScraping(false);
      }, delay);
    };

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        setScrapingStatus('Injecting scanning helper...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
        } catch (e) {
          console.log('Script injection skipped/failed, trying messaging directly:', e);
        }

        setScrapingStatus('Extracting job description & questions...');
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' }, async (response) => {
          if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
            finishScraping('Could not connect to the webpage. Please refresh the page and try scanning again.', 'Connection failed');
            return;
          }
          if (response) {
            if (response.jd) setJd(response.jd);

            // Resolve company website URL via backend API using companyName
            if (response.companyName) {
              setScrapingStatus(`Searching web for official ${response.companyName} site...`);
              try {
                const res = await fetch('http://localhost:3000/api/company-details', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ companyName: response.companyName })
                });
                if (res.ok) {
                  const details = await res.json();
                  if (details.websiteUrl) {
                    setCompanyUrl(details.websiteUrl);
                  } else {
                    setCompanyUrl(response.companyUrl || tab.url || '');
                  }
                } else {
                  setCompanyUrl(response.companyUrl || tab.url || '');
                }
              } catch (e) {
                setCompanyUrl(response.companyUrl || tab.url || '');
              }
            } else {
              setCompanyUrl(response.companyUrl || tab.url || '');
            }

            if (response.questions && response.questions.length > 0) {
              setQuestion(response.questions[0].question);
            } else {
              setQuestion(''); // Clear if no question detected
            }
            finishScraping('', 'Scan complete!');
          } else {
            finishScraping('No data could be extracted from the active page.', 'Failed to extract content');
          }
        });
      } else {
        finishScraping('No active browser tab found.', 'No active tab');
      }
    } catch (err) {
      console.error('Failed to query tab:', err);
      finishScraping('Failed to scan active tab.', 'Error querying tab');
    }
  };

  useEffect(() => {
    if (session) {
      scrapeActiveTab();
    }
  }, [session]);

  const handleSaveResume = async (newResume: string, newResumePdf: string, newResumeName: string) => {
    await Promise.all([
      storage.saveResume(newResume),
      storage.saveResumePdf(newResumePdf),
      storage.saveResumeName(newResumeName)
    ]);
    setResumeName(newResumeName);
    setResumeSavedMessage(true);
    setTimeout(() => setResumeSavedMessage(false), 2000);
  };

  return (
    <div className="w-[450px] min-h-[550px] bg-slate-950 text-slate-100 font-sans p-4 relative overflow-hidden selection:bg-indigo-500/30 flex flex-col">
      {/* Page analysis overlay loader */}
      {isScraping && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            {/* Spinning abstract gradient ring */}
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent"></div>
            <div className="animate-ping absolute rounded-full h-8 w-8 bg-indigo-500/10"></div>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center px-6">
            <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 animate-pulse tracking-wide">
              {scrapingStatus}
            </span>
            <span className="text-[11px] text-slate-400">
              Scraping page elements & resolving company domain
            </span>
          </div>
        </div>
      )}

      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent -z-10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-600/20 to-transparent -z-10 blur-3xl rounded-full" />

      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 shrink-0">
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
        {session && (
          <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-800 backdrop-blur-md items-center gap-2">
            <div className="flex">
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
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                await Promise.all([
                  storage.saveResume(''),
                  storage.saveResumePdf(''),
                  storage.saveResumeName(''),
                  storage.saveFormState(null),
                  storage.saveGeneratedAnswer('')
                ]);
                setResume('');
                setResumePdf('');
                setResumeName('');
              }}
              className="px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 min-h-0">
        {!session ? (
          <Auth />
        ) : activeTab === 'settings' ? (
          <ResumeSettings
            resume={resume}
            resumePdf={resumePdf}
            resumeName={resumeName}
            setResume={setResume}
            setResumePdf={setResumePdf}
            setResumeName={setResumeName}
            onSave={handleSaveResume}
            resumeSavedMessage={resumeSavedMessage}
          />
        ) : (
          <GenerateForm
            resume={resume}
            initialJd={jd}
            initialQuestion={question}
            initialCompanyUrl={companyUrl}
            isScraping={isScraping}
            scrapeError={scrapeError}
            onReScrape={scrapeActiveTab}
          />
        )}
      </main>
    </div>
  );
}
