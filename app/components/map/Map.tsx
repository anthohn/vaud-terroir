// components/map/Map.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Producer } from '@/types';
import AddProducerForm from './AddProducerForm'; // Import du formulaire

// --- Fix Icônes (inchangé) ---
const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

const getEmoji = (type: string) => {
    switch (type) {
        case 'vending_machine': return '🥛';
        case 'farm_shop': return '🚜';
        case 'cellar': return '🍷';
        default: return '📍';
    }
};

// --- NOUVEAU COMPOSANT INTERNE : Gère les clics sur la carte ---
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const Map = () => {
    const [producers, setProducers] = useState<Producer[]>([]);

    // NOUVEAU : État pour gérer l'ajout
    const [newLocation, setNewLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Déplacé dans une fonction pour pouvoir la rappeler après un ajout
    const fetchProducers = async () => {
        const { data, error } = await supabase.from('view_producers').select('*');
        if (!error) setProducers(data as Producer[]);
    };

    useEffect(() => {
        fixLeafletIcon();
        fetchProducers();
    }, []);

    return (
        // Ajout de 'relative' pour positionner le formulaire par dessus
        <div className="h-full w-full relative">

            <MapContainer center={[46.64, 6.63]} zoom={10} scrollWheelZoom={true} className="h-full w-full z-0">
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Détecteur de clics */}
                <MapClickHandler onMapClick={(lat, lng) => setNewLocation({ lat, lng })} />

                {/* Marqueurs existants */}
                {producers.map((producer) => (
                    <Marker key={producer.id} position={[producer.lat, producer.lng]}>
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-base">{getEmoji(producer.type)} {producer.name}</h3>
                                <p className="text-sm text-gray-600">{producer.description}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Marker temporaire pour montrer où on va ajouter */}
                {newLocation && <Marker position={[newLocation.lat, newLocation.lng]} opacity={0.6} />}
            </MapContainer>

            {/* Affichage du formulaire si on a cliqué quelque part */}
            {newLocation && (
                <AddProducerForm
                    lat={newLocation.lat}
                    lng={newLocation.lng}
                    onCancel={() => setNewLocation(null)}
                    onSuccess={() => {
                        setNewLocation(null);
                        fetchProducers(); // Rafraîchit la carte immédiatement !
                    }}
                />
            )}
        </div>
    );
};

export default Map;