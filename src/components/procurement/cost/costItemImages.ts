/**
 * High-quality 1:1 Aspect Ratio Images and Visual Asset Defaults
 * for Procurement Cost Items and Variants.
 */

export const DEFAULT_COST_ITEM_IMAGES: Record<string, string> = {
  // Extrusions & Aluminium Profiles
  'extrusions': 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&h=400&q=80',
  'aluminium': 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-MAT-6063': 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-MAT-ALU-6063': 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&h=400&q=80',
  
  // Architectural Glazing & DGU
  'glazing': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=400&q=80',
  'glass': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-MAT-GLS-DGU': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-MAT-DGU-28': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=400&q=80',

  // Outside Services - Powder Coating & Anodizing
  'powder-coating': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80',
  'coating': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-OUT-PC-CL2': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80',

  // Subcontractor Installation Crew & Labour
  'crew': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=400&q=80',
  'labour': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-SUB-CW-CREW': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=400&q=80',

  // Equipment & Plant - Spider Crane
  'crane': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=400&h=400&q=80',
  'equipment': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-EQP-SPIDER-CRANE': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=400&h=400&q=80',

  // Logistics & Freight Transport
  'logistics': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=400&q=80',
  'PR-LOG-FLATBED-TRIP': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=400&q=80',

  // Gaskets, Weatherseals & Silicones
  'gasket': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&h=400&q=80',
  'sealant': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&h=400&q=80',

  // Steel Brackets & Hardware
  'steel': 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&h=400&q=80',
  'hardware': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=400&h=400&q=80',
  'fasteners': 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=400&h=400&q=80',

  // Fallback architectural construction
  'default': 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=400&h=400&q=80'
};

/**
 * Generates a clean, modern SVG Data URL fallback with styled gradient, grid pattern and classification badge
 */
export function getCostItemFallbackSvg(categoryOrClassification?: string, name?: string): string {
  const cat = (categoryOrClassification || '').toLowerCase();
  const itemName = (name || '').toLowerCase();
  let bg1 = '#0284c7';
  let bg2 = '#0369a1';
  let label = 'MAT';
  let sub = 'Material';

  if (cat.includes('outside') || cat.includes('service') || cat.includes('coat') || itemName.includes('coat')) {
    bg1 = '#9333ea';
    bg2 = '#7e22ce';
    label = 'SRV';
    sub = 'Outside Service';
  } else if (cat.includes('subcon') || cat.includes('labour') || cat.includes('crew') || itemName.includes('crew')) {
    bg1 = '#ea580c';
    bg2 = '#c2410c';
    label = 'SUB';
    sub = 'Subcontractor';
  } else if (cat.includes('equip') || cat.includes('plant') || cat.includes('crane') || itemName.includes('crane')) {
    bg1 = '#16a34a';
    bg2 = '#15803d';
    label = 'EQP';
    sub = 'Equipment';
  } else if (cat.includes('logist') || cat.includes('freight') || cat.includes('trans') || itemName.includes('haul')) {
    bg1 = '#475569';
    bg2 = '#334155';
    label = 'LOG';
    sub = 'Logistics';
  } else if (itemName.includes('glass') || itemName.includes('dgu')) {
    bg1 = '#0891b2';
    bg2 = '#0e7490';
    label = 'GLS';
    sub = 'Glazing';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="400" fill="url(#g)" />
    <rect width="400" height="400" fill="url(#grid)" />
    <circle cx="200" cy="180" r="70" fill="rgba(255,255,255,0.14)" />
    <text x="200" y="196" font-family="monospace, ui-monospace, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">${label}</text>
    <text x="200" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="rgba(255,255,255,0.9)" text-anchor="middle">${sub}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a guaranteed valid 1:1 image URL for a cost item or variant
 */
export function getCostItemImageUrl(item: { 
  imageUrl?: string; 
  itemCode?: string; 
  variantCode?: string; 
  category?: string; 
  classification?: string;
  name?: string;
}): string {
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl;
  }

  const code = (item.itemCode || item.variantCode || '').toUpperCase();
  if (DEFAULT_COST_ITEM_IMAGES[code]) {
    return DEFAULT_COST_ITEM_IMAGES[code];
  }

  const nameAndCat = `${item.name || ''} ${item.category || ''} ${item.classification || ''}`.toLowerCase();
  
  if (nameAndCat.includes('glass') || nameAndCat.includes('dgu') || nameAndCat.includes('glaz')) {
    return DEFAULT_COST_ITEM_IMAGES['glass'];
  }
  if (nameAndCat.includes('powder') || nameAndCat.includes('coat') || nameAndCat.includes('anodiz') || nameAndCat.includes('paint')) {
    return DEFAULT_COST_ITEM_IMAGES['powder-coating'];
  }
  if (nameAndCat.includes('crane') || nameAndCat.includes('spider') || nameAndCat.includes('plant') || nameAndCat.includes('machin')) {
    return DEFAULT_COST_ITEM_IMAGES['crane'];
  }
  if (nameAndCat.includes('subcontract') || nameAndCat.includes('crew') || nameAndCat.includes('gang') || nameAndCat.includes('labour') || nameAndCat.includes('install')) {
    return DEFAULT_COST_ITEM_IMAGES['crew'];
  }
  if (nameAndCat.includes('transp') || nameAndCat.includes('flatbed') || nameAndCat.includes('logist') || nameAndCat.includes('haul')) {
    return DEFAULT_COST_ITEM_IMAGES['logistics'];
  }
  if (nameAndCat.includes('gasket') || nameAndCat.includes('epdm') || nameAndCat.includes('seal')) {
    return DEFAULT_COST_ITEM_IMAGES['gasket'];
  }
  if (nameAndCat.includes('fastener') || nameAndCat.includes('bolt') || nameAndCat.includes('screw') || nameAndCat.includes('anchor')) {
    return DEFAULT_COST_ITEM_IMAGES['fasteners'];
  }
  if (nameAndCat.includes('extru') || nameAndCat.includes('alumi') || nameAndCat.includes('mullion') || nameAndCat.includes('transom') || nameAndCat.includes('profile')) {
    return DEFAULT_COST_ITEM_IMAGES['extrusions'];
  }

  return DEFAULT_COST_ITEM_IMAGES['default'];
}
