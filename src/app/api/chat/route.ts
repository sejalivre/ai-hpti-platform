import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { MODELS } from '@/lib/models';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://dummy",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

export const dynamic = "force-dynamic";

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

function checkApiKey(provider: string): string | null {
    console.log(`[API Check] Provider: ${provider}`);
    console.log(`[API Check] GROQ_API_KEY: ${!!process.env.GROQ_API_KEY}`);
    console.log(`[API Check] DEEPSEEK_API_KEY: ${!!process.env.DEEPSEEK_API_KEY}`);
    console.log(`[API Check] MODAL_API_KEY: ${!!process.env.MODAL_API_KEY}`);
    
    if (provider === 'groq' && !process.env.GROQ_API_KEY) {
        return 'GROQ_API_KEY não configurada';
    }
    if (provider === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
        return 'DEEPSEEK_API_KEY não configurada';
    }
    if (provider === 'modal' && !process.env.MODAL_API_KEY) {
        return 'MODAL_API_KEY não configurada';
    }
    return null;
}

async function streamGroq(messages: ChatMessage[], modelId: string): Promise<Response> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro Groq:', error);
        throw new Error(`Groq API error (${response.status}): ${error}`);
    }

    return response;
}

async function streamDeepSeek(messages: ChatMessage[], modelId: string): Promise<Response> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro DeepSeek:', error);
        throw new Error(`DeepSeek API error (${response.status}): ${error}`);
    }

    return response;
}

async function streamModal(messages: ChatMessage[], modelId: string): Promise<Response> {
    const response = await fetch('https://api.us-west-2.modal.direct/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.MODAL_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Erro Modal:', error);
        throw new Error(`Modal API error (${response.status}): ${error}`);
    }

    return response;
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await req.json();
        const { messages: inputMessages, modelId } = body;

        const selectedModel = MODELS.find(m => m.id === modelId) || MODELS[0];
        
        const keyError = checkApiKey(selectedModel.provider);
        if (keyError) {
            return new Response(JSON.stringify({ error: keyError }), { status: 400 });
        }

        const formattedMessages: ChatMessage[] = inputMessages
            .filter((msg: { content: unknown }) => {
                const content = msg.content;
                return typeof content === 'string' && content.trim() !== '';
            })
            .map((msg: { role: string; content: string }) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content.trim(),
            }));

        if (formattedMessages.length === 0) {
            return new Response(JSON.stringify({ error: 'No valid messages' }), { status: 400 });
        }

        const allMessages: ChatMessage[] = [
            { role: 'system', content: 'Você é um assistente útil e amigável. Sempre responda em português brasileiro.' },
            ...formattedMessages
        ];

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        let apiResponse: Response;

        if (selectedModel.provider === 'groq') {
            apiResponse = await streamGroq(allMessages, selectedModel.id);
        } else if (selectedModel.provider === 'deepseek') {
            apiResponse = await streamDeepSeek(allMessages, selectedModel.id);
        } else if (selectedModel.provider === 'modal') {
            apiResponse = await streamModal(allMessages, selectedModel.id);
        } else {
            return new Response(JSON.stringify({ error: 'Provider not supported' }), { status: 400 });
        }

        const reader = apiResponse.body?.getReader();
        if (!reader) {
            return new Response(JSON.stringify({ error: 'No response body' }), { status: 500 });
        }

        const chatId = `chat:${userId}`;
        let fullResponse = '';

        const stream = new ReadableStream({
            async start(controller) {
                let buffer = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (fullResponse) {
                            const history = [...formattedMessages, { role: 'assistant' as const, content: fullResponse }];
                            await redis.set(chatId, JSON.stringify(history));
                            await redis.expire(chatId, 86400);
                        }
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    fullResponse += content;
                                    controller.enqueue(encoder.encode(content));
                                }
                            } catch { }
                        }
                    }
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('Erro na API:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
