/**
 * KLAVERJAS UI (Klaas Klaverjas Versie 2.7 - Statusbalk Update)
 */
const KJUI = {
    el: {},
    animationFrameId: null, // Voor het stoppen van de loop

    init: function() {
        // Cache belangrijke elementen
        // AANGEPAST: 'game-message' is vervangen door 'status-bar'
        const ids = ['player-hand-container', 'status-bar', 'trump-selection', 
                     'trump-indicator', 'score-us', 'score-them', 'game-table', 
                     'confetti-canvas', 'game-over-overlay'];
        
        ids.forEach(id => {
            this.el[id] = document.getElementById(id);
        });
        
        // Aliassen
        this.el.hand = this.el['player-hand-container'];
        this.el.msg = this.el['status-bar']; // Verwijst nu naar de statusbalk
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

        hand.forEach((card, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'hand-card'; 
            
            const mid = (totalCards - 1) / 2;
            const rotate = (index - mid) * 4; 
            const translateY = Math.abs(index - mid) * 4; 

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

    // AANGEPAST: Nieuwe logica voor de statusbalk
    showMessage: function(text, duration = 0) {
        // Zet de tekst in de balk
        this.el.msg.textContent = text || ""; 
        
        // Als er een tijdsduur is, wis de tekst dan na die tijd
        // Maar check wel of de tekst in de tussentijd niet al is veranderd door een nieuwe melding
        if (duration > 0) {
            setTimeout(() => {
                if (this.el.msg.textContent === text) {
                    this.el.msg.textContent = ""; // Of zet terug op een standaard welkomsttekst
                }
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

    showTrumpSelection: function(show) {
        if (show) this.el.trumpSelect.classList.remove('hidden');
        else this.el.trumpSelect.classList.add('hidden');
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

    renderLastTrick: function(trick) {
        const overlay = document.getElementById('last-trick-overlay');
        const container = document.getElementById('last-trick-cards');
        
        if (!overlay || !container) return;

        container.innerHTML = '';
        // Deze namen kloppen met de windrichtingen (Zuid = Speler 0, etc.)
        const playerNames = ['ZUID', 'WEST', 'NOORD', 'OOST'];

        trick.forEach(play => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'last-trick-item';

            const nameLabel = document.createElement('span');
            nameLabel.className = 'last-trick-label';
            nameLabel.innerText = playerNames[play.playerIndex];

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.createCardHTML(play.card);
            const cardElement = tempDiv.firstElementChild;

            cardElement.style.position = 'relative'; 
            cardElement.style.transform = 'scale(0.85)';
            cardElement.style.margin = '0';
            
            itemWrapper.appendChild(nameLabel);
            itemWrapper.appendChild(cardElement);
            
            container.appendChild(itemWrapper);
        });

        overlay.classList.remove('hidden');
        overlay.onclick = () => overlay.classList.add('hidden');
    },

    updateRound: function(round) {
        const el = document.getElementById('round-current');
        if(el) el.innerText = round;
    },

    showGameOverScreen: function(totalScore) {
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

    // --- CONFETTI OPTIMALISATIE ---
    startConfetti: function() {
        const canvas = this.el['confetti-canvas'];
        if (!canvas) return;

        // Stop vorige loop indien aanwezig
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

                // Reset particle als hij beneden is (continue loop)
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
    }
};