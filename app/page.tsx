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
    </main>
  );
}