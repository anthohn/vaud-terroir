'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CheckCircle, X, Plus, Loader2, MapPin, Clock, Tag,
    Store, AlignLeft, Image as ImageIcon, ShoppingBag, Search
} from 'lucide-react';
import OpeningHoursEditor, { WeeklyHours } from './OpeningHoursEditor';
import { Producer } from '@/types';

// ... (Types et formatNominatimAddress restent inchangés) ...
const formatNominatimAddress = (item: any) => {
    const a = item.address;
    if (!a) return item.display_name.split(',').slice(0, 4).join(',');

    const road = a.road || a.pedestrian || a.street || a.hamlet || '';
    const number = a.house_number || '';
    const zip = a.postcode || '';
    const city = a.city || a.town || a.village || a.municipality || '';

    let cleanAddress = '';
    if (road) cleanAddress += road;
    if (number) cleanAddress += ` ${number}`;
    if (cleanAddress && (zip || city)) cleanAddress += ', ';
    if (zip) cleanAddress += `${zip} `;
    if (city) cleanAddress += city;

    return cleanAddress.trim() || item.display_name.split(',').slice(0, 3).join(',');
};

type ImageState =
    | { type: 'existing'; url: string; id: string }
    | { type: 'new'; file: File; previewUrl: string; id: string };

type Props = {
    lat: number;
    lng: number;
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Producer;
};

export default function AddProducerForm({ lat: initialLat, lng: initialLng, onSuccess, onCancel, initialData }: Props) {
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [currentCoords, setCurrentCoords] = useState({ lat: initialLat, lng: initialLng });

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const suggestionRef = useRef<HTMLDivElement>(null);

    // NOUVEAU : Ce flag permet de savoir si le changement d'adresse vient de l'utilisateur ou du code
    const isManualInput = useRef(false);

    const [images, setImages] = useState<ImageState[]>(() => {
        if (!initialData?.images) return [];
        return initialData.images.map((url, index) => ({
            type: 'existing', url, id: `existing-${index}`
        }));
    });

    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [type, setType] = useState(initialData?.type || 'farm_shop');
    const [openingHours, setOpeningHours] = useState<WeeklyHours | null>(initialData?.opening_hours || null);
    const [address, setAddress] = useState(initialData?.address || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.labels || []);

    const availableTags = [
        { id: 'Lait', label: '🥛 Lait cru' }, { id: 'Fromage', label: '🧀 Fromages' },
        { id: 'Oeufs', label: '🥚 Œufs' }, { id: 'Viande', label: '🥩 Viandes' },
        { id: 'Legumes', label: '🥦 F&L' }, { id: 'Vin', label: '🍷 Vins' },
        { id: 'Miel', label: '🍯 Miel' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // LOGIQUE DE RECHERCHE NOMINATIM (CORRIGÉE)
    useEffect(() => {
        const timer = setTimeout(async () => {
            // CORRECTION ICI : On a retiré "!showSuggestions"
            // On cherche si > 3 lettres ET si c'est une frappe manuelle
            if (address.length > 2 && isManualInput.current) {
                setIsSearching(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=5&countrycodes=ch`);

                    if (!res.ok) throw new Error('Erreur réseau');

                    const data = await res.json();
                    setSuggestions(data);

                    // On ouvre le menu seulement s'il y a des résultats
                    if (data.length > 0) {
                        setShowSuggestions(true);
                    } else {
                        setShowSuggestions(false);
                    }
                } catch (e) {
                    console.error("Erreur Nominatim", e);
                } finally {
                    setIsSearching(false);
                }
            } else if (address.length <= 2) {
                // Si on efface le texte, on ferme les suggestions
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 600); // Debounce de 600ms

        return () => clearTimeout(timer);
    }, [address]);

    // QUAND ON CLIQUE SUR UNE SUGGESTION
    const handleSelectSuggestion = (s: any) => {
        isManualInput.current = false; // Ce n'est pas une frappe manuelle, on bloque la recherche suivante
        const clean = formatNominatimAddress(s);
        setAddress(clean);
        setCurrentCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // AUTO-DETECTION INITIALE
    useEffect(() => {
        if (initialData?.address) return;
        const fetchAddress = async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialLat}&lon=${initialLng}&addressdetails=1`);
                const data = await response.json();

                if (data) {
                    const clean = formatNominatimAddress(data);

                    // ICI : On dit que c'est automatique, donc pas de recherche
                    isManualInput.current = false;
                    setAddress(clean);
                }
            } catch (error) { console.error(error); }
        };
        fetchAddress();
    }, [initialLat, initialLng, initialData]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                type: 'new' as const,
                file: file,
                previewUrl: URL.createObjectURL(file),
                id: `new-${Date.now()}-${Math.random()}`
            }));
            setImages(prev => [...prev, ...newFiles]);
        }
        e.target.value = '';
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => {
            const imageToRemove = prev[indexToRemove];
            if (imageToRemove.type === 'new') {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
        else setSelectedTags([...selectedTags, tag]);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCancel();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const finalImagePromises = images.map(async (img) => {
                if (img.type === 'existing') return img.url;
                const fileExt = img.file.name.split('.').pop();
                const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                const fileName = `${sanitizedName}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('producers-images').upload(fileName, img.file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('producers-images').getPublicUrl(fileName);
                return data.publicUrl;
            });

            const finalImageUrls = await Promise.all(finalImagePromises);

            const producerData = {
                name, description, type,
                labels: selectedTags.length > 0 ? selectedTags : ['Divers'],
                location: `POINT(${currentCoords.lng} ${currentCoords.lat})`,
                images: finalImageUrls,
                address,
                opening_hours: openingHours,
                status: 'pending',
                original_id: initialData?.id || null
            };

            const { error } = await supabase.from('producers').insert(producerData);
            if (error) throw error;
            setIsSubmitted(true);
        } catch (err: any) { alert("Erreur : " + err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={handleBackdropClick}>

            {isSubmitted ? (
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border-2 border-green-600 text-center animate-in fade-in zoom-in duration-300 cursor-default">
                    <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2">Envoyé ! 🚜</h3>
                    <p className="text-gray-600 mb-6 text-sm">Vos modifications seront validées par un admin.</p>
                    <button onClick={onSuccess} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-transform active:scale-95 cursor-pointer">Retour à la carte</button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col cursor-default">

                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                        <h3 className="font-bold text-xl text-green-800 flex items-center gap-2">
                            {initialData ? '✏️ Modifier le lieu' : '📍 Ajouter un nouveau lieu'}
                        </h3>
                        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors cursor-pointer"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* COLONNE GAUCHE (Identique à avant) */}
                            <div className="flex flex-col gap-6">
                                <div className="pb-2 border-b border-gray-100 font-bold text-gray-400 text-xs uppercase tracking-wider">Identité</div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><ImageIcon size={14} /> Photos</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {images.map((img, idx) => (
                                            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50 shadow-sm">
                                                <img src={img.type === 'existing' ? img.url : img.previewUrl} className={`w-full h-full object-cover transition-opacity ${img.type === 'new' ? 'opacity-90' : ''}`} alt="Aperçu" />
                                                {img.type === 'new' && <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[9px] text-center py-0.5 font-bold">NOUVEAU</span>}
                                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"><X size={12} /></button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-400 hover:text-green-600 text-gray-400 transition-all group">
                                            <div className="bg-gray-100 p-2 rounded-full mb-1 group-hover:bg-white group-hover:shadow-sm transition-all"><Plus size={20} /></div>
                                            <span className="text-[10px] uppercase font-bold">Ajouter</span>
                                            <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 italic flex justify-end">{images.length} photo(s)</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du lieu</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Store size={18} className="text-gray-400" /></div>
                                        <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm" placeholder="Ex: Ferme du Chalet" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Type de vente</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ShoppingBag size={18} className="text-gray-400" /></div>
                                        <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-green-500 outline-none shadow-sm appearance-none">
                                            <option value="farm_shop">🚜 Magasin à la ferme</option>
                                            <option value="vending_machine">🥛 Automate à lait / casiers</option>
                                            <option value="cellar">🍷 Cave / Vigneron</option>
                                            <option value="market">🥕 Marché</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description courte</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 pointer-events-none"><AlignLeft size={18} className="text-gray-400" /></div>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg text-sm h-28 focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm resize-none" placeholder="Détails sur l'accès, les produits phares..." />
                                    </div>
                                </div>
                            </div>

                            {/* COLONNE DROITE : LOGISTIQUE */}
                            <div className="flex flex-col gap-6">
                                <div className="pb-2 border-b border-gray-100 font-bold text-gray-400 text-xs uppercase tracking-wider">Logistique</div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Tag size={14} /> Produits disponibles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map(tag => (
                                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-all duration-200 active:scale-95 select-none flex items-center gap-1 ${selectedTags.includes(tag.id) ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100 -translate-y-px' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'}`}>
                                                {selectedTags.includes(tag.id) && <CheckCircle size={10} />}
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION ADRESSE */}
                                <div className="relative z-50" ref={suggestionRef}>
                                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><MapPin size={14} /> Adresse exacte</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {isSearching ? <Loader2 size={18} className="text-green-600 animate-spin" /> : <Search size={18} className="text-gray-400" />}
                                        </div>
                                        <input
                                            value={address}
                                            onChange={(e) => {
                                                isManualInput.current = true; // C'est un humain qui tape !
                                                setAddress(e.target.value);
                                                if (e.target.value.length < 3) setShowSuggestions(false);
                                            }}
                                            onFocus={() => {
                                                // Optionnel : Rouvrir les suggestions au focus si on avait déjà tapé
                                                if (suggestions.length > 0) setShowSuggestions(true);
                                            }}
                                            type="text"
                                            className="w-full border border-gray-300 pl-10 p-2.5 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                            placeholder="Tapez pour rechercher une adresse..."
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* LISTE SUGGESTIONS */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-1 z-[100]">
                                            {suggestions.map((s, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => handleSelectSuggestion(s)}
                                                    className="p-3 hover:bg-green-50 cursor-pointer border-b last:border-0 border-gray-100 transition-colors flex flex-col"
                                                >
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {formatNominatimAddress(s).split(',')[0]}
                                                    </span>
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {s.display_name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-[11px] text-gray-400 mt-1 ml-1 flex items-center gap-1">📍 Adresse normalisée.</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Clock size={14} /> Horaires d'ouverture</label>
                                    <OpeningHoursEditor initialData={initialData?.opening_hours} onChange={setOpeningHours} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                            <button type="button" onClick={onCancel} className="flex-1 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
                            <button disabled={loading} type="submit" className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-[0.98]">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Enregistrer les modifications' : 'Valider la création')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}