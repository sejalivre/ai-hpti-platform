"use client";

import { useState, useEffect, useRef } from "react";
import nextDynamic from "next/dynamic";
import { Trash2, PlusCircle, Send, Sparkles } from "lucide-react";

// Carrega o UserButton apenas no cliente para evitar hydration mismatch
const UserButton = nextDynamic(
    () => import("@clerk/nextjs").then((mod) => mod.UserButton),
    { ssr: false }
);

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export const dynamic = "force-dynamic";

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Carrega histórico do Redis ao iniciar
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

    // Auto-scroll para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
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
                }),
            });

            if (!response.ok) throw new Error("Erro na API");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
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
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Desculpe, ocorreu um erro. Tente novamente.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Nova Conversa (Limpa apenas o estado local)
    const handleNewChat = () => {
        setMessages([]);
    };

    // Limpar Histórico (Deleta do Redis e do estado local)
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

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            {/* Toolbar / Header Local */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Sessão Ativa</span>
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-6 bg-transparent">
                <div className="max-w-4xl mx-auto relative group">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Mensagem para HPTI AI..."
                        className="w-full p-5 pr-16 bg-white border border-zinc-200 rounded-[2rem] shadow-soft focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
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