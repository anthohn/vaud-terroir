// app/page.tsx
'use client'; // Nécessaire pour l'import dynamique

import dynamic from 'next/dynamic';

// Import dynamique sans SSR (Server Side Rendering)
const MapWithNoSSR = dynamic(() => import('@/app/components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-100 text-green-700">
      <p className="animate-pulse font-semibold">Chargement du terroir...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between relative">
      <div className="w-full h-[100dvh]">
        <MapWithNoSSR />
      </div>

      {/* Exemple d'un petit bouton flottant "Lead Dev Style" pour tester l'UI mobile */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
        <button className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg font-bold active:scale-95 transition-transform">
          Trouver autour de moi 📍
        </button>
      </div>
    </main>
  );
}