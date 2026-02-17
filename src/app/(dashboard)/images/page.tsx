"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, ChevronDown, Loader2, Copy, Check, X } from "lucide-react";
import { VISION_MODELS, type VisionModel } from "@/lib/vision-models";
import { clsx } from "clsx";

interface ImageData {
    base64: string;
    mimeType: string;
    url: string;
}

export const dynamic = "force-dynamic";

export default function ImagesPage() {
    const [image, setImage] = useState<ImageData | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [usedModel, setUsedModel] = useState<VisionModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<VisionModel>(VISION_MODELS[0]);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('O arquivo é muito grande. Máximo: 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const mimeType = file.type;
            const base64 = dataUrl.split(',')[1] || '';

            setImage({ base64, mimeType, url: "" });
            setPreview(dataUrl);
            setResult(null);
            setUsedModel(null);
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (!file) continue;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    const mimeType = file.type;
                    const base64 = dataUrl.split(',')[1] || '';

                    setImage({ base64, mimeType, url: "" });
                    setPreview(dataUrl);
                    setResult(null);
                    setUsedModel(null);
                };
                reader.readAsDataURL(file);
                break;
            }
        }
    };

    const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const url = formData.get('url') as string;

        if (url) {
            setImage({ base64: "", mimeType: "", url });
            setPreview(url);
            setResult(null);
            setUsedModel(null);
        }
    };

    const handleAnalyze = async () => {
        if (!image || isLoading) return;

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: {
                        base64: image.base64,
                        mimeType: image.mimeType,
                        url: image.url,
                    },
                    prompt: prompt || undefined,
                    modelId: selectedModel.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao analisar imagem');
            }

            setResult(data.result);
            setUsedModel(data.model);
        } catch (error) {
            console.error('Erro:', error);
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            setResult(`Erro: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setImage(null);
        setPreview(null);
        setResult(null);
        setUsedModel(null);
        setPrompt("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'openai': return 'text-green-500 bg-green-50 dark:bg-green-950/30';
            case 'google': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
            default: return 'text-zinc-500 bg-zinc-50';
        }
    };

    const getProviderLabel = (provider: string) => {
        switch (provider) {
            case 'openai': return 'OpenAI';
            case 'google': return 'Google';
            default: return provider;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Análise Visual</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative" ref={modelMenuRef}>
                        <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all dark:border-zinc-700 dark:hover:border-zinc-600"
                        >
                            <span className="text-base">{selectedModel.icon}</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{selectedModel.name}</span>
                            <ChevronDown size={14} className={clsx(
                                "text-zinc-400 transition-transform",
                                isModelMenuOpen && "rotate-180"
                            )} />
                        </button>

                        {isModelMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="max-h-80 overflow-y-auto">
                                    {['openai', 'google'].map((provider) => (
                                        <div key={provider}>
                                            <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50">
                                                <span className={clsx(
                                                    "text-[10px] font-bold tracking-widest uppercase",
                                                    getProviderColor(provider)
                                                )}>
                                                    {getProviderLabel(provider)}
                                                </span>
                                            </div>
                                            {VISION_MODELS.filter(m => m.provider === provider).map((model) => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model);
                                                        setIsModelMenuOpen(false);
                                                    }}
                                                    className={clsx(
                                                        "w-full flex items-center gap-3 px-3 py-3 text-left transition-all",
                                                        selectedModel.id === model.id
                                                            ? "bg-purple-50 dark:bg-purple-950/30"
                                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                                    )}
                                                >
                                                    <span className="text-lg">{model.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={clsx(
                                                            "text-sm font-bold truncate",
                                                            selectedModel.id === model.id
                                                                ? "text-purple-600 dark:text-purple-400"
                                                                : "text-zinc-700 dark:text-zinc-300"
                                                        )}>
                                                            {model.name}
                                                        </p>
                                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                            {model.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {image && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all dark:hover:bg-red-900/10"
                        >
                            <X size={16} />
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Upload de Imagem</h3>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                                    Clique para fazer upload ou cole uma imagem (Ctrl+V)
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">PNG, JPG, WEBP até 10MB</p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400">ou use uma URL</span>
                                </div>
                            </div>

                            <form onSubmit={handleUrlSubmit} className="flex gap-2">
                                <input
                                    name="url"
                                    type="url"
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    className="flex-1 px-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-bold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    Carregar
                                </button>
                            </form>
                        </div>

                        {preview && (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-64 object-contain rounded-lg bg-zinc-50 dark:bg-zinc-800"
                                />
                            </div>
                        )}

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Prompt Personalizado (opcional)</h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Descreva os objetos na imagem e identifique o contexto..."
                                rows={3}
                                className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                            />
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={!image || isLoading}
                            className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5" />
                                    Analisar Imagem
                                </>
                            )}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 min-h-[400px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Resultado</h3>
                                {result && (
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                )}
                            </div>

                            {usedModel && (
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                    <span>{usedModel.icon}</span>
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                        {usedModel.name}
                                    </span>
                                </div>
                            )}

                            {result ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                        {result}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <ImageIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                                        Faça upload de uma imagem e clique em analisar
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
