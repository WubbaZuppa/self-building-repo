import { getConfig } from './config.mjs';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryRequest(requestFn, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      attempt++;
      console.warn(`[AI] Request failed (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt >= maxRetries) {
        throw new Error(`AI request failed after ${maxRetries} attempts: ${error.message}`);
      }
      const backoff = Math.pow(2, attempt) * 2000;
      console.log(`[AI] Waiting ${backoff}ms before retrying...`);
      await delay(backoff);
    }
  }
}

// Dynamically discover available models for this API key
async function getAvailableModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[AI] Could not list models (${res.status}): ${errText}`);
      return [];
    }
    const data = await res.json();
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
    
    console.log(`[AI] Discovered ${models.length} available models for API key:`, models.slice(0, 5).join(', '));
    return models;
  } catch (err) {
    console.warn('[AI] Error querying available models:', err.message);
    return [];
  }
}

async function generateWithNativeFetch(systemPrompt, userMessage, isJSON = false) {
  const config = getConfig();
  const apiKey = config.geminiApiKey;

  // 1. Discover models dynamically
  const discovered = await getAvailableModels(apiKey);
  
  // Default candidates list if discovery returned empty
  const fallbackCandidates = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];

  // Prioritize discovered models, fallback to defaults
  const candidateModels = Array.from(new Set([...discovered, ...fallbackCandidates]));

  const fullPrompt = `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER REQUEST:\n${userMessage}`;

  let lastError;

  for (const modelName of candidateModels) {
    try {
      console.log(`[AI] Attempting generateContent with model: ${modelName}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ]
      };

      if (isJSON) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[AI] Model ${modelName} returned status ${response.status}: ${errorText}`);
        lastError = new Error(`Status ${response.status}: ${errorText}`);
        continue; // Try next candidate
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log(`[AI] Success with model: ${modelName}`);
        return text;
      } else {
        console.warn(`[AI] Model ${modelName} returned empty text response.`);
      }
    } catch (err) {
      console.warn(`[AI] Model ${modelName} request error:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All AI model attempts failed. Last error: ${lastError?.message}`);
}

export async function chat(systemPrompt, userMessage, options = {}) {
  return retryRequest(async () => {
    return await generateWithNativeFetch(systemPrompt, userMessage, false);
  });
}

export async function chatJSON(systemPrompt, userMessage) {
  return retryRequest(async () => {
    const rawText = await generateWithNativeFetch(systemPrompt, userMessage, true);
    let text = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(text);
  });
}
