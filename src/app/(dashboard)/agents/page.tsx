"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Sparkles, User, Save, X } from "lucide-react";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

interface Agent {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', systemPrompt: '', icon: '🤖' });

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            if (res.ok) {
                const data = await res.json();
                setAgents(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Erro ao carregar agentes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                fetchAgents();
                setIsCreating(false);
                setFormData({ name: '', description: '', systemPrompt: '', icon: '🤖' });
            }
        } catch (error) {
            console.error("Erro ao criar agente:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este agente?")) return;
        try {
            await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
            fetchAgents();
        } catch (error) {
            console.error("Erro ao excluir agente:", error);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">Meus Agentes</h1>
                    <p className="text-zinc-500 mt-2">Crie personas personalizadas para tarefas específicas.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-black transition-all dark:bg-white dark:text-black font-bold"
                >
                    <Plus size={18} />
                    Novo Agente
                </button>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Criar Novo Agente</h2>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Nome</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Ex: Tradutor Técnico"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Descrição Curta</label>
                                <input
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Ex: Especialista em tradução de manuais"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">System Prompt (Instruções)</label>
                                <textarea
                                    required
                                    value={formData.systemPrompt}
                                    onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-zinc-200 h-32 dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Ex: Você é um tradutor técnico experiente. Traduza sempre mantendo os termos técnicos em inglês..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                                >
                                    Salvar Agente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <div key={agent.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-lg transition-all group relative">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl">
                                {agent.icon}
                            </div>
                            <button
                                onClick={() => handleDelete(agent.id)}
                                className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{agent.name}</h3>
                        <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{agent.description}</p>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs font-mono text-zinc-600 dark:text-zinc-400 line-clamp-3">
                            {agent.systemPrompt}
                        </div>
                    </div>
                ))}

                {agents.length === 0 && !isLoading && (
                    <div className="col-span-full py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                        <User size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold">Nenhum agente criado ainda</p>
                        <button onClick={() => setIsCreating(true)} className="text-blue-600 hover:underline mt-2 text-sm font-bold">
                            Criar meu primeiro agente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
