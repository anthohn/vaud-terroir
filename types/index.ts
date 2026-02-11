export type Producer = {
    id: number;
    name: string;
    description: string;
    type: string;
    labels: string[];
    lat: number;
    lng: number;
    images: string[];
    address: string;
    opening_hours?: any;
    original_id?: number | null;
    status?: string;
    created_at?: string;
    website?: string;
};