'use client';

import { useState, useRef, useEffect } from 'react';
import { Navigation, X } from 'lucide-react';
import { SiWaze, SiGooglemaps, SiApple } from 'react-icons/si';

type Props = {
    lat: number;
    lng: number;
    address?: string;
};

export default function RouteSelector({ lat, lng, address }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // On prépare l'adresse encodée proprement (pour éviter les bugs avec les espaces/accents)
    const encodedAddress = address ? encodeURIComponent(address) : null;

    const openAppleMaps = () => {
        // Apple Maps : daddr (Destination Address) accepte soit une adresse texte, soit lat,lng
        const dest = encodedAddress || `${lat},${lng}`;
        window.open(`http://maps.apple.com/?daddr=${dest}&dirflg=d`, '_system');
        setIsOpen(false);
    };

    const openGoogleMaps = () => {
        // Google Maps : query accepte l'adresse texte. C'est le plus fiable.
        const query = encodedAddress || `${lat},${lng}`;
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        setIsOpen(false);
    };

    const openWaze = () => {
        // Waze : q = recherche texte (Adresse), ll = coordonnées (GPS)
        // Si on a l'adresse, on utilise 'q', sinon 'll'
        const url = encodedAddress
            ? `https://waze.com/ul?q=${encodedAddress}&navigate=yes`
            : `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

        window.open(url, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="relative z-10 w-full" ref={menuRef}>
            {/* BOUTON PRINCIPAL */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-[0.98] cursor-pointer"
            >
                <Navigation size={20} />
                <span>Y aller (Itinéraire)</span>
            </button>

            {/* MENU DÉROULANT (Action Sheet) */}
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">

                    {/* Header */}
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Choisir le GPS</span>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded-full cursor-pointer transition-colors">
                            <X size={14} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Liste des options */}
                    <div className="flex flex-col">

                        {/* Apple Plans */}
                        <button onClick={openAppleMaps} className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors group cursor-pointer">
                            <div className="bg-gray-100 p-2 rounded-lg text-black group-hover:bg-gray-200 transition-colors">
                                <SiApple size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">Apple Plans</div>
                                <div className="text-[10px] text-gray-400">Via l'adresse postale</div>
                            </div>
                        </button>

                        {/* Google Maps */}
                        <button onClick={openGoogleMaps} className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors group cursor-pointer">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <SiGooglemaps size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">Google Maps</div>
                                <div className="text-[10px] text-gray-400">Recherche textuelle</div>
                            </div>
                        </button>

                        {/* Waze */}
                        <button onClick={openWaze} className="flex items-center gap-3 p-4 hover:bg-gray-50 text-left transition-colors group cursor-pointer">
                            <div className="bg-sky-50 p-2 rounded-lg text-sky-500 group-hover:bg-sky-100 transition-colors">
                                <SiWaze size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-sm">Waze</div>
                                <div className="text-[10px] text-gray-400">Navigation directe</div>
                            </div>
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}