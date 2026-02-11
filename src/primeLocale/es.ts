import { addLocale } from 'primereact/api';

export const setupSpanishLocale = () => {
  addLocale('es', {
    startsWith: 'Empieza con',
    contains: 'Contiene',
    notContains: 'No contiene',
    endsWith: 'Termina con',
    equals: 'Igual',
    notEquals: 'No igual',
    noFilter: 'Sin filtro',
    filter: 'Filtrar',
    clear: 'Limpiar',
    apply: 'Aplicar',
    matchAll: 'Coincide con todo',
    matchAny: 'Coincide con alguno',
    addRule: 'Agregar regla',
    removeRule: 'Eliminar regla',
    accept: 'Sí',
    reject: 'No',
    choose: 'Elegir',
    upload: 'Subir',
    cancel: 'Cancelar',
    pending: 'Pendiente',

    // 🔑 CLAVES OBLIGATORIAS PARA <Password />
    passwordPrompt: 'Ingrese una contraseña',
    weak: 'Débil',
    medium: 'Media',
    strong: 'Fuerte'
  });
};
