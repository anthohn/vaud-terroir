'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, X, ShieldCheck, Loader2, LayoutDashboard,
    ArrowRight, AlertTriangle, PlusCircle, LogOut, Image as ImageIcon
} from 'lucide-react';
import { Producer } from '@/types';
import { getSaleTypeInfo } from '@/lib/constants';

interface PendingProducer extends Producer {
    original?: Producer;
}

const getTypeEmoji = (type: string) => {
    const info = getSaleTypeInfo(type);
    return `${info.emoji} ${info.label}`;
};

// --- COMPOSANT DIFF IMAGES (VERSION FINALE) ---
const ImagesDiff = ({ oldImages, newImages }: { oldImages?: string[], newImages?: string[] }) => {
    const oldList = oldImages || [];
    const newList = newImages || [];

    const added = newList.filter(url => !oldList.includes(url));
    const removed = oldList.filter(url => !newList.includes(url));

    return (
        <div className="bg-gray-50 border-b border-gray-200">
            <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-white">
                <span className="text-[10px] uppercase font-bold text-gray-500">Aperçu galerie finale</span>
                <span className="text-[10px] font-bold text-gray-400">{newList.length} photo(s)</span>
            </div>

            <div className="p-3 flex gap-3 overflow-x-auto no-scrollbar">
                {newList.map((url, i) => {
                    const isNew = added.includes(url);
                    return (
                        <div key={`new-${i}`} className="relative w-20 h-20 shrink-0 group">
                            <img 
                                src={url} 
                                className={`w-full h-full object-cover rounded-lg shadow-sm border-2 ${isNew ? 'border-green-500' : 'border-white'}`} 
                            />
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                {i + 1}
                            </div>
                            {isNew && (
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                    <PlusCircle size={10} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {removed.map((url, i) => (
                    <div key={`rem-${i}`} className="relative w-20 h-20 shrink-0 opacity-40 grayscale group">
                        <img src={url} className="w-full h-full object-cover rounded-lg border-2 border-red-400" />
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
                            <X size={24} className="text-red-600 drop-shadow-md" />
                        </div>
                    </div>
                ))}

                {newList.length === 0 && removed.length === 0 && (
                    <div className="w-full h-20 flex items-center justify-center text-gray-400 text-xs italic bg-white rounded-lg border-2 border-dashed border-gray-100">
                        Aucune image
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPOSANT DIFF HORAIRES ---
const HoursDiff = ({ oldHours, newHours }: { oldHours: any, newHours: any }) => {
    if (!oldHours && !newHours) return <span className="text-gray-400 italic">Non renseignés</span>;
    if (!oldHours && newHours) return <div className="text-green-600 text-xs font-bold"><PlusCircle size={10} className="inline mr-1" /> Horaires ajoutés</div>;
    const hasChanged = JSON.stringify(oldHours) !== JSON.stringify(newHours);
    if (!hasChanged) return <span className="text-gray-500 text-xs">Identiques</span>;
    return <div className="text-xs bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800 font-bold italic">⚠️ Horaires modifiés</div>;
};

// --- COMPOSANT DIFF FIELD ---
const DiffField = ({ label, oldVal, newVal, type = 'text' }: { label: string, oldVal?: any, newVal: any, type?: 'text' | 'tags' | 'hours' }) => {
    const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
    if (!hasChanged && !newVal) return null;
    if (!hasChanged) {
        if (type === 'hours') return null;
        return (
            <div className="mb-2 text-sm opacity-60">
                <span className="font-bold text-gray-700 block text-[10px] uppercase">{label}</span>
                <span className="text-gray-600 truncate block">{type === 'tags' ? newVal.join(', ') : newVal}</span>
            </div>
        );
    }

    return (
        <div className="mb-3 text-sm bg-yellow-50 p-2 rounded border border-yellow-200 w-full">
            <span className="font-bold text-yellow-800 text-[10px] uppercase mb-1 flex items-center gap-1">
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
                        {oldVal && <span className="text-red-400 line-through text-[10px] block truncate">{oldVal}</span>}
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
        if (error) { setAuthError(error.message); setLoading(false); }
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
            // On récupère les 'pending' (utilisateurs) ET les 'scraped' (script)
            .in('status', ['pending', 'scraped'])
            .order('created_at', { ascending: false });

        if (error || !pendingData) { setLoading(false); return; }
        
        const originalIds = pendingData.map(p => p.original_id).filter((id): id is number => id !== null);
        let originalsMap: Record<number, Producer> = {};
        
        if (originalIds.length > 0) {
            const { data: originalsData } = await supabase.from('producers').select('*').in('id', originalIds);
            if (originalsData) originalsData.forEach(org => originalsMap[org.id] = org as Producer);
        }
        
        setPendings(pendingData.map(p => ({ ...p, original: p.original_id ? originalsMap[p.original_id] : undefined })) as PendingProducer[]);
        setLoading(false);
    };

    const handleApprove = async (producer: PendingProducer) => {
        if (!confirm('Valider cette modification ?')) return;
        setLoading(true);
        try {
            const updateData: any = {
                name: producer.name,
                description: producer.description,
                type: producer.type,
                labels: producer.labels,
                website: producer.website,
                phone: producer.phone,
                opening_hours: producer.opening_hours,
                address: producer.address,
                lat: producer.lat,
                lng: producer.lng,

                status: 'approved'
            };

            // Gestion des images
            if (producer.images && producer.images.length > 0) {
                updateData.images = producer.images;
            }

            if (producer.original_id) {
                // Modification d'un existant
                const { error: updateError } = await supabase.from('producers').update(updateData).eq('id', producer.original_id);
                if (updateError) throw updateError;
                // Supprimer la demande pending
                await supabase.from('producers').delete().eq('id', producer.id);
            } else {
                // Création (ou Scraping validé)
                await supabase.from('producers').update(updateData).eq('id', producer.id);
            }
            
            await fetchPendings();
        } catch (error: any) { alert("Erreur : " + error.message); }
        finally { setLoading(false); }
    };

    const handleReject = async (id: number) => {
        if (confirm('Refuser et supprimer cette demande ?')) {
            const { error } = await supabase.from('producers').delete().eq('id', id);
            if (error) alert("Erreur : " + error.message); else fetchPendings();
        }
    };

    if (!session) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
                <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin VaudTerroir</h1>
                    {authError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded border border-red-100">{authError}</p>}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all" />
                        <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors cursor-pointer">Connexion</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="text-green-700" />
                    <h1 className="font-bold text-xl text-gray-800">Gestion Terroir</h1>
                    <span className="bg-green-100 text-green-800 px-2 rounded-full text-xs font-bold">{pendings.length} en attente</span>
                </div>
                <div className="flex gap-6 items-center">
                    <button onClick={fetchPendings} className="text-sm font-medium hover:text-green-600 transition-colors cursor-pointer">Rafraîchir</button>
                    <button onClick={handleLogout} className="text-sm text-red-600 font-bold flex items-center gap-1 hover:text-red-700 transition-colors cursor-pointer">
                        <LogOut size={16} /> Sortir
                    </button>
                </div>
            </header>

            <div className="p-6 max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pendings.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 flex flex-col items-center gap-4">
                        <ShieldCheck size={48} className="text-green-200" />
                        <p className="text-gray-400 font-medium">Aucune demande en attente. Beau travail ! 🚜</p>
                    </div>
                )}

                {pendings.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">ID_PROD #{p.id}</span>
                            <div className="flex gap-1">
                                {p.status === 'scraped' && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-purple-200">Scraping</span>
                                )}
                                {p.original ? (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-200">MAJ</span>
                                ) : p.status === 'pending' ? (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-200">NEW</span>
                                ) : null}
                            </div>
                        </div>

                        <ImagesDiff oldImages={p.original?.images} newImages={p.images} />

                        <div className="p-4 flex-1 flex flex-col gap-1">
                            <DiffField label="Nom" oldVal={p.original?.name} newVal={p.name} />
                            <DiffField label="Type" oldVal={p.original ? getTypeEmoji(p.original.type) : null} newVal={getTypeEmoji(p.type)} />
                            <DiffField label="Adresse" oldVal={p.original?.address} newVal={p.address} />
                            
                            {/* ✅ AJOUTS VISUELS DANS LE DASHBOARD */}
                            <DiffField label="Téléphone" oldVal={p.original?.phone} newVal={p.phone} />
                            <DiffField label="Site Web" oldVal={p.original?.website} newVal={p.website} />
                            
                            <DiffField label="Horaires" oldVal={p.original?.opening_hours} newVal={p.opening_hours} type="hours" />
                            <DiffField label="Produits" oldVal={p.original?.labels} newVal={p.labels} type="tags" />
                            <DiffField label="Description" oldVal={p.original?.description} newVal={p.description} />

                            <div className="mt-auto pt-4 flex gap-2">
                                <button onClick={() => handleReject(p.id)} className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex justify-center items-center gap-1 transition-colors cursor-pointer">
                                    <X size={14} /> Rejeter
                                </button>
                                <button onClick={() => handleApprove(p)} className="flex-[2] py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold text-xs flex justify-center items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer">
                                    <Check size={14} /> {p.original ? 'Appliquer' : 'Approuver'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <Loader2 className="animate-spin text-green-600" size={40} />
                </div>
            )}
        </main>
    );
}