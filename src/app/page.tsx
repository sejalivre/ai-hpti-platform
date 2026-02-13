import Link from "next/link";
import { ArrowRight, MessageSquare, Image as ImageIcon, FileText, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center overflow-hidden">
      {/* Mesh Background */}
      <div className="mesh-gradient" aria-hidden="true" />

      {/* Hero Section */}
      <section className="max-w-5xl w-full text-center space-y-12 py-32 px-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-zinc-200/50 shadow-soft backdrop-blur-md text-blue-600 text-xs font-bold tracking-widest uppercase dark:bg-blue-400/10 dark:text-blue-400 animate-float">
          <Sparkles size={14} />
          <span>Next Generation AI Lab</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[0.9] text-balance">
            Construindo o Futuro com <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:to-indigo-300">
              Inteligência Artificial
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium text-balance">
            Uma plataforma de exploração técnica focada no domínio de modelos de linguagem e visão computacional.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-6">
          <Link
            href="/chat"
            className="group relative flex items-center gap-2 px-10 py-5 bg-zinc-900 text-white font-black rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Explorar Chat
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/sejalivre/ai-hpti-platform"
            target="_blank"
            className="flex items-center gap-2 px-10 py-5 bg-white/40 backdrop-blur-xl text-zinc-900 font-bold rounded-2xl border border-zinc-200 shadow-soft hover:bg-white transition-all dark:bg-white/5 dark:border-zinc-800 dark:text-white dark:hover:bg-white/10"
          >
            Ver Código
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 py-24 px-6 relative z-10">
        <FeatureCard
          href="/chat"
          icon={<MessageSquare className="text-blue-600" size={24} />}
          title="Chat AI"
          description="Interface conversacional moderna com streaming de respostas em tempo real."
        />
        <FeatureCard
          href="/images"
          icon={<ImageIcon className="text-purple-600" size={24} />}
          title="Visão"
          description="Análise profunda de dados visuais através de modelos neurais especializados."
        />
        <FeatureCard
          href="/files"
          icon={<FileText className="text-emerald-600" size={24} />}
          title="Arquivos"
          description="Processamento inteligente de documentos para extração de conhecimento."
        />
      </section>

      {/* Footer Info */}
      <footer className="w-full py-16 border-t border-zinc-100/50 flex flex-col items-center gap-4 bg-white/20 backdrop-blur-sm dark:bg-transparent dark:border-zinc-800/50">
        <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase">
          © 2026 HPTI AI Platform • Experimental Lab
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group p-10 bg-white/40 border border-zinc-100/50 rounded-[2.5rem] shadow-soft backdrop-blur-xl transition-all hover:bg-white hover:scale-[1.02] hover:border-blue-500/20 dark:bg-zinc-900/40 dark:border-zinc-800/50"
    >
      <div className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl mb-8 shadow-soft group-hover:shadow-blue-500/10 transition-all dark:bg-zinc-800/50">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{description}</p>

      <div className="mt-8 flex items-center gap-2 text-xs font-black tracking-widest uppercase text-zinc-400 group-hover:text-blue-600 transition-colors">
        Acessar
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}
