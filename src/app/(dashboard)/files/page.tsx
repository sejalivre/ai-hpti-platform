"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Sparkles, ChevronDown, Loader2, Copy, Check, X, File, FileText as FileTextIcon } from "lucide-react";
import { MODELS, type Model } from "@/lib/models";
import { clsx } from "clsx";

interface DocumentData {
    content: string;
    fileName: string;
    fileType: string;
}

export const dynamic = "force-dynamic";

export default function FilesPage() {
    const [document, setDocument] = useState<DocumentData | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [usedModel, setUsedModel] = useState<Model | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            'text/plain',
            'text/markdown',
            'text/html',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.some(type => file.type.includes(type.replace('application/', '').replace('text/', '')))) {
            alert('Por favor, selecione um arquivo de texto suportado (TXT, MD, HTML, DOC, DOCX). PDF não é suportado no momento.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('O arquivo é muito grande. Máximo: 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const fileName = file.name;
            const fileType = file.type;

            setDocument({ content, fileName, fileType });
            const previewText = content.length > 500 
                ? content.substring(0, 500) + '... [documento truncado para visualização]'
                : content;
            setPreview(previewText);
            setResult(null);
            setUsedModel(null);
        };

        reader.readAsText(file);
    };

    const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const url = formData.get('url') as string;

        if (url) {
            setDocument({ content: '', fileName: 'URL Document', fileType: 'text/url' });
            setPreview(`URL: ${url}`);
            setResult(null);
            setUsedModel(null);
        }
    };

    const handleAnalyze = async () => {
        if (!document || isLoading) return;

        setIsLoading(true);
        setResult(null);

        try {
            const truncatedContent = document.content.length > 10000 
                ? document.content.substring(0, 10000) + '\n\n[Documento truncado devido ao tamanho]'
                : document.content;

            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document: {
                        content: truncatedContent,
                        fileName: document.fileName,
                        fileType: document.fileType,
                    },
                    prompt: prompt || undefined,
                    modelId: selectedModel.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao analisar documento');
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
        setDocument(null);
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
            case 'groq': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
            case 'openai': return 'text-green-500 bg-green-50 dark:bg-green-950/30';
            case 'google': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
            default: return 'text-zinc-500 bg-zinc-50';
        }
    };

    const getProviderLabel = (provider: string) => {
        switch (provider) {
            case 'groq': return 'Groq';
            case 'openai': return 'OpenAI';
            case 'google': return 'Google';
            default: return provider;
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return <File className="w-5 h-5" />;
        if (fileType.includes('word') || fileType.includes('document')) return <FileTextIcon className="w-5 h-5" />;
        return <FileText className="w-5 h-5" />;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Análise de Documentos</span>
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
                                    {['groq', 'openai', 'google'].map((provider) => (
                                        <div key={provider}>
                                            <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50">
                                                <span className={clsx(
                                                    "text-[10px] font-bold tracking-widest uppercase",
                                                    getProviderColor(provider)
                                                )}>
                                                    {getProviderLabel(provider)}
                                                </span>
                                            </div>
                                            {MODELS.filter(m => m.provider === provider).map((model) => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model);
                                                        setIsModelMenuOpen(false);
                                                    }}
                                                    className={clsx(
                                                        "w-full flex items-center gap-3 px-3 py-3 text-left transition-all",
                                                        selectedModel.id === model.id
                                                            ? "bg-emerald-50 dark:bg-emerald-950/30"
                                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                                    )}
                                                >
                                                    <span className="text-lg">{model.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={clsx(
                                                            "text-sm font-bold truncate",
                                                            selectedModel.id === model.id
                                                                ? "text-emerald-600 dark:text-emerald-400"
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

                    {document && (
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
                            <h3 className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Upload de Documento</h3>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.md,.html,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                                    Clique para fazer upload de um documento
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">TXT, MD, HTML, DOC, DOCX até 5MB</p>
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
                                    placeholder="https://exemplo.com/documento.pdf"
                                    className="flex-1 px-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    {getFileIcon(document?.fileType || '')}
                                    <h3 className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">
                                        {document?.fileName || 'Documento'}
                                    </h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                                    <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                                        {preview}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Prompt Personalizado (opcional)</h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Resuma este documento, identifique os pontos principais, extraia informações importantes..."
                                rows={3}
                                className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                            />
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={!document || isLoading}
                            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Analisar Documento
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
                                    <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                                        Faça upload de um documento e clique em analisar
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
