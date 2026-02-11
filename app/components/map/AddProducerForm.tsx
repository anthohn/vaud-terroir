'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, X, Plus, Loader2, MapPin, Clock, Tag } from 'lucide-react';
import OpeningHoursEditor, { WeeklyHours } from './OpeningHoursEditor';
import { Producer } from '@/types';

// --- TYPES INTERNES ---
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

export default function AddProducerForm({ lat, lng, onSuccess, onCancel, initialData }: Props) {
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // --- STATE & LOGIQUE (Inchangés) ---
    const [images, setImages] = useState<ImageState[]>(() => {
        if (!initialData?.images) return [];
        return initialData.images.map((url, index) => ({
            type: 'existing',
            url: url,
            id: `existing-${index}`
        }));
    });

    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [type, setType] = useState(initialData?.type || 'farm_shop');
    const [openingHours, setOpeningHours] = useState<WeeklyHours | null>(initialData?.opening_hours || null);
    const [address, setAddress] = useState(initialData?.address || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.labels || []);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    const availableTags = [
        { id: 'Lait', label: '🥛 Lait cru' }, { id: 'Fromage', label: '🧀 Fromages' },
        { id: 'Oeufs', label: '🥚 Œufs' }, { id: 'Viande', label: '🥩 Viandes' },
        { id: 'Legumes', label: '🥦 F&L' }, { id: 'Vin', label: '🍷 Vins' },
        { id: 'Miel', label: '🍯 Miel' },
    ];

    useEffect(() => {
        if (initialData?.address) return;
        const fetchAddress = async () => {
            setIsFetchingAddress(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                if (data?.display_name) setAddress(data.display_name.split(',').slice(0, 4).join(','));
            } catch (error) { console.error(error); }
            finally { setIsFetchingAddress(false); }
        };
        fetchAddress();
    }, [lat, lng, initialData]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const finalImagePromises = images.map(async (img) => {
                if (img.type === 'existing') {
                    return img.url;
                } else {
                    const fileExt = img.file.name.split('.').pop();
                    const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                    const fileName = `${sanitizedName}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('producers-images')
                        .upload(fileName, img.file);

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage
                        .from('producers-images')
                        .getPublicUrl(fileName);

                    return data.publicUrl;
                }
            });

            const finalImageUrls = await Promise.all(finalImagePromises);

            const producerData = {
                name, description, type,
                labels: selectedTags.length > 0 ? selectedTags : ['Divers'],
                location: `POINT(${lng} ${lat})`,
                images: finalImageUrls,
                address,
                opening_hours: openingHours,
                status: 'pending',
                original_id: initialData?.id || null
            };

            const { error } = await supabase.from('producers').insert(producerData);
            if (error) throw error;
            setIsSubmitted(true);

        } catch (err: any) {
            console.error(err);
            alert("Erreur : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---

    // 1. BACKDROP ET STRUCTURE MODALE
    return (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

            {/* ETAT SUCCES */}
            {isSubmitted ? (
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border-2 border-green-600 text-center animate-in fade-in zoom-in duration-300">
                    <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2">Envoyé ! 🚜</h3>
                    <p className="text-gray-600 mb-6 text-sm">Vos modifications seront validées par un admin.</p>
                    <button onClick={onSuccess} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Retour à la carte</button>
                </div>
            ) : (

                // FORMULAIRE PRINCIPAL
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

                    {/* Header Fixe */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className="font-bold text-xl text-green-800 flex items-center gap-2">
                            {initialData ? '✏️ Modifier le lieu' : '📍 Ajouter un nouveau lieu'}
                        </h3>
                        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">

                        {/* GRILLE 2 COLONNES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* --- COLONNE GAUCHE : IDENTITÉ VISUELLE --- */}
                            <div className="flex flex-col gap-5">
                                <div className="pb-2 border-b border-gray-100 font-bold text-gray-400 text-xs uppercase tracking-wider">Identité</div>

                                {/* PHOTOS */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Photos</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {images.map((img, idx) => (
                                            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                                                <img
                                                    src={img.type === 'existing' ? img.url : img.previewUrl}
                                                    className={`w-full h-full object-cover transition-opacity ${img.type === 'new' ? 'opacity-90' : ''}`}
                                                    alt="Aperçu"
                                                />
                                                {img.type === 'new' && <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[9px] text-center py-0.5 font-bold">NOUVEAU</span>}
                                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-400 hover:text-green-600 text-gray-400 transition-all">
                                            <Plus size={24} />
                                            <span className="text-[10px] uppercase font-bold mt-1">Ajouter</span>
                                            <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1 italic">{images.length} photo(s) sélectionnée(s)</p>
                                </div>

                                {/* NOM */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du lieu</label>
                                    <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="Ex: Ferme du Chalet" />
                                </div>

                                {/* TYPE */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Type de vente</label>
                                    <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-green-500 outline-none">
                                        <option value="farm_shop">🚜 Magasin à la ferme</option>
                                        <option value="vending_machine">🥛 Automate à lait / casiers</option>
                                        <option value="cellar">🍷 Cave / Vigneron</option>
                                        <option value="market">🥕 Marché</option>
                                    </select>
                                </div>

                                {/* DESCRIPTION */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description courte</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm h-24 focus:ring-2 focus:ring-green-500 outline-none" placeholder="Détails sur l'accès, les produits phares..." />
                                </div>
                            </div>

                            {/* --- COLONNE DROITE : LOGISTIQUE --- */}
                            <div className="flex flex-col gap-5">
                                <div className="pb-2 border-b border-gray-100 font-bold text-gray-400 text-xs uppercase tracking-wider">Logistique</div>

                                {/* TAGS */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Tag size={14} /> Produits disponibles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map(tag => (
                                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors shadow-sm ${selectedTags.includes(tag.id) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-500'}`}>
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ADRESSE */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><MapPin size={14} /> Adresse exacte</label>
                                    <div className="relative">
                                        <input value={address} onChange={(e) => setAddress(e.target.value)} type="text" className={`w-full border border-gray-300 p-2.5 pl-9 rounded-lg text-sm ${isFetchingAddress ? 'bg-gray-50 text-gray-400' : ''}`} />
                                        <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                        {isFetchingAddress && <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-green-600" />}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1 ml-1">Détectée automatiquement via le placement du marqueur.</p>
                                </div>

                                {/* HORAIRES */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Clock size={14} /> Horaires d'ouverture</label>
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <OpeningHoursEditor initialData={initialData?.opening_hours} onChange={setOpeningHours} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER ACTIONS (Pleine largeur) */}
                        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 bg-white sticky bottom-0">
                            <button type="button" onClick={onCancel} className="flex-1 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
                            <button disabled={loading} type="submit" className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Enregistrer les modifications' : 'Valider la création')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}