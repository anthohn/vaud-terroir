export type Producer = {
    id: number;
    name: string;
    description: string;
    type: string;
    labels: string[];
    lat: number;
    lng: number;
    image_url: string | null;
    status?: string;
    // AJOUTE CES DEUX LIGNES :
    address?: string;
    opening_hours?: any;
    original_id?: string;
};