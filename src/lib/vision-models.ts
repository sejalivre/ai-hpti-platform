export type VisionProvider = 'openai' | 'google';

export interface VisionModel {
    id: string;
    name: string;
    provider: VisionProvider;
    description: string;
    icon: string;
}

export const VISION_MODELS: VisionModel[] = [
    {
        id: 'gpt-4o',
        name: 'GPT-4o Vision',
        provider: 'openai',
        description: 'Análise visual avançada da OpenAI',
        icon: '🧠',
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini Vision',
        provider: 'openai',
        description: 'Visão rápida e econômica',
        icon: '💡',
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        description: 'Visão multimodal do Google',
        icon: '💎',
    },
];

export const DEFAULT_VISION_MODEL = VISION_MODELS[0];

export function getVisionModelById(id: string): VisionModel | undefined {
    return VISION_MODELS.find(m => m.id === id);
}
