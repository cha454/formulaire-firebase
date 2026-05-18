// Importation des fonctions nécessaires de Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Vérification de la présence des variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log de sécurité (uniquement en développement) pour vérifier si les clés sont chargées
if (import.meta.env.DEV) {
  console.log("Firebase Config chargée :", !!firebaseConfig.apiKey);
}

// Initialisation de Firebase avec gestion d'erreur
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Erreur lors de l'initialisation de Firebase. Vérifiez vos variables d'environnement.", error);
}

// Initialisation des services
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
