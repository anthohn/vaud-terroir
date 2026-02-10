'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Producer } from '@/types';
import AddProducerForm from './AddProducerForm';
import FilterBar from './FilterBar'; // <--- IMPORT NOUVEAU
import { Navigation, Locate } from 'lucide-react';
import Link from 'next/link';

// --- Fix Icônes ---
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

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const LocateControl = () => {
    const map = useMap();
    const [loading, setLoading] = useState(false);

    const handleLocate = () => {
        setLoading(true);
        map.locate().on("locationfound", function (e) {
            setLoading(false);
            map.flyTo(e.latlng, 13);
            L.circleMarker(e.latlng, {
                radius: 8, fillColor: "#3b82f6", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
        }).on("locationerror", function (e) {
            setLoading(false);
            alert("Impossible de vous géolocaliser :(");
        });
    };

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[400]">
            <button
                onClick={handleLocate}
                className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg font-bold active:scale-95 transition-transform flex items-center gap-2"
            >
                {loading ? <span className="animate-spin">⌛</span> : <Locate size={20} />}
                {loading ? 'Recherche...' : 'Autour de moi'}
            </button>
        </div>
    );
};

const Map = () => {
    const [producers, setProducers] = useState<Producer[]>([]);
    const [newLocation, setNewLocation] = useState<{ lat: number, lng: number } | null>(null);

    // NOUVEAU STATE POUR LE FILTRE
    const [filterType, setFilterType] = useState<string | null>(null);

    const fetchProducers = async () => {
        const { data, error } = await supabase.from('view_producers').select('*');
        if (!error) setProducers(data as Producer[]);
    };

    useEffect(() => {
        fixLeafletIcon();
        fetchProducers();
    }, []);

    // FILTRAGE DYNAMIQUE
    const filteredProducers = useMemo(() => {
        if (!filterType) return producers; // Si pas de filtre, on rend tout
        return producers.filter(p => p.type === filterType);
    }, [producers, filterType]);

    return (
        <div className="h-full w-full relative">

            {/* BARRE DE FILTRES EN HAUT */}
            <FilterBar activeType={filterType} onFilterChange={setFilterType} />

            <MapContainer center={[46.64, 6.63]} zoom={10} scrollWheelZoom={true} className="h-full w-full z-0">
                <TileLayer
                    attribution='© OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler onMapClick={(lat, lng) => setNewLocation({ lat, lng })} />
                <LocateControl />

                {/* ON UTILISE LA LISTE FILTRÉE ICI */}
                {filteredProducers.map((producer) => (
                    <Marker key={producer.id} position={[producer.lat, producer.lng]}>
                        <Popup>
                            <div className="p-0 w-[240px]">
                                {producer.image_url ? (
                                    <div className="relative h-32 w-full mb-3 rounded-t-lg overflow-hidden bg-gray-100">
                                        <img src={producer.image_url} alt={producer.name} className="w-full h-full object-cover" />
                                        <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-xs font-bold rounded-md shadow-sm">
                                            {getEmoji(producer.type)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-12 w-full bg-gradient-to-r from-green-500 to-green-600 rounded-t-lg mb-3 flex items-center justify-center">
                                        <span className="text-2xl">{getEmoji(producer.type)}</span>
                                    </div>
                                )}

                                <div className="px-3 pb-3">
                                    <Link href={`/producer/${producer.id}`} className="group">
                                        <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-green-600 group-hover:underline transition-colors cursor-pointer flex items-center justify-between">
                                            <span>{producer.name}</span>
                                            <span className="text-gray-400 text-xs">voir &rarr;</span>
                                        </h3>
                                    </Link>
                                    <div className="flex gap-1 mb-2 flex-wrap">
                                        {producer.labels?.map(label => (
                                            <span key={label} className="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-sm">
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{producer.description}</p>

                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${producer.lat},${producer.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-800 transition-colors shadow-sm"
                                    >
                                        <Navigation size={16} />
                                        Y aller
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {newLocation && <Marker position={[newLocation.lat, newLocation.lng]} opacity={0.6} />}
            </MapContainer>

            {newLocation && (
                <AddProducerForm
                    lat={newLocation.lat}
                    lng={newLocation.lng}
                    onCancel={() => setNewLocation(null)}
                    onSuccess={() => {
                        setNewLocation(null);
                        fetchProducers();
                    }}
                />
            )}
        </div>
    );
};

export default Map;