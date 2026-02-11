'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export type WeeklyHours = {
    [key: string]: { isOpen: boolean; start: string; end: string }
};

const DAYS = [
    { key: 'mo', label: 'L' }, { key: 'tu', label: 'M' }, { key: 'we', label: 'M' },
    { key: 'th', label: 'J' }, { key: 'fr', label: 'V' }, { key: 'sa', label: 'S' }, { key: 'su', label: 'D' },
];

const DAY_NAMES: { [key: string]: string } = {
    mo: 'Lundi', tu: 'Mardi', we: 'Mercredi', th: 'Jeudi', fr: 'Vendredi', sa: 'Samedi', su: 'Dimanche',
};

// VALEURS PAR DÉFAUT (Si rien n'est fourni)
const DEFAULT_SCHEDULE: WeeklyHours = {
    mo: { isOpen: false, start: '08:00', end: '18:00' },
    tu: { isOpen: false, start: '08:00', end: '18:00' },
    we: { isOpen: false, start: '08:00', end: '18:00' },
    th: { isOpen: false, start: '08:00', end: '18:00' },
    fr: { isOpen: false, start: '08:00', end: '18:00' },
    sa: { isOpen: false, start: '09:00', end: '17:00' },
    su: { isOpen: false, start: '09:00', end: '17:00' },
};

type Props = {
    initialData?: WeeklyHours | null; // <--- NOUVEAU : On accepte les données existantes
    onChange: (hours: WeeklyHours) => void;
};

export default function OpeningHoursEditor({ initialData, onChange }: Props) {
    // On initialise avec initialData SI il existe, sinon par défaut
    const [schedule, setSchedule] = useState<WeeklyHours>(initialData || DEFAULT_SCHEDULE);
    const [selectedDay, setSelectedDay] = useState<string>('mo');

    // On notifie le parent dès le début (pour que le formulaire ait les données même si on ne touche rien)
    useEffect(() => {
        onChange(schedule);
    }, [schedule, onChange]);

    const toggleDay = (dayKey: string) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], isOpen: !prev[dayKey].isOpen }
        }));
        setSelectedDay(dayKey);
    };

    const updateTime = (type: 'start' | 'end', value: string) => {
        setSchedule(prev => ({
            ...prev,
            [selectedDay]: { ...prev[selectedDay], [type]: value }
        }));
    };

    return (
        <div className="border border-gray-300 p-4 rounded-xl mt-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-3">
                <Clock size={12} /> Horaires d'ouverture
            </label>

            <div className="flex justify-between mb-4 px-1">
                {DAYS.map(day => (
                    <button
                        key={day.key}
                        type="button"
                        onClick={() => setSelectedDay(day.key)}
                        className={`
                            w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer
                            ${selectedDay === day.key ? 'ring-2 ring-offset-1 ring-green-600 scale-110' : ''}
                            ${schedule[day.key]?.isOpen
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-white text-gray-400 border border-gray-200'}
                        `}
                    >
                        {day.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-in fade-in">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-gray-800">{DAY_NAMES[selectedDay]}</span>
                    <button
                        type="button"
                        onClick={() => toggleDay(selectedDay)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${schedule[selectedDay]?.isOpen ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule[selectedDay]?.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {schedule[selectedDay]?.isOpen ? (
                    <div className="flex items-center gap-2">
                        <input type="time" value={schedule[selectedDay].start} onChange={(e) => updateTime('start', e.target.value)} className="border cursor-pointer p-2 rounded text-sm flex-1 text-center bg-gray-50 outline-none focus:border-green-500" />
                        <span className="text-gray-400">-</span>
                        <input type="time" value={schedule[selectedDay].end} onChange={(e) => updateTime('end', e.target.value)} className="border cursor-pointer p-2 rounded text-sm flex-1 text-center bg-gray-50 outline-none focus:border-green-500" />
                    </div>
                ) : (
                    <div className="text-center text-sm text-gray-400 py-2 italic">Fermé ce jour-là 💤</div>
                )}
            </div>
        </div>
    );
}