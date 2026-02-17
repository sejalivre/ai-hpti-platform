import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://dummy",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "dummy",
});

export const dynamic = "force-dynamic";

interface BattleSession {
    id: string;
    leftModel: string;
    rightModel: string;
    initialMessage: string;
    messages: Array<{
        role: "left" | "right";
        content: string;
        modelId: string;
    }>;
    createdAt: number;
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { leftModel, rightModel, initialMessage, messages } = body;

        if (!leftModel || !rightModel || !messages) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sessionId = `battle:${Date.now()}`;
        const session: BattleSession = {
            id: sessionId,
            leftModel,
            rightModel,
            initialMessage: initialMessage || "Olá, quem é você?",
            messages,
            createdAt: Date.now(),
        };

        await redis.set(sessionId, JSON.stringify(session));
        await redis.expire(sessionId, 86400 * 30);

        const userBattleListKey = `battles:${userId}`;
        await redis.lpush(userBattleListKey, sessionId);
        await redis.ltrim(userBattleListKey, 0, 49);

        return NextResponse.json({ sessionId, session });
    } catch (error) {
        console.error('Erro ao salvar batalha:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userBattleListKey = `battles:${userId}`;
        const sessionIds = await redis.lrange(userBattleListKey, 0, 49);

        const sessions = await Promise.all(
            sessionIds.map(async (sessionId: string) => {
                const session = await redis.get(sessionId);
                return session;
            })
        );

        return NextResponse.json(sessions.filter(Boolean));
    } catch (error) {
        console.error('Erro ao listar batalhas:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
