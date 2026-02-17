import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que não precisam de login
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/']);

export default clerkMiddleware(async (auth, request) => {
    // Diagnóstico seguro para Vercel Logs
    const hasPubKey = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY);
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;

    console.log(`[Middleware Check] Auth Keys: Publishable=${hasPubKey}, Secret=${hasSecretKey}`);

    if (!isPublicRoute(request)) {
        await auth.protect();
    }
}, {
    // Passagem explícita das chaves para garantir detecção no Edge Runtime da Vercel
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};