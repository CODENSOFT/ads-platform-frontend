/**
 * Frontend fallback: category slug -> field presets when backend does NOT return fields.
 * Schema: { key, label, type, required?, options?, min?, max?, placeholder?, unit? }
 * Labels and select options use Capital Letters (Romanian).
 */

export const CATEGORY_FIELD_PRESETS = {
  automobile: [
    { key: 'an', label: 'An', type: 'number', required: false, min: 1990, max: 2030, unit: 'an' },
    { key: 'capacitateCilindrica', label: 'Capacitate Cilindrica', type: 'number', required: false, min: 0, max: 10000, unit: 'cm³' },
    { key: 'inmatriculare', label: 'Inmatriculare', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Excelent', 'Bun', 'Acceptabil', 'Necesita Reparatii'] },
    { key: 'autorAnunt', label: 'Autor Anunt (PF/PJ)', type: 'select', required: false, options: ['PF', 'PJ'] },
    { key: 'volan', label: 'Volan (Stanga/Dreapta)', type: 'select', required: false, options: ['Stanga', 'Dreapta'] },
    { key: 'tipCaroserie', label: 'Tip Caroserie', type: 'select', required: false, options: ['Sedan', 'SUV', 'Hatchback', 'Combi', 'Coupe', 'Cabrio', 'Monovolume', 'Pick-up', 'Altele'] },
    { key: 'nrLocuri', label: 'Nr Locuri', type: 'number', required: false, min: 1, max: 9, unit: 'locuri' },
    { key: 'rulaj', label: 'Rulaj', type: 'number', required: false, min: 0, unit: 'km' },
    { key: 'combustibil', label: 'Combustibil', type: 'select', required: false, options: ['Benzina', 'Motorina', 'GPL', 'Electric', 'Hibrid', 'Plug-in Hibrid'] },
    { key: 'cutieViteze', label: 'Cutie Viteze', type: 'select', required: false, options: ['Manuala', 'Automata', 'Semi-automata'] },
    { key: 'tipTractiune', label: 'Tip Tractiune', type: 'select', required: false, options: ['Fata', 'Spate', 'Integrala (4x4)'] },
    { key: 'culoare', label: 'Culoare', type: 'text', required: false, placeholder: 'Ex: Alb, Negru' },
    { key: 'marca', label: 'Marca', type: 'text', required: false, placeholder: 'Ex: Volkswagen, BMW' },
    { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Ex: Golf, Seria 3' },
  ],
  imobiliare: [
    { key: 'tipOferta', label: 'Tip Oferta', type: 'select', required: false, options: ['Vanzare', 'Inchiriere'] },
    { key: 'tipImobil', label: 'Tip Imobil', type: 'select', required: false, options: ['Apartament', 'Casa', 'Teren', 'Spatiu Comercial', 'Altele'] },
    { key: 'suprafata', label: 'Suprafata', type: 'number', required: false, min: 0, unit: 'm²' },
    { key: 'nrCamere', label: 'Nr Camere', type: 'number', required: false, min: 1, max: 20, unit: 'camere' },
    { key: 'etaj', label: 'Etaj', type: 'number', required: false, min: 0, max: 50 },
    { key: 'anConstructie', label: 'An Constructie', type: 'number', required: false, min: 1900, max: 2030, unit: 'an' },
  ],
  'electronice-tehnica': [
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Ca Nou', 'Bun', 'Acceptabil'] },
    { key: 'garantie', label: 'Garantie', type: 'select', required: false, options: ['Da', 'Nu'] },
    { key: 'marca', label: 'Marca', type: 'text', required: false, placeholder: 'Marca produs' },
    { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Model' },
  ],
  'casa-gradina': [
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Bun', 'Acceptabil'] },
    { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material principal' },
    { key: 'dimensiuni', label: 'Dimensiuni', type: 'text', required: false, placeholder: 'Ex: 120x80 cm' },
  ],
  'moda-frumusete': [
    { key: 'marime', label: 'Marime', type: 'select', required: false, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'] },
    { key: 'stare', label: 'Stare', type: 'select', required: false, options: ['Nou', 'Nou cu Eticheta', 'Ca Nou', 'Bun'] },
    { key: 'culoare', label: 'Culoare', type: 'text', required: false, placeholder: 'Culoare' },
    { key: 'marca', label: 'Marca', type: 'text', required: false, placeholder: 'Marca' },
  ],
  'locuri-de-munca': [
    { key: 'tipJob', label: 'Tip Job', type: 'select', required: false, options: ['Full-time', 'Part-time', 'Freelance', 'Sezonier', 'Practica'] },
    { key: 'experienta', label: 'Experienta', type: 'select', required: false, options: ['Fara Experienta', '1-3 Ani', '3-5 Ani', 'Peste 5 Ani'] },
    { key: 'nivelStudii', label: 'Nivel Studii', type: 'select', required: false, options: ['Liceu', 'Post-liceala', 'Facultate', 'Master', 'Doctorat'] },
    { key: 'remote', label: 'Remote', type: 'select', required: false, options: ['Da', 'Nu', 'Hibrid'] },
  ],
};
