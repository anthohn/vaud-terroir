'use client';

import { Producer } from '@/types';
import { X, Navigation, Clock, MapPin, Edit } from 'lucide-react'; // Ajout de Edit
import { useEffect, useState } from 'react';

type Props = {
    producer: Producer;
    onClose: () => void;
    onEdit: () => void; // Ajout de la prop onEdit
};

// Helper pour les emojis
const getEmoji = (type: string) => {
    switch (type) {
        case 'vending_machine': return '🥛';
        case 'farm_shop': return '🚜';
        case 'cellar': return '🍷';
        default: return '📍';
    }
};

// Helper pour les noms des jours en français
const DAY_NAMES: { [key: string]: string } = {
    mo: 'Lundi',
    tu: 'Mardi',
    we: 'Mercredi',
    th: 'Jeudi',
    fr: 'Vendredi',
    sa: 'Samedi',
    su: 'Dimanche',
};

// Ordre d'affichage des jours (commence par Lundi ou Aujourd'hui ?)
// Ici on affiche du Lundi au Dimanche classique
const SORTED_DAYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

export default function ProducerPanel({ producer, onClose, onEdit }: Props) {
    // Animation d'entrée (Slide in)
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Déclenche l'animation après le montage
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Attend la fin de l'animation (300ms) pour démonter
    };

    // --- LOGIQUE D'OUVERTURE (Calcul du statut) ---
    const getStatus = (hours: any) => {
        if (!hours) return { text: 'Horaires non renseignés', color: 'text-gray-500', isOpen: false };

        const now = new Date();
        // getDay() renvoie 0 pour Dimanche, 1 pour Lundi...
        // On mappe ça vers nos clés JSON ('su', 'mo', etc.)
        const dayKeys = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
        const currentDayKey = dayKeys[now.getDay()];
        const todaySchedule = hours[currentDayKey];

        // 1. Vérifier si c'est ouvert aujourd'hui
        if (!todaySchedule || !todaySchedule.isOpen) {
            return { text: 'Fermé', color: 'text-red-600', isOpen: false };
        }

        // 2. Parser les heures pour comparer (HH:MM -> minutes)
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = todaySchedule.start.split(':').map(Number);
        const openingMinutes = startH * 60 + startM;

        const [endH, endM] = todaySchedule.end.split(':').map(Number);
        const closingMinutes = endH * 60 + endM;

        // 3. Comparaisons
        if (currentMinutes < openingMinutes) {
            return { text: `Fermé • Ouvre à ${todaySchedule.start}`, color: 'text-red-600', isOpen: false };
        }

        if (currentMinutes >= closingMinutes) {
            return { text: 'Fermé • A fermé à ' + todaySchedule.end, color: 'text-red-600', isOpen: false };
        }

        // Si on est ici, c'est ouvert. On regarde si ça ferme bientôt (< 60 min)
        if (closingMinutes - currentMinutes < 60) {
            return { text: `Ferme bientôt (${todaySchedule.end})`, color: 'text-orange-600', isOpen: true };
        }

        return { text: `Ouvert • Ferme à ${todaySchedule.end}`, color: 'text-green-600', isOpen: true };
    };

    // 👉 C'EST ICI QU'ON CALCULE LE STATUT POUR L'AFFICHER EN BAS
    const status = getStatus(producer.opening_hours);

    return (
        <div
            className={`
        absolute z-[1500] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col
        /* MOBILE : En bas, prend 85% de la hauteur */
        bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl transform
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        
        /* DESKTOP : À droite, prend toute la hauteur, largeur augmentée à 500px */
        md:top-0 md:right-0 md:h-full md:w-[500px] md:rounded-l-2xl md:rounded-tr-none
        md:${isVisible ? 'translate-x-0' : 'translate-x-full'}
      `}
        >

            {/* HEADER BOUTONS (Fermer et Modifier) */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* Bouton MODIFIER */}
                <button
                    onClick={onEdit}
                    className="bg-white/80 backdrop-blur p-2 rounded-full shadow-md hover:bg-white hover:text-green-600 transition-colors group"
                    title="Suggérer une modification"
                >
                    <Edit size={20} className="text-gray-600 group-hover:text-green-600" />
                </button>

                {/* Bouton FERMER */}
                <button
                    onClick={handleClose}
                    className="bg-white/80 backdrop-blur p-2 rounded-full shadow-md hover:bg-white transition-colors group"
                >
                    <X size={20} className="text-gray-600 group-hover:text-black" />
                </button>
            </div>

            {/* --- ZONE 1 : IMAGE HERO --- */}
            <div className="h-64 shrink-0 relative bg-gray-100">
                {producer.image_url ? (
                    <img
                        src={producer.image_url}
                        alt={producer.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-emerald-800 text-white">
                        <span className="text-6xl mb-2 drop-shadow-lg">{getEmoji(producer.type)}</span>
                    </div>
                )}
                {/* Dégradé pour lisibilité du titre */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-24" />
                <h2 className="absolute bottom-4 left-6 text-white text-3xl font-bold drop-shadow-md leading-tight">
                    {producer.name}
                </h2>
            </div>

            {/* --- ZONE 2 : CONTENU SCROLLABLE --- */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">

                {/* Tags / Catégories */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                        {getEmoji(producer.type)} {producer.type === 'vending_machine' ? 'Automate' : producer.type === 'farm_shop' ? 'Ferme' : 'Cave'}
                    </span>
                    {producer.labels?.map(label => (
                        <span key={label} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-200">
                            {label}
                        </span>
                    ))}
                </div>

                {/* Description */}
                <div className="prose prose-sm text-gray-600 mb-8 border-b border-gray-100 pb-6">
                    <h3 className="text-gray-900 font-bold text-base mb-2">À propos</h3>
                    <p className="whitespace-pre-wrap leading-relaxed">
                        {producer.description || "Aucune description détaillée disponible pour ce lieu."}
                    </p>
                </div>

                {/* --- INFOS PRATIQUES --- */}
                <div className="space-y-6">
                    <h3 className="text-gray-900 font-bold text-base">Informations pratiques</h3>

                    {/* ADRESSE */}
                    <div className="flex items-start gap-4 text-gray-700 group">
                        <div className="bg-gray-100 p-2 rounded-full group-hover:bg-green-100 transition-colors">
                            <MapPin size={20} className="text-gray-500 group-hover:text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-900">Adresse</p>
                            {producer.address ? (
                                <p className="text-sm text-gray-600 mt-0.5">{producer.address}</p>
                            ) : (
                                <p className="text-sm text-gray-400 italic mt-0.5">
                                    GPS: {producer.lat.toFixed(4)}, {producer.lng.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* HORAIRES DÉTAILLÉS */}
                    <div className="flex items-start gap-4 text-gray-700">
                        <div className="bg-gray-100 p-2 rounded-full">
                            <Clock size={20} className="text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-gray-900 mb-1">Horaires d'ouverture</p>

                            {/* Statut Actuel (Ouvert/Fermé) */}
                            <p className={`text-sm font-bold ${status.color} mb-3`}>
                                {status.text}
                            </p>

                            {/* Tableau de la semaine - ON L'AFFICHE SEULEMENT SI LES HORAIRES EXISTENT */}
                            {producer.opening_hours && (
                                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                                    {SORTED_DAYS.map(dayKey => {
                                        const daySchedule = producer.opening_hours[dayKey];
                                        const isToday = new Date().getDay() === (['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].indexOf(dayKey));

                                        return (
                                            <div key={dayKey} className={`flex justify-between ${isToday ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                <span className="w-20">{DAY_NAMES[dayKey]}</span>
                                                <span>
                                                    {daySchedule?.isOpen
                                                        ? `${daySchedule.start} - ${daySchedule.end}`
                                                        : 'Fermé'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Message alternatif si pas d'horaires (Optionnel, mais sympa) */}
                            {!producer.opening_hours && (
                                <p className="text-xs text-gray-400 italic">
                                    Les horaires détaillés n'ont pas encore été ajoutés pour ce lieu.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER FIXE (Bouton d'action) --- */}
            <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-20">
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${producer.lat},${producer.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-[0.98]"
                >
                    <Navigation size={20} />
                    Y aller (Itinéraire)
                </a>
            </div>

        </div >
    );
}