/**
 * KLAVERJAS UI (Klaas Klaverjas Versie 3.0 - Met Drentse UI Support)
 */
const KJUI = {
    el: {},
    animationFrameId: null, 

    init: function() {
        // Cache belangrijke elementen
        const ids = [
            'player-hand-container', 'status-bar', 'trump-selection', 
            'trump-indicator', 'score-us', 'score-them', 'game-table', 
            'confetti-canvas', 'game-over-overlay',
            // NIEUW: Container voor de gedraaide kaart
            'bid-card-container', 'bid-card-display'
        ];
        
        ids.forEach(id => {
            this.el[id] = document.getElementById(id);
        });
        
        // Aliassen
        this.el.hand = this.el['player-hand-container'];
        this.el.msg = this.el['status-bar']; 
        this.el.trumpSelect = this.el['trump-selection'];
        this.el.trumpIndicator = this.el['trump-indicator'];
        this.el.scoreUs = this.el['score-us'];
        this.el.scoreThem = this.el['score-them'];
        this.el.table = this.el['game-table']; 
    },

    createCardHTML: function(card) {
        const suitConf = Object.values(KJConfig.SUITS).find(s => s.id === card.suit);
        return `
            <div class="card-modern ${suitConf.cssClass}">
                <div class="card-value">${card.rank}<br><span style="font-size:0.7em">${suitConf.symbol}</span></div>
                <div class="card-suit-big">${suitConf.symbol}</div>
                <div class="card-value card-corner-btm">${card.rank}<br><span style="font-size:0.7em">${suitConf.symbol}</span></div>
            </div>
        `;
    },

    renderHand: function(hand) {
        this.el.hand.innerHTML = ''; 
            const totalCards = hand.length;
            const isMyTurn = (KJCore.turnIndex === 0);
            
            // NIEUW: Check of we op mobiel zitten
            const isMobile = window.innerWidth < 600;
            
            // Op mobiel een kleinere hoek (3 graden) dan op desktop (6 graden)
            const spreadAngle = isMobile ? 3.5 : 6; 
            const yOffsetFactor = isMobile ? 4 : 8;

            hand.forEach((card, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'hand-card'; 
                
                const mid = (totalCards - 1) / 2;
                
                // Gebruik de variabele hoek
                const rotate = (index - mid) * spreadAngle; 
                const translateY = Math.abs(index - mid) * yOffsetFactor; 

                wrapper.style.transform = `rotate(${rotate}deg) translateY(${translateY}px)`;
            wrapper.innerHTML = this.createCardHTML(card);
            
            if (isMyTurn) {
                const isValid = KJCore.isValidMove(card, 0);
                if (!isValid) {
                    wrapper.classList.add('card-disabled');
                } else {
                    wrapper.onclick = () => KlaverjasMain.onCardClick(index);
                }
            } else {
                wrapper.style.cursor = "default";
            }
            
            this.el.hand.appendChild(wrapper);
        });
    },

    showMessage: function(text, duration = 0) {
        this.el.msg.textContent = text || ""; 
        
        // Visuele Verfijning bij Roem
        if (text.includes("Roem")) {
            this.el.msg.style.color = "var(--accent-gold)";
            this.el.msg.style.transform = "scale(1.2)";
        } else {
            this.el.msg.style.color = "";
            this.el.msg.style.transform = "scale(1)";
        }

        if (duration > 0) {
            setTimeout(() => {
                // (Optioneel: bericht wissen na tijd, hier leeg gelaten voor persistentie in statusbalk)
            }, duration);
        }
    },

    updateScore: function(points) {
        this.el.scoreUs.innerText = points.us;
        this.el.scoreThem.innerText = points.them;
    },

    setTrump: function(suit) {
        if (!suit) {
            this.el.trumpIndicator.innerText = "?";
            this.el.trumpIndicator.className = "trump-icon";
            return;
        }
        const s = Object.values(KJConfig.SUITS).find(x => x.id === suit);
        this.el.trumpIndicator.innerText = s.symbol;
        this.el.trumpIndicator.className = `trump-icon ${s.cssClass}`;
    },

    // --- AANGEPAST: Ondersteuning voor Drentse modus ---
    showTrumpSelection: function(show, mode = 'normal', proposedSuit = null) {
        const overlay = this.el.trumpSelect;
        const groupNormal = document.getElementById('controls-normal');
        const groupDrents = document.getElementById('controls-drents');
        const btnPass = document.getElementById('btn-pass');

        if (!show) {
            overlay.classList.add('hidden');
            return;
        }

        overlay.classList.remove('hidden');
        
        if (mode === 'drents') {
            // Toon Drentse knoppen (Speel / Pas) en verberg normale
            if (groupNormal) groupNormal.classList.add('hidden');
            if (groupDrents) groupDrents.classList.remove('hidden');
            
            // Update het icoontje in de knop
            const s = Object.values(KJConfig.SUITS).find(x => x.id === proposedSuit);
            const iconSpan = document.getElementById('drents-suit-icon');
            
            if(iconSpan && s) {
                iconSpan.innerText = s.symbol;
                // Reset classes en zet handmatig kleur (omdat classList replace complex kan zijn met icon logic)
                iconSpan.style.color = (s.id === 'h' || s.id === 'd') ? '#d32f2f' : '#000';
            }
        } else {
            // Toon Normale knoppen (4 suits / Pas) en verberg Drentse
            if (groupDrents) groupDrents.classList.add('hidden');
            if (groupNormal) groupNormal.classList.remove('hidden');
        }
        
        // Pas knop altijd tonen
        if(btnPass) btnPass.classList.remove('hidden');
    },

// In KJUI object...

// AANGEPAST: Geen inline styles meer die conflicteren met CSS
    showBidCard: function(cardData) {
    const container = this.el['bid-card-container'];
    const display = this.el['bid-card-display'];
    
    if (!container || !display) return;
    
    // Reset transformaties in JS, laat CSS het werk doen
    display.style.transform = ''; 
    
    // Maak HTML voor de kaart
    display.innerHTML = this.createCardHTML(cardData);
    
    // Direct tonen
    container.classList.remove('hidden');
},

    // --- NIEUW: Verberg de gedraaide kaart ---
    hideBidCard: function() {
        const container = this.el['bid-card-container'];
        if(container) container.classList.add('hidden');
    },

    updateActivePlayer: function(playerIndex) {
        for(let i=0; i<4; i++) {
            const wrapper = document.getElementById(`avatar-${i}`);
            if(wrapper && wrapper.parentElement) {
                wrapper.parentElement.classList.remove('active-turn');
            }
        }
        const activeWrapper = document.getElementById(`avatar-${playerIndex}`);
        if(activeWrapper && activeWrapper.parentElement) {
            activeWrapper.parentElement.classList.add('active-turn');
        }
    },

    shakeHand: function() {
        this.vibrate([50, 50, 50]); // <--- NIEUW: Bzz-bzz-bzz
        this.el.hand.classList.add('shake-anim');
        setTimeout(() => this.el.hand.classList.remove('shake-anim'), 500);
    },

    playCardAnimation: function(card, playerIndex) {
        const animCard = document.createElement('div');
        animCard.className = 'table-anim-card';
        animCard.innerHTML = this.createCardHTML(card);
        
        const startPositions = ['fly-in-bottom', 'fly-in-left', 'fly-in-top', 'fly-in-right'];
        animCard.classList.add(startPositions[playerIndex]);
        
        this.el.table.appendChild(animCard);
        void animCard.offsetWidth;

        const endPositions = ['on-table-bottom', 'on-table-left', 'on-table-top', 'on-table-right'];
        animCard.classList.remove(startPositions[playerIndex]);
        animCard.classList.add(endPositions[playerIndex]);
    },

    clearTableAnimated: function(winnerIndex) {
        const cards = document.querySelectorAll('.table-anim-card');
        const targets = [
            { bottom: '-100px', left: '50%' },
            { top: '50%', left: '-100px' },
            { top: '-100px', left: '50%' },
            { top: '50%', left: '110%' }
        ];

        const target = targets[winnerIndex];

        cards.forEach(card => {
            card.style.transition = 'all 0.5s ease-in';
            card.style.top = target.top || 'auto';
            card.style.bottom = target.bottom || 'auto';
            card.style.left = target.left || 'auto';
            card.style.transform = 'scale(0.2) rotate(15deg)';
            card.style.opacity = '0';
        });

        setTimeout(() => {
            cards.forEach(c => c.remove());
        }, 550);
    },

// In js/klaverjas-ui.js

renderLastTrick: function(trickData) {
        const overlay = document.getElementById('last-trick-overlay');
        const container = document.getElementById('last-trick-cards');
        
        if (!overlay || !container) return;

        // 1. Reset de inhoud
        container.innerHTML = '';
        
        // Verwijder eventuele oude info-blokken die we eerder hebben toegevoegd
        const oldDetails = document.getElementById('last-trick-details');
        if (oldDetails) oldDetails.remove();
        const oldInfo = document.getElementById('last-trick-info');
        if (oldInfo) oldInfo.remove();

        const h3 = overlay.querySelector('h3');

        // --- SITUATIE 1: NOG GEEN SLAG (START VAN SPEL) ---
        if (!trickData || !trickData.cards || trickData.cards.length === 0) {
            if(h3) h3.textContent = "Huidige Ronde";

            const infoDiv = document.createElement('div');
            infoDiv.id = 'last-trick-info';
            infoDiv.style.textAlign = 'center';
            infoDiv.style.width = '100%';
            infoDiv.style.padding = '10px';
            
            // Troef ophalen
            let trumpHtml = "<span style='color:#999'>Nog kiezen...</span>";
            if (KJCore.trumpSuit) {
                const s = Object.values(KJConfig.SUITS).find(x => x.id === KJCore.trumpSuit);
                if(s) trumpHtml = `<span class="${s.cssClass}" style="font-size:2.5em; vertical-align:middle;">${s.symbol}</span><div style="color:#ccc; margin-top:5px;">${s.name}</div>`;
            }

            infoDiv.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:20px; margin-top:10px;">
                    <p style="color:#aaa; margin:0 0 15px 0; font-style:italic;">Er is nog geen vorige slag.</p>
                    <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:15px;">
                        <p style="color:var(--accent-gold); font-size:1.1em; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">Actieve Troef</p>
                        ${trumpHtml}
                    </div>
                </div>
            `;
            
            container.appendChild(infoDiv);
            overlay.classList.remove('hidden');
            
            // Klik om te sluiten
            overlay.onclick = () => overlay.classList.add('hidden');
            return; // Klaar, we tekenen geen kaarten
        }

        // --- SITUATIE 2: ER IS WEL EEN SLAG ---
        if(h3) h3.textContent = "Vorige Slag";
        const playerNames = ['ZUID', 'WEST', 'NOORD', 'OOST'];

        // Kaarten tekenen
        trickData.cards.forEach(play => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'last-trick-item';

            const isWinner = (play.playerIndex === trickData.winnerIndex);
            
            // Naam label
            const nameLabel = document.createElement('span');
            nameLabel.className = 'last-trick-label';
            nameLabel.innerText = playerNames[play.playerIndex];
            if(isWinner) {
                nameLabel.style.color = 'var(--accent-gold)';
                nameLabel.style.fontWeight = 'bold';
            } else {
                nameLabel.style.color = '#ccc';
            }

            // De Kaart
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.createCardHTML(play.card);
            const cardElement = tempDiv.firstElementChild;

            cardElement.style.position = 'relative'; 
            cardElement.style.transform = 'scale(0.85)';
            cardElement.style.margin = '0';
            
            if (isWinner) {
                cardElement.style.boxShadow = "0 0 15px var(--accent-gold)";
                cardElement.style.borderColor = "var(--accent-gold)";
            }
            
            itemWrapper.appendChild(nameLabel);
            itemWrapper.appendChild(cardElement);
            container.appendChild(itemWrapper);
        });

        // Details (Punten) toevoegen
        const detailsDiv = document.createElement('div');
        detailsDiv.id = 'last-trick-details';
        detailsDiv.style.marginTop = '15px';
        detailsDiv.style.padding = '15px';
        detailsDiv.style.background = 'rgba(0,0,0,0.3)';
        detailsDiv.style.borderRadius = '8px';
        detailsDiv.style.width = '100%';

        let roemHtml = trickData.roem.total > 0 
            ? `<div style="color:var(--accent-gold); margin-top:5px;">+ Roem: <strong>${trickData.roem.total}</strong> <span style="font-size:0.8em">(${trickData.roem.desc.join(', ')})</span></div>`
            : `<div style="color:#aaa; font-size:0.9em; margin-top:5px;">Geen roem</div>`;

        detailsDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #555; padding-bottom:5px;">
                <span>Kaartpunten:</span> <strong>${trickData.points}</strong>
            </div>
            ${roemHtml}
            <div style="text-align:center; margin-top:10px; font-size:0.8em; color:#888;">
                Gewonnen door: ${playerNames[trickData.winnerIndex]}
            </div>
        `;

        const contentBox = document.querySelector('.last-trick-container');
        contentBox.appendChild(detailsDiv);

        overlay.classList.remove('hidden');
        overlay.onclick = () => overlay.classList.add('hidden');
    },

    updateRound: function(round) {
        const el = document.getElementById('round-current');
        if(el) el.innerText = round;
    },

    showGameOverScreen: function(totalScore) {
        this.vibrate([100, 50, 100, 50, 200]);
        const overlay = this.el['game-over-overlay'];
        const scoreUs = document.getElementById('go-score-us');
        const scoreThem = document.getElementById('go-score-them');
        const title = document.getElementById('go-title');
        const msg = document.getElementById('go-message');

        scoreUs.innerText = totalScore.us;
        scoreThem.innerText = totalScore.them;
        
        if (totalScore.us > totalScore.them) {
            title.innerText = "GEWONNEN! 🏆";
            title.style.color = "var(--accent-gold)";
            msg.innerText = "Wat een prestatie! Sla je score op.";
            this.startConfetti();
        } else {
            title.innerText = "VERLOREN...";
            title.style.color = "#ccc";
            msg.innerText = "Helaas! Volgende keer beter.";
        }

        overlay.classList.remove('hidden');
    },

    startConfetti: function() {
        const canvas = this.el['confetti-canvas'];
        if (!canvas) return;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;

        const colors = ['#ffc107', '#b71c1c', '#f5f5dc', '#ffffff', '#4CAF50']; 
        let particles = [];
        
        for(let i=0; i<100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                w: Math.random() * 5 + 5,
                h: Math.random() * 5 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                spin: Math.random() * 360,
                spinSpeed: (Math.random() - 0.5) * 10
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.y += p.vy;
                p.x += p.vx + Math.sin(p.y / 50);
                p.spin += p.spinSpeed;

                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.spin * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
            });

            this.animationFrameId = requestAnimationFrame(draw);
        };

        draw();
    },

    stopConfetti: function() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        const canvas = this.el['confetti-canvas'];
        if(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    // --- NIEUWE FUNCTIES VOOR TURFLIJST ---
    
    updateScoreSheet: function(history, totals) {
        const tbody = document.querySelector('#score-table-body tbody');
        const elTotalUs = document.getElementById('sheet-total-us');
        const elTotalThem = document.getElementById('sheet-total-them');
        
        if(!tbody) return;

        // Tabel leegmaken
        tbody.innerHTML = '';

        // Lijst vullen met rijen
        if (history && history.length > 0) {
            history.forEach(row => {
                const tr = document.createElement('tr');
                
                let classUs = "";
                let classThem = "";
                let suffixUs = "";
                let suffixThem = "";

                // Markeringen toevoegen
                if (row.type === 'PIT') {
                    if (row.scoreUs > row.scoreThem) { classUs = "mark-pit"; suffixUs = " (P)"; }
                    else { classThem = "mark-pit"; suffixThem = " (P)"; }
                }
                else if (row.type === 'NAT') {
                    // Wie was er nat? De spelende partij had 0 punten over
                    if (row.playingTeam === 'us') { classUs = "mark-nat"; suffixUs = " (Nat)"; }
                    else { classThem = "mark-nat"; suffixThem = " (Nat)"; }
                }

                tr.innerHTML = `
                    <td style="color:#aaa;">${row.round}</td>
                    <td class="${classUs}">${row.scoreUs}${suffixUs}</td>
                    <td class="${classThem}">${row.scoreThem}${suffixThem}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" style="padding:20px; color:#aaa;">Nog geen rondes gespeeld</td></tr>';
        }

        // Totalen onderaan bijwerken
        if(elTotalUs) elTotalUs.innerText = totals.us;
        if(elTotalThem) elTotalThem.innerText = totals.them;
    },

    toggleScoreSheet: function(show) {
        const el = document.getElementById('score-sheet-overlay');
        if (!el) return;

        if(show) {
            // Eerst updaten met de data uit Core
            this.updateScoreSheet(KJCore.matchHistory, KJCore.matchPoints);
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },

    // --- NIEUW: Haptische Feedback (Trillen) ---
    vibrate: function(pattern) {
        // Werkt op Android (iPhone blokkeert dit helaas in de browser)
        if (navigator.vibrate) {
            // Als er geen patroon is, geef een kort tikje (15ms)
            navigator.vibrate(pattern || 15);
        }
    }
};