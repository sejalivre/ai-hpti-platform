import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://dummy",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const session = await redis.get(id);

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error('Erro ao buscar batalha:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
