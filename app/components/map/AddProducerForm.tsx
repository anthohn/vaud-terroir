'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, MapPin } from 'lucide-react';
import OpeningHoursEditor, { WeeklyHours } from './OpeningHoursEditor';
import { Producer } from '@/types'; // Assure-toi d'importer le type

type Props = {
    lat: number;
    lng: number;
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Producer; // NOUVEAU : Données pour le mode édition
};

export default function AddProducerForm({ lat, lng, onSuccess, onCancel, initialData }: Props) {
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // --- INITIALISATION DES ÉTATS (Avec les données existantes si dispo) ---
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

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
        else setSelectedTags([...selectedTags, tag]);
    };

    // Auto-adresse (Seulement si on n'est PAS en mode édition ou si l'adresse est vide)
    useEffect(() => {
        if (initialData?.address) return; // On garde l'adresse existante en mode edit

        const fetchAddress = async () => {
            setIsFetchingAddress(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                if (data?.display_name) {
                    setAddress(data.display_name.split(',').slice(0, 4).join(','));
                }
            } catch (error) { console.error(error); }
            finally { setIsFetchingAddress(false); }
        };
        fetchAddress();
    }, [lat, lng, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = initialData?.image_url || null;

        // 1. Upload Image (si nouvelle image)
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${name.replace(/\s/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('producers-images').upload(fileName, imageFile);
            if (uploadError) { alert('Erreur upload'); setLoading(false); return; }
            const { data } = supabase.storage.from('producers-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        // 2. Préparation des données
        const producerData = {
            name, description, type,
            labels: selectedTags.length > 0 ? selectedTags : ['Divers'],
            location: `POINT(${lng} ${lat})`, // Format PostGIS
            image_url: imageUrl,
            address,
            opening_hours: openingHours,
            status: 'pending', // Toujours en attente de validation
            original_id: initialData?.id || null // LIEN VERS L'ORIGINAL SI MODIF
        };

        // 3. Insertion directe (plus simple que la RPC pour gérer le original_id dynamiquement)
        const { error } = await supabase.from('producers').insert(producerData);

        setLoading(false);
        if (error) alert('Erreur: ' + error.message);
        else setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl shadow-2xl z-[1000] w-[90%] max-w-sm border-2 border-green-600 text-center">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Merci ! 🚜</h3>
                <p className="text-gray-600 mb-6 text-sm">
                    {initialData ? "Votre modification a été envoyée." : "Votre lieu a été ajouté."} <br />
                    Un administrateur va valider les changements.
                </p>
                <button onClick={onSuccess} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Retour à la carte</button>
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-[1000] w-[95%] max-w-md border-2 border-green-600 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center gap-2">
                {initialData ? '✏️ Modifier le lieu' : '📍 Ajouter un lieu'}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* IMAGE */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-sm text-gray-500">
                        {imageFile ? `📷 ${imageFile.name}` : (initialData?.image_url ? "📸 Changer la photo" : "📸 Ajouter une photo")}
                    </span>
                    {/* Aperçu petite image si existe déjà */}
                    {!imageFile && initialData?.image_url && (
                        <img src={initialData.image_url} alt="Actuelle" className="h-10 w-10 object-cover rounded absolute top-2 right-2 border" />
                    )}
                </div>

                {/* NOM */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nom</label>
                    <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border border-gray-300 p-2 rounded text-sm" />
                </div>

                {/* TYPE */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 p-2 rounded text-sm bg-white">
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
                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1 rounded-full text-xs font-bold border border-gray-300 ${selectedTags.includes(tag.id) ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ADRESSE */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Adresse</label>
                    <div className="relative">
                        <input value={address} onChange={(e) => setAddress(e.target.value)} type="text" className={`w-full border border-gray-300 p-2 rounded text-sm ${isFetchingAddress ? 'bg-gray-100' : ''}`} />
                        {isFetchingAddress && <span className="absolute right-2 top-2 text-xs">🔍...</span>}
                    </div>
                </div>

                {/* HORAIRES */}
                <OpeningHoursEditor initialData={initialData?.opening_hours} onChange={setOpeningHours}
                />

                {/* DESCRIPTION */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 p-2 rounded text-sm h-16" />
                </div>

                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="flex-1 py-2 bg-gray-100 rounded text-gray-600 font-bold">Annuler</button>
                    <button disabled={loading} type="submit" className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">{loading ? '...' : 'Valider'}</button>
                </div>
            </form>
        </div>
    );
}