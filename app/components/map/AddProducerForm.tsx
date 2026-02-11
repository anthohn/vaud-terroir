'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, X, Plus, Loader2 } from 'lucide-react';
import OpeningHoursEditor, { WeeklyHours } from './OpeningHoursEditor';
import { Producer } from '@/types';

// --- TYPES INTERNES POUR LA GESTION ROBUSTE ---
type ImageState =
    | { type: 'existing'; url: string; id: string } // Image venant de la DB
    | { type: 'new'; file: File; previewUrl: string; id: string }; // Nouvelle image locale

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

    // --- STATE UNIFIÉ (La clé de la solution) ---
    // On initialise directement avec les images existantes
    const [images, setImages] = useState<ImageState[]>(() => {
        if (!initialData?.images) return [];
        return initialData.images.map((url, index) => ({
            type: 'existing',
            url: url,
            id: `existing-${index}` // Clé unique stable pour React
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

    // --- GESTION ADRESSE ---
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

    // --- GESTION DES IMAGES (La partie critique) ---

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                type: 'new' as const,
                file: file,
                previewUrl: URL.createObjectURL(file),
                id: `new-${Date.now()}-${Math.random()}`
            }));

            // On ajoute à la suite (garde l'ordre)
            setImages(prev => [...prev, ...newFiles]);
        }
        // Reset l'input pour permettre de resélectionner le même fichier si besoin
        e.target.value = '';
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => {
            const imageToRemove = prev[indexToRemove];

            // Nettoyage mémoire : si c'est un blob local, on le révoque
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

    // --- SOUMISSION DU FORMULAIRE ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Traitement séquentiel pour garder l'ordre EXACT des images
            // On mappe sur le tableau 'images' actuel.
            // Si c'est 'existing' -> on garde l'URL.
            // Si c'est 'new' -> on upload et on prend la nouvelle URL.

            const finalImagePromises = images.map(async (img) => {
                if (img.type === 'existing') {
                    return img.url;
                } else {
                    // Upload du fichier
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

            // On attend que tous les uploads soient finis
            const finalImageUrls = await Promise.all(finalImagePromises);

            // 2. Préparation des données
            const producerData = {
                name,
                description,
                type,
                labels: selectedTags.length > 0 ? selectedTags : ['Divers'],
                location: `POINT(${lng} ${lat})`,
                images: finalImageUrls, // L'ordre est garanti ici
                address,
                opening_hours: openingHours,
                status: 'pending', // Important pour le workflow admin
                original_id: initialData?.id || null
            };

            // 3. Insertion
            const { error } = await supabase.from('producers').insert(producerData);
            if (error) throw error;

            setIsSubmitted(true);

        } catch (err: any) {
            console.error(err);
            alert("Erreur lors de l'enregistrement : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl shadow-2xl z-1000 w-[90%] max-w-sm border-2 border-green-600 text-center">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Envoyé ! 🚜</h3>
                <p className="text-gray-600 mb-6 text-sm">Vos modifications seront validées par un admin.</p>
                <button onClick={onSuccess} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Retour à la carte</button>
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-1000 w-[95%] max-w-md border-2 border-green-600 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center gap-2">
                {initialData ? '✏️ Modifier' : '📍 Ajouter un lieu'}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                {/* ZONE PHOTOS REVISITÉE */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Photos</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {images.map((img, idx) => (
                            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                                <img
                                    src={img.type === 'existing' ? img.url : img.previewUrl}
                                    className={`w-full h-full object-cover transition-opacity ${img.type === 'new' ? 'opacity-90' : ''}`}
                                    alt="Aperçu"
                                />
                                {/* Badge "Nouveau" pour feedback visuel */}
                                {img.type === 'new' && <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[9px] text-center py-0.5 font-bold">NOUVEAU</span>}

                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
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
                    <p className="text-[10px] text-gray-400 italic text-right">{images.length} photo(s)</p>
                </div>

                {/* NOM */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nom</label>
                    <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border border-gray-300 p-2 rounded text-sm" placeholder="Ex: Ferme du Chalet..." />
                </div>

                {/* TYPE */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white cursor-pointer">
                        <option value="farm_shop">🚜 Magasin à la ferme</option>
                        <option value="vending_machine">🥛 Automate</option>
                        <option value="cellar">🍷 Cave / Vigneron</option>
                    </select>
                </div>

                {/* TAGS */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Produits</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${selectedTags.includes(tag.id) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'}`}>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ADRESSE */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label>
                    <div className="relative">
                        <input value={address} onChange={(e) => setAddress(e.target.value)} type="text" className={`w-full border border-gray-300 p-2 rounded text-sm ${isFetchingAddress ? 'bg-gray-50 text-gray-400' : ''}`} />
                        {isFetchingAddress && <Loader2 size={16} className="absolute right-2 top-2.5 animate-spin text-green-600" />}
                    </div>
                </div>

                {/* HORAIRES */}
                <OpeningHoursEditor initialData={initialData?.opening_hours} onChange={setOpeningHours} />

                {/* DESCRIPTION */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 p-2 rounded text-sm h-16" placeholder="Détails sur l'accès, les produits..." />
                </div>

                {/* BOUTONS ACTIONS */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer">Annuler</button>
                    <button disabled={loading} type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Valider'}
                    </button>
                </div>
            </form>
        </div>
    );
}