// app/producer/[id]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Phone, Globe } from 'lucide-react';
import { Metadata } from 'next';

// Définition du type pour Next.js 15 (params est une Promise maintenant)
type Props = {
    params: Promise<{ id: string }>;
};

// Fonction pour le SEO (Titres Google)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // 1. On "await" les params
    const { id } = await params;

    const { data: producer } = await supabase
        .from('view_producers')
        .select('name, description')
        .eq('id', id)
        .single();

    return {
        title: producer ? `${producer.name} | VaudTerroir` : 'Producteur introuvable',
        description: producer?.description || 'Découvrez ce producteur local vaudois.',
    };
}

// Le composant de la page principale
export default async function ProducerPage({ params }: Props) {
    // 2. On "await" les params ici aussi
    const { id } = await params;

    // 3. On va chercher les infos dans Supabase
    const { data: producer, error } = await supabase
        .from('view_producers')
        .select('*')
        .eq('id', id)
        .single();

    // Si erreur ou pas de producteur -> Page 404
    if (error || !producer) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-10">

            {/* HEADER AVEC IMAGE */}
            <div className="relative h-64 md:h-80 w-full bg-gray-200">
                {producer.image_url ? (
                    <img
                        src={producer.image_url}
                        alt={producer.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-700 text-white text-4xl">
                        🌾
                    </div>
                )}

                {/* Bouton retour */}
                <Link href="/" className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition z-10">
                    <ArrowLeft className="text-gray-800" />
                </Link>
            </div>

            {/* CONTENU PRINCIPAL */}
            <div className="max-w-2xl mx-auto -mt-10 relative z-10 px-4">
                <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">

                    {/* Labels */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {producer.labels?.map((label: string) => (
                            <span key={label} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {label}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{producer.name}</h1>

                    <div className="flex items-center text-gray-500 mb-6 text-sm">
                        <MapPin size={16} className="mr-1" />
                        <span>Coordonnées GPS : {producer.lat.toFixed(4)}, {producer.lng.toFixed(4)}</span>
                    </div>

                    <hr className="my-6 border-gray-100" />

                    {/* Description */}
                    <div className="prose prose-green">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">À propos</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {producer.description || "Aucune description fournie pour le moment."}
                        </p>
                    </div>

                    {/* Section Infos Pratiques */}
                    <div className="mt-8 grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Clock className="text-green-600" />
                            <span>Horaires : Voir description</span>
                        </div>
                        {/* Si on avait un téléphone dans la BDD, on l'afficherait ici */}
                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone className="text-green-600" />
                            <span>Contact sur place</span>
                        </div>
                    </div>

                    {/* Bouton d'action */}
                    <div className="mt-8">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${producer.lat},${producer.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-green-600 text-white text-center font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition active:scale-95"
                        >
                            Y aller maintenant 🚗
                        </a>
                    </div>

                </div>
            </div>
        </main>
    );
}