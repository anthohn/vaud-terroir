'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Props = {
    lat: number;
    lng: number;
    onSuccess: () => void;
    onCancel: () => void;
};

export default function AddProducerForm({ lat, lng, onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        let imageUrl = null;

        // 1. Upload de l'image (si présente)
        if (imageFile) {
            // On crée un nom de fichier unique pour éviter les conflits
            // ex: "mon-fromage-167891234.jpg"
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${name.replace(/\s/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('producers-images') // Ton bucket créé à l'étape 2
                .upload(filePath, imageFile);

            if (uploadError) {
                alert('Erreur upload image: ' + uploadError.message);
                setLoading(false);
                return;
            }

            // 2. On récupère l'URL publique pour l'afficher plus tard
            const { data: { publicUrl } } = supabase.storage
                .from('producers-images')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        }

        // 3. Enregistrement en base de données
        const { error } = await supabase.rpc('create_producer', {
            name_input: name,
            description_input: formData.get('description'),
            type_input: formData.get('type'),
            labels_input: ['VaudTerroir'],
            lat_input: lat,
            lng_input: lng,
            image_url_input: imageUrl // On passe l'URL (ou null)
        });

        setLoading(false);

        if (error) {
            alert('Erreur base de données: ' + error.message);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-[1000] w-[90%] max-w-sm border-2 border-green-600 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-green-800">Ajouter un lieu ici ? 📍</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Champ IMAGE (Nouveau) */}
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

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nom</label>
                    <input required name="name" type="text" placeholder="Ex: Ferme des Tilleuls" className="w-full border p-2 rounded text-sm" />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                    <select name="type" className="w-full border p-2 rounded text-sm bg-white">
                        <option value="farm_shop">🚜 Magasin à la ferme</option>
                        <option value="vending_machine">🥛 Automate</option>
                        <option value="cellar">🍷 Cave / Vigneron</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea name="description" placeholder="Horaires, produits..." className="w-full border p-2 rounded text-sm h-20" />
                </div>

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