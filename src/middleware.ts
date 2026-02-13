import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que não precisam de login
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/']);

export default clerkMiddleware(async (auth, request) => {
    // Verificação de segurança para evitar erro 500 catastrófico na Vercel se as chaves sumirem
    if (!process.env.CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        console.error("ERRO: CLERK_PUBLISHABLE_KEY não encontrada no ambiente.");
    }

    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};