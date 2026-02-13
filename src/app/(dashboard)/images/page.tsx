export default function ImagesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100-4rem)] py-12 px-4 shadow-sm">
            <div className="max-w-2xl w-full text-center space-y-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto dark:bg-purple-900/20">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Processamento de Imagens</h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                    Esta funcionalidade está em desenvolvimento. Em breve você poderá fazer upload de imagens para análise com IA.
                </p>
                <div className="pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-full text-sm text-zinc-500 dark:border-zinc-800">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Implementação em progresso
                    </div>
                </div>
            </div>
        </div>
    );
}
