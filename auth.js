import { auth, db, usernameToEmail } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const authScreen = document.getElementById('authScreen');
const loadingScreen = document.getElementById('loadingScreen');
const appRoot = document.getElementById('appRoot');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authToggle = document.getElementById('authToggle');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');

let mode = 'login'; // oppure 'register'

function setMode(newMode) {
  mode = newMode;
  authError.textContent = '';
  if (mode === 'login') {
    authTitle.textContent = 'Accedi';
    authSubmit.textContent = 'Accedi';
    authToggle.textContent = 'Non hai un account? Registrati';
    authPassword.autocomplete = 'current-password';
  } else {
    authTitle.textContent = 'Crea account';
    authSubmit.textContent = 'Registrati';
    authToggle.textContent = 'Hai già un account? Accedi';
    authPassword.autocomplete = 'new-password';
  }
}

authToggle.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Questo nome utente è già in uso.',
  'auth/invalid-email': 'Nome utente non valido.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/user-not-found': 'Nome utente o password errati.',
  'auth/wrong-password': 'Nome utente o password errati.',
  'auth/invalid-credential': 'Nome utente o password errati.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.'
};

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  const username = authUsername.value.trim();
  const password = authPassword.value;
  if (!username || !password) return;
  authSubmit.disabled = true;
  const email = usernameToEmail(username);
  try {
    if (mode === 'register') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        username,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    authError.textContent = ERROR_MESSAGES[err.code] || 'Si è verificato un errore. Riprova.';
  } finally {
    authSubmit.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));
document.getElementById('logoutBtnPending').addEventListener('click', () => signOut(auth));
document.getElementById('logoutBtnRejected').addEventListener('click', () => signOut(auth));

// window.onUserReady viene definita in script.js: viene chiamata quando un
// utente ha effettuato l'accesso, per caricare i suoi dati da Firestore.
onAuthStateChanged(auth, (user) => {
  loadingScreen.classList.add('hidden');
  if (user) {
    authScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    authForm.reset();
    if (typeof window.onUserReady === 'function') window.onUserReady(user);
  } else {
    appRoot.classList.add('hidden');
    authScreen.classList.remove('hidden');
    if (typeof window.onUserSignedOut === 'function') window.onUserSignedOut();
  }
});

setMode('login');
