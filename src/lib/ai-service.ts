import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Configure Groq Provider
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Configure DeepSeek Provider
const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Configure Modal Provider (Custom OpenAI-compatible)
const modal = createOpenAI({
  baseURL: 'https://api.us-west-2.modal.direct/v1',
  apiKey: process.env.MODAL_API_KEY,
});

export const getModel = (provider: string, modelId: string) => {
  switch (provider) {
    case 'groq':
      return groq(modelId);
    case 'deepseek':
      return deepseek(modelId);
    case 'modal':
      return modal(modelId);
    default:
      throw new Error(`Provider ${provider} not supported`);
  }
};

export { streamText, generateText };
