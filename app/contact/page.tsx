import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Lightbulb } from 'lucide-react';

export default function ContactPage() {
    // Remplace par ton adresse email réelle plus tard
    const contactEmail = "bonjour@vaudterroir.ch";

    return (
        <main className="min-h-screen bg-gray-50 pb-20 selection:bg-green-200">
            {/* EN-TÊTE FIXE */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-4 flex items-center border-b border-gray-200">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors font-bold"
                >
                    <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 hover:bg-green-50 transition-colors">
                        <ArrowLeft size={20} />
                    </div>
                    <span>Retour à la carte</span>
                </Link>
            </header>

            <div className="max-w-2xl mx-auto px-6 pt-16 md:pt-24">
                {/* TITRE PRINCIPAL */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Un mot à <span className="text-green-600 italic">nous dire ?</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        VaudTerroir est un projet en constante évolution. Vos retours, idées et mots doux sont notre meilleur engrais.
                    </p>
                </div>

                {/* OPTIONS DE CONTACT */}
                <div className="space-y-6">
                    {/* Option 1 : Idées & Suggestions */}
                    <a
                        href={`mailto:${contactEmail}?subject=Suggestion pour VaudTerroir`}
                        className="block bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-full text-yellow-600">
                                <Lightbulb size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Suggérer une idée
                                </h2>
                                <p className="text-gray-600">
                                    Une nouvelle fonctionnalité ? Un type de produit manquant ? Aidez-nous à améliorer l'application.
                                </p>
                            </div>
                        </div>
                    </a>

                    {/* Option 2 : Signaler un problème */}
                    <a
                        href={`mailto:${contactEmail}?subject=Problème sur la carte VaudTerroir`}
                        className="block bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-full text-red-500">
                                <MessageSquare size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Signaler un problème
                                </h2>
                                <p className="text-gray-600">
                                    Un bug sur la carte ? Une ferme qui n'existe plus ? Dites-le nous pour que la carte reste fiable.
                                </p>
                            </div>
                        </div>
                    </a>

                    {/* Option 3 : Contact Général */}
                    <a
                        href={`mailto:${contactEmail}`}
                        className="block bg-green-700 p-6 md:p-8 rounded-2xl shadow-lg  group cursor-pointer text-white"
                    >
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-full text-white">
                                <Mail size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-2">
                                    Nous écrire directement
                                </h2>
                                <p className="text-green-100">
                                    Pour toute autre question, partenariat ou simplement pour nous encourager.
                                </p>
                            </div>
                        </div>
                    </a>
                </div>

            </div>
        </main>
    );
}