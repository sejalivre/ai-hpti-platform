"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Send, Sparkles, ChevronDown, Loader2, Database, AlertTriangle } from "lucide-react";
import { getAvailableModels, getDefaultModel, type Model } from "@/lib/models";
import { clsx } from "clsx";
import { useChat } from "@ai-sdk/react";

export const dynamic = "force-dynamic";

export default function RagPage() {
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    const chatHelpers = useChat({}) as any;
    const { messages, input, handleInputChange, handleSubmit, isLoading } = chatHelpers;

    // Load models on mount
    useEffect(() => {
        const loadModels = async () => {
            const models = await getAvailableModels();
            setAvailableModels(models);
            if (models.length > 0 && !selectedModel) {
                setSelectedModel(models[0]);
            }
        };
        loadModels();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(null);

        // Client-side text extraction for demo purposes (since we can't use pdf-parse on server easily without install)
        // Ideally, we would upload the file to an API that parses it.
        // Here we simulate parsing for text/md files.
        try {
            let content = "";
            if (file.type === "application/pdf") {
                // In a real app, we would use pdfjs-dist here or send to server
                // For now, we alert the user
                alert("Para suporte real a PDF, instale 'pdf-parse' no servidor. Enviando apenas metadados simulados.");
                content = `Simulação de conteúdo do arquivo PDF: ${file.name}. (Instale bibliotecas de PDF para extração real).`;
            } else {
                content = await file.text();
            }

            const res = await fetch('/api/rag/upload', {
                method: 'POST',
                body: JSON.stringify({ content, fileName: file.name }),
            });

            if (res.ok) {
                setUploadStatus(`Arquivo "${file.name}" indexado com sucesso!`);
            } else {
                setUploadStatus("Erro ao indexar arquivo.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("Erro no upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim() || !selectedModel) return;
        
        const formData = new FormData();
        formData.append('message', input);
        formData.append('modelId', selectedModel.id);
        
        handleSubmit(e as any, {
            body: formData,
        } as any);
    };

    const getProviderColor = (provider: string) => {
        const colorMap: Record<string, string> = {
            'groq': 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
            'deepseek': 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
            'modal': 'text-pink-500 bg-pink-50 dark:bg-pink-950/30',
            'openai': 'text-green-500 bg-green-50 dark:bg-green-950/30',
            'google': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
        };
        return colorMap[provider] || 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30';
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Database size={18} className="text-violet-600 dark:text-violet-400" />
                        <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">RAG Chat (PDFs)</span>
                    </div>

                    <div className="relative" ref={modelMenuRef}>
                        <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all dark:border-zinc-700 dark:hover:border-zinc-600"
                            disabled={availableModels.length === 0}
                        >
                            <span className="text-base">{selectedModel?.icon || '📊'}</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{selectedModel?.name || 'Selecionar modelo'}</span>
                            <ChevronDown size={14} className={clsx("text-zinc-400 transition-transform", isModelMenuOpen && "rotate-180")} />
                        </button>
                        {isModelMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="max-h-80 overflow-y-auto">
                                    {availableModels.length === 0 ? (
                                        <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                                            <div className="w-4 h-4 border-2 border-zinc-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-xs">Carregando modelos...</p>
                                        </div>
                                    ) : (
                                        (() => {
                                            const providers = Array.from(new Set(availableModels.map(m => m.provider)));
                                            return providers.map((provider) => (
                                            <div key={provider}>
                                                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50">
                                                    <span className={clsx("text-[10px] font-bold tracking-widest uppercase", getProviderColor(provider))}>
                                                        {provider}
                                                    </span>
                                                </div>
                                                {availableModels.filter(m => m.provider === provider).map((model) => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => { setSelectedModel(model); setIsModelMenuOpen(false); }}
                                                        className={clsx("w-full flex items-center gap-3 px-3 py-3 text-left transition-all", selectedModel?.id === model.id ? "bg-violet-50 dark:bg-violet-950/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}
                                                    >
                                                        <span className="text-lg">{model.icon}</span>
                                                        <span className="text-sm font-bold truncate flex-1">{model.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ));
                                        })()
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {uploadStatus && <span className="text-xs text-green-600 font-bold animate-in fade-in">{uploadStatus}</span>}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        Upload PDF/TXT
                    </button>
                    <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} className="hidden" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center dark:bg-violet-900/20">
                                <Database className="text-violet-500" size={32} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-900 dark:text-white">Chat com Documentos</h2>
                                <p className="text-sm text-zinc-500">Faça upload de arquivos e converse com eles usando RAG.</p>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg flex items-start gap-2 text-left max-w-md">
                                <AlertTriangle className="text-yellow-600 dark:text-yellow-500 shrink-0" size={16} />
                                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                    <strong>Nota:</strong> Para funcionamento completo (PDFs reais e busca vetorial), instale <code>@upstash/vector</code> e <code>pdf-parse</code> e configure as chaves no <code>.env</code>.
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((m: any) => (
                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={clsx(
                                "max-w-[85%] p-4 rounded-3xl shadow-soft",
                                m.role === "user" 
                                    ? "bg-zinc-900 text-white rounded-tr-none dark:bg-white dark:text-black" 
                                    : "bg-white border border-zinc-100 rounded-tl-none text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200"
                            )}>
                                <span className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</span>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="bg-zinc-100 p-4 rounded-3xl rounded-tl-none"><Loader2 className="animate-spin w-4 h-4 text-zinc-500" /></div></div>}
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleCustomSubmit} className="p-6 bg-transparent">
                <div className="max-w-3xl mx-auto relative">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Pergunte sobre os documentos..."
                        className="w-full p-5 pl-6 pr-16 bg-white border border-zinc-200 rounded-[2rem] shadow-soft focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500/50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input?.trim() || !selectedModel}
                        className="absolute right-2 top-2 h-12 w-12 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-black transition-all disabled:opacity-30 dark:bg-white dark:text-black"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}
