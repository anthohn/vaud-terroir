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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // Appel de notre fonction RPC Supabase
        const { error } = await supabase.rpc('create_producer', {
            name_input: formData.get('name'),
            description_input: formData.get('description'),
            type_input: formData.get('type'),
            labels_input: ['VaudTerroir'], // On met un tag par défaut pour l'instant
            lat_input: lat,
            lng_input: lng
        });

        setLoading(false);

        if (error) {
            alert('Erreur: ' + error.message);
        } else {
            onSuccess(); // Ferme le formulaire et rafraîchit la carte
        }
    };

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl z-[1000] w-[90%] max-w-sm border-2 border-green-600">
            <h3 className="font-bold text-lg mb-4 text-green-800">Ajouter un lieu ici ? 📍</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

                <div className="text-xs text-gray-400 mb-2">
                    Coordonnées : {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="flex-1 py-2 text-gray-600 font-bold bg-gray-100 rounded">Annuler</button>
                    <button disabled={loading} type="submit" className="flex-1 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                        {loading ? 'Envoi...' : 'Valider'}
                    </button>
                </div>
            </form>
        </div>
    );
}