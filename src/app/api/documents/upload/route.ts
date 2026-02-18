import { auth } from '@clerk/nextjs/server';
import { getAvailableModels, getModelById } from '@/lib/models';
export const dynamic = "force-dynamic";

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    const pdfParse = require('pdf-parse');
    try {
        const data = await pdfParse(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF file');
    }
}

function checkApiKey(provider: string): string | null {
    console.log(`[Documents Upload API Check] Provider: ${provider}`);
    console.log(`[Documents Upload API Check] GROQ_API_KEY: ${!!process.env.GROQ_API_KEY}`);
    console.log(`[Documents Upload API Check] OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`[Documents Upload API Check] GOOGLE_API_KEY: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    
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

async function analyzeWithOpenAI(document: { content: string; fileName: string; fileType: string }, modelId: string, prompt: string): Promise<string> {
    const fullPrompt = `${prompt}\n\nDocumento: ${document.fileName}\nConteúdo:\n${document.content}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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

async function analyzeWithGroq(document: { content: string; fileName: string; fileType: string }, modelId: string, prompt: string): Promise<string> {
    const fullPrompt = `${prompt}\n\nDocumento: ${document.fileName}\nConteúdo:\n${document.content}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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

async function analyzeWithGoogle(document: { content: string; fileName: string; fileType: string }, modelId: string, prompt: string): Promise<string> {
    const fullPrompt = `${prompt}\n\nDocumento: ${document.fileName}\nConteúdo:\n${document.content}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: fullPrompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
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

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const prompt = formData.get('prompt') as string;
        const modelId = formData.get('modelId') as string;

        if (!file) {
            return Response.json({ error: 'File is required' }, { status: 400 });
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return Response.json({ error: 'File too large. Maximum size: 10MB' }, { status: 400 });
        }

        // Read file content
        const buffer = Buffer.from(await file.arrayBuffer());
        let content: string;
        const fileName = file.name;
        const fileType = file.type;

        // Extract text based on file type
        if (fileType.includes('pdf')) {
            content = await extractTextFromPDF(buffer);
        } else if (fileType.includes('text') || fileType.includes('plain') || fileName.endsWith('.txt')) {
            content = buffer.toString('utf-8');
        } else {
            // Try to extract text from other file types
            content = buffer.toString('utf-8');
        }

        // Check if content was extracted
        if (!content || content.trim().length === 0) {
            return Response.json({ error: 'Could not extract text from file' }, { status: 400 });
        }

        const document = { content, fileName, fileType };
        
        const models = await getAvailableModels();
        const selectedModel = await getModelById(modelId) || models[0];
        
        const keyError = checkApiKey(selectedModel.provider);
        if (keyError) {
            return Response.json({ error: keyError }, { status: 400 });
        }

        const analysisPrompt = prompt || 'Analise este documento em detalhes. Resuma o conteúdo, identifique pontos principais, temas importantes, e forneça insights relevantes. Responda em português brasileiro.';

        let result: string;

        switch (selectedModel.provider) {
            case 'groq':
                result = await analyzeWithGroq(document, selectedModel.id, analysisPrompt);
                break;
            case 'openai':
                result = await analyzeWithOpenAI(document, selectedModel.id, analysisPrompt);
                break;
            case 'google':
                result = await analyzeWithGoogle(document, selectedModel.id, analysisPrompt);
                break;
            default:
                return Response.json({ error: `Provider ${selectedModel.provider} not supported for document analysis` }, { status: 400 });
        }

        return Response.json({ result, model: selectedModel });
    } catch (error) {
        console.error('Error in documents upload API:', error);
        return Response.json({ error: 'Failed to analyze document' }, { status: 500 });
    }
}