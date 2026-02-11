'use client';

import { clsx } from 'clsx';

type Props = {
    selectedTags: string[];
    onFilterChange: (tags: string[]) => void;
};

export default function FilterBar({ selectedTags, onFilterChange }: Props) {

    const filters = [
        { id: 'all', label: 'Tout', emoji: '🔍' },
        { id: 'Lait', label: 'Lait cru', emoji: '🥛' },
        { id: 'Fromage', label: 'Fromages', emoji: '🧀' },
        { id: 'Oeufs', label: 'Œufs', emoji: '🥚' },
        { id: 'Viande', label: 'Viandes', emoji: '🥩' },
        { id: 'Legumes', label: 'F&L', emoji: '🥦' },
        { id: 'Vin', label: 'Vins', emoji: '🍷' },
        { id: 'Miel', label: 'Miel', emoji: '🍯' },
    ];

    const handleToggle = (tagId: string) => {
        // CAS 1 : Clic sur "Tout" -> On vide le tableau
        if (tagId === 'all') {
            onFilterChange([]);
            return;
        }

        // CAS 2 : Le tag est déjà sélectionné -> On le retire
        if (selectedTags.includes(tagId)) {
            onFilterChange(selectedTags.filter(t => t !== tagId));
        }
        // CAS 3 : Le tag n'est pas sélectionné -> On l'ajoute
        else {
            onFilterChange([...selectedTags, tagId]);
        }
    };

    return (
        <div className="absolute top-4 left-0 right-0 z-500 flex justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-gray-200 pointer-events-auto flex gap-1 overflow-x-auto max-w-[95%] scrollbar-hide">
                {filters.map((f) => {
                    // "Tout" est actif si le tableau est vide
                    const isAllActive = selectedTags.length === 0 && f.id === 'all';
                    // Les autres sont actifs s'ils sont dans le tableau
                    const isTagActive = selectedTags.includes(f.id);

                    const isActive = isAllActive || isTagActive;

                    return (
                        <button
                            key={f.id}
                            onClick={() => handleToggle(f.id)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                                isActive
                                    ? "bg-green-600 text-white shadow-md transform scale-105"
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