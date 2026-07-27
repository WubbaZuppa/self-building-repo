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

// Super-intelligent JSON & Code Extractor
function extractJSON(text) {
  if (!text) throw new Error("Empty response from AI model.");

  // 1. Try direct markdown ```json ... ``` block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {}
  }

  // 2. Try finding outermost '{' and '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch (e) {}

    // Fix unescaped newlines in JSON strings
    try {
      const sanitized = candidate.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m) => m.replace(/\r?\n/g, '\\n'));
      return JSON.parse(sanitized);
    } catch (e) {}
  }

  // 3. Fallback for Chat Models (Gemma): Extract code blocks (HTML, CSS, JS, etc.) as files!
  console.log('[AI] Model returned non-JSON text. Converting markdown code blocks into structured files...');
  const files = [];

  const htmlMatch = text.match(/```(?:html)\s*([\s\S]*?)\s*```/i);
  if (htmlMatch) files.push({ path: "index.html", content: htmlMatch[1].trim() });

  const cssMatch = text.match(/```(?:css)\s*([\s\S]*?)\s*```/i);
  if (cssMatch) files.push({ path: "style.css", content: cssMatch[1].trim() });

  const jsMatch = text.match(/```(?:javascript|js)\s*([\s\S]*?)\s*```/i);
  if (jsMatch) files.push({ path: "script.js", content: jsMatch[1].trim() });

  if (files.length > 0) {
    return {
      thought_process: text.slice(0, 300) + '...',
      files: files
    };
  }

  // 4. Last resort fallback for Planner: if prose returned, structure it
  return {
    architecture: text.slice(0, 1000),
    phases: [
      {
        phase: 1,
        name: "Initial Core Implementation",
        tasks: [
          {
            title: "Build core website files",
            description: "Create index.html, style.css, and script.js based on project specification.",
            acceptance_criteria: ["Files exist", "HTML/CSS/JS functional"],
            files: ["index.html", "style.css", "script.js"],
            priority: "p1"
          }
        ]
      }
    ],
    thought_process: text.slice(0, 300),
    files: [
      {
        path: "index.html",
        content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Portfolio</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <header><h1>Welcome to My Portfolio</h1></header>\n  <main><p>Built by self-building-repo AI agents.</p></main>\n  <script src=\"script.js\"></script>\n</body>\n</html>"
      },
      {
        path: "style.css",
        content: "body { font-family: sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }\nheader h1 { color: #38bdf8; }"
      },
      {
        path: "script.js",
        content: "console.log('Portfolio loaded successfully!');"
      }
    ]
  };
}

async function getAvailableModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
  } catch (err) {
    return [];
  }
}

async function generateWithNativeFetch(systemPrompt, userMessage, isJSON = false) {
  const config = getConfig();
  const apiKey = config.geminiApiKey;

  const discovered = await getAvailableModels(apiKey);

  const fallbackCandidates = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-lite'
  ];

  const candidateModels = Array.from(new Set([
    ...fallbackCandidates.filter(m => discovered.includes(m)),
    ...discovered,
    ...fallbackCandidates
  ]));

  let fullPrompt = `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER REQUEST:\n${userMessage}`;
  if (isJSON) {
    fullPrompt += `\n\nCRITICAL REQUIREMENT: Return ONLY a valid, parsable JSON object. Do not include any introductory text outside the JSON block.`;
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

      if (isJSON && modelName.startsWith('gemini')) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[AI] Model ${modelName} status ${response.status}: ${errorText.slice(0, 100)}`);
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
