import { auth } from '@clerk/nextjs/server';
import { VISION_MODELS } from '@/lib/vision-models';

export const dynamic = "force-dynamic";

interface ImageData {
    url: string;
    base64: string;
    mimeType: string;
}

function checkApiKey(provider: string): string | null {
    console.log(`[Vision API Check] Provider: ${provider}`);
    console.log(`[Vision API Check] OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`[Vision API Check] GOOGLE_API_KEY: ${!!process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
        return 'OPENAI_API_KEY não configurada';
    }
    if (provider === 'google' && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return 'GOOGLE_GENERATIVE_AI_API_KEY não configurada';
    }
    return null;
}

async function analyzeWithOpenAI(image: ImageData, modelId: string, prompt: string): Promise<string> {
    const imageUrl = image.url || `data:${image.mimeType};base64,${image.base64}`;

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
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageUrl } },
                    ],
                },
            ],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro OpenAI Vision:', error);
        throw new Error(`OpenAI Vision API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Não foi possível analisar a imagem.';
}

async function analyzeWithGoogle(image: ImageData, modelId: string, prompt: string): Promise<string> {
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
        { text: prompt },
    ];

    if (image.url) {
        const imageResponse = await fetch(image.url);
        const buffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        parts.push({ inlineData: { mimeType, data: base64 } });
    } else {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro Google Vision:', error);
        throw new Error(`Google Vision API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível analisar a imagem.';
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { image, prompt, modelId } = body;

        if (!image || (!image.base64 && !image.url)) {
            return Response.json({ error: 'Image required (base64 or url)' }, { status: 400 });
        }

        const selectedModel = VISION_MODELS.find(m => m.id === modelId) || VISION_MODELS[0];
        
        const keyError = checkApiKey(selectedModel.provider);
        if (keyError) {
            return Response.json({ error: keyError }, { status: 400 });
        }

        const analysisPrompt = prompt || 'Analise esta imagem em detalhes. Descreva o que você vê, identifique objetos, cores, texto (se houver), e forneça insights relevantes. Responda em português brasileiro.';

        let result: string;

        if (selectedModel.provider === 'openai') {
            result = await analyzeWithOpenAI(image, selectedModel.id, analysisPrompt);
        } else if (selectedModel.provider === 'google') {
            result = await analyzeWithGoogle(image, selectedModel.id, analysisPrompt);
        } else {
            throw new Error('Provider not supported');
        }

        return Response.json({ result, model: selectedModel });

    } catch (error) {
        console.error('Erro na API Vision:', error);
        const message = error instanceof Error ? error.message : 'Erro ao processar imagem';
        return Response.json({ error: message }, { status: 500 });
    }
}
