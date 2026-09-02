// ============================================================
// Configuración de Firebase (Realtime Database)
// ------------------------------------------------------------
// Nota: la apiKey de un proyecto Firebase web no es un secreto:
// se envía al navegador del cliente por diseño. La seguridad de
// los datos se gobierna con las Security Rules de la base.
// ============================================================

export const firebaseConfig = {
  apiKey: 'AIzaSyAawo3Lccp_sSWROPh8LUJNUGYvh66KGAQ',
  authDomain: 'dmbuddy-10a10.firebaseapp.com',
  databaseURL: 'https://dmbuddy-10a10-default-rtdb.firebaseio.com',
  projectId: 'dmbuddy-10a10',
  storageBucket: 'dmbuddy-10a10.firebasestorage.app',
  messagingSenderId: '934736630166',
  appId: '1:934736630166:web:a7f682b2a8f06d36ed0db7',
  measurementId: 'G-XSFYRYPW12',
} as const;