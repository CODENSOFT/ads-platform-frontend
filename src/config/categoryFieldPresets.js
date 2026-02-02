/**
 * Frontend fallback: slug aliases + category field presets when backend does NOT return fields.
 * Schema: { key, label, type, required?, options?, min?, max?, placeholder?, unit? }
 * Labels and options use Capital Letters (Romanian).
 * Alias matching: lowercase/trim.
 */

export const CATEGORY_SLUG_ALIASES = {
  'cat-real-estate': 'imobiliare',
  'real-estate': 'imobiliare',
  imobiliare: 'imobiliare',
  auto: 'automobile',
  cars: 'automobile',
  automobile: 'automobile',
  automobiles: 'automobile',
  jobs: 'locuri-de-munca',
  'locuri-de-munca': 'locuri-de-munca',
  electronics: 'electronice-tehnica',
  'electronice-tehnica': 'electronice-tehnica',
  'home-garden': 'casa-gradina',
  'casa-gradina': 'casa-gradina',
  fashion: 'moda-frumusete',
  'moda-frumusete': 'moda-frumusete',
};

export const CATEGORY_FIELD_PRESETS = {
  automobile: [
    { key: 'make', label: 'Marca', type: 'text', required: false, placeholder: 'Ex: Volkswagen, BMW' },
    { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Ex: Golf, Seria 3' },
    { key: 'year', label: 'An', type: 'number', required: false, min: 1990, max: 2030, unit: 'an' },
    { key: 'engineCc', label: 'Capacitate Cilindrica', type: 'number', required: false, min: 0, max: 10000, unit: 'cm³' },
    { key: 'registered', label: 'Inmatriculare', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'condition', label: 'Stare', type: 'select', required: false, options: ['Excelent', 'Bun', 'Acceptabil', 'Necesita Reparatii'] },
    { key: 'sellerType', label: 'Autor Anunt (Persoana Fizica/Juridica)', type: 'select', required: false, options: ['Persoana Fizica', 'Persoana Juridica'] },
    { key: 'steering', label: 'Volan (Stanga/Dreapta)', type: 'select', required: false, options: ['Stanga', 'Dreapta'] },
    { key: 'bodyType', label: 'Tip Caroserie', type: 'select', required: false, options: ['Sedan', 'SUV', 'Hatchback', 'Combi', 'Coupe', 'Cabrio', 'Monovolume', 'Pick-up', 'Altele'] },
    { key: 'seats', label: 'Nr De Locuri', type: 'number', required: false, min: 1, max: 9, unit: 'locuri' },
    { key: 'mileageKm', label: 'Rulaj', type: 'number', required: false, min: 0, unit: 'km' },
    { key: 'fuelType', label: 'Tip Combustibil', type: 'select', required: false, options: ['Benzina', 'Motorina', 'GPL', 'Electric', 'Hibrid', 'Plug-in Hibrid'] },
    { key: 'gearbox', label: 'Cutie De Viteze', type: 'select', required: false, options: ['Manuala', 'Automata', 'Semi-automata'] },
    { key: 'driveType', label: 'Tip Tractiune', type: 'select', required: false, options: ['Fata', 'Spate', 'Integrala (4x4)'] },
    { key: 'color', label: 'Culoare', type: 'text', required: false, placeholder: 'Ex: Alb, Negru' },
  ],
  imobiliare: [
    { key: 'tipImobil', label: 'Tip Imobil', type: 'select', required: false, options: ['Apartament', 'Casa', 'Teren', 'Spatiu Comercial', 'Altele'] },
    { key: 'suprafataM2', label: 'Suprafata', type: 'number', required: false, min: 0, unit: 'm²' },
    { key: 'camere', label: 'Camere', type: 'number', required: false, min: 1, max: 20, unit: 'camere' },
    { key: 'etaj', label: 'Etaj', type: 'number', required: false, min: 0, max: 50 },
    { key: 'etajeTotal', label: 'Etaje Total', type: 'number', required: false, min: 1, max: 50 },
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Renovat', 'Bun', 'De Renovare'] },
    { key: 'incalzire', label: 'Incalzire', type: 'select', required: false, options: ['Centrala', 'Termoficare', 'Gaz', 'Lemne', 'Altele'] },
    { key: 'autorAnunt', label: 'Autor Anunt', type: 'select', required: false, options: ['Persoana Fizica', 'Agentie', 'Constructor'] },
  ],
  'electronice-tehnica': [
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca / Producator' },
    { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Model produs' },
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Ca Nou', 'Bun', 'Acceptabil'] },
    { key: 'garantie', label: 'Garantie', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'anFabricatie', label: 'An Fabricatie', type: 'number', required: false, min: 2000, max: 2030, unit: 'an' },
    { key: 'culoare', label: 'Culoare', type: 'text', required: false, placeholder: 'Culoare' },
    { key: 'livrare', label: 'Livrare', type: 'select', required: false, options: ['Da', 'Nu', 'Pick-up'] },
  ],
  'casa-gradina': [
    { key: 'tipProdus', label: 'Tip Produs', type: 'select', required: false, options: ['Mobilier', 'Decoratiuni', 'Unelte', 'Plante', 'Altele'] },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material principal' },
    { key: 'dimensiuni', label: 'Dimensiuni', type: 'text', required: false, placeholder: 'Ex: 120x80 cm' },
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Bun', 'Acceptabil'] },
    { key: 'culoare', label: 'Culoare', type: 'text', required: false, placeholder: 'Culoare' },
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
  ],
  'moda-frumusete': [
    { key: 'tipArticol', label: 'Tip Articol', type: 'select', required: false, options: ['Imbracaminte', 'Incaltaminte', 'Accesorii', 'Cosmetice', 'Altele'] },
    { key: 'marime', label: 'Marime', type: 'select', required: false, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'] },
    { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
    { key: 'culoare', label: 'Culoare', type: 'text', required: false, placeholder: 'Culoare' },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material' },
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Nou Cu Eticheta', 'Ca Nou', 'Bun'] },
  ],
  'locuri-de-munca': [
    { key: 'tipJob', label: 'Tip Job', type: 'select', required: false, options: ['Full-time', 'Part-time', 'Freelance', 'Sezonier', 'Practica'] },
    { key: 'program', label: 'Program', type: 'select', required: false, options: ['Zi', 'Tura', 'Flexibil', 'Remote'] },
    { key: 'experienta', label: 'Experienta', type: 'select', required: false, options: ['Fara Experienta', '1-3 Ani', '3-5 Ani', 'Peste 5 Ani'] },
    { key: 'salariu', label: 'Salariu', type: 'text', required: false, placeholder: 'Ex: 1500 EUR, Negociabil' },
    { key: 'companie', label: 'Companie', type: 'text', required: false, placeholder: 'Nume companie' },
    { key: 'locatie', label: 'Locatie', type: 'text', required: false, placeholder: 'Oras / Regiune' },
    { key: 'remote', label: 'Remote', type: 'select', required: false, options: ['Da', 'Nu', 'Hibrid'] },
  ],
};
