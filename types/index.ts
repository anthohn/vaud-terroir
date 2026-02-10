// types/index.ts

export type Producer = {
    id: number;
    name: string;
    description: string | null;
    type: 'farm_shop' | 'vending_machine' | 'market' | 'cellar' | 'pickup_point';
    labels: string[] | null;
    lat: number;
    lng: number;
    image_url: string | null;
    contact_info: any; // On pourra typer ça plus finement plus tard
};