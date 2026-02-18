import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DemarchePage() {
    return (
        <main className="min-h-screen bg-gray-50 pb-20 selection:bg-green-200">
            {/* EN-TÊTE FIXE (Style minimaliste gardé de la page concept) */}
            <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 py-4 flex items-center border-b border-gray-100">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors font-bold"
                >
                    <div className="bg-gray-50 p-2 rounded-full hover:bg-green-50 transition-colors">
                        <ArrowLeft size={20} />
                    </div>
                    <span>Retour à la carte</span>
                </Link>
            </header>

            <article className="max-w-3xl mx-auto px-6 pt-12">
                {/* TITRE PRINCIPAL */}
                <header className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Remettre le paysan <br className="hidden md:block" />
                        au <span className="text-green-600 italic">centre du village.</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-bold tracking-wide uppercase">
                        Notre Démarche
                    </p>
                </header>

                {/* CORPS DU TEXTE (Style Éditorial) */}
                <div className="prose prose-lg prose-green max-w-none text-gray-800 space-y-8 leading-relaxed">

                    <p className="text-2xl font-bold text-gray-900 leading-snug">
                        L'agriculture vaudoise est une richesse inestimable, pourtant, ceux qui la façonnent peinent souvent à en vivre dignement.
                    </p>

                    <p>
                        Aujourd'hui, la chaîne de distribution classique est longue et complexe. Entre le champ et l'assiette, les intermédiaires s'accumulent. Les grandes surfaces imposent leurs prix, leurs marges et leurs conditions. Résultat : le producteur ne perçoit qu'une infime partie de la valeur réelle de son travail, tandis que le consommateur paie le prix fort pour des produits dont l'origine devient floue.
                    </p>

                    <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Briser la chaîne, rétablir le lien</h2>

                    <p>
                        Nous voulons offrir une alternative concrète aux grandes surfaces. Une alternative où le consommateur sait exactement d'où vient sa nourriture, et où <strong className="text-gray-900 bg-green-100 px-1">100% de la somme dépensée va directement dans la poche de l'artisan</strong> ou du paysan.
                    </p>

                    {/* <div className="bg-gray-50 p-8 rounded-2xl border-l-4 border-green-600 my-10"> */}
                    <div className="my-10">

                        <h3 className="text-xl font-bold text-gray-900 mb-4">Notre promesse :</h3>
                        <ul className="space-y-3 list-none pl-0">
                            <li className="flex gap-2">
                                <span className="text-green-600 font-bold">—</span>
                                Promouvoir la vente directe.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-600 font-bold">—</span>
                                Encourager une alimentation de saison, ancrée dans le terroir vaudois.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-600 font-bold">—</span>
                                Rétribuer de manière juste les producteurs pour leur travail.
                            </li>
                        </ul>
                    </div>

                    <p>
                        En utilisant cette carte, vous ne faites pas que vos courses. Vous soutenez l'économie locale et vous rendez au métier d'agriculteur la reconnaissance qu'il mérite.
                    </p>

                </div>

            </article>
        </main>
    );
}