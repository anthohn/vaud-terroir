'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
    Menu, X, Map as MapIcon, BookOpen,
    HeartHandshake, Mail, ChevronRight, Leaf
} from 'lucide-react';

export default function NavigationMenu() {
    const [isOpen, setIsOpen] = useState(false);

    // Empêche le scroll de la page quand le menu est ouvert (confort mobile)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const navItems = [
        { icon: MapIcon, label: 'Carte des producteurs', href: '/' },
        { icon: BookOpen, label: 'Notre Démarche', href: '/demarche' },
        { icon: HeartHandshake, label: 'Comment ça marche ?', href: '/concept' },
        { icon: Mail, label: 'Contact & Suggestions', href: '/contact' },
    ];

    return (
        <>
            {/* BOUTON FLOTTANT SUR LA CARTE */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 left-4 z-1000 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-gray-200 text-green-700 hover:bg-green-50 hover:scale-105 transition-all cursor-pointer"
                aria-label="Ouvrir le menu"
            >
                <Menu size={24} />
            </button>

            {/* FOND ASSOMBRI (BACKDROP) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-1001 transition-opacity duration-300 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* PANNEAU LATÉRAL (DRAWER) */}
            <div
                className={clsx(
                    "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-1002 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* En-tête du menu */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-green-50/50">
                    <div className="flex items-center gap-2 text-green-800">
                        <Leaf size={24} strokeWidth={2.5} />
                        <span className="text-2xl font-bold tracking-wide">VaudTerroir</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:bg-white hover:text-red-500 rounded-full transition-colors cursor-pointer shadow-sm border border-transparent hover:border-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Liens de navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {navItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center justify-between p-4 rounded-2xl hover:bg-green-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                            <div className="flex items-center gap-4 text-gray-700 group-hover:text-white transition-colors">
                                <div className="p-2 rounded-xl">
                                    <item.icon size={20} className="text-green-700 group-hover:text-white" />
                                </div>
                                <span className="font-bold text-lg">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </nav>

                {/* Pied de page : L'ADN du projet */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto">
                    <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest text-green-700 flex items-center gap-2">
                        Notre Philosophie
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                        « Remettre le paysan au centre du village. Fini les marges de la grande distribution. Ici, vos achats soutiennent directement ceux qui nourrissent notre terroir. »
                    </p>
                </div>
            </div>
        </>
    );
}