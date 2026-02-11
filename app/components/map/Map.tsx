'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Producer } from '@/types';
import AddProducerForm from './AddProducerForm';
import FilterBar from './FilterBar';
import ProducerPanel from './ProducerPanel';
import { Locate, Plus, MapPin, X, Check } from 'lucide-react';

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

// --- Composant Helper ---
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
        <div className="absolute bottom-32 right-4 z-400">
            <button onClick={handleLocate} className="bg-white text-gray-700 p-3 rounded-full shadow-lg font-bold border border-gray-100 cursor-pointer">
                {loading ? <span className="animate-spin">⌛</span> : <Locate size={24} />}
            </button>
        </div>
    );
};

const Map = () => {
    const [producers, setProducers] = useState<Producer[]>([]);

    // --- STATES ---
    const [newLocation, setNewLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isTargeting, setIsTargeting] = useState(false);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

    // CHANGEMENT 1 : On gère un TABLEAU de tags, pas juste une string
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Le producteur sélectionné pour le panneau latéral
    const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);

    // Le producteur en cours de modification
    const [editingProducer, setEditingProducer] = useState<Producer | null>(null);

    const fetchProducers = async () => {
        const { data, error } = await supabase.from('view_producers').select('*');
        if (!error) setProducers(data as Producer[]);
    };

    useEffect(() => {
        fixLeafletIcon();
        fetchProducers();
    }, []);

    // CHANGEMENT 2 : Logique "AND" (Intersection stricte)
    const filteredProducers = useMemo(() => {
        // Si aucun tag sélectionné, on affiche tout
        if (selectedTags.length === 0) return producers;

        return producers.filter(p => {
            // Sécurité : si le producteur n'a pas de labels, on l'exclut
            if (!p.labels) return false;

            // LOGIQUE "AND" : On vérifie que CHAQUE tag sélectionné est présent dans les labels du producteur
            return selectedTags.every(tag => p.labels.includes(tag));
        });
    }, [producers, selectedTags]);

    return (
        <div className="h-full w-full relative overflow-hidden">

            {/* CHANGEMENT 3 : On passe les bonnes props au FilterBar (assure-toi d'avoir mis à jour FilterBar.tsx aussi) */}
            <FilterBar
                selectedTags={selectedTags}
                onFilterChange={setSelectedTags}
            />

            {/* --- CAS 1 : MODE ÉDITION (L'utilisateur a cliqué sur le crayon) --- */}
            {editingProducer && (
                <AddProducerForm
                    lat={editingProducer.lat}
                    lng={editingProducer.lng}
                    initialData={editingProducer}
                    onCancel={() => setEditingProducer(null)}
                    onSuccess={() => {
                        setEditingProducer(null);
                        setSelectedProducer(null);
                        fetchProducers(); // Rafraîchir les données
                    }}
                />
            )}

            {/* --- CAS 2 : LE PANNEAU LATÉRAL (Affichage normal) --- */}
            {selectedProducer && !editingProducer && (
                <ProducerPanel
                    producer={selectedProducer}
                    onClose={() => setSelectedProducer(null)}
                    onEdit={() => setEditingProducer(selectedProducer)}
                />
            )}

            {/* --- MODE VISÉE (Targeting) --- */}
            {isTargeting && (
                <div className="absolute inset-0 pointer-events-none z-1000 flex items-center justify-center">
                    <div className="relative transform -translate-y-1/2">
                        <MapPin size={48} className="text-red-600 fill-current drop-shadow-2xl animate-bounce" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/30 rounded-full blur-sm"></div>
                    </div>
                    <div className="absolute top-24 bg-white/90 text-gray-800 px-5 py-2 rounded-full text-sm font-bold shadow-lg border border-gray-200 backdrop-blur-md">
                        Déplacez la carte pour viser 🎯
                    </div>
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-3 w-full max-w-xs px-4 pointer-events-auto">
                        <button onClick={() => setIsTargeting(false)} className="flex-1 bg-white text-gray-800 py-3 rounded-full font-bold shadow-xl border border-gray-200 flex items-center justify-center gap-2 cursor-pointer">
                            <X size={20} className="text-gray-500" /> <span>Annuler</span>
                        </button>
                        <button
                            onClick={() => {
                                if (mapInstance) {
                                    const center = mapInstance.getCenter();
                                    setNewLocation({ lat: center.lat, lng: center.lng });
                                    setIsTargeting(false);
                                }
                            }}
                            className="flex-1 bg-green-600 text-white py-3 rounded-full font-bold shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Check size={20} /> <span>Valider</span>
                        </button>
                    </div>
                </div>
            )}

            {/* --- BOUTON AJOUTER (Caché si on vise, ajoute, édite ou voit un détail) --- */}
            {!isTargeting && !newLocation && !selectedProducer && !editingProducer && (
                <button
                    onClick={() => setIsTargeting(true)}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-400 bg-green-600 text-white px-6 py-3.5 rounded-full shadow-2xl font-bold active:scale-95 transition-transform flex items-center gap-2 border-2 border-white/20 hover:scale-105 cursor-pointer"
                >
                    <Plus size={24} />
                    <span className="text-sm uppercase tracking-wider">Ajouter un lieu</span>
                </button>
            )}

            <MapContainer center={[46.64, 6.63]} zoom={10} scrollWheelZoom={true} className="h-full w-full z-0" zoomControl={false}>
                <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapInstanceExposer setMap={setMapInstance} />
                <LocateControl />

                {filteredProducers.map((producer) => (
                    <Marker
                        key={producer.id}
                        position={[producer.lat, producer.lng]}
                        eventHandlers={{
                            click: () => {
                                setSelectedProducer(producer);
                                mapInstance?.flyTo([producer.lat, producer.lng], 14);
                            },
                        }}
                    />
                ))}

                {newLocation && <Marker position={[newLocation.lat, newLocation.lng]} opacity={0.6} />}
            </MapContainer>

            {/* --- CAS 3 : CRÉATION D'UN NOUVEAU LIEU --- */}
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