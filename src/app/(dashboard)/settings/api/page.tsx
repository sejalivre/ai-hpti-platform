"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Key, Server, Settings, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { type Model } from "@/lib/models";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

interface ApiConfig {
    id: string;
    provider: string;
    apiKey: string;
    baseUrl?: string;
    models: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const PROVIDER_OPTIONS = [
    { value: 'groq', label: 'Groq', defaultModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
    { value: 'deepseek', label: 'DeepSeek', defaultModels: ['deepseek-reasoner', 'deepseek-chat'] },
    { value: 'modal', label: 'Modal (GLM)', defaultModels: ['zai-org/GLM-5-FP8'], defaultBaseUrl: 'https://api.us-west-2.modal.direct/v1' },
    { value: 'openai', label: 'OpenAI', defaultModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
    { value: 'google', label: 'Google AI', defaultModels: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
    { value: 'anthropic', label: 'Anthropic', defaultModels: ['claude-3-5-sonnet', 'claude-3-haiku'] },
];

export default function SettingsApiPage() {
    const { user, isLoaded } = useUser();
    const [configs, setConfigs] = useState<ApiConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const fetchConfigs = async () => {
        if (!user?.id) return;
        
        try {
            const response = await fetch('/api/api-config');
            if (response.ok) {
                const data = await response.json();
                setConfigs(data.configs || []);
            } else {
                throw new Error('Failed to fetch configs');
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user?.id) {
            fetchConfigs();
        }
    }, [isLoaded, user?.id]);

    const handleSave = async () => {
        if (!user?.id) {
            setMessage({ type: 'error', text: 'Usuário não autenticado' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            // Save each config
            const savePromises = configs.map(async (config) => {
                if (config.id.startsWith('new-')) {
                    // New config
                    const response = await fetch('/api/api-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            provider: config.provider,
                            apiKey: config.apiKey,
                            baseUrl: config.baseUrl,
                            models: config.models,
                            isActive: config.isActive,
                        }),
                    });
                    return response.ok;
                } else {
                    // Update existing config
                    const response = await fetch('/api/api-config', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: config.id,
                            provider: config.provider,
                            apiKey: config.apiKey,
                            baseUrl: config.baseUrl,
                            models: config.models,
                            isActive: config.isActive,
                        }),
                    });
                    return response.ok;
                }
            });

            const results = await Promise.all(savePromises);
            const allSuccess = results.every(result => result);

            if (allSuccess) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
                await fetchConfigs(); // Refresh configs
            } else {
                throw new Error('Some configs failed to save');
            }
        } catch (error) {
            console.error('Error saving configs:', error);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (id: string, field: keyof ApiConfig, value: any) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addConfig = () => {
        const newConfig: ApiConfig = {
            id: `new-${Date.now()}`,
            provider: 'groq',
            apiKey: '',
            baseUrl: '',
            models: ['llama-3.3-70b-versatile'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setConfigs(prev => [...prev, newConfig]);
    };

    const deleteConfig = async (id: string) => {
        if (!user?.id) return;

        if (id.startsWith('new-')) {
            // Remove unsaved config
            setConfigs(prev => prev.filter(c => c.id !== id));
            return;
        }

        if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

        try {
            const response = await fetch(`/api/api-config?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Configuração excluída com sucesso!' });
                await fetchConfigs(); // Refresh configs
            } else {
                throw new Error('Failed to delete config');
            }
        } catch (error) {
            console.error('Error deleting config:', error);
            setMessage({ type: 'error', text: 'Erro ao excluir configuração' });
        }
    };

    const getProviderModels = (provider: string) => {
        const providerOption = PROVIDER_OPTIONS.find(p => p.value === provider);
        return providerOption?.defaultModels || [];
    };

    const getProviderDefaultBaseUrl = (provider: string) => {
        const providerOption = PROVIDER_OPTIONS.find(p => p.value === provider);
        return providerOption?.defaultBaseUrl || '';
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Autenticação necessária</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-md">
                    Você precisa estar autenticado para gerenciar configurações de API.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Configurações de API</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Configure suas chaves de API para diferentes provedores de modelos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={addConfig}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold"
                    >
                        <Plus size={16} />
                        Nova Configuração
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={clsx(
                    "mb-6 p-4 rounded-lg flex items-center gap-3",
                    message.type === 'success' 
                        ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                        : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                )}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                </div>
            ) : configs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <Settings className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Nenhuma configuração de API</h3>
                    <p className="text-zinc-500 dark:text-zinc-500 mb-6 max-w-md mx-auto">
                        Adicione sua primeira configuração de API para começar a usar os modelos.
                    </p>
                    <button
                        onClick={addConfig}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold mx-auto"
                    >
                        <Plus size={16} />
                        Adicionar Primeira Configuração
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {configs.map((config) => (
                        <div key={config.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "px-3 py-1 rounded-full text-xs font-bold",
                                        config.isActive 
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}>
                                        {config.isActive ? 'Ativo' : 'Inativo'}
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {PROVIDER_OPTIONS.find(p => p.value === config.provider)?.label || config.provider}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => deleteConfig(config.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all dark:text-red-400 dark:hover:bg-red-950/30"
                                    title="Excluir configuração"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                        Provedor
                                    </label>
                                    <select
                                        value={config.provider}
                                        onChange={(e) => {
                                            updateConfig(config.id, 'provider', e.target.value);
                                            updateConfig(config.id, 'models', getProviderModels(e.target.value));
                                            const defaultBaseUrl = getProviderDefaultBaseUrl(e.target.value);
                                            if (defaultBaseUrl) {
                                                updateConfig(config.id, 'baseUrl', defaultBaseUrl);
                                            }
                                        }}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {PROVIDER_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                        Status
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={config.isActive}
                                                onChange={(e) => updateConfig(config.id, 'isActive', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Ativo</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Chave da API
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="password"
                                        value={config.apiKey}
                                        onChange={(e) => updateConfig(config.id, 'apiKey', e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full p-3 pl-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    URL Base (Opcional)
                                </label>
                                <div className="relative">
                                    <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="text"
                                        value={config.baseUrl || ''}
                                        onChange={(e) => updateConfig(config.id, 'baseUrl', e.target.value)}
                                        placeholder="https://api.example.com/v1"
                                        className="w-full p-3 pl-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Modelos Suportados (separados por vírgula)
                                </label>
                                <input
                                    type="text"
                                    value={config.models.join(', ')}
                                    onChange={(e) => updateConfig(config.id, 'models', e.target.value.split(',').map(m => m.trim()).filter(m => m))}
                                    placeholder="model1, model2, model3"
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                                    Separe os nomes dos modelos com vírgulas. Exemplo: llama-3.3-70b-versatile, llama-3.1-8b-instant
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                    <Info className="text-blue-600 dark:text-blue-400 mt-0.5" size={18} />
                    <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Informações importantes</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• As chaves de API são armazenadas com segurança no servidor</li>
                            <li>• Cada usuário tem suas próprias configurações isoladas</li>
                            <li>• Apenas configurações ativas aparecem no seletor de modelos</li>
                            <li>• As configurações são sincronizadas automaticamente entre dispositivos</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}