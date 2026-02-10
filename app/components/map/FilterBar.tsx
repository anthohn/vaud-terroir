'use client';

import { clsx } from 'clsx'; // Utilitaire pour gérer les classes conditionnelles

type Props = {
    activeType: string | null;
    onFilterChange: (type: string | null) => void;
};

export default function FilterBar({ activeType, onFilterChange }: Props) {

    const filters = [
        { id: 'all', label: 'Tout', emoji: '🔍' },
        { id: 'farm_shop', label: 'Fermes', emoji: '🚜' },
        { id: 'vending_machine', label: 'Automates', emoji: '🥛' },
        { id: 'cellar', label: 'Caves', emoji: '🍷' },
    ];

    return (
        <div className="absolute top-4 left-0 right-0 z-[500] flex justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-gray-200 pointer-events-auto flex gap-1 overflow-x-auto max-w-[95%]">
                {filters.map((f) => {
                    const isActive = (activeType === null && f.id === 'all') || activeType === f.id;

                    return (
                        <button
                            key={f.id}
                            onClick={() => onFilterChange(f.id === 'all' ? null : f.id)}
                            className={clsx(
                                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                isActive
                                    ? "bg-green-600 text-white shadow-md"
                                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <span>{f.emoji}</span>
                            <span>{f.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}