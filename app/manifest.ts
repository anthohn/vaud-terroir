import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'VaudTerroir Connect',
        short_name: 'VaudTerroir',
        description: 'Trouvez les producteurs locaux du canton de Vaud',
        start_url: '/',
        display: 'standalone', // C'est ça qui enlève la barre d'adresse !
        background_color: '#ffffff',
        theme_color: '#16a34a', // Le vert de ton bouton
        icons: [
            {
                src: '/favicon.ico', // On utilise l'icône par défaut pour l'instant
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}