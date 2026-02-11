# VaudTerroir Connect

**L'application de référence pour localiser les producteurs locaux dans le Canton de Vaud.**
*Du champ à l'assiette, sans détour.*

## À propos
Ce projet est une **Web App Progressive (PWA)** permettant aux utilisateurs de trouver des points de vente directe (fermes, automates, vignerons) via une carte interactive. Elle repose sur une stack moderne, performante et favorise les solutions Open Source.

---

## Stack Technique

### Frontend
- **Framework :** [Next.js 16+](https://nextjs.org/) (App Router)
- **Langage :** TypeScript
- **Styling :** [Tailwind CSS](https://tailwindcss.com/)
- **Icônes :** [Lucide React](https://lucide.dev/)
- **State Management :** React Hooks (`useState`, `useEffect`, `useRef`)

### Cartographie & Géolocalisation (100% Open Source)
- **Moteur de carte :** [Leaflet](https://leafletjs.com/) (via `react-leaflet`)
- **Tuiles :** OpenStreetMap (OSM)
- **Recherche d'adresse (Geocoding) :** API [Nominatim](https://nominatim.org/) (implémentation custom sans clé API)
- **Système de coordonnées :** WGS84 (Standard GPS)

### Backend & Data
- **BaaS :** [Supabase](https://supabase.com/)
- **Base de données :** PostgreSQL
- **Extension Géospatiale :** PostGIS
- **Stockage Images :** Supabase Storage (Bucket `producers-images`)
- **Auth :** Supabase Auth (pour l'admin)

---

## Modélisation Base de Données (Supabase)

La table principale `producers`.

| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | Identifiant unique |
| `created_at` | `timestamptz` | Date de création |
| `name` | `text` | Nom du lieu |
| `description`| `text` | Détails produits/accès |
| `type` | `text` | ex: `farm_shop`, `vending_machine`, `cellar` |
| `location` | `geography(Point)` | Point GPS PostGIS (Lon/Lat) |
| `images` | `text[]` | Tableau d'URLs des photos |
| `address` | `text` | Adresse textuelle formatée (Nominatim) |
| `labels` | `text[]` | Tags (ex: `['Lait', 'Bio', 'Vaud+']`) |
| `opening_hours`| `jsonb` | Structure JSON des horaires hebdo |
| `status` | `text` | `'approved'` (public) ou `'pending'` (en attente) |
| `original_id`| `bigint` | ID du parent si c'est une modification |

---
