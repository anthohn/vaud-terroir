import Link from 'next/link';
import { ArrowLeft, MapPinned, Tractor, Users, HeartHandshake } from 'lucide-react';

export default function ConceptPage() {
    const steps = [
        {
            icon: MapPinned,
            title: "1. Explorez le terroir",
            description: "Utilisez les filtres pour trouver ce dont vous avez besoin : du lait cru pour le petit-déjeuner, une boucherie artisanale pour le barbecue, ou des légumes de saison. La carte vous montre ce qui est autour de vous."
        },
        {
            icon: Tractor,
            title: "2. Allez à la source",
            description: "Rendez-vous directement chez le producteur ou au distributeur automatique (souvent ouvert 24/7). En achetant à la source, vous garantissez une juste rémunération à l'artisan, sans aucun intermédiaire."
        },
        {
            icon: Users,
            title: "3. Participez à la carte",
            description: "VaudTerroir est une application citoyenne et collaborative. Vous connaissez une ferme qui n'est pas sur la carte ? Les horaires d'une laiterie ont changé ? Ajoutez-les ou modifiez-les en un clic !"
        }
    ];

    return (
        <main className="min-h-screen bg-gray-50 pb-20 selection:bg-green-200">
            {/* EN-TÊTE FIXE */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 px-4 py-4 flex items-center">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors font-bold"
                >
                    <div className="bg-gray-100 p-2 rounded-full hover:bg-green-100 transition-colors">
                        <ArrowLeft size={20} />
                    </div>
                    <span>Retour à la carte</span>
                </Link>
            </header>

            <div className="max-w-3xl mx-auto px-6 pt-12">
                {/* HERO SECTION */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Le circuit court, <br className="hidden md:block" />
                        <span className="text-green-600 italic">rendu facile.</span>
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
                        Notre mission est de recréer du lien entre les habitants du canton de Vaud et ceux qui nourrissent notre région. Voici comment utiliser cet outil.
                    </p>
                </div>

                {/* LES ÉTAPES (STEPS) */}
                <div className="space-y-6">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="bg-white text-center p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow group"
                        >
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    {step.title}
                                </h2>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CALL TO ACTION (CTA) FIN DE PAGE */}
                <div className="mt-16 text-center bg-green-700 text-white rounded-3xl p-10 shadow-xl relative overflow-hidden">
                    {/* Décoration de fond (Cercle subtil) */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

                    <h3 className="text-3xl font-bold mb-4">Prêt à explorer ?</h3>
                    <p className="text-green-100 mb-8 max-w-lg mx-auto text-lg">
                        Découvrez les trésors cachés à deux pas de chez vous et soutenez l'économie locale.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-white text-green-800 font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    >
                        Ouvrir la carte
                    </Link>
                </div>
            </div>
        </main>
    );
}