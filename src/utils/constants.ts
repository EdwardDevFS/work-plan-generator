export const PRIORITY_LABELS = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta'
} as const;

export const PRIORITY_COLORS = {
  1: 'text-gray-600 bg-gray-100',
  2: 'text-blue-600 bg-blue-100', 
  3: 'text-red-600 bg-red-100'
} as const;

export const PRIORITY_OPTIONS = [
  { label: 'Baja', value: 1 },
  { label: 'Media', value: 2 },
  { label: 'Alta', value: 3 }
];

export const FORM_FIELD_TYPE_OPTIONS = [
  { label: 'Texto', value: 'text' },
  { label: 'Área de texto', value: 'textarea' },
  { label: 'Número', value: 'number' },
  { label: 'Autocompletado', value: 'autocomplete' },
  { label: 'Lista desplegable', value: 'select' },
  { label: 'Selección múltiple', value: 'multiselect' },
  { label: 'Casilla de verificación', value: 'checkbox' },
  { label: 'Botones radio', value: 'radio' },
  { label: 'Fecha', value: 'date' },
  { label: 'Hora', value: 'time' },
  { label: 'Archivo', value: 'file' },
  { label: 'Foto', value: 'photo' }
];

export const MAP_CONFIG = {
  defaultCenter: { lat: -12.0464, lng: -77.0428 }, // Lima, Peru
  defaultZoom: 13,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout'
  },
  STORES: {
    BASE: '/api/stores',
    BY_ID: (id: string) => `/api/stores/${id}`
  },
  FORMS: {
    FIELDS: '/api/forms/fields',
    FIELD_BY_ID: (id: string) => `/api/forms/fields/${id}`
  },
  ITINERARY: {
    MONTHLY: '/api/itinerary/monthly',
    DAILY: '/api/itinerary/daily',
    METRICS: '/api/itinerary/metrics'
  }
};