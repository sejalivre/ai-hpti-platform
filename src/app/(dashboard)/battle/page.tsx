"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, ChevronDown, Send, RefreshCw, ArrowRight, Save, History, Volume2, VolumeX, Edit3, Check } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { MODELS, type Model } from "@/lib/models";
import { clsx } from "clsx";

interface Message {
    id: string;
    role: "left" | "right";
    content: string;
    modelId: string;
}

interface BattleSession {
    id: string;
    leftModel: string;
    rightModel: string;
    initialMessage: string;
    messages: Message[];
    createdAt: number;
}

export const dynamic = "force-dynamic";

export default function BattlePage() {
    const [leftModel, setLeftModel] = useState<Model | null>(null);
    const [rightModel, setRightModel] = useState<Model | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
    const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initialMessage, setInitialMessage] = useState("Olá, quem é você?");
    const [waitingForNext, setWaitingForNext] = useState(false);
    const [lastMessage, setLastMessage] = useState("");
    const [nextTurn, setNextTurn] = useState<"left" | "right">("right");
    const [started, setStarted] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [battles, setBattles] = useState<BattleSession[]>([]);
    const [saving, setSaving] = useState(false);
    const [topic, setTopic] = useState("");
    const [isEditingTopic, setIsEditingTopic] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const { user } = useUser();

    const fakeNames = [
        "João Silva", "José Souza", "Maria Oliveira", "Ana Cardoso", 
        "Carlos Pereira", "Paulo Rodrigues", "Fernanda Lima", "Juliana Alves",
        "Ricardo Santos", "André Costa", "Beatriz Martins", "Lucas Ferreira",
        "Gabriela Dias", "Marcos Rodrigues", "Camila Almeida", "Bruno Castro",
        "Larissa Barbosa", "Felipe Rocha", "Patrícia Cunha", "Eduardo Melo"
    ];
    
    const getRandomFakeName = () => fakeNames[Math.floor(Math.random() * fakeNames.length)];
    
    const [fakeName, setFakeName] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const leftMenuRef = useRef<HTMLDivElement>(null);
    const rightMenuRef = useRef<HTMLDivElement>(null);
    const topicInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadBattles();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (leftMenuRef.current && !leftMenuRef.current.contains(event.target as Node)) {
                setIsLeftMenuOpen(false);
            }
            if (rightMenuRef.current && !rightMenuRef.current.contains(event.target as Node)) {
                setIsRightMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditingTopic && topicInputRef.current) {
            topicInputRef.current.focus();
        }
    }, [isEditingTopic]);

    const loadBattles = async () => {
        try {
            const response = await fetch('/api/battles');
            if (response.ok) {
                const data = await response.json();
                setBattles(data);
            }
        } catch (error) {
            console.error('Erro ao carregar batalhas:', error);
        }
    };

    const speakText = (text: string, messageId: string) => {
        if (playingAudio === messageId) {
            window.speechSynthesis.cancel();
            setPlayingAudio(null);
            return;
        }

        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => setPlayingAudio(messageId);
        utterance.onend = () => setPlayingAudio(null);
        utterance.onerror = () => setPlayingAudio(null);
        
        window.speechSynthesis.speak(utterance);
    };

    const saveBattle = async () => {
        if (!leftModel || !rightModel || messages.length === 0) return;
        
        setSaving(true);
        try {
            const response = await fetch('/api/battles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leftModel: leftModel.id,
                    rightModel: rightModel.id,
                    initialMessage,
                    messages,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSessionId(data.sessionId);
                loadBattles();
            }
        } catch (error) {
            console.error('Erro ao salvar batalha:', error);
        } finally {
            setSaving(false);
        }
    };

    const loadBattle = async (battleId: string) => {
        try {
            const response = await fetch(`/api/battles/${battleId}`);
            if (response.ok) {
                const battle = await response.json();
                const left = MODELS.find(m => m.id === battle.leftModel);
                const right = MODELS.find(m => m.id === battle.rightModel);
                
                if (left) setLeftModel(left);
                if (right) setRightModel(right);
                setInitialMessage(battle.initialMessage);
                setMessages(battle.messages);
                setFakeName(getRandomFakeName());
                setStarted(true);
                setShowHistory(false);
            }
        } catch (error) {
            console.error('Erro ao carregar batalha:', error);
        }
    };

    const startConversation = async () => {
        if (!leftModel || !rightModel || isLoading || !initialMessage.trim()) return;
        
        setStarted(true);
        setMessages([]);
        setWaitingForNext(false);
        setNextTurn("right");
        setFakeName(getRandomFakeName());
        
        const firstMessage: Message = {
            id: Date.now().toString(),
            role: "left",
            content: initialMessage.trim(),
            modelId: leftModel.id,
        };
        setMessages([firstMessage]);
        setLastMessage(initialMessage.trim());
        
        await generateResponse("right", initialMessage.trim());
    };

    const generateResponse = async (respondingSide: "left" | "right", messageContent: string) => {
        if (!leftModel || !rightModel) return;
        
        const model = respondingSide === "left" ? leftModel : rightModel;
        const otherModel = respondingSide === "left" ? rightModel : leftModel;
        
        setIsLoading(true);
        setWaitingForNext(false);

        const topicContext = topic ? `\n\nO tema atual da conversa é: ${topic}.` : '';
        const userName = user?.firstName || user?.username || "usuário";

        try {
            const conversationHistory = messages.map(m => ({
                role: m.role === respondingSide ? "assistant" : "user",
                content: m.content,
            }));

            const systemPrompt = `Você é ${model.name} conversando com ${userName}.
Seja natural, amigável e interessante. Responda de forma concisa (máximo 2-3 parágrafos).
Sempre responda em português brasileiro.${topicContext}`;

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        ...conversationHistory,
                        { role: "user", content: messageContent },
                    ],
                    modelId: model.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro na API");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    fullContent += chunk;
                }
            }

            const newMessage: Message = {
                id: Date.now().toString(),
                role: respondingSide,
                content: fullContent,
                modelId: model.id,
            };

            setMessages(prev => [...prev, newMessage]);
            setLastMessage(fullContent);
            setIsLoading(false);
            setWaitingForNext(true);
            setNextTurn(respondingSide === "left" ? "right" : "left");

        } catch (error) {
            console.error("Erro:", error);
            const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: respondingSide,
                content: `Erro: ${errorMsg}`,
                modelId: model.id,
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    };

    const handleContinue = async () => {
        if (!waitingForNext || isLoading) return;
        setWaitingForNext(false);
        await generateResponse(nextTurn, lastMessage);
    };

    const handleReset = () => {
        setMessages([]);
        setStarted(false);
        setWaitingForNext(false);
        setIsLoading(false);
        setLastMessage("");
        setNextTurn("right");
        setSessionId(null);
        setTopic("");
        window.speechSynthesis.cancel();
        setPlayingAudio(null);
    };

    const handleTopicSave = () => {
        setIsEditingTopic(false);
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
            case 'modal': return 'Modal';
            default: return provider;
        }
    };

    const getModelName = (modelId: string) => {
        return MODELS.find(m => m.id === modelId)?.name || modelId;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderModelSelector = (
        model: Model | null,
        setModel: (m: Model) => void,
        isMenuOpen: boolean,
        setIsMenuOpen: (v: boolean) => void,
        menuRef: React.RefObject<HTMLDivElement | null>,
        side: "left" | "right"
    ) => (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all dark:border-zinc-700 dark:hover:border-zinc-600"
            >
                {model ? (
                    <>
                        <span className="text-base">{model.icon}</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{model.name}</span>
                    </>
                ) : (
                    <span className="text-zinc-500">Escolher modelo</span>
                )}
                <ChevronDown size={14} className={clsx(
                    "text-zinc-400 transition-transform",
                    isMenuOpen && "rotate-180"
                )} />
            </button>

            {isMenuOpen && (
                <div className={clsx(
                    "absolute top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden",
                    side === "right" && "right-0"
                )}>
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
                                {MODELS.filter(m => m.provider === provider).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setModel(m);
                                            setIsMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-3 text-left transition-all",
                                            model?.id === m.id
                                                ? "bg-blue-50 dark:bg-blue-950/30"
                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                        )}
                                    >
                                        <span className="text-lg">{m.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx(
                                                "text-sm font-bold truncate",
                                                model?.id === m.id
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-zinc-700 dark:text-zinc-300"
                                            )}>
                                                {m.name}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                {m.description}
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
    );

    const allSelected = leftModel && rightModel;

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {showHistory && (
                <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm font-black tracking-widest uppercase text-zinc-500">Histórico</h3>
                    </div>
                    <div className="p-2">
                        {battles.length === 0 ? (
                            <p className="text-sm text-zinc-400 p-4 text-center">Nenhuma batalha salva</p>
                        ) : (
                            battles.map((battle) => (
                                <button
                                    key={battle.id}
                                    onClick={() => loadBattle(battle.id)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 mb-2"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-blue-600">{getModelName(battle.leftModel)}</span>
                                        <span className="text-xs text-zinc-400">vs</span>
                                        <span className="text-xs font-bold text-pink-600">{getModelName(battle.rightModel)}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 truncate">{battle.initialMessage}</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">{formatDate(battle.createdAt)}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-pink-600 dark:text-pink-400" />
                        <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-white">Batalha de Modelos</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                showHistory 
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            )}
                        >
                            <History size={16} />
                            Histórico
                        </button>
                        
                        {started && messages.length > 0 && (
                            <button
                                onClick={saveBattle}
                                disabled={saving || !!sessionId}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-green-600 hover:bg-green-50 rounded-lg transition-all dark:hover:bg-green-900/10 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Salvando...' : sessionId ? 'Salvo!' : 'Salvar'}
                            </button>
                        )}

                        {started && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all dark:hover:bg-red-900/10"
                            >
                                <RefreshCw size={16} />
                                Novo
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        {!started ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center">
                                        <h3 className="text-sm font-black tracking-widest uppercase text-zinc-500 mb-4">Modelo 1</h3>
                                        {renderModelSelector(leftModel, setLeftModel, isLeftMenuOpen, setIsLeftMenuOpen, leftMenuRef, "left")}
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center">
                                        <h3 className="text-sm font-black tracking-widest uppercase text-zinc-500 mb-4">Modelo 2</h3>
                                        {renderModelSelector(rightModel, setRightModel, isRightMenuOpen, setIsRightMenuOpen, rightMenuRef, "right")}
                                    </div>
                                </div>

                                {allSelected && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-black tracking-widest uppercase text-zinc-500 mb-3">
                                                Tema da Conversa (opcional)
                                            </label>
                                            <input
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="Ex: Tecnologia, filosofia, culinária, etc..."
                                                className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black tracking-widest uppercase text-zinc-500 mb-3">
                                                Mensagem Inicial
                                            </label>
                                            <textarea
                                                value={initialMessage}
                                                onChange={(e) => setInitialMessage(e.target.value)}
                                                placeholder="Digite a mensagem inicial para começar a conversa..."
                                                rows={3}
                                                className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 resize-none"
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={startConversation}
                                                disabled={isLoading || !initialMessage.trim()}
                                                className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50"
                                            >
                                                <Send size={18} />
                                                Iniciar Conversa
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    <div className="flex justify-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-950/50 rounded-full">
                                            <span>{leftModel?.icon}</span>
                                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{leftModel?.name}</span>
                                        </div>
                                        <span className="text-zinc-400 font-bold">VS</span>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-950/50 rounded-full">
                                            <span>{rightModel?.icon}</span>
                                            <span className="text-sm font-bold text-pink-700 dark:text-pink-300">{fakeName || rightModel?.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full">
                                        {isEditingTopic ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={topicInputRef}
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleTopicSave()}
                                                    placeholder="Novo tema..."
                                                    className="bg-transparent border-b border-zinc-400 focus:outline-none text-sm w-48"
                                                />
                                                <button onClick={handleTopicSave} className="text-green-600">
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-xs text-zinc-500">
                                                    Tema: <strong className="text-zinc-700 dark:text-zinc-300">{topic || "Geral"}</strong>
                                                </span>
                                                <button 
                                                    onClick={() => setIsEditingTopic(true)} 
                                                    className="text-zinc-400 hover:text-zinc-600"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {messages.map((m) => (
                                        <div
                                            key={m.id}
                                            className={clsx(
                                                "flex",
                                                m.role === "left" ? "justify-start" : "justify-end"
                                            )}
                                        >
                                            <div
                                                className={clsx(
                                                    "max-w-[80%] p-4 rounded-2xl group",
                                                    m.role === "left"
                                                        ? "bg-blue-100 dark:bg-blue-950/50 rounded-bl-none"
                                                        : "bg-pink-100 dark:bg-pink-950/50 rounded-br-none"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                                                        {m.role === "left" ? leftModel?.name : (fakeName || rightModel?.name)}
                                                    </p>
                                                    <button
                                                        onClick={() => speakText(m.content, m.id)}
                                                        className={clsx(
                                                            "p-1.5 rounded-lg transition-all",
                                                            playingAudio === m.id
                                                                ? "bg-red-500 text-white"
                                                                : "bg-white/50 text-zinc-500 hover:bg-white hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                                        )}
                                                    >
                                                        {playingAudio === m.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                    </button>
                                                </div>
                                                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                                                    {m.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className={clsx(
                                            "flex",
                                            nextTurn === "left" ? "justify-start" : "justify-end"
                                        )}>
                                            <div className={clsx(
                                                "p-4 rounded-2xl",
                                                nextTurn === "left"
                                                    ? "bg-blue-100 dark:bg-blue-950/50 rounded-bl-none"
                                                    : "bg-pink-100 dark:bg-pink-950/50 rounded-br-none"
                                            )}>
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {waitingForNext && !isLoading && (
                                    <div className="mt-6 flex justify-center">
                                        <button
                                            onClick={handleContinue}
                                            className={clsx(
                                                "flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors",
                                                nextTurn === "left"
                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                    : "bg-pink-600 text-white hover:bg-pink-700"
                                            )}
                                        >
                                            <ArrowRight size={18} />
                                            {nextTurn === "left" ? `${leftModel?.name} responde` : `${fakeName || rightModel?.name} responde`}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
