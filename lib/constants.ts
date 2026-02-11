export const PRODUCT_TAGS = [
    { id: 'Viande', label: 'Viandes', emoji: '🥩' },
    { id: 'Lait', label: 'Lait cru', emoji: '🥛' },
    { id: 'Fromage', label: 'Fromages', emoji: '🧀' },
    { id: 'Oeufs', label: 'Œufs', emoji: '🥚' },
    { id: 'Legumes', label: 'Fruits & Légumes', emoji: '🥦' },
    { id: 'Pain', label: 'Pains & Céréales', emoji: '🥖' },
    { id: 'Epicerie', label: 'Huiles & Farines', emoji: '🌻' },
    { id: 'Vin', label: 'Vins', emoji: '🍷' },
    { id: 'Miel', label: 'Miel & Confitures', emoji: '🍯' },
    { id: 'Boissons', label: 'Jus & Bières', emoji: '🧃' },
] as const;

export const SALE_TYPES = [
    { id: 'farm_shop', label: 'Magasin de ferme', emoji: '🚜' },
    { id: 'vending_machine', label: 'Automate', emoji: '🥛' },
    { id: 'cheese_dairy', label: 'Laiterie / Fromagerie', emoji: '🧀' },
    { id: 'butcher', label: 'Boucherie', emoji: '🥩' },
    { id: 'cellar', label: 'Cave / Vigneron', emoji: '🍷' },
    { id: 'bakery', label: 'Boulangerie', emoji: '🥖' },
    { id: 'market', label: 'Marché / Stand', emoji: '🥕' },
    { id: 'self_harvest', label: 'Cueillette au champ', emoji: '🍓' },
] as const;

// --- HELPERS ---

/** Retourne les infos complètes d'un type de vente */
export const getSaleTypeInfo = (id: string) => {
    return SALE_TYPES.find(t => t.id === id) || { label: 'Autre', emoji: '📍' };
};

/** Retourne l'emoji d'un produit (utile pour le ProducerPanel) */
export const getProductEmoji = (id: string) => {
    return PRODUCT_TAGS.find(t => t.id === id)?.emoji || '📦';
};

/** Retourne le label d'un produit (utile pour le ProducerPanel) */
export const getProductLabel = (id: string) => {
    return PRODUCT_TAGS.find(t => t.id === id)?.label || id;
};