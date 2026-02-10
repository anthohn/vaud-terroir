'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check,
    X,
    MapPin,
    Calendar,
    ShieldCheck,
    Loader2,
    LayoutDashboard,
    ExternalLink
} from 'lucide-react';

// On enrichit le type pour avoir toutes les infos utiles à la décision
type PendingProducer = {
    id: number;
    name: string;
    description: string;
    image_url: string | null;
    created_at: string;
    type: string;
    labels: string[] | null;
    lat: number;
    lng: number;
};

// Petit helper pour les emojis
const getTypeEmoji = (type: string) => {
    switch (type) {
        case 'vending_machine': return '🥛 Automate';
        case 'farm_shop': return '🚜 Ferme';
        case 'cellar': return '🍷 Cave';
        default: return '📍 Autre';
    }
};

export default function AdminPage() {
    const [pendings, setPendings] = useState<PendingProducer[]>([]);
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Login simple
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin1234') {
            setIsAuthenticated(true);
            fetchPendings();
        } else {
            alert('Accès refusé. Essaye encore !');
        }
    };

    const fetchPendings = async () => {
        setLoading(true);
        // On récupère TOUT pour bien juger (lat, lng, labels...)
        const { data, error } = await supabase
            .from('producers')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (data) setPendings(data as PendingProducer[]);
        setLoading(false);
    };

    // Validation via RPC
    const handleApprove = async (id: number) => {
        const { error } = await supabase.rpc('approve_producer', { producer_id: id });
        if (!error) fetchPendings();
    };

    // Rejet via RPC
    const handleReject = async (id: number) => {
        if (confirm('Supprimer définitivement cette proposition ?')) {
            const { error } = await supabase.rpc('reject_producer', { producer_id: id });
            if (!error) fetchPendings();
        }
    };

    // --- 1. UI DE LOGIN (Propre et centrée) ---
    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full">
                            <ShieldCheck size={40} className="text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Admin VaudTerroir</h1>
                    <p className="text-center text-gray-500 mb-8">Veuillez vous identifier pour modérer.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Mot de passe administrateur"
                            className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-transform active:scale-95">
                            Déverrouiller
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- 2. DASHBOARD PRINCIPAL ---
    return (
        <main className="min-h-screen bg-gray-50">

            {/* Header Admin */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-black text-white p-2 rounded-lg">
                        <LayoutDashboard size={20} />
                    </div>
                    <h1 className="font-bold text-xl text-gray-800">Control Room</h1>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {pendings.length} en attente
                    </span>
                </div>
                <button onClick={fetchPendings} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Rafraîchir'}
                </button>
            </header>

            <div className="p-6 max-w-7xl mx-auto">

                {/* État vide (Si tout est propre) */}
                {pendings.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                            <Check size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-600">Tout est à jour !</h2>
                        <p>Aucune nouvelle proposition à valider pour le moment.</p>
                    </div>
                )}

                {/* Grille des cartes */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {pendings.map(p => (
                        <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">

                            {/* Image Header */}
                            <div className="h-48 bg-gray-100 relative group">
                                {p.image_url ? (
                                    <img src={p.image_url} alt="Preuve" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                                        Pas d'image
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {getTypeEmoji(p.type)}
                                </div>
                            </div>

                            {/* Contenu */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{p.name}</h3>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-500 hover:text-blue-700"
                                        title="Vérifier sur Google Maps"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {p.labels?.map(label => (
                                        <span key={label} className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4 flex-1">
                                    {p.description || <em className="text-gray-400">Pas de description...</em>}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                    <Calendar size={12} />
                                    Proposé le {new Date(p.created_at).toLocaleDateString()} à {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                {/* Actions Bar */}
                                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleReject(p.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors"
                                    >
                                        <X size={18} />
                                        Refuser
                                    </button>
                                    <button
                                        onClick={() => handleApprove(p.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 font-bold shadow-sm transition-all active:scale-95"
                                    >
                                        <Check size={18} />
                                        Valider
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}