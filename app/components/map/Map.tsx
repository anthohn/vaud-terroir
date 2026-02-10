'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Producer } from '@/types';
import AddProducerForm from './AddProducerForm';
import FilterBar from './FilterBar';
import Link from 'next/link';
import { Navigation, Locate, ExternalLink, Plus, MapPin, X, Check } from 'lucide-react';

// --- Fix Icônes Leaflet ---
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

// --- Composant Helper pour capturer la carte ---
const MapInstanceExposer = ({ setMap }: { setMap: (map: L.Map) => void }) => {
    const map = useMap();
    useEffect(() => {
        setMap(map);
    }, [map, setMap]);
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
        }).on("locationerror", function () {
            setLoading(false);
            alert("Impossible de vous géolocaliser :(");
        });
    };

    return (
        <div className="absolute bottom-28 right-4 z-[400]">
            <button
                onClick={handleLocate}
                className="bg-white text-gray-700 p-3 rounded-full shadow-lg font-bold active:scale-95 transition-transform flex items-center justify-center border border-gray-100"
            >
                {loading ? <span className="animate-spin">⌛</span> : <Locate size={24} />}
            </button>
        </div>
    );
};

const Map = () => {
    const [producers, setProducers] = useState<Producer[]>([]);

    // --- STATES VISÉE ---
    const [newLocation, setNewLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isTargeting, setIsTargeting] = useState(false);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    const fetchProducers = async () => {
        const { data, error } = await supabase.from('view_producers').select('*');
        if (!error) setProducers(data as Producer[]);
    };

    useEffect(() => {
        fixLeafletIcon();
        fetchProducers();
    }, []);

    const filteredProducers = useMemo(() => {
        if (!filterCategory) return producers;
        return producers.filter(p =>
            p.labels && p.labels.includes(filterCategory)
        );
    }, [producers, filterCategory]);

    return (
        <div className="h-full w-full relative">

            <FilterBar activeCategory={filterCategory} onFilterChange={setFilterCategory} />

            {/* --- MODE VISÉE (Targeting) --- */}
            {isTargeting && (
                <div className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center">

                    {/* 1. Épingle au centre */}
                    <div className="relative transform -translate-y-1/2">
                        <MapPin size={48} className="text-red-600 fill-current drop-shadow-2xl animate-bounce" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/30 rounded-full blur-sm"></div>
                    </div>

                    {/* 2. Message instructions (Haut) */}
                    <div className="absolute top-24 bg-white/90 text-gray-800 px-5 py-2 rounded-full text-sm font-bold shadow-lg border border-gray-200 backdrop-blur-md animate-in slide-in-from-top-4">
                        Déplacez la carte pour viser 🎯
                    </div>

                    {/* 3. Boutons Valider / Annuler (Bas) */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-3 w-full max-w-xs px-4 pointer-events-auto">

                        <button
                            onClick={() => setIsTargeting(false)}
                            className="flex-1 bg-white text-gray-800 py-3 rounded-full font-bold shadow-xl border border-gray-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <X size={20} className="text-gray-500" />
                            <span>Annuler</span>
                        </button>

                        <button
                            onClick={() => {
                                if (mapInstance) {
                                    const center = mapInstance.getCenter();
                                    setNewLocation({ lat: center.lat, lng: center.lng });
                                    setIsTargeting(false);
                                }
                            }}
                            // CHANGEMENT ICI : bg-green-600 au lieu de bg-black
                            className="flex-1 bg-green-600 text-white py-3 rounded-full font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-green-700"
                        >
                            <Check size={20} />
                            <span>Valider</span>
                        </button>

                    </div>
                </div>
            )}

            {/* --- BOUTON FLOTTANT "AJOUTER" (Idle) --- */}
            {!isTargeting && !newLocation && (
                <button
                    onClick={() => setIsTargeting(true)}
                    // CHANGEMENT ICI : bg-green-600 au lieu de bg-black
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[400] bg-green-600 text-white px-6 py-3.5 rounded-full shadow-2xl font-bold active:scale-95 transition-transform flex items-center gap-2 border-2 border-white/20 hover:scale-105"
                >
                    <Plus size={24} />
                    <span className="text-sm uppercase tracking-wider">Ajouter un lieu</span>
                </button>
            )}

            <MapContainer
                center={[46.64, 6.63]}
                zoom={10}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    attribution='© OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapInstanceExposer setMap={setMapInstance} />
                <LocateControl />

                {/* MARQUEURS */}
                {filteredProducers.map((producer) => (
                    <Marker key={producer.id} position={[producer.lat, producer.lng]}>
                        <Popup closeButton={false} offset={[0, -10]}>
                            <div className="w-[260px] flex flex-col font-sans">
                                {producer.image_url ? (
                                    <div className="relative h-36 w-full rounded-t-xl overflow-hidden group">
                                        <img
                                            src={producer.image_url}
                                            alt={producer.name}
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                        <span className="absolute bottom-2 right-2 bg-white/95 px-2 py-1 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 backdrop-blur-sm">
                                            {getEmoji(producer.type)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-28 w-full bg-gradient-to-br from-green-600 to-emerald-800 rounded-t-xl flex flex-col items-center justify-center relative overflow-hidden group">
                                        <div className="absolute top-[-20px] left-[-20px] w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                                        <div className="absolute bottom-[-20px] right-[-20px] w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                                        <span className="text-4xl drop-shadow-md transform group-hover:scale-110 transition-transform duration-300 cursor-default">
                                            {getEmoji(producer.type)}
                                        </span>
                                    </div>
                                )}

                                <div className="bg-white px-4 py-3 rounded-b-xl shadow-lg border border-gray-100">
                                    <Link href={`/producer/${producer.id}`} className="group block mb-2">
                                        <div className="flex justify-between items-start gap-3">
                                            <h3 className="font-extrabold text-lg leading-tight text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2">
                                                {producer.name}
                                            </h3>
                                            <div className="bg-gray-50 p-1.5 rounded-full group-hover:bg-green-100 transition-colors mt-0.5 shrink-0">
                                                <ExternalLink size={14} className="text-gray-400 group-hover:text-green-700" />
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {producer.labels?.slice(0, 3).map(label => (
                                            <span key={label} className="text-[10px] uppercase font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full tracking-wide">
                                                {label}
                                            </span>
                                        ))}
                                        {(producer.labels?.length || 0) > 3 && (
                                            <span className="text-[10px] text-gray-400 px-1 py-0.5">+{producer.labels!.length - 3}</span>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em] leading-relaxed">
                                        {producer.description || "Pas de description disponible."}
                                    </p>

                                    {/* CHANGEMENT ICI AUSSI : Le bouton itinéraire passe en vert pour la cohérence */}
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${producer.lat},${producer.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-green-600 py-2.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-all active:scale-[0.98] shadow-md text-white"
                                    >
                                        <Navigation size={14} />
                                        Itinéraire
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