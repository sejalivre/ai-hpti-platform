export type ModelProvider = 'groq' | 'openai' | 'google' | 'deepseek' | 'modal' | 'anthropic' | string;

export interface Model {
    id: string;
    name: string;
    provider: ModelProvider;
    description: string;
    icon: string;
    apiConfigId?: string;
}

export interface ApiConfig {
    id: string;
    provider: string;
    apiKey: string;
    baseUrl?: string;
    models: string[];
    isActive: boolean;
}

const PROVIDER_ICONS: Record<string, string> = {
    'groq': '🦙',
    'openai': '🤖',
    'google': '🔍',
    'deepseek': '🔮',
    'modal': '📊',
    'anthropic': '🎭',
    'default': '⚡'
};

const PROVIDER_NAMES: Record<string, string> = {
    'groq': 'Groq',
    'openai': 'OpenAI',
    'google': 'Google AI',
    'deepseek': 'DeepSeek',
    'modal': 'Modal',
    'anthropic': 'Anthropic',
    'default': 'Custom Provider'
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
    'groq': 'Modelos rápidos e eficientes',
    'openai': 'Modelos avançados da OpenAI',
    'google': 'Modelos do Google AI Studio',
    'deepseek': 'Modelos de reasoning avançado',
    'modal': 'Modelos via Modal Labs',
    'anthropic': 'Modelos Claude da Anthropic',
    'default': 'Modelo personalizado configurado pelo usuário'
};

function generateFriendlyName(modelId: string): string {
    let name = modelId
        .replace(/^[^\/]+\//, '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\./g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

    // Special cases for known models
    const specialNames: Record<string, string> = {
        'llama-3.3-70b-versatile': 'Llama 3.3 70B Versatile',
        'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
        'deepseek-reasoner': 'DeepSeek Reasoner',
        'deepseek-chat': 'DeepSeek Chat',
        'gpt-4o': 'GPT-4o',
        'gpt-4o-mini': 'GPT-4o Mini',
        'gpt-3.5-turbo': 'GPT-3.5 Turbo',
        'gemini-1.5-pro': 'Gemini 1.5 Pro',
        'gemini-1.5-flash': 'Gemini 1.5 Flash',
        'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
        'claude-3-haiku': 'Claude 3 Haiku',
        'zai-org/GLM-5-FP8': 'GLM-5 FP8',
    };

    return specialNames[modelId] || name;
}

// Cache for API configs to avoid repeated fetches
let cachedApiConfigs: ApiConfig[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

async function fetchApiConfigs(): Promise<ApiConfig[]> {
    // Return cached configs if they're still valid
    const now = Date.now();
    if (cachedApiConfigs !== null && now - lastFetchTime < CACHE_DURATION) {
        return cachedApiConfigs;
    }

    try {
        const response = await fetch('/api/api-config');
        if (response.ok) {
            const data = await response.json();
            cachedApiConfigs = data.configs || [];
            lastFetchTime = now;
            return cachedApiConfigs!;
        }
    } catch (error) {
        console.error('Error fetching API configs:', error);
    }

    // Fallback to localStorage for development
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('api_configs');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                cachedApiConfigs = parsed;
                return parsed;
            } catch (e) {
                console.error('Error parsing localStorage configs:', e);
            }
        }
    }

    return [];
}

export async function getAvailableModels(): Promise<Model[]> {
    const apiConfigs = await fetchApiConfigs();
    const activeConfigs = apiConfigs.filter(config => config.isActive);
    
    const models: Model[] = [];
    
    for (const config of activeConfigs) {
        for (const modelId of config.models) {
            const provider = config.provider as ModelProvider;
            models.push({
                id: modelId,
                name: generateFriendlyName(modelId),
                provider,
                description: PROVIDER_DESCRIPTIONS[provider] || PROVIDER_DESCRIPTIONS.default,
                icon: PROVIDER_ICONS[provider] || PROVIDER_ICONS.default,
                apiConfigId: config.id,
            });
        }
    }

    // If no models are configured, return some defaults for development
    if (models.length === 0 && typeof window !== 'undefined') {
        return [
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B Versatile',
                provider: 'groq',
                description: 'Modelo rápido e versátil',
                icon: '🦙',
            },
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner',
                provider: 'deepseek',
                description: 'Modelo especializado em reasoning',
                icon: '🔮',
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                provider: 'openai',
                description: 'Modelo compacto e eficiente',
                icon: '🤖',
            },
        ];
    }

    return models;
}

export async function getDefaultModel(): Promise<Model> {
    const models = await getAvailableModels();
    return models[0] || {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        provider: 'groq',
        description: 'Modelo rápido e versátil',
        icon: '🦙',
    };
}

export async function getModelById(modelId: string): Promise<Model | undefined> {
    const models = await getAvailableModels();
    return models.find(m => m.id === modelId);
}

export async function getApiConfigForModel(modelId: string): Promise<ApiConfig | undefined> {
    const apiConfigs = await fetchApiConfigs();
    const models = await getAvailableModels();
    
    const model = models.find(m => m.id === modelId);
    if (!model || !model.apiConfigId) return undefined;
    
    return apiConfigs.find(config => config.id === model.apiConfigId);
}

export function getProviderIcon(provider: string): string {
    return PROVIDER_ICONS[provider] || PROVIDER_ICONS.default;
}

export function getProviderName(provider: string): string {
    return PROVIDER_NAMES[provider] || PROVIDER_NAMES.default;
}

export function getProviderDescription(provider: string): string {
    return PROVIDER_DESCRIPTIONS[provider] || PROVIDER_DESCRIPTIONS.default;
}

// Helper function to clear cache (useful after saving new configs)
export function clearModelCache(): void {
    cachedApiConfigs = null;
    lastFetchTime = 0;
}