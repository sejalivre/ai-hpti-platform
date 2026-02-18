import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface ApiConfig {
    id: string;
    provider: string;
    apiKey: string;
    baseUrl?: string;
    models: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserApiConfig {
    userId: string;
    configs: ApiConfig[];
}

const API_CONFIG_PREFIX = 'api_config:';

export async function getUserApiConfigs(userId: string): Promise<ApiConfig[]> {
    try {
        const key = `${API_CONFIG_PREFIX}${userId}`;
        const data = await redis.get<UserApiConfig>(key);
        return data?.configs || [];
    } catch (error) {
        console.error('Error fetching user API configs:', error);
        return [];
    }
}

export async function saveUserApiConfigs(userId: string, configs: ApiConfig[]): Promise<boolean> {
    try {
        const key = `${API_CONFIG_PREFIX}${userId}`;
        const userConfig: UserApiConfig = {
            userId,
            configs: configs.map(config => ({
                ...config,
                updatedAt: new Date().toISOString(),
            })),
        };
        await redis.set(key, JSON.stringify(userConfig));
        return true;
    } catch (error) {
        console.error('Error saving user API configs:', error);
        return false;
    }
}

export async function addUserApiConfig(userId: string, config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiConfig | null> {
    try {
        const existingConfigs = await getUserApiConfigs(userId);
        const newConfig: ApiConfig = {
            ...config,
            id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const updatedConfigs = [...existingConfigs, newConfig];
        const success = await saveUserApiConfigs(userId, updatedConfigs);
        return success ? newConfig : null;
    } catch (error) {
        console.error('Error adding user API config:', error);
        return null;
    }
}

export async function updateUserApiConfig(userId: string, configId: string, updates: Partial<ApiConfig>): Promise<boolean> {
    try {
        const existingConfigs = await getUserApiConfigs(userId);
        const configIndex = existingConfigs.findIndex(c => c.id === configId);
        
        if (configIndex === -1) return false;
        
        const updatedConfigs = [...existingConfigs];
        updatedConfigs[configIndex] = {
            ...updatedConfigs[configIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        
        return await saveUserApiConfigs(userId, updatedConfigs);
    } catch (error) {
        console.error('Error updating user API config:', error);
        return false;
    }
}

export async function deleteUserApiConfig(userId: string, configId: string): Promise<boolean> {
    try {
        const existingConfigs = await getUserApiConfigs(userId);
        const updatedConfigs = existingConfigs.filter(c => c.id !== configId);
        return await saveUserApiConfigs(userId, updatedConfigs);
    } catch (error) {
        console.error('Error deleting user API config:', error);
        return false;
    }
}

export async function getActiveApiConfigs(userId: string): Promise<ApiConfig[]> {
    const configs = await getUserApiConfigs(userId);
    return configs.filter(config => config.isActive);
}