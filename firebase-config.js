// Configurazione e inizializzazione Firebase, condivisa da tutta l'app.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJm7DGX-7PN_aMQqcsxo5PmrK7kheeq6E",
  authDomain: "turni-stefan.firebaseapp.com",
  projectId: "turni-stefan",
  storageBucket: "turni-stefan.firebasestorage.app",
  messagingSenderId: "941427211949",
  appId: "1:941427211949:web:2006b7b592d0be656dd024",
  measurementId: "G-FV6C7YZVTK"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase Authentication richiede un'email. Per permettere agli utenti di
// accedere con un semplice "nome utente", trasformiamo il nome utente in
// un'email fittizia univoca (mai mostrata all'utente, usata solo internamente).
export function usernameToEmail(username) {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `${clean}@turni-stefan.app`;
}
