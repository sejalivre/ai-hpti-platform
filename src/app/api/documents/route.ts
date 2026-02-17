import { auth } from '@clerk/nextjs/server';
import { MODELS } from '@/lib/models';

export const dynamic = "force-dynamic";

interface DocumentData {
    content: string;
    fileName: string;
    fileType: string;
}

function checkApiKey(provider: string): string | null {
    console.log(`[Documents API Check] Provider: ${provider}`);
    console.log(`[Documents API Check] GROQ_API_KEY: ${!!process.env.GROQ_API_KEY}`);
    console.log(`[Documents API Check] OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`[Documents API Check] GOOGLE_API_KEY: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    
    if (provider === 'groq' && !process.env.GROQ_API_KEY) {
        return 'GROQ_API_KEY não configurada';
    }
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
        return 'OPENAI_API_KEY não configurada';
    }
    if (provider === 'google' && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return 'GOOGLE_GENERATIVE_AI_API_KEY não configurada';
    }
    return null;
}

async function analyzeWithGroq(document: DocumentData, modelId: string, prompt: string): Promise<string> {
    const fullPrompt = `${prompt}\n\nDocumento: ${document.fileName}\nConteúdo:\n${document.content}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                {
                    role: 'user',
                    content: fullPrompt,
                },
            ],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro Groq Documents:', error);
        throw new Error(`Groq Documents API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Não foi possível analisar o documento.';
}

async function analyzeWithOpenAI(document: DocumentData, modelId: string, prompt: string): Promise<string> {
    const fullPrompt = `${prompt}\n\nDocumento: ${document.fileName}\nConteúdo:\n${document.content}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                {
                    role: 'user',
                    content: fullPrompt,
                },
            ],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro OpenAI Documents:', error);
        throw new Error(`OpenAI Documents API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Não foi possível analisar o documento.';
}

async function analyzeWithGoogle(document: DocumentData, modelId: string, prompt: string): Promise<string> {
    const fullPrompt = `${prompt}\n\nDocumento: ${document.fileName}\nConteúdo:\n${document.content}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }],
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro Google Documents:', error);
        throw new Error(`Google Documents API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível analisar o documento.';
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { document, prompt, modelId } = body;

        if (!document || !document.content) {
            return Response.json({ error: 'Document content required' }, { status: 400 });
        }

        const selectedModel = MODELS.find(m => m.id === modelId) || MODELS[0];
        
        const keyError = checkApiKey(selectedModel.provider);
        if (keyError) {
            return Response.json({ error: keyError }, { status: 400 });
        }

        const analysisPrompt = prompt || 'Analise este documento em detalhes. Resuma o conteúdo, identifique pontos principais, temas importantes, e forneça insights relevantes. Responda em português brasileiro.';

        let result: string;

        if (selectedModel.provider === 'groq') {
            result = await analyzeWithGroq(document, selectedModel.id, analysisPrompt);
        } else if (selectedModel.provider === 'openai') {
            result = await analyzeWithOpenAI(document, selectedModel.id, analysisPrompt);
        } else if (selectedModel.provider === 'google') {
            result = await analyzeWithGoogle(document, selectedModel.id, analysisPrompt);
        } else {
            throw new Error('Provider not supported');
        }

        return Response.json({ result, model: selectedModel });

    } catch (error) {
        console.error('Erro na API Documents:', error);
        const message = error instanceof Error ? error.message : 'Erro ao processar documento';
        return Response.json({ error: message }, { status: 500 });
    }
}
