'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, MapPin, Clock } from 'lucide-react';
import OpeningHoursEditor, { WeeklyHours } from './OpeningHoursEditor';

type Props = {
    lat: number;
    lng: number;
    onSuccess: () => void;
    onCancel: () => void;
};

export default function AddProducerForm({ lat, lng, onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [openingHours, setOpeningHours] = useState<WeeklyHours | null>(null);

    // Nouveaux états
    const [address, setAddress] = useState('');
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    // Tags (inchangé)
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const availableTags = [
        { id: 'Lait', label: '🥛 Lait cru' },
        { id: 'Fromage', label: '🧀 Fromages' },
        { id: 'Oeufs', label: '🥚 Œufs' },
        { id: 'Viande', label: '🥩 Viandes' },
        { id: 'Legumes', label: '🥦 F&L' },
        { id: 'Vin', label: '🍷 Vins' },
        { id: 'Miel', label: '🍯 Miel' },
    ];

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
        else setSelectedTags([...selectedTags, tag]);
    };

    // --- AUTO-ADRESSE MAGIQUE ---
    useEffect(() => {
        const fetchAddress = async () => {
            setIsFetchingAddress(true);
            try {
                // On demande à OpenStreetMap : "C'est où ça ?"
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                if (data && data.display_name) {
                    // On nettoie un peu l'adresse pour qu'elle soit plus courte
                    const cleanAddress = data.display_name.split(',').slice(0, 4).join(',');
                    setAddress(cleanAddress);
                }
            } catch (error) {
                console.error("Erreur adresse", error);
            } finally {
                setIsFetchingAddress(false);
            }
        };
        fetchAddress();
    }, [lat, lng]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        let imageUrl = null;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${name.replace(/\s/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('producers-images').upload(fileName, imageFile);
            if (uploadError) { alert('Erreur upload'); setLoading(false); return; }
            const { data: { publicUrl } } = supabase.storage.from('producers-images').getPublicUrl(fileName);
            imageUrl = publicUrl;
        }

        // Appel RPC mis à jour avec les nouveaux champs
        const { error } = await supabase.rpc('create_producer', {
            name_input: name,
            description_input: formData.get('description'),
            type_input: formData.get('type'),
            labels_input: selectedTags.length > 0 ? selectedTags : ['Divers'],
            lat_input: lat,
            lng_input: lng,
            image_url_input: imageUrl,
            address_input: formData.get('address'),        // <-- On envoie l'adresse
            opening_hours_input: openingHours // <-- On envoie les horaires
        });

        setLoading(false);
        if (error) alert('Erreur: ' + error.message);
        else setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl shadow-2xl z-[1000] w-[90%] max-w-sm border-2 border-green-600 text-center">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Merci ! 🚜</h3>
                <p className="text-gray-600 mb-6 text-sm">En attente de validation.</p>
                <button onClick={onSuccess} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Retour à la carte</button>
            </div>
        );
    }

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-[1000] w-[95%] max-w-md border-2 border-green-600 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-green-800">Ajouter un lieu 📍</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                {/* IMAGE */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer relative hover:bg-gray-50">
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-sm text-gray-500">{imageFile ? `📷 ${imageFile.name}` : "📸 Ajouter une photo"}</span>
                </div>

                {/* NOM */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nom :</label>
                    <input required name="name" type="text" placeholder="Ex: Ferme des Tilleuls" className="w-full border border-gray-300 p-2 rounded text-sm" />
                </div>

                {/* TYPE */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Type :</label>
                    <select name="type" className="w-full border border-gray-300 p-2 rounded text-sm bg-white cursor-pointer">
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
                            <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`px-3 py-1 rounded-full text-xs font-bold border border-gray-300 cursor-pointer ${selectedTags.includes(tag.id) ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ADRESSE (Auto-remplie) */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                        {/* <MapPin size={12} /> */}
                        Adresse :
                    </label>
                    <div className="relative">
                        <input
                            name="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)} // On peut corriger manuellement
                            className={`w-full border border-gray-300 p-2 rounded text-sm ${isFetchingAddress ? 'bg-gray-100 text-gray-400' : ''}`}
                        />
                        {isFetchingAddress && <span className="absolute right-2 top-2 text-xs">🔍...</span>}
                    </div>
                </div>

                {/* HORAIRES (Nouveau) */}
                <OpeningHoursEditor onChange={setOpeningHours} />



                {/* DESCRIPTION */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                    <textarea name="description" placeholder="Détails supplémentaires..." className="w-full border border-gray-300 p-2 rounded text-sm h-16" />
                </div>

                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="flex-1 py-2 bg-gray-100 rounded text-gray-600 font-bold cursor-pointer">Annuler</button>
                    <button disabled={loading} type="submit" className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 cursor-pointer">{loading ? '...' : 'Valider'}</button>
                </div>
            </form>
        </div>
    );
}