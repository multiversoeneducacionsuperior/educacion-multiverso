// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBAK_z8sumdtnW--HHHo5yoj2QbtH9hfGw",
  authDomain: "educacion-multiverso.firebaseapp.com",
  projectId: "educacion-multiverso",
  storageBucket: "educacion-multiverso.firebasestorage.app",
  messagingSenderId: "32349264193",
  appId: "1:32349264193:web:07ed20400f249eca76e9c0"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
