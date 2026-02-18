import { auth } from '@clerk/nextjs/server';
import { indexDocument } from '@/lib/rag-service';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await req.json();
        const { content, fileName } = body;

        if (!content || !fileName) {
            return new Response(JSON.stringify({ error: 'Content and filename required' }), { status: 400 });
        }

        const chunkCount = await indexDocument(content, {
            fileName,
            userId,
            uploadedAt: new Date().toISOString(),
        });

        return new Response(JSON.stringify({ success: true, chunks: chunkCount }), { status: 200 });

    } catch (error) {
        console.error('Error in RAG upload:', error);
        return new Response(JSON.stringify({ error: 'Failed to process document' }), { status: 500 });
    }
}
