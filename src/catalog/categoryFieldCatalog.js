/**
 * Fallback category field catalog when backend does not return fields.
 * Slug normalization: lowercase, trim. Aliases map to canonical slugs.
 * Schema: { key, label, type, required?, options?, min?, max?, placeholder?, unit? }
 * Labels start with capital letters (Romanian). Compatible with DynamicFields.
 */

const CATALOG_ALIASES = {
  servicii: 'servicii',
  services: 'servicii',
  'afaceri-echipamente': 'afaceri-echipamente',
  'business-equipment': 'afaceri-echipamente',
  'copii-bebelusi': 'copii-bebelusi',
  'kids-baby': 'copii-bebelusi',
  'sport-timp-liber': 'sport-timp-liber',
  'sport-leisure': 'sport-timp-liber',
  animale: 'animale',
  pets: 'animale',
  agricultura: 'agricultura',
  agriculture: 'agricultura',
  'educatie-cursuri': 'educatie-cursuri',
  'education-courses': 'educatie-cursuri',
};

function normalizeSlug(slug) {
  return String(slug || '').toLowerCase().trim();
}

function getServiciiFields() {
  return [
    { key: 'serviceType', label: 'Tip Serviciu', type: 'select', required: true, options: ['Reparații', 'Construcții', 'Curățenie', 'Transport', 'IT & Software', 'Design', 'Marketing', 'Foto/Video', 'Evenimente', 'Consultanță', 'Juridic', 'Contabilitate', 'Altele'] },
    { key: 'location', label: 'Locație', type: 'select', required: true, options: ['Chișinău', 'Bălți', 'Cahul', 'Orhei', 'Ungheni', 'Soroca', 'Alt oraș', 'Online'] },
    { key: 'availability', label: 'Disponibilitate', type: 'select', required: false, options: ['Disponibil acum', 'Programare', 'Doar weekend', 'Doar zile lucrătoare'] },
    { key: 'experienceYears', label: 'Experiență (ani)', type: 'number', required: false, min: 0, max: 50, unit: 'ani' },
    { key: 'priceType', label: 'Tip Preț', type: 'select', required: true, options: ['Pe oră', 'Per proiect', 'Fix', 'Negociabil', 'Gratuit'] },
    { key: 'languages', label: 'Limbi Vorbite', type: 'text', required: false, placeholder: 'Română, Rusă, Engleză…' },
    { key: 'warranty', label: 'Garanție', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'urgent', label: 'Disponibil Urgent', type: 'boolean', required: false },
  ];
}

function getAfaceriEchipamenteFields() {
  const maxYear = new Date().getFullYear() + 1;
  return [
    { key: 'itemType', label: 'Tip Articol', type: 'select', required: true, options: ['Echipamente comerciale', 'Utilaje', 'Echipamente IT', 'Mobilier business', 'Scule', 'Echipamente medicale', 'Echipamente industriale', 'Altele'] },
    { key: 'condition', label: 'Stare', type: 'select', required: true, options: ['Nou', 'Ca nou', 'Folosit', 'Pentru piese'] },
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
    { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Model' },
    { key: 'year', label: 'An', type: 'number', required: false, min: 1950, max: maxYear, unit: 'an' },
    { key: 'warranty', label: 'Garanție', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'invoiceVAT', label: 'Factură / TVA', type: 'select', required: false, options: ['Cu factură', 'Fără factură', 'TVA inclus', 'TVA nu se aplică'] },
    { key: 'powerW', label: 'Putere (W)', type: 'number', required: false, min: 0, unit: 'W' },
    { key: 'voltage', label: 'Tensiune', type: 'select', required: false, options: ['220V', '380V', 'Alt'] },
    { key: 'stockQty', label: 'Cantitate Disponibilă', type: 'number', required: false, min: 1, unit: 'buc' },
  ];
}

function getCopiiBebelusiFields() {
  return [
    { key: 'productType', label: 'Tip Produs', type: 'select', required: true, options: ['Haine', 'Încălțăminte', 'Cărucior', 'Scaun auto', 'Pătuț', 'Jucării', 'Hrană', 'Accesorii', 'Altele'] },
    { key: 'ageRange', label: 'Vârstă', type: 'select', required: true, options: ['0-3 luni', '3-6 luni', '6-12 luni', '1-2 ani', '3-5 ani', '6-8 ani', '9-12 ani', '13+'] },
    { key: 'gender', label: 'Gen', type: 'select', required: false, options: ['Unisex', 'Băiat', 'Fată'] },
    { key: 'size', label: 'Mărime', type: 'text', required: false, placeholder: '56, 62, 74, 80…' },
    { key: 'condition', label: 'Stare', type: 'select', required: true, options: ['Nou', 'Ca nou', 'Folosit'] },
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
    { key: 'color', label: 'Culoare', type: 'text', required: false, placeholder: 'Culoare' },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material' },
    { key: 'safetyCertified', label: 'Certificare Siguranță', type: 'select', required: false, options: ['Da', 'Nu'] },
  ];
}

function getSportTimpLiberFields() {
  return [
    { key: 'sportType', label: 'Tip Sport', type: 'select', required: true, options: ['Fitness', 'Ciclism', 'Fotbal', 'Baschet', 'Tenis', 'Sporturi de iarnă', 'Pescuit', 'Camping', 'Alergare', 'Altele'] },
    { key: 'itemType', label: 'Tip Articol', type: 'select', required: true, options: ['Echipament', 'Îmbrăcăminte', 'Accesoriu', 'Bicicletă', 'Trotinetă', 'Aparate fitness', 'Altele'] },
    { key: 'condition', label: 'Stare', type: 'select', required: true, options: ['Nou', 'Ca nou', 'Folosit'] },
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
    { key: 'size', label: 'Mărime/Dimensiune', type: 'text', required: false, placeholder: 'Mărime' },
    { key: 'weightKg', label: 'Greutate (kg)', type: 'number', required: false, min: 0, unit: 'kg' },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material' },
    { key: 'suitableFor', label: 'Potrivit Pentru', type: 'select', required: false, options: ['Începători', 'Intermediari', 'Profesioniști'] },
  ];
}

function getAnimaleFields() {
  return [
    { key: 'listingType', label: 'Tip Anunț', type: 'select', required: true, options: ['Vânzare', 'Adopție', 'Împerechere', 'Servicii'] },
    { key: 'animalType', label: 'Tip Animal', type: 'select', required: true, options: ['Câine', 'Pisică', 'Pasăre', 'Pește', 'Rozător', 'Reptilă', 'Altele'] },
    { key: 'breed', label: 'Rasă', type: 'text', required: false, placeholder: 'Rasa' },
    { key: 'ageMonths', label: 'Vârstă (luni)', type: 'number', required: false, min: 0, unit: 'luni' },
    { key: 'gender', label: 'Gen', type: 'select', required: false, options: ['Mascul', 'Femelă'] },
    { key: 'vaccinated', label: 'Vaccinat', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'sterilized', label: 'Sterilizat', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'pedigree', label: 'Pedigree', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'delivery', label: 'Livrare', type: 'select', required: false, options: ['Ridicare personală', 'Livrare posibilă'] },
  ];
}

function getAgriculturaFields() {
  const maxYear = new Date().getFullYear() + 1;
  return [
    { key: 'itemType', label: 'Tip Articol', type: 'select', required: true, options: ['Tehnică agricolă', 'Utilaje', 'Semințe', 'Îngrășăminte', 'Furaje', 'Animale agricole', 'Miere', 'Altele'] },
    { key: 'condition', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Folosit'] },
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
    { key: 'year', label: 'An', type: 'number', required: false, min: 1950, max: maxYear, unit: 'an' },
    { key: 'areaHa', label: 'Suprafață (ha)', type: 'number', required: false, min: 0, unit: 'ha' },
    { key: 'quantity', label: 'Cantitate', type: 'number', required: false, min: 0, unit: '' },
    { key: 'unit', label: 'Unitate', type: 'select', required: false, options: ['kg', 'tone', 'litri', 'buc', 'sac', 'ha'] },
    { key: 'origin', label: 'Origine', type: 'select', required: false, options: ['Local', 'Import', 'Mixt'] },
    { key: 'organic', label: 'Bio/Organic', type: 'select', required: false, options: ['Da', 'Nu'] },
  ];
}

function getEducatieCursuriFields() {
  return [
    { key: 'courseType', label: 'Tip Curs', type: 'select', required: true, options: ['Meditații', 'Curs', 'Training', 'Workshop', 'Certificare', 'Altele'] },
    { key: 'subject', label: 'Materie', type: 'select', required: true, options: ['Matematică', 'Română', 'Engleză', 'Germană', 'Franceză', 'IT/Programare', 'Design', 'Muzică', 'Dans', 'Business', 'Altele'] },
    { key: 'format', label: 'Format', type: 'select', required: true, options: ['Online', 'Offline', 'Hybrid'] },
    { key: 'level', label: 'Nivel', type: 'select', required: false, options: ['Începător', 'Intermediar', 'Avansat'] },
    { key: 'duration', label: 'Durată', type: 'text', required: false, placeholder: 'ex: 60 min / 10 lecții' },
    { key: 'schedule', label: 'Program', type: 'text', required: false, placeholder: 'Program' },
    { key: 'certificate', label: 'Certificat', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'groupOrIndividual', label: 'Individual / Grup', type: 'select', required: false, options: ['Individual', 'Grup'] },
  ];
}

const PRESET_BUILDERS = {
  servicii: getServiciiFields,
  'afaceri-echipamente': getAfaceriEchipamenteFields,
  'copii-bebelusi': getCopiiBebelusiFields,
  'sport-timp-liber': getSportTimpLiberFields,
  animale: getAnimaleFields,
  agricultura: getAgriculturaFields,
  'educatie-cursuri': getEducatieCursuriFields,
};

/**
 * Base fields for a category (category-level only, never depends on subcategory).
 * Slug normalization: lowercase, trim. Returns [] for unknown slugs.
 *
 * @param {string} categorySlug
 * @returns {Array<{key: string, label: string, type: string, ...}>}
 */
export function getBaseFieldsByCategorySlug(categorySlug) {
  const cat = normalizeSlug(categorySlug);
  if (!cat) return [];
  const canonical = CATALOG_ALIASES[cat] || cat;
  const builder = PRESET_BUILDERS[canonical];
  if (!builder) return [];
  return builder();
}

/**
 * Optional extra fields for a subcategory (add/override on top of base).
 * Returns [] for unknown or when no extras defined.
 *
 * @param {string} categorySlug
 * @param {string} [subCategorySlug]
 * @returns {Array<{key: string, label: string, type: string, ...}>}
 */
export function getExtraFieldsBySubcategorySlug(categorySlug, subCategorySlug) {
  const cat = normalizeSlug(categorySlug);
  const sub = normalizeSlug(subCategorySlug);
  if (!cat || !sub) return [];
  // Extras per subcategory can be added here later; for now empty.
  return [];
}
