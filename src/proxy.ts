import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define as rotas que não precisam de login
const publicRoutes = ['/sign-in(.*)', '/sign-up(.*)', '/'];

export async function proxy(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Verifica se é uma rota pública
    const isPublic = publicRoutes.some(route => {
        const regex = new RegExp(`^${route.replace('(.*)', '.*')}$`);
        return regex.test(path);
    });

    // Diagnóstico seguro para Vercel Logs
    const hasPubKey = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY);
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;

    console.log(`[Proxy Check] Path: ${path}, Public: ${isPublic}, Auth Keys: Publishable=${hasPubKey}, Secret=${hasSecretKey}`);

    // Se não for rota pública, verifica autenticação
    if (!isPublic) {
        try {
            // Tenta obter o usuário autenticado
        const auth = await clerkClient();
        const session = await auth.sessions.getSessionList();
        
        if (!session || session.data.length === 0) {
            // Redireciona para login se não autenticado
            const signInUrl = new URL('/sign-in', request.url);
            return NextResponse.redirect(signInUrl);
        }
        } catch (error) {
            console.error('[Proxy Error] Authentication failed:', error);
            // Em caso de erro, redireciona para login
            const signInUrl = new URL('/sign-in', request.url);
            return NextResponse.redirect(signInUrl);
        }
    }

    // Continua com a requisição
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};