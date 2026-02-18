import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { 
    getUserApiConfigs, 
    saveUserApiConfigs, 
    addUserApiConfig, 
    updateUserApiConfig, 
    deleteUserApiConfig,
    type ApiConfig 
} from '@/lib/api-config';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await getUserApiConfigs(userId);
        return NextResponse.json({ configs });
    } catch (error) {
        console.error('Error fetching API configs:', error);
        return NextResponse.json({ error: 'Failed to fetch API configs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { provider, apiKey, baseUrl, models, isActive } = body;

        if (!provider || !apiKey || !models || !Array.isArray(models)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newConfig = await addUserApiConfig(userId, {
            provider,
            apiKey,
            baseUrl,
            models,
            isActive: isActive !== undefined ? isActive : true,
        });

        if (!newConfig) {
            return NextResponse.json({ error: 'Failed to create API config' }, { status: 500 });
        }

        return NextResponse.json({ config: newConfig }, { status: 201 });
    } catch (error) {
        console.error('Error creating API config:', error);
        return NextResponse.json({ error: 'Failed to create API config' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
        }

        const success = await updateUserApiConfig(userId, id, updates);
        
        if (!success) {
            return NextResponse.json({ error: 'Config not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating API config:', error);
        return NextResponse.json({ error: 'Failed to update API config' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
        }

        const success = await deleteUserApiConfig(userId, id);
        
        if (!success) {
            return NextResponse.json({ error: 'Config not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting API config:', error);
        return NextResponse.json({ error: 'Failed to delete API config' }, { status: 500 });
    }
}