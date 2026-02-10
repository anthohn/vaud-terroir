'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, X, ShieldCheck, Loader2, LayoutDashboard, ExternalLink, ArrowRight, AlertTriangle, PlusCircle, LogOut
} from 'lucide-react';
import { Producer } from '@/types';

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

// --- COMPOSANT DIFF HORAIRES ---
const HoursDiff = ({ oldHours, newHours }: { oldHours: any, newHours: any }) => {
    if (!oldHours && !newHours) return <span className="text-gray-400 italic">Non renseignés</span>;
    if (!oldHours && newHours) {
        return (
            <div className="text-xs">
                <div className="text-green-600 font-bold flex items-center gap-1 mb-1"><PlusCircle size={10} /> Ajout complet</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-green-50 p-2 rounded border border-green-100">
                    {DAYS_ORDER.map(d => {
                        const h = newHours[d];
                        if (!h?.isOpen) return null;
                        return (
                            <div key={d} className="flex justify-between text-green-800">
                                <span className="font-bold w-6">{DAY_LABELS[d]}</span>
                                <span>{h.start}-{h.end}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    const changes = [];
    for (const d of DAYS_ORDER) {
        const oldH = oldHours ? oldHours[d] : null;
        const newH = newHours ? newHours[d] : null;
        const oldStr = oldH?.isOpen ? `${oldH.start} - ${oldH.end}` : 'Fermé';
        const newStr = newH?.isOpen ? `${newH.start} - ${newH.end}` : 'Fermé';
        if (oldStr !== newStr) changes.push({ day: DAY_LABELS[d], old: oldStr, new: newStr });
    }
    if (changes.length === 0) return <span className="text-gray-600">Identique</span>;
    return (
        <div className="flex flex-col gap-1 w-full">
            {changes.map((change, idx) => (
                <div key={idx} className="flex items-center text-xs bg-white p-1 rounded border border-gray-100 shadow-sm">
                    <span className="font-bold w-8 text-gray-700 uppercase">{change.day}</span>
                    <span className="text-red-400 line-through mr-2 text-[10px]">{change.old}</span>
                    <ArrowRight size={10} className="text-gray-400 mr-2" />
                    <span className="text-green-700 font-bold">{change.new}</span>
                </div>
            ))}
        </div>
    );
};

// --- COMPOSANT DIFF FIELD ---
const DiffField = ({ label, oldVal, newVal, type = 'text' }: { label: string, oldVal?: any, newVal: any, type?: 'text' | 'tags' | 'hours' }) => {
    const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
    if ((oldVal === undefined || !hasChanged) && type !== 'hours') {
        if (!newVal) return null;
        return (
            <div className="mb-2 text-sm opacity-60">
                <span className="font-bold text-gray-700 block text-[10px] uppercase">{label}</span>
                <span className="text-gray-600">{type === 'tags' ? newVal.join(', ') : newVal}</span>
            </div>
        );
    }
    return (
        <div className="mb-3 text-sm bg-yellow-50 p-2 rounded border border-yellow-200 w-full">
            <span className="font-bold text-yellow-800 block text-[10px] uppercase mb-2 flex items-center gap-1">
                <AlertTriangle size={10} /> {label} {oldVal ? 'Modifié' : 'Défini'}
            </span>
            {type === 'hours' ? <HoursDiff oldHours={oldVal} newHours={newVal} /> :
                type === 'tags' ? (
                    <div className="flex flex-wrap gap-2">
                        {((oldVal as string[]) || []).filter(x => !(newVal as string[] || []).includes(x)).map(t => (
                            <span key={t} className="text-red-500 line-through text-xs bg-red-50 px-1 rounded border border-red-100">{t}</span>
                        ))}
                        {((newVal as string[]) || []).filter(x => !(oldVal as string[] || []).includes(x)).map(t => (
                            <span key={t} className="text-green-700 font-bold text-xs bg-green-100 px-1 rounded border border-green-200">+ {t}</span>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {oldVal ? <div className="text-red-400 line-through text-xs opacity-70">{oldVal}</div> : <div className="text-green-600 text-[10px] font-bold flex items-center gap-1"><PlusCircle size={10} /> Nouvel ajout</div>}
                        <div className="text-green-700 font-bold flex items-center gap-1"><ArrowRight size={12} /> {newVal}</div>
                    </div>
                )}
        </div>
    );
};

export default function AdminPage() {
    const [pendings, setPendings] = useState<PendingProducer[]>([]);
    const [email, setEmail] = useState('');     // NOUVEAU
    const [password, setPassword] = useState('');
    const [session, setSession] = useState<any>(null); // NOUVEAU : Session Supabase
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // Vérifier si déjà connecté au chargement
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchPendings();
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchPendings();
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setLoading(true);

        // AUTHENTIFICATION SÉCURISÉE SUPABASE
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setAuthError(error.message);
            setLoading(false);
        }
        // Si succès, le onAuthStateChange ci-dessus va prendre le relais
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setPendings([]);
    };

    const fetchPendings = async () => {
        setLoading(true);
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
        const finalData = pendingData.map(p => ({ ...p, original: p.original_id ? originalsMap[p.original_id] : undefined })) as PendingProducer[];
        setPendings(finalData);
        setLoading(false);
    };

    const handleApprove = async (producer: PendingProducer) => {
        setLoading(true);
        let error;
        if (producer.original_id) {
            const res = await supabase.rpc('approve_edit', { edit_id: producer.id });
            error = res.error;
        } else {
            const res = await supabase.from('producers').update({ status: 'approved' }).eq('id', producer.id);
            error = res.error;
        }
        if (error) alert("Erreur : " + error.message);
        else await fetchPendings();
        setLoading(false);
    };

    const handleReject = async (id: number) => {
        if (confirm('Refuser cette demande ?')) {
            const { error } = await supabase.from('producers').delete().eq('id', id);
            if (error) alert("Erreur : " + error.message);
            else fetchPendings();
        }
    };

    // UI DE LOGIN
    if (!session) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full"><ShieldCheck size={40} className="text-green-600" /></div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Admin VaudTerroir</h1>
                    <p className="text-center text-gray-500 mb-6 text-sm">Accès sécurisé réservé aux administrateurs</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email administrateur"
                                className="w-full border p-3 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Mot de passe"
                                className="w-full border p-3 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        {authError && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{authError}</div>}

                        <button disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // DASHBOARD
    return (
        <main className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <LayoutDashboard /> <h1 className="font-bold text-xl">Control Room</h1>
                    <span className="bg-green-100 text-green-800 px-2 rounded-full text-xs font-bold">{pendings.length}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchPendings} className="text-sm text-gray-500 hover:text-black">{loading ? '...' : 'Rafraîchir'}</button>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 font-bold">
                        <LogOut size={16} /> Déconnexion
                    </button>
                </div>
            </header>

            <div className="p-6 max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pendings.length === 0 && !loading && <div className="col-span-full text-center py-20 text-gray-400">Rien à valider.</div>}

                {pendings.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                        <div className="absolute top-3 right-3 z-10">
                            {p.original ? (
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">✏️ Modif</span>
                            ) : (
                                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">✨ Nouveau</span>
                            )}
                        </div>
                        <div className="h-32 bg-gray-100 relative group flex border-b border-gray-100">
                            {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Pas d'image</div>}
                            {p.original && p.original.image_url !== p.image_url && <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 text-white text-center text-[10px] uppercase font-bold py-1">Nouvelle photo !</div>}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <DiffField label="Nom" oldVal={p.original?.name} newVal={p.name} />
                            <DiffField label="Type" oldVal={p.original ? getTypeEmoji(p.original.type) : null} newVal={getTypeEmoji(p.type)} />
                            <DiffField label="Adresse" oldVal={p.original?.address} newVal={p.address} />
                            <DiffField label="Horaires" oldVal={p.original?.opening_hours} newVal={p.opening_hours} type="hours" />
                            <DiffField label="Produits" oldVal={p.original?.labels} newVal={p.labels} type="tags" />
                            <DiffField label="Description" oldVal={p.original?.description} newVal={p.description} />
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-gray-50">
                                <button onClick={() => handleReject(p.id)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 font-bold text-sm"><X size={16} /> Refuser</button>
                                <button onClick={() => handleApprove(p)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white bg-green-600 hover:bg-green-700 font-bold text-sm"><Check size={16} /> {p.original ? 'Fusionner' : 'Valider'}</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}