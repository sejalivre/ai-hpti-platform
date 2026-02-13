"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { MessageSquare, Image as ImageIcon, FileText, Home, Brain } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
    { name: "Início", href: "/", icon: Home },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Imagens", href: "/images", icon: ImageIcon },
    { name: "Arquivos", href: "/files", icon: FileText },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <header className="fixed top-0 z-50 w-full border-b border-zinc-100/50 bg-white/30 backdrop-blur-2xl dark:bg-black/40 dark:border-zinc-800/50">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-soft dark:bg-white">
                            <Brain size={18} className="text-white dark:text-black" />
                        </div>
                        <span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
                            HPTI<span className="text-blue-600">AI</span>
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 text-xs font-black tracking-widest uppercase rounded-xl transition-all",
                                        isActive
                                            ? "bg-zinc-900 text-white shadow-soft dark:bg-white dark:text-black"
                                            : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/50 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800/50"
                                    )}
                                >
                                    <Icon size={14} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8 ring-4 ring-zinc-50 border border-zinc-200 dark:ring-zinc-900 dark:border-zinc-800 shadow-soft"
                            }
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
