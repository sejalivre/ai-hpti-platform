"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Carrega o UserButton apenas no cliente para evitar hydration mismatch
const UserButton = dynamic(
    () => import("@clerk/nextjs").then((mod) => mod.UserButton),
    { ssr: false }
);

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

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
                        // Adiciona IDs se não existirem
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

            if (!response.ok) {
                throw new Error("Erro na API");
            }

            // Streaming da resposta
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
                            {
                                ...assistantMessage,
                                content: fullContent,
                            },
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

    // Limpar histórico
    const handleClearHistory = () => {
        setMessages([]);
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-50">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
                <h1 className="font-bold text-xl text-zinc-800">HPTI AI</h1>
                <div className="flex items-center gap-4">
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="text-sm text-zinc-500 hover:text-zinc-700"
                        >
                            Limpar
                        </button>
                    )}
                    <UserButton afterSignOutUrl="/" />
                </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingHistory ? (
                    <div className="text-center text-zinc-400 mt-10">
                        Carregando histórico...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-zinc-400 mt-10">
                        Como posso ajudar você hoje?
                    </div>
                ) : null}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl ${m.role === "user"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white border border-zinc-200 text-zinc-800 shadow-sm"
                                }`}
                        >
                            <span className="whitespace-pre-wrap">{m.content}</span>
                        </div>
                    </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-200 animate-pulse p-3 rounded-2xl text-zinc-500 text-sm">
                            IA pensando...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte qualquer coisa..."
                        className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
}