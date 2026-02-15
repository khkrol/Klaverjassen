// js/firebase-config.js

// 1. Importeer de functies van Google (Versie 10.7.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Jouw configuratie (van Oldboys project)
const firebaseConfig = {
  apiKey: "AIzaSyDnYWBnPqiurKK_vM4C_JT07UxGpaaifGs",
  authDomain: "oldboys-c58f9.firebaseapp.com",
  projectId: "oldboys-c58f9",
  storageBucket: "oldboys-c58f9.firebasestorage.app",
  messagingSenderId: "23329894436",
  appId: "1:23329894436:web:8cd9d409be74fce51f28b1"
};

// 3. Start de services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase is verbonden!");

// 4. Exporteer de database zodat we hem elders kunnen gebruiken
export { db };