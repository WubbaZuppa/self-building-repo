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

function getModel(systemPrompt, isJSON = false) {
  const config = getConfig();
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  
  const generationConfig = {};
  if (isJSON) {
    generationConfig.responseMimeType = "application/json";
  }

  return genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: systemPrompt,
    generationConfig
  });
}

export async function chat(systemPrompt, userMessage, options = {}) {
  return retryRequest(async () => {
    const model = getModel(systemPrompt);
    const result = await model.generateContent(userMessage);
    return result.response.text();
  });
}

export async function chatJSON(systemPrompt, userMessage) {
  return retryRequest(async () => {
    const model = getModel(systemPrompt, true);
    const result = await model.generateContent(userMessage);
    let text = result.response.text();
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(text);
  });
}
