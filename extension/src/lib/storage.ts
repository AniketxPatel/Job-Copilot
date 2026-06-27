/// <reference types="chrome" />

const get = async <T>(key: string, defaultValue: T): Promise<T> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result: any) => {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
};

const set = async <T>(key: string, value: T): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
};

export const storage = {
  getResume: () => get('resume', ''),
  saveResume: (resume: string) => set('resume', resume),
  getResumePdf: () => get('resumePdf', ''),
  saveResumePdf: (resumePdf: string) => set('resumePdf', resumePdf),
  getResumeName: () => get('resumeName', ''),
  saveResumeName: (resumeName: string) => set('resumeName', resumeName),
  getFormState: () => get<any>('formState', null),
  saveFormState: (formState: any) => set('formState', formState),
  getGeneratedAnswer: () => get('generatedAnswer', ''),
  saveGeneratedAnswer: (generatedAnswer: string) => set('generatedAnswer', generatedAnswer)
};
