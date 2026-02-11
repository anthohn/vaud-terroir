'use client';

import { Producer } from '@/types';
import { X, Navigation, Clock, MapPin, Edit, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

type Props = {
    producer: Producer;
    onClose: () => void;
    onEdit: () => void;
};

// --- HELPER LIGHTBOX (Plein écran) ---
const Lightbox = ({ images, initialIndex, onClose }: { images: string[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex);

    const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setIndex((i) => (i + 1) % images.length); };
    const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); };

    // Support clavier
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <div className="fixed inset-0 z-9999 bg-black/95 flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 cursor-pointer"><X size={32} /></button>

            {/* Image */}
            <img
                src={images[index]}
                alt="Full screen"
                className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-sm"
                onClick={(e) => e.stopPropagation()} // Empêche de fermer si on clique sur l'image
            />

            {/* Navigation */}
            {images.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors cursor-pointer"><ChevronLeft size={40} /></button>
                    <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors cursor-pointer"><ChevronRight size={40} /></button>

                    {/* Compteur bas */}
                    {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-mono text-sm bg-black/50 px-3 py-1 rounded-full">
                        {index + 1} / {images.length}
                    </div> */}
                </>
            )}
        </div>
    );
};


// --- COMPOSANT PRINCIPAL ---
export default function ProducerPanel({ producer, onClose, onEdit }: Props) {
    const [isVisible, setIsVisible] = useState(false);

    // États pour le carrousel
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLightbox, setShowLightbox] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    // Gestion du scroll pour mettre à jour les points (dots)
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const width = scrollContainerRef.current.offsetWidth;
        const index = Math.round(scrollLeft / width);
        setCurrentImageIndex(index);
    };

    const scrollToIndex = (index: number) => {
        if (!scrollContainerRef.current) return;
        const width = scrollContainerRef.current.offsetWidth;
        scrollContainerRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
    };

    // --- LOGIQUE STATUT ---
    const getStatus = (hours: any) => {
        if (!hours) return { text: 'Horaires non renseignés', color: 'text-gray-500', isOpen: false };
        const now = new Date();
        const dayKeys = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
        const currentDayKey = dayKeys[now.getDay()];
        const todaySchedule = hours[currentDayKey];

        if (!todaySchedule || !todaySchedule.isOpen) return { text: 'Fermé', color: 'text-red-600', isOpen: false };

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = todaySchedule.start.split(':').map(Number);
        const [endH, endM] = todaySchedule.end.split(':').map(Number);
        const openingMinutes = startH * 60 + startM;
        const closingMinutes = endH * 60 + endM;

        if (currentMinutes < openingMinutes) return { text: `Fermé • Ouvre à ${todaySchedule.start}`, color: 'text-red-600', isOpen: false };
        if (currentMinutes >= closingMinutes) return { text: 'Fermé • A fermé à ' + todaySchedule.end, color: 'text-red-600', isOpen: false };
        if (closingMinutes - currentMinutes < 60) return { text: `Ferme bientôt (${todaySchedule.end})`, color: 'text-orange-600', isOpen: true };

        return { text: `Ouvert • Ferme à ${todaySchedule.end}`, color: 'text-green-600', isOpen: true };
    };

    const status = getStatus(producer.opening_hours);
    const images = producer.images && producer.images.length > 0 ? producer.images : [];

    // Fallback image unique pour compatibilité
    // @ts-ignore
    const displayImages = images.length > 0 ? images : (producer.image_url ? [producer.image_url] : []);

    return (
        <>
            {/* LIGHTBOX OVERLAY */}
            {showLightbox && displayImages.length > 0 && (
                <Lightbox
                    images={displayImages}
                    initialIndex={currentImageIndex}
                    onClose={() => setShowLightbox(false)}
                />
            )}

            <div className={`absolute z-1500 bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl transform ${isVisible ? 'translate-y-0' : 'translate-y-full'} md:top-0 md:right-0 md:h-full md:w-[500px] md:rounded-l-2xl md:rounded-tr-none md:${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* BOUTONS FLOTTANTS */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button onClick={onEdit} className="bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:bg-white hover:text-green-600 transition-colors cursor-pointer" title="Modifier">
                        <Edit size={20} className="text-gray-700" />
                    </button>
                    <button onClick={handleClose} className="bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:bg-white transition-colors cursor-pointer">
                        <X size={20} className="text-gray-700" />
                    </button>
                </div>

                {/* --- ZONE 1 : GALERIE PREMIUM --- */}
                <div className="h-72 shrink-0 relative bg-gray-900 group select-none">
                    {displayImages.length > 0 ? (
                        <>
                            {/* SCROLL CONTAINER */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-pointer"
                                onClick={() => setShowLightbox(true)}
                            >
                                {displayImages.map((img, idx) => (
                                    <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                                        <img src={img} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                    </div>
                                ))}
                            </div>

                            {/* NAVIGATION DOTS (Si plusieurs images) */}
                            {displayImages.length > 1 && (
                                <>
                                    {/* Flèches PC (Visible au survol) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); scrollToIndex(currentImageIndex - 1); }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block cursor-pointer"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); scrollToIndex(currentImageIndex + 1); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block cursor-pointer"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-800 text-white">
                            {/* <span className="text-6xl">🚜</span> */}
                        </div>
                    )}

                    {/* Titre superposé */}
                    <div className="absolute bottom-8 left-6 right-16 pointer-events-none">
                        <h2 className="text-white text-3xl font-bold drop-shadow-lg leading-tight">{producer.name}</h2>
                    </div>
                </div>

                {/* --- ZONE 2 : CONTENU --- */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
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

                    {/* Infos Pratiques */}
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 text-gray-700">
                            <div className="bg-gray-100 p-2 rounded-full"><MapPin size={20} className="text-gray-500" /></div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">Adresse</p>
                                <p className="text-sm text-gray-600 mt-0.5">{producer.address || `GPS: ${producer.lat.toFixed(4)}, ${producer.lng.toFixed(4)}`}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 text-gray-700">
                            <div className="bg-gray-100 p-2 rounded-full"><Clock size={20} className="text-gray-500" /></div>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-gray-900 mb-1">Horaires</p>
                                <p className={`text-sm font-bold ${status.color} mb-3`}>{status.text}</p>
                                {producer.opening_hours && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                                        {['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'].map(day => {
                                            const s = producer.opening_hours[day];
                                            // @ts-ignore
                                            const dayName = { mo: 'Lundi', tu: 'Mardi', we: 'Mercredi', th: 'Jeudi', fr: 'Vendredi', sa: 'Samedi', su: 'Dimanche' }[day];
                                            const isToday = new Date().getDay() === (day === 'su' ? 0 : ['mo', 'tu', 'we', 'th', 'fr', 'sa'].indexOf(day) + 1);
                                            return (
                                                <div key={day} className={`flex justify-between ${isToday ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                    <span className="w-20">{dayName}</span>
                                                    <span>{s?.isOpen ? `${s.start} - ${s.end}` : 'Fermé'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer GPS */}
                <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-20">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${producer.lat},${producer.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-[0.98]"
                    >
                        <Navigation size={20} /> Y aller (Itinéraire)
                    </a>
                </div>
            </div>
        </>
    );
}