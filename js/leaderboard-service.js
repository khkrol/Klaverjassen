// js/leaderboard-service.js
import { db } from './firebase-config.js';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const LeaderboardService = {
    
    saveScore: async function(playerName, score) {
        const name = playerName.trim() || "Anoniem";
        const now = Date.now(); 

        try {
            await addDoc(collection(db, "scores"), {
                name: name,
                score: score,
                date: now
            });
            console.log(`Score opgeslagen: ${name} - ${score}`);
            return true;
        } catch (e) {
            console.error("Fout bij opslaan: ", e);
            alert("Kon score niet opslaan. Check je internet.");
            return false;
        }
    },

    getTopScores: async function(listElementId) {
        const listElement = document.getElementById(listElementId);
        if (!listElement) return;

        listElement.innerHTML = '<li class="loading-state">Laden...</li>';

        // 7 dagen geleden
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        try {
            const q = query(
                collection(db, "scores"),
                where("date", ">", sevenDaysAgo),
                orderBy("score", "desc"),
                limit(10)
            );

            const querySnapshot = await getDocs(q);
            const scores = [];
            
            querySnapshot.forEach((doc) => {
                scores.push(doc.data());
            });

            // Client-side sortering
            scores.sort((a, b) => b.score - a.score);
            this.renderList(scores, listElementId);

        } catch (error) {
            console.error("Ophalen mislukt:", error);
            listElement.innerHTML = '<li class="error-state">Kan lijst niet laden.<br><small>Check console voor Index link</small></li>';
        }
    },

    renderList: function(scores, listElementId) {
        const list = document.getElementById(listElementId);
        list.innerHTML = '';

        if (scores.length === 0) {
            list.innerHTML = '<li class="empty-state">Nog geen scores deze week!</li>';
            return;
        }

        const medals = ["🥇", "🥈", "🥉"];

        scores.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `hs-item rank-${index + 1}`;
            
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString('nl-NL', { weekday: 'short' }) + ' ' + 
                            dateObj.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

            const icon = medals[index] || `<span class="rank-num">${index + 1}</span>`;

            li.innerHTML = `
                <div class="hs-rank">${icon}</div>
                <div class="hs-info">
                    <span class="hs-name">${item.name}</span>
                    <span class="hs-date">${dateStr}</span>
                </div>
                <div class="hs-score">${item.score}</div>
            `;
            list.appendChild(li);
        });
    }
};

window.LeaderboardService = LeaderboardService;