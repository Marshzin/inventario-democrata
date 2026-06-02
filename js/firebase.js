import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDN8-DE_4z88rag9JC3YP4RmQibtSBhb4o",
  authDomain: "inventario-democrata.firebaseapp.com",
  projectId: "inventario-democrata",
  storageBucket: "inventario-democrata.firebasestorage.app",
  messagingSenderId: "51505424598",
  appId: "1:51505424598:web:3b183fcdc4fad7496c0177"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
