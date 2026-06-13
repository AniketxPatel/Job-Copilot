/// <reference types="chrome" />

export const storage = {
  getResume: async (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['resume'], (result: any) => {
        resolve(result.resume || '');
      });
    });
  },
  saveResume: async (resume: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ resume }, () => {
        resolve();
      });
    });
  },
  getResumePdf: async (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['resumePdf'], (result: any) => {
        resolve(result.resumePdf || '');
      });
    });
  },
  saveResumePdf: async (resumePdf: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ resumePdf }, () => {
        resolve();
      });
    });
  },
  getFormState: async (): Promise<any> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['formState'], (result: any) => {
        resolve(result.formState || null);
      });
    });
  },
  saveFormState: async (formState: any): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ formState }, () => {
        resolve();
      });
    });
  },
  getGeneratedAnswer: async (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['generatedAnswer'], (result: any) => {
        resolve(result.generatedAnswer || '');
      });
    });
  },
  saveGeneratedAnswer: async (generatedAnswer: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ generatedAnswer }, () => {
        resolve();
      });
    });
  }
};
