'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react'; // Assure-toi d'avoir lucide-react, sinon utilise un emoji ✅

type Props = {
    lat: number;
    lng: number;
    onSuccess: () => void; // Ça servira à fermer la fenêtre à la fin
    onCancel: () => void;
};

export default function AddProducerForm({ lat, lng, onSuccess, onCancel }: Props) {

    // --- Gestion des Tags (Produits) ---
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
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // --- États du formulaire ---
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // <--- NOUVEL ÉTAT !
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        let imageUrl = null;

        // 1. Upload de l'image
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${name.replace(/\s/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('producers-images')
                .upload(fileName, imageFile);

            if (uploadError) {
                alert('Erreur upload image: ' + uploadError.message);
                setLoading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('producers-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        // 2. Enregistrement en base de données (Status sera 'pending' automatiquement via la fonction SQL)
        const { error } = await supabase.rpc('create_producer', {
            name_input: name,
            description_input: formData.get('description'),
            type_input: formData.get('type'),
            labels_input: selectedTags.length > 0 ? selectedTags : ['Divers'],
            lat_input: lat,
            lng_input: lng,
            image_url_input: imageUrl
        });

        setLoading(false);

        if (error) {
            alert('Erreur base de données: ' + error.message);
        } else {
            // AU LIEU DE FERMER DIRECTEMENT, ON AFFICHE LE SUCCÈS
            setIsSubmitted(true);
        }
    };

    // --- ÉCRAN DE SUCCÈS (Si soumis) ---
    if (isSubmitted) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl shadow-2xl z-[1000] w-[90%] max-w-sm border-2 border-green-600 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-4 rounded-full">
                        {/* Si tu n'as pas lucide-react, remplace <CheckCircle /> par <span className="text-4xl">✅</span> */}
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                </div>

                <h3 className="font-bold text-xl mb-2 text-gray-800">Merci beaucoup ! 🚜</h3>

                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Votre proposition a bien été envoyée.
                    <br /><br />
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase">
                        En attente de validation
                    </span>
                    <br /><br />
                    Un administrateur va vérifier les infos avant de l'afficher sur la carte pour tout le monde.
                </p>

                <button
                    onClick={onSuccess} // C'est ici qu'on ferme vraiment la fenêtre
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                    Compris, retour à la carte
                </button>
            </div>
        );
    }

    // --- FORMULAIRE STANDARD (Si pas encore soumis) ---
    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-[1000] w-[90%] max-w-sm border-2 border-green-600 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-green-800">Ajouter un lieu ici ? 📍</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* ... (Tout le reste de ton formulaire reste identique ici) ... */}

                {/* Champ IMAGE */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-sm text-gray-500">
                        {imageFile ? (
                            <span className="text-green-600 font-bold">📷 {imageFile.name}</span>
                        ) : (
                            <span>📸 Ajouter une photo (optionnel)</span>
                        )}
                    </div>
                </div>

                {/* Champ NOM */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nom</label>
                    <input required name="name" type="text" placeholder="Ex: Ferme des Tilleuls" className="w-full border p-2 rounded text-sm" />
                </div>

                {/* Champ TAGS */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Produits disponibles</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${selectedTags.includes(tag.id)
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-600 border-gray-300'
                                    }`}
                            >
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Champ TYPE */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Type de lieu</label>
                    <select name="type" className="w-full border p-2 rounded text-sm bg-white">
                        <option value="farm_shop">🚜 Magasin à la ferme</option>
                        <option value="vending_machine">🥛 Automate</option>
                        <option value="cellar">🍷 Cave / Vigneron</option>
                    </select>
                </div>

                {/* Champ DESCRIPTION */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea name="description" placeholder="Horaires, produits..." className="w-full border p-2 rounded text-sm h-20" />
                </div>

                {/* BOUTONS */}
                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 rounded">Annuler</button>
                    <button disabled={loading} type="submit" className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                        {loading ? 'Envoi...' : 'Valider'}
                    </button>
                </div>
            </form>
        </div>
    );
}