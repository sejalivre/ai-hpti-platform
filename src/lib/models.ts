export type ModelProvider = 'groq' | 'openai' | 'google' | 'deepseek' | 'modal';

export interface Model {
    id: string;
    name: string;
    provider: ModelProvider;
    description: string;
    icon: string;
}

export const MODELS: Model[] = [
    {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        provider: 'groq',
        description: 'Modelo versátil e rápido da Meta',
        icon: '🦙',
    },
    {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        provider: 'groq',
        description: 'Respostas rápidas e eficientes',
        icon: '⚡',
    },
    {
        id: 'moonshotai/kimi-k2-instruct',
        name: 'Kimi K2',
        provider: 'groq',
        description: 'Modelo avançado da Moonshot AI',
        icon: '🌙',
    },
    {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1',
        provider: 'deepseek',
        description: 'Modelo de reasoning avançado da DeepSeek',
        icon: '🔮',
    },
    {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        description: 'Modelo conversacional da DeepSeek',
        icon: '💬',
    },
    {
        id: 'zai-org/GLM-5-FP8',
        name: 'GLM-5',
        provider: 'modal',
        description: 'Modelo avançado da Zhipu AI via Modal',
        icon: '📊',
    },
];

export const DEFAULT_MODEL = MODELS[0];

export function getModelById(id: string): Model | undefined {
    return MODELS.find(m => m.id === id);
}
