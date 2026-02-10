'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// --- Hack pour corriger les icônes Leaflet manquantes dans Next.js ---
const fixLeafletIcon = () => {
    // On supprime le getter par défaut qui pose problème
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

const Map = () => {
    useEffect(() => {
        fixLeafletIcon();
    }, []);

    // Coordonnées approximatives du centre du canton de Vaud (Echallens)
    const vaudCenter: [number, number] = [46.64, 6.63];

    return (
        <MapContainer
            center={vaudCenter}
            zoom={10}
            scrollWheelZoom={true}
            className="h-full w-full z-0" // Important pour le styling
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Un petit marker test à Lausanne pour vérifier que ça marche */}
            <Marker position={[46.5197, 6.6323]}>
                <Popup>
                    Salut depuis Lausanne ! <br /> VaudTerroir est en ligne. 🧀
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default Map;