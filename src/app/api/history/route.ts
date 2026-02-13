import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const chatId = `chat:${userId}`;
        const history = await redis.get(chatId);

        return NextResponse.json(history ?? []);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const chatId = `chat:${userId}`;
        await redis.del(chatId);

        return new NextResponse("History deleted", { status: 200 });
    } catch (error) {
        console.error("Erro ao deletar histórico:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}