import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Verwijzing naar de database die al in window.DB zit (vanuit index.html)
// We wachten even tot window.DB beschikbaar is
const db = window.DB; 

const COLLECTION_NAME = 'guestbook';

export class GuestbookService {
    constructor() {
        this.listElement = document.getElementById('guestbook-list');
        this.unsubscribe = null; // Om te stoppen met luisteren als we scherm sluiten
    }

    // Luister naar berichten (Real-time!)
    startListening() {
        if (!window.DB) {
            console.error("Firebase DB niet gevonden!");
            this.renderError();
            return;
        }

        this.listElement.innerHTML = '<li style="text-align:center;">Laden...</li>';

        // Haal de laatste 30 berichten op, nieuwste bovenaan
        const q = query(
            collection(window.DB, COLLECTION_NAME),
            orderBy("timestamp", "desc"),
            limit(30)
        );

        // onSnapshot zorgt dat het scherm direct update als iemand anders iets post
        this.unsubscribe = onSnapshot(q, (snapshot) => {
            this.listElement.innerHTML = '';
            
            if (snapshot.empty) {
                this.listElement.innerHTML = '<li style="text-align:center; color:#aaa;">Nog geen berichten. Wees de eerste!</li>';
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                this.renderMessage(data);
            });
        }, (error) => {
            console.error("Fout bij ophalen berichten:", error);
            this.renderError();
        });
    }

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe(); // Stop dataverbruik als scherm dicht is
        }
    }

    renderMessage(data) {
        const li = document.createElement('li');
        li.className = 'gb-item';
        
        // Datum formatteren
        let dateStr = "Zojuist";
        if (data.timestamp) {
            const date = data.timestamp.toDate();
            dateStr = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
        }

        // Veiligheid: HTML tags strippen om XSS te voorkomen
        const safeName = this.escapeHtml(data.name || "Anoniem");
        const safeMsg = this.escapeHtml(data.message || "...");

        li.innerHTML = `
            <div class="gb-header">
                <span>${safeName}</span>
                <span style="font-size:0.8em;">${dateStr}</span>
            </div>
            <div class="gb-msg">${safeMsg}</div>
        `;
        this.listElement.appendChild(li);
    }

    async postMessage(name, message) {
        if (!name.trim() || !message.trim()) return false;
        
        try {
            await addDoc(collection(window.DB, COLLECTION_NAME), {
                name: name.trim(),
                message: message.trim(),
                timestamp: serverTimestamp()
            });
            return true;
        } catch (e) {
            console.error("Fout bij plaatsen:", e);
            alert("Kon bericht niet plaatsen. Check je internetverbinding.");
            return false;
        }
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    renderError() {
         this.listElement.innerHTML = '<li style="text-align:center; color:red;">Kan geen verbinding maken met het gastenboek.</li>';
    }
}