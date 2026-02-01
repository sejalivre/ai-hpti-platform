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
        // Buscamos o histórico salvo no passo anterior
        const history = await redis.get(chatId);

        // Se não houver histórico, retornamos uma lista vazia
        return NextResponse.json(history ?? []);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}