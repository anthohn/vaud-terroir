'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, X, ShieldCheck, Loader2, LayoutDashboard,
    ArrowRight, AlertTriangle, PlusCircle, LogOut, Image as ImageIcon
} from 'lucide-react';
import { Producer } from '@/types';

// Assure-toi que ton type Producer dans @/types inclut bien 'images: string[]'
interface PendingProducer extends Producer {
    original?: Producer;
}

const getTypeEmoji = (type: string) => {
    switch (type) {
        case 'vending_machine': return '🥛 Automate';
        case 'farm_shop': return '🚜 Ferme';
        case 'cellar': return '🍷 Cave';
        default: return '📍 Autre';
    }
};

const DAYS_ORDER = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
const DAY_LABELS: Record<string, string> = { mo: 'Lun', tu: 'Mar', we: 'Mer', th: 'Jeu', fr: 'Ven', sa: 'Sam', su: 'Dim' };

// --- COMPOSANT DIFF IMAGES (NOUVEAU) ---
const ImagesDiff = ({ oldImages, newImages }: { oldImages?: string[], newImages?: string[] }) => {
    const oldList = oldImages || [];
    const newList = newImages || [];

    // Détection des changements
    const added = newList.filter(url => !oldList.includes(url));
    const removed = oldList.filter(url => !newList.includes(url));
    const kept = oldList.filter(url => newList.includes(url));

    if (added.length === 0 && removed.length === 0) {
        // Pas de changement, on montre juste la 1ère image pour info
        if (kept.length > 0) return (
            <div className="h-32 bg-gray-100 relative group flex border-b border-gray-100 overflow-hidden">
                <img src={kept[0]} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-white font-bold text-xs drop-shadow-md">
                    {kept.length} photo(s) (Inchangé)
                </div>
            </div>
        );
        return <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Pas d'image</div>;
    }

    return (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Modification des photos</span>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">

                {/* Images Supprimées */}
                {removed.map((url, i) => (
                    <div key={`rem-${i}`} className="relative w-16 h-16 shrink-0 border-2 border-red-400 rounded overflow-hidden opacity-60">
                        <img src={url} className="w-full h-full object-cover grayscale" />
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                            <X size={20} className="text-red-600 drop-shadow-md" />
                        </div>
                    </div>
                ))}

                {/* Images Ajoutées */}
                {added.map((url, i) => (
                    <div key={`add-${i}`} className="relative w-16 h-16 shrink-0 border-2 border-green-500 rounded overflow-hidden">
                        <img src={url} className="w-full h-full object-cover" />
                        <div className="absolute top-0 right-0 bg-green-500 text-white p-0.5 rounded-bl">
                            <PlusCircle size={10} />
                        </div>
                    </div>
                ))}

                {/* Images Conservées (Juste un petit indicateur) */}
                {kept.length > 0 && (
                    <div className="w-16 h-16 shrink-0 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-500 text-[10px] border border-gray-300">
                        <ImageIcon size={16} />
                        <span>+{kept.length} autre(s)</span>
                    </div>
                )}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 italic">
                {removed.length > 0 && <span className="text-red-500 mr-2">-{removed.length} supprimée(s)</span>}
                {added.length > 0 && <span className="text-green-600">+{added.length} ajoutée(s)</span>}
            </div>
        </div>
    );
};

// --- COMPOSANT DIFF HORAIRES ---
const HoursDiff = ({ oldHours, newHours }: { oldHours: any, newHours: any }) => {
    if (!oldHours && !newHours) return <span className="text-gray-400 italic">Non renseignés</span>;
    if (!oldHours && newHours) return <div className="text-green-600 text-xs font-bold"><PlusCircle size={10} className="inline mr-1" /> Horaires ajoutés</div>;

    // Simplification pour l'affichage compact
    const hasChanged = JSON.stringify(oldHours) !== JSON.stringify(newHours);
    if (!hasChanged) return <span className="text-gray-500 text-xs">Identiques</span>;

    return (
        <div className="text-xs bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800">
            ⚠️ Horaires modifiés
        </div>
    );
};

// --- COMPOSANT DIFF FIELD ---
const DiffField = ({ label, oldVal, newVal, type = 'text' }: { label: string, oldVal?: any, newVal: any, type?: 'text' | 'tags' | 'hours' }) => {
    const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    // Si pas de changement et pas de valeur, on n'affiche rien
    if (!hasChanged && !newVal) return null;

    // Si pas de changement, affichage discret
    if (!hasChanged) {
        if (type === 'hours') return null; // Géré à part
        return (
            <div className="mb-2 text-sm opacity-60">
                <span className="font-bold text-gray-700 block text-[10px] uppercase">{label}</span>
                <span className="text-gray-600 truncate block">{type === 'tags' ? newVal.join(', ') : newVal}</span>
            </div>
        );
    }

    // Si Changement détecté
    return (
        <div className="mb-3 text-sm bg-yellow-50 p-2 rounded border border-yellow-200 w-full relative">
            <span className="font-bold text-yellow-800 block text-[10px] uppercase mb-1 flex items-center gap-1">
                <AlertTriangle size={10} /> {label}
            </span>

            {type === 'hours' ? <HoursDiff oldHours={oldVal} newHours={newVal} /> :
                type === 'tags' ? (
                    <div className="flex flex-wrap gap-1">
                        {((oldVal as string[]) || []).filter(x => !(newVal as string[] || []).includes(x)).map(t => (
                            <span key={t} className="text-red-500 line-through text-[10px] bg-red-50 px-1 rounded border border-red-100">{t}</span>
                        ))}
                        {((newVal as string[]) || []).filter(x => !(oldVal as string[] || []).includes(x)).map(t => (
                            <span key={t} className="text-green-700 font-bold text-[10px] bg-green-100 px-1 rounded border border-green-200">+{t}</span>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {oldVal && <span className="text-red-400 line-through text-[10px] block truncate mb-0.5">{oldVal}</span>}
                        <span className="text-green-700 font-bold block truncate">{newVal}</span>
                    </div>
                )}
        </div>
    );
};

export default function AdminPage() {
    const [pendings, setPendings] = useState<PendingProducer[]>([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchPendings();
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchPendings();
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setAuthError(error.message);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setPendings([]);
    };

    const fetchPendings = async () => {
        setLoading(true);
        // On récupère tout
        const { data: pendingData, error } = await supabase
            .from('producers')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error || !pendingData) { setLoading(false); return; }

        const originalIds = pendingData.map(p => p.original_id).filter((id): id is number => id !== null && id !== undefined);

        let originalsMap: Record<number, Producer> = {};
        if (originalIds.length > 0) {
            const { data: originalsData } = await supabase.from('producers').select('*').in('id', originalIds);
            if (originalsData) originalsData.forEach(org => originalsMap[org.id] = org as Producer);
        }

        const finalData = pendingData.map(p => ({
            ...p,
            original: p.original_id ? originalsMap[p.original_id] : undefined
        })) as PendingProducer[];

        setPendings(finalData);
        setLoading(false);
    };

    const handleApprove = async (producer: PendingProducer) => {
        setLoading(true);
        let error;

        if (producer.original_id) {
            // FUSION : On utilise la RPC pour être sûr (ou un update manuel ici si la RPC déconne)
            // IMPORTANT : Vérifie que ta fonction RPC 'approve_edit' met bien à jour la colonne 'images' !
            // Sinon, voici l'alternative JS directe (plus sûre si ta RPC est ancienne) :

            const { error: updateError } = await supabase
                .from('producers')
                .update({
                    name: producer.name,
                    description: producer.description,
                    type: producer.type,
                    labels: producer.labels,
                    images: producer.images, // <--- ON FORCE LE TABLEAU COMPLET
                    opening_hours: producer.opening_hours,
                    address: producer.address,
                    // location ne change généralement pas mais on peut l'ajouter
                })
                .eq('id', producer.original_id);

            if (!updateError) {
                // Si l'update de l'original a marché, on supprime le pending
                const { error: delError } = await supabase.from('producers').delete().eq('id', producer.id);
                error = delError;
            } else {
                error = updateError;
            }

        } else {
            // NOUVEAU : Juste changer le statut
            const res = await supabase.from('producers').update({ status: 'approved' }).eq('id', producer.id);
            error = res.error;
        }

        if (error) alert("Erreur : " + error.message);
        else await fetchPendings();
        setLoading(false);
    };

    const handleReject = async (id: number) => {
        if (confirm('Refuser et supprimer cette demande ?')) {
            const { error } = await supabase.from('producers').delete().eq('id', id);
            if (error) alert("Erreur : " + error.message);
            else fetchPendings();
        }
    };

    if (!session) {
        // ... (Ton code de login existant reste identique ici, je l'abrége pour la réponse)
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
                {/* ... Formulaire Login ... */}
                <div className="bg-white p-8 rounded-2xl w-full max-w-md">
                    <h1 className="text-xl font-bold text-center mb-4">Admin VaudTerroir</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border p-2 rounded" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border p-2 rounded" />
                        <button className="w-full bg-green-600 text-white py-2 rounded">Connexion</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="text-green-700" /> <h1 className="font-bold text-xl text-gray-800">Admin</h1>
                    <span className="bg-green-100 text-green-800 px-2 rounded-full text-xs font-bold">{pendings.length}</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={fetchPendings} className="text-sm font-medium hover:underline">Rafraîchir</button>
                    <button onClick={handleLogout} className="text-sm text-red-600 font-bold flex items-center gap-1"><LogOut size={14} /> Sortir</button>
                </div>
            </header>

            <div className="p-6 max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pendings.length === 0 && !loading && <div className="col-span-full text-center py-20 text-gray-400">Tout est à jour chef ! 🚜</div>}

                {pendings.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">

                        {/* HEADER CARTE */}
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <span className="text-xs text-gray-400 font-mono">#{p.id}</span>
                            {p.original ?
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-200">Modification</span> :
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-200">Nouveau</span>
                            }
                        </div>

                        {/* COMPOSANT DIFF IMAGES */}
                        <ImagesDiff oldImages={p.original?.images} newImages={p.images} />

                        {/* CORPS DE LA CARTE */}
                        <div className="p-4 flex-1 flex flex-col gap-1">
                            <DiffField label="Nom" oldVal={p.original?.name} newVal={p.name} />
                            <DiffField label="Type" oldVal={p.original ? getTypeEmoji(p.original.type) : null} newVal={getTypeEmoji(p.type)} />
                            <DiffField label="Adresse" oldVal={p.original?.address} newVal={p.address} />
                            <DiffField label="Horaires" oldVal={p.original?.opening_hours} newVal={p.opening_hours} type="hours" />
                            <DiffField label="Produits" oldVal={p.original?.labels} newVal={p.labels} type="tags" />
                            <DiffField label="Description" oldVal={p.original?.description} newVal={p.description} />

                            <div className="mt-auto pt-4 flex gap-2">
                                <button onClick={() => handleReject(p.id)} className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex justify-center items-center gap-1">
                                    <X size={14} /> Rejeter
                                </button>
                                <button onClick={() => handleApprove(p)} className="flex-2 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold text-xs flex justify-center items-center gap-1 shadow-sm">
                                    <Check size={14} /> {p.original ? 'Appliquer modifs' : 'Valider création'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}