import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://dummy",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const agents = await redis.get(`agents:${userId}`) || [];
    return new Response(JSON.stringify(agents), { status: 200 });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = await req.json();
    const { name, description, systemPrompt, icon } = body;

    if (!name || !systemPrompt) {
        return new Response('Name and System Prompt are required', { status: 400 });
    }

    const newAgent = {
        id: Date.now().toString(),
        name,
        description: description || '',
        systemPrompt,
        icon: icon || '🤖',
        createdAt: new Date().toISOString(),
    };

    const agents: any[] = (await redis.get(`agents:${userId}`)) || [];
    agents.push(newAgent);
    
    await redis.set(`agents:${userId}`, JSON.stringify(agents));

    return new Response(JSON.stringify(newAgent), { status: 201 });
}

export async function DELETE(req: Request) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new Response('ID required', { status: 400 });

    let agents: any[] = (await redis.get(`agents:${userId}`)) || [];
    agents = agents.filter((a: any) => a.id !== id);

    await redis.set(`agents:${userId}`, JSON.stringify(agents));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
