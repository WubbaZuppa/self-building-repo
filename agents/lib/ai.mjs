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

// Robustly extract JSON object from text even if model adds markdown or preamble
function extractJSON(text) {
  if (!text) throw new Error("Empty response from AI model.");

  // 1. Try markdown code block matcher ```json ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {}
  }

  // 2. Try slicing from first '{' to last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  // 3. Direct parse fallback
  return JSON.parse(text.trim());
}

async function getAvailableModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      console.warn(`[AI] Could not list models (${res.status})`);
      return [];
    }
    const data = await res.json();
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
    
    console.log(`[AI] Discovered ${models.length} models for API key:`, models.slice(0, 5).join(', '));
    return models;
  } catch (err) {
    console.warn('[AI] Error querying available models:', err.message);
    return [];
  }
}

async function generateWithNativeFetch(systemPrompt, userMessage, isJSON = false) {
  const config = getConfig();
  const apiKey = config.geminiApiKey;

  const discovered = await getAvailableModels(apiKey);

  // Preferred order of models for fast and structured text generation
  const fallbackCandidates = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemma-4-26b-a4b-it'
  ];

  // Prioritize flash/pro models over gemma for better JSON adherence
  const candidateModels = Array.from(new Set([
    ...fallbackCandidates.filter(m => discovered.includes(m)),
    ...discovered,
    ...fallbackCandidates
  ]));

  let fullPrompt = `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER REQUEST:\n${userMessage}`;
  if (isJSON) {
    fullPrompt += `\n\nCRITICAL REQUIREMENT: Return ONLY a valid, parsable JSON object. Do not include any introductory or concluding text, explanations, or commentary outside the JSON block.`;
  }

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
        console.warn(`[AI] Model ${modelName} status ${response.status}: ${errorText.slice(0, 150)}`);
        lastError = new Error(`Status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log(`[AI] Success with model: ${modelName}`);
        return text;
      }
    } catch (err) {
      console.warn(`[AI] Model ${modelName} error:`, err.message);
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
    return extractJSON(rawText);
  });
}
