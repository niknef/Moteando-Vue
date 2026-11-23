// Tipos de parada que se pueden marcar en un punto de la ruta (se guardan en waypoints[].type).
// El color sale de los tokens --note-* de style.css.
export const STOP_TYPES = {
  fuel: { label: 'Nafta', icon: 'Fuel', color: 'text-note-fuel' },
  food: { label: 'Comida', icon: 'Utensils', color: 'text-note-food' },
  photo: { label: 'Foto', icon: 'Camera', color: 'text-note-photo' },
  regroup: { label: 'Reagrupe', icon: 'Users', color: 'text-note-other' },
}

export const stopType = (type) => STOP_TYPES[type] ?? null
