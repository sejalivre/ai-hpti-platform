"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, PlusCircle, Send, Sparkles, ChevronDown, Zap } from "lucide-react";
import { MODELS, type Model } from "@/lib/models";
import { clsx } from "clsx";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    modelId?: string;
}

export const dynamic = "force-dynamic";

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch('/api/history');
                if (response.ok) {
                    const history = await response.json();
                    if (Array.isArray(history) && history.length > 0) {
                        const messagesWithIds = history.map((msg: { role: string; content: string }, index: number) => ({
                            id: `history-${index}`,
                            role: msg.role as "user" | "assistant",
                            content: msg.content,
                        }));
                        setMessages(messagesWithIds);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
                setIsModelMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            modelId: selectedModel.id,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    modelId: selectedModel.id,
                }),
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!response.ok) {
                let errorMsg = "Erro na API";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch { }
                throw new Error(errorMsg);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
                modelId: selectedModel.id,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            let fullContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullContent += chunk;

                    setMessages((prev) => {
                        const updated = prev.slice(0, -1);
                        return [
                            ...updated,
                            { ...assistantMessage, content: fullContent },
                        ];
                    });
                }
            }
        } catch (error) {
            console.error("Erro:", error);
            const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: `Erro: ${errorMsg}`,
                    modelId: selectedModel.id,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
    };

    const handleClearHistory = async () => {
        if (!confirm("Tem certeza que deseja apagar todo o histórico permanentemente?")) return;

        try {
            const response = await fetch('/api/history', { method: 'DELETE' });
            if (response.ok) {
                setMessages([]);
            } else {
                alert("Erro ao limpar histórico no servidor.");
            }
        } catch (error) {
            console.error("Erro ao limpar histórico:", error);
            alert("Erro de conexão ao limpar histórico.");
        }
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'groq': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
            case 'deepseek': return 'text-purple-500 bg-purple-50 dark:bg-purple-950/30';
            case 'modal': return 'text-pink-500 bg-pink-50 dark:bg-pink-950/30';
            default: return 'text-zinc-500 bg-zinc-50';
        }
    };

    const getProviderLabel = (provider: string) => {
        switch (provider) {
            case 'groq': return 'Groq';
            case 'deepseek': return 'DeepSeek';
            case 'modal': return 'Modal (GLM)';
            default: return provider;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Sessão Ativa</span>
                    </div>

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
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 px-2">Selecione um Modelo</p>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {['groq', 'deepseek', 'modal'].map((provider) => (
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
                                                            ? "bg-blue-50 dark:bg-blue-950/30"
                                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                                    )}
                                                >
                                                    <span className="text-lg">{model.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={clsx(
                                                            "text-sm font-bold truncate",
                                                            selectedModel.id === model.id
                                                                ? "text-blue-600 dark:text-blue-400"
                                                                : "text-zinc-700 dark:text-zinc-300"
                                                        )}>
                                                            {model.name}
                                                        </p>
                                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                            {model.description}
                                                        </p>
                                                    </div>
                                                    {selectedModel.id === model.id && (
                                                        <Zap size={14} className="text-blue-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
                        title="Nova Conversa"
                    >
                        <PlusCircle size={16} />
                        Nova
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
                    <button
                        onClick={handleClearHistory}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all dark:hover:bg-red-900/10"
                        title="Apagar Histórico"
                    >
                        <Trash2 size={16} />
                        Limpar
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 space-y-6">
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-4">
                        <div className="w-6 h-6 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-xs font-bold tracking-widest uppercase">Sincronizando...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center dark:bg-zinc-900">
                            <MessageSquare className="text-zinc-300" size={32} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tighter">Inicie uma conversa</h2>
                            <p className="text-sm text-zinc-500 max-w-[240px]">Pergunte qualquer coisa para começar a explorar a IA.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {MODELS.slice(0, 4).map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all",
                                        selectedModel.id === model.id
                                            ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
                                            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400"
                                    )}
                                >
                                    <span>{model.icon}</span>
                                    {model.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start animate-in fade-in slide-in-from-left-2 duration-300"}`}
                    >
                        <div
                            className={`max-w-[85%] p-4 rounded-3xl shadow-soft ${m.role === "user"
                                ? "bg-zinc-900 text-white rounded-tr-none dark:bg-white dark:text-black"
                                : "bg-white border border-zinc-100 rounded-tl-none text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200"
                                }`}
                        >
                            {m.role === "assistant" && m.modelId && (
                                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <span className="text-xs">
                                        {MODELS.find(mod => mod.id === m.modelId)?.icon || '🤖'}
                                    </span>
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                                        {MODELS.find(mod => mod.id === m.modelId)?.name || 'AI'}
                                    </span>
                                </div>
                            )}
                            <span className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</span>
                        </div>
                    </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-100 p-4 rounded-3xl rounded-tl-none flex items-center gap-3 dark:bg-zinc-900">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-transparent">
                <div className="max-w-3xl mx-auto p-6 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>{selectedModel.icon}</span>
                    </div>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Mensagem para ${selectedModel.name}...`}
                        className="w-full p-5 pl-12 pr-16 bg-white border border-zinc-200 rounded-[2rem] shadow-soft focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 h-12 w-12 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-black transition-all disabled:opacity-30 dark:bg-white dark:text-black"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
                        AI pode cometer erros. Verifique informações importantes.
                    </p>
                </div>
            </form>
        </div>
    );
}

function MessageSquare({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}
