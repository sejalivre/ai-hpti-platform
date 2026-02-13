export default function FilesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100-4rem)] py-12 px-4">
            <div className="max-w-2xl w-full text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto dark:bg-emerald-900/20">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Análise de Arquivos</h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                    Em breve você poderá fazer upload de PDFs, documentos e outros arquivos para análise contextual com RAG (Retrieval-Augmented Generation).
                </p>
                <div className="pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-full text-sm text-zinc-500 dark:border-zinc-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Implementação em progresso
                    </div>
                </div>
            </div>
        </div>
    );
}
