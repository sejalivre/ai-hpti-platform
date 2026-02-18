"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, PlusCircle, Send, Sparkles, ChevronDown, Zap, Bot, User, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { getAvailableModels, getDefaultModel, type Model } from "@/lib/models";
import { clsx } from "clsx";
import { useChat } from "@ai-sdk/react";

export const dynamic = "force-dynamic";

interface Agent {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
}

const DEFAULT_AGENT: Agent = {
    id: 'default',
    name: 'Assistente Padrão',
    description: 'Assistente geral útil e amigável',
    systemPrompt: '',
    icon: '🤖'
};

export default function ChatPage() {
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    
    const [agents, setAgents] = useState<Agent[]>([DEFAULT_AGENT]);
    const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENT);
    const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);

    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);
    const agentMenuRef = useRef<HTMLDivElement>(null);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const chatHelpers = useChat({}) as any;
    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, stop, setInput } = chatHelpers;

    // Handle speech when messages finish
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant' && isSpeaking) {
                speak(lastMessage.content);
            }
        }
    }, [messages, isSpeaking]);

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

    // Initialize Speech Synthesis
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    // Speech Recognition Logic
    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            return;
        }
        
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onstart = () => {
            setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Auto submit after voice input? Optional. Let's keep manual send for now or auto submit.
            // Let's just set input for now.
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    // Text to Speech Logic
    const toggleSpeaking = () => {
        if (isSpeaking) {
            if (synthRef.current) synthRef.current.cancel();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
        }
    };

    const speak = (text: string) => {
        if (!synthRef.current) return;
        
        // Cancel previous speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0; // Normal speed
        
        // Try to find a good voice
        const voices = synthRef.current.getVoices();
        const ptVoice = voices.find(v => v.lang.includes('pt-BR'));
        if (ptVoice) utterance.voice = ptVoice;

        synthRef.current.speak(utterance);
    };

    // Stop speaking when component unmounts
    useEffect(() => {
        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch('/api/history');
                if (response.ok) {
                    const history = await response.json();
                    if (Array.isArray(history) && history.length > 0) {
                        setMessages(history.map((msg: any, index: number) => ({
                            id: `history-${index}`,
                            role: msg.role,
                            content: msg.content,
                        })));
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        const loadAgents = async () => {
            try {
                const res = await fetch('/api/agents');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setAgents([DEFAULT_AGENT, ...data]);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar agentes:", error);
            }
        };

        loadHistory();
        loadAgents();
    }, [setMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
                setIsModelMenuOpen(false);
            }
            if (agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node)) {
                setIsAgentMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim() || !selectedModel) return;
        
        const formData = new FormData();
        formData.append('message', input);
        formData.append('modelId', selectedModel.id);
        formData.append('systemPrompt', selectedAgent.systemPrompt);
        
        handleSubmit(e as any, {
            body: formData,
        } as any);
    };

    const handleNewChat = () => {
        setMessages([]);
        stop();
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
        const colorMap: Record<string, string> = {
            'groq': 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
            'deepseek': 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
            'modal': 'text-pink-500 bg-pink-50 dark:bg-pink-950/30',
            'openai': 'text-green-500 bg-green-50 dark:bg-green-950/30',
            'google': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
        };
        return colorMap[provider] || 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30';
    };

    const getProviderLabel = (provider: string) => {
        const labelMap: Record<string, string> = {
            'groq': 'Groq',
            'deepseek': 'DeepSeek',
            'modal': 'Modal (GLM)',
            'openai': 'OpenAI',
            'google': 'Google AI'
        };
        return labelMap[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Sessão Ativa</span>
                    </div>

                    {/* Model Selector */}
                    <div className="relative" ref={modelMenuRef}>
                        <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all dark:border-zinc-700 dark:hover:border-zinc-600"
                            disabled={availableModels.length === 0}
                        >
                            <span className="text-base">{selectedModel?.icon || '🤖'}</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{selectedModel?.name || 'Selecionar modelo'}</span>
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
                                    {availableModels.length === 0 ? (
                                        <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                                            <div className="w-4 h-4 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-xs">Carregando modelos...</p>
                                        </div>
                                    ) : (
                                        (() => {
                                            const providers = Array.from(new Set(availableModels.map(m => m.provider)));
                                            return providers.map((provider) => (
                                            <div key={provider}>
                                                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50">
                                                    <span className={clsx(
                                                        "text-[10px] font-bold tracking-widest uppercase",
                                                        getProviderColor(provider)
                                                    )}>
                                                        {getProviderLabel(provider)}
                                                    </span>
                                                </div>
                                                {availableModels.filter(m => m.provider === provider).map((model) => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => {
                                                            setSelectedModel(model);
                                                            setIsModelMenuOpen(false);
                                                        }}
                                                        className={clsx(
                                                            "w-full flex items-center gap-3 px-3 py-3 text-left transition-all",
                                                            selectedModel?.id === model.id
                                                                ? "bg-blue-50 dark:bg-blue-950/30"
                                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                                        )}
                                                    >
                                                        <span className="text-lg">{model.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={clsx(
                                                                "text-sm font-bold truncate",
                                                                selectedModel?.id === model.id
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : "text-zinc-700 dark:text-zinc-300"
                                                            )}>
                                                                {model.name}
                                                            </p>
                                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                                {model.description}
                                                            </p>
                                                        </div>
                                                        {selectedModel?.id === model.id && (
                                                            <Zap size={14} className="text-blue-500" />
                                                        )}
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

                    {/* Agent Selector */}
                    <div className="relative" ref={agentMenuRef}>
                        <button
                            onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all dark:border-zinc-700 dark:hover:border-zinc-600"
                        >
                            <span className="text-base">{selectedAgent.icon}</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{selectedAgent.name}</span>
                            <ChevronDown size={14} className={clsx(
                                "text-zinc-400 transition-transform",
                                isAgentMenuOpen && "rotate-180"
                            )} />
                        </button>

                        {isAgentMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 px-2">Selecione um Agente</p>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {agents.map((agent) => (
                                        <button
                                            key={agent.id}
                                            onClick={() => {
                                                setSelectedAgent(agent);
                                                setIsAgentMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full flex items-center gap-3 px-3 py-3 text-left transition-all",
                                                selectedAgent.id === agent.id
                                                    ? "bg-blue-50 dark:bg-blue-950/30"
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            )}
                                        >
                                            <span className="text-lg">{agent.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={clsx(
                                                    "text-sm font-bold truncate",
                                                    selectedAgent.id === agent.id
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-zinc-700 dark:text-zinc-300"
                                                )}>
                                                    {agent.name}
                                                </p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                    {agent.description}
                                                </p>
                                            </div>
                                            {selectedAgent.id === agent.id && (
                                                <User size={14} className="text-blue-500" />
                                            )}
                                        </button>
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
                        onClick={toggleSpeaking}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                            isSpeaking 
                                ? "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400" 
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        )}
                        title={isSpeaking ? "Desativar Voz (TTS)" : "Ativar Voz (TTS)"}
                    >
                        {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {isSpeaking ? "Voz ON" : "Voz OFF"}
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
                            {availableModels.slice(0, 4).map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all",
                                        selectedModel?.id === model.id
                                            ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
                                            : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-700 dark:text-zinc-400"
                                    )}
                                >
                                    <span>{model.icon}</span>
                                    <span>{model.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}

                {messages.map((m: any) => (
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
                            {m.role === "assistant" && (
                                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                    <span className="text-xs">
                                        {selectedAgent.icon}
                                    </span>
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                                        {selectedAgent.name}
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

            <form onSubmit={handleCustomSubmit} className="bg-transparent">
                <div className="max-w-3xl mx-auto p-6 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>{selectedModel?.icon || '🤖'}</span>
                    </div>
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={`Mensagem para ${selectedModel?.name || 'modelo'} como ${selectedAgent.name}...`}
                        className="w-full p-5 pl-12 pr-32 bg-white border border-zinc-200 rounded-[2rem] shadow-soft focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                        disabled={isLoading || !selectedModel}
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={clsx(
                                "h-12 w-12 flex items-center justify-center rounded-full transition-all",
                                isListening 
                                    ? "bg-red-500 text-white animate-pulse" 
                                    : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
                            )}
                            title={isListening ? "Parar de ouvir" : "Falar (Microfone)"}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !input?.trim() || !selectedModel}
                            className="h-12 w-12 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-black transition-all disabled:opacity-30 dark:bg-white dark:text-black"
                        >
                            <Send size={20} />
                        </button>
                    </div>
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
