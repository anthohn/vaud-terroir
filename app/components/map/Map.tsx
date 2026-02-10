// components/map/Map.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Assure-toi que le chemin est bon
import { Producer } from '@/types';

// --- Hack pour corriger les icônes Leaflet (toujours nécessaire) ---
const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

// Fonction helper pour choisir un emoji selon le type
const getEmoji = (type: string) => {
    switch (type) {
        case 'vending_machine': return '🥛'; // Automate
        case 'farm_shop': return '🚜';      // Ferme
        case 'cellar': return '🍷';         // Cave
        default: return '📍';
    }
};

const Map = () => {
    const [producers, setProducers] = useState<Producer[]>([]);

    useEffect(() => {
        fixLeafletIcon();

        // Fonction pour charger les producteurs
        const fetchProducers = async () => {
            const { data, error } = await supabase
                .from('view_producers') // On appelle notre VUE, pas la table directe
                .select('*');

            if (error) {
                console.error('Erreur chargement producteurs:', error);
            } else {
                console.log('Producteurs chargés:', data); // Pour débugger dans la console
                setProducers(data as Producer[]);
            }
        };

        fetchProducers();
    }, []);

    // Centre du canton
    const vaudCenter: [number, number] = [46.64, 6.63];

    return (
        <MapContainer
            center={vaudCenter}
            zoom={10}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* On boucle sur notre liste de producteurs */}
            {producers.map((producer) => (
                <Marker
                    key={producer.id}
                    position={[producer.lat, producer.lng]}
                >
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <span>{getEmoji(producer.type)}</span>
                                {producer.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{producer.description}</p>

                            {/* Affichage des labels (Bio, etc.) */}
                            <div className="flex gap-1 mt-2 flex-wrap">
                                {producer.labels?.map(label => (
                                    <span key={label} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

        </MapContainer>
    );
};

export default Map;