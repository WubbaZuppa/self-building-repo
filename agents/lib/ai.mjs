import { GoogleGenerativeAI } from '@google/generative-ai';
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

const CANDIDATE_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro-latest'
];

async function generateWithFallback(systemPrompt, userMessage, isJSON = false) {
  const config = getConfig();
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  
  const fullPrompt = `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER REQUEST:\n${userMessage}`;
  
  let lastError;
  const modelsToTry = [config.model, ...CANDIDATE_MODELS.filter(m => m !== config.model)];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting request with model: ${modelName}`);
      const generationConfig = isJSON ? { responseMimeType: "application/json" } : {};
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      console.warn(`[AI] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }
  throw new Error(`All AI model attempts failed. Last error: ${lastError?.message}`);
}

export async function chat(systemPrompt, userMessage, options = {}) {
  return retryRequest(async () => {
    return await generateWithFallback(systemPrompt, userMessage, false);
  });
}

export async function chatJSON(systemPrompt, userMessage) {
  return retryRequest(async () => {
    const rawText = await generateWithFallback(systemPrompt, userMessage, true);
    let text = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(text);
  });
}
