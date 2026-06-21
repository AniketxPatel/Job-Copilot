// DOM Scraper and Autofiller Content Script

// Helper: Scrape Job Description
function scrapeJobDescription() {
  // Common selectors for Job Descriptions on popular ATS and platforms
  const selectors = [
    // Greenhouse
    '#content',
    '.job-description',
    '#job-details',
    // Lever
    '.section.page-centered.html-section',
    '.posting-description',
    // LinkedIn
    '.jobs-description__container',
    '.jobs-box__html-content',
    '#job-details',
    // Workday
    '[data-automation-id="jobPostingDescription"]',
    // Generic fallbacks
    '[class*="job-description"]',
    '[class*="description"]',
    '[id*="description"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.innerText.trim().length > 100) {
      return el.innerText.trim();
    }
  }

  // Fallback: If nothing specific is found, get the text of the main content elements or body
  const main = document.querySelector('main') || document.querySelector('article') || document.body;
  if (main) {
    return main.innerText.trim().substring(0, 5000);
  }
  return '';
}

// Helper: Identify Company Website URL
function scrapeCompanyUrl() {
  // First priority: Try parsing JSON-LD Schema (Google Job Search schema)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.innerText);
      const objects = Array.isArray(data) ? data : [data];
      for (const obj of objects) {
        // Look for JobPosting schema
        if (obj['@type'] === 'JobPosting' || obj['@context']?.includes('schema.org')) {
          const org = obj.hiringOrganization;
          if (org) {
            const orgUrl = org.sameAs || org.url;
            if (orgUrl && typeof orgUrl === 'string' && orgUrl.startsWith('http')) {
              return orgUrl;
            }
          }
        }
      }
    } catch (e) { }
  }

  // Second priority: Try to extract an external link directly from the Job Description text
  const jdText = scrapeJobDescription();
  if (jdText) {
    const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
    const matches = jdText.match(urlRegex);
    if (matches) {
      const ignoredDomains = ['wellfound.com', 'greenhouse.io', 'lever.co', 'linkedin.com', 'angel.co', 'twitter.com', 'x.com', 'github.com'];
      for (const match of matches) {
        try {
          const cleanUrl = match.replace(/[.,;:)\]'"]$/, ''); // Remove trailing punctuation
          const parsed = new URL(cleanUrl);
          if (!ignoredDomains.some(domain => parsed.hostname.includes(domain))) {
            return cleanUrl;
          }
        } catch (e) { }
      }
    }
  }

  // Check for specific selectors next
  const companySelectors = [
    'a[href*="website"]',
    'a[class*="website"]',
    'a[class*="company"]',
    '.company-website a',
    'a[data-automation-id="companyPageLink"]'
  ];

  for (const selector of companySelectors) {
    const el = document.querySelector(selector);
    if (el && el.href) return el.href;
  }

  // Generic fallback: Scan all links on page
  const links = Array.from(document.querySelectorAll('a'));
  const currentHost = window.location.hostname;
  const ignoredDomains = [
    'wellfound.com', 'greenhouse.io', 'lever.co', 'linkedin.com', 'angel.co',
    'twitter.com', 'x.com', 'github.com', 'facebook.com', 'youtube.com',
    'instagram.com', 'medium.com', 'google.com', 'microsoft.com', 'apple.com',
    'glassdoor.com', 'indeed.com', 'w3.org', 'schema.org', 'google.co.in'
  ];

  for (const link of links) {
    try {
      const href = link.href;
      if (!href) continue;

      const url = new URL(href);
      const hostname = url.hostname.toLowerCase();

      // Skip if it matches the current host or any of the ignored domains
      if (hostname === currentHost || ignoredDomains.some(domain => hostname.includes(domain))) {
        continue;
      }

      // Skip non-HTTP links (like mailto or javascript)
      if (!url.protocol.startsWith('http')) {
        continue;
      }

      // We found an external link! Return it.
      return href;
    } catch (e) {
      // Invalid URL
    }
  }
  return '';
}

// Helper: Detect Form Fields and Questions
function detectQuestions() {
  const fields = [];
  const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');

  // Words that indicate an input is NOT an application question
  const excludedKeywords = [
    'search', 'query', 'find', 'filter', 'location', 'keyword', 'city', 'zip', 'country',
    'email', 'password', 'login', 'username', 'phone', 'tel', 'name', 'first_name',
    'last_name', 'first-name', 'last-name', 'resume', 'cv', 'attach', 'file', 'upload',
    'captcha', 'sign-in', 'signin', 'newsletter', 'subscribe', 'url', 'website', 'portfolio',
    'github', 'linkedin', 'twitter'
  ];

  inputs.forEach((input, index) => {
    // Skip inputs inside header/nav elements
    if (input.closest('header') || input.closest('nav') || input.closest('.header') || input.closest('.navbar')) {
      return;
    }

    // Skip hidden or tiny inputs
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(input).display === 'none') {
      return;
    }

    // Skip if input attributes match excluded keywords
    const inputType = (input.getAttribute('type') || '').toLowerCase();
    const inputName = (input.getAttribute('name') || '').toLowerCase();
    const inputId = (input.getAttribute('id') || '').toLowerCase();
    const inputPlaceholder = (input.getAttribute('placeholder') || '').toLowerCase();
    const inputClass = (input.className || '').toLowerCase();

    if (inputType === 'search') return;

    const isExcluded = excludedKeywords.some(keyword =>
      inputName.includes(keyword) ||
      inputId.includes(keyword) ||
      inputPlaceholder.includes(keyword) ||
      inputClass.includes(keyword)
    );

    if (isExcluded) return;

    let questionText = '';

    // 1. Check for label pointing to input ID
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        questionText = label.innerText.trim();
      }
    }

    // 2. Check if parent/ancestor is label
    if (!questionText) {
      const parentLabel = input.closest('label');
      if (parentLabel) {
        let text = parentLabel.innerText || '';
        text = text.replace(input.value || '', '').trim();
        questionText = text;
      }
    }

    // 3. Look for placeholder or aria-label
    if (!questionText) {
      questionText = input.getAttribute('placeholder') || input.getAttribute('aria-label') || '';
    }

    // 4. Traverse up and search for text (Greenhouse/Lever/Wellfound patterns)
    if (!questionText || questionText.length < 3) {
      let current = input.parentElement;
      let depth = 0;
      while (current && depth < 3) {
        const potentialLabel = current.querySelector('label, [class*="label"], [class*="title"], [class*="question"]');
        if (potentialLabel && potentialLabel !== input) {
          questionText = potentialLabel.innerText.trim();
          break;
        }
        current = current.parentElement;
        depth++;
      }
    }

    // Clean up question text
    questionText = questionText
      .replace(/[*：:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Skip if question text itself matches excluded keywords
    const isQuestionExcluded = excludedKeywords.some(keyword =>
      questionText.toLowerCase().includes(keyword)
    );
    if (isQuestionExcluded && questionText.split(/\s+/).length < 3) {
      // Allow longer questions even if they contain keywords (e.g. "What is your full name...")
      return;
    }

    let selector = '';
    if (input.id) {
      selector = `#${input.id}`;
    } else if (input.name) {
      selector = `${input.tagName.toLowerCase()}[name="${input.name}"]`;
    } else {
      input.setAttribute('data-job-copilot-id', `field-${index}`);
      selector = `[data-job-copilot-id="field-${index}"]`;
    }

    if (questionText && questionText.length > 2) {
      fields.push({
        selector,
        question: questionText,
        type: input.tagName.toLowerCase(),
        placeholder: input.getAttribute('placeholder') || ''
      });
    }
  });

  return fields;
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SCRAPE_PAGE') {
    const jd = scrapeJobDescription();
    const companyUrl = scrapeCompanyUrl();
    const companyName = scrapeCompanyName();
    const questions = detectQuestions();
    sendResponse({ jd, companyUrl, companyName, questions });
  }
  return true;
});
