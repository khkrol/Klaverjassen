/**
 * KLAVERJAS UI (Lumina Versie 2.2 - Met Waaier Effect)
 */
const KJUI = {
    el: {},

    init: function() {
        // We slaan verwijzingen op naar belangrijke HTML elementen
        this.el.hand = document.getElementById('player-hand-container');
        this.el.msg = document.getElementById('game-message');
        this.el.trumpSelect = document.getElementById('trump-selection');
        this.el.trumpIndicator = document.getElementById('trump-indicator');
        this.el.scoreUs = document.getElementById('score-us');
        this.el.scoreThem = document.getElementById('score-them');
        this.el.table = document.getElementById('game-table'); 
    },

    // Helper: Maak HTML string voor één kaart
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

    /**
     * Teken de kaarten in de hand van de speler
     * VERBETERING: Kaarten worden nu in een waaier (arc) getoond
     */
    renderHand: function(hand) {
        this.el.hand.innerHTML = ''; 
        const totalCards = hand.length;
        
        hand.forEach((card, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'hand-card'; 
            
            // Bereken de rotatie en verticale verschuiving voor het waaier-effect
            const mid = (totalCards - 1) / 2;
            const rotate = (index - mid) * 4; // Draai de kaarten lichtjes
            const translateY = Math.abs(index - mid) * 4; // De buitenste kaarten staan iets lager

            wrapper.style.transform = `rotate(${rotate}deg) translateY(${translateY}px)`;
            wrapper.innerHTML = this.createCardHTML(card);
            
            // Klik event koppelen
            wrapper.onclick = () => KlaverjasMain.onCardClick(index);
            
            this.el.hand.appendChild(wrapper);
        });
    },

    // Toon berichten (toasts)
    showMessage: function(text, duration = 0) {
        this.el.msg.textContent = text;
        this.el.msg.classList.remove('hidden');
        if (duration > 0) {
            setTimeout(() => this.el.msg.classList.add('hidden'), duration);
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

    /**
     * Verbetert de animatie: kaarten vliegen naar de winnaar van de slag
     */
    clearTableAnimated: function(winnerIndex) {
        const cards = document.querySelectorAll('.table-anim-card');
        
        // Bepaal de doelpositie op basis van de winnaar (overeenkomstig met player CSS)
        const targets = [
            { bottom: '-100px', left: '50%' },  // Jij (Player 0)
            { top: '50%', left: '-100px' },     // Links (Player 1)
            { top: '-100px', left: '50%' },     // Maat (Player 2)
            { top: '50%', left: '110%' }        // Rechts (Player 3)
        ];

        const target = targets[winnerIndex];

        cards.forEach(card => {
            // Stap 1: Beweeg naar de winnende speler
            card.style.transition = 'all 0.5s ease-in';
            card.style.top = target.top || 'auto';
            card.style.bottom = target.bottom || 'auto';
            card.style.left = target.left || 'auto';
            card.style.transform = 'scale(0.2) rotate(15deg)';
            card.style.opacity = '0';
        });

        // Stap 2: Verwijder de elementen uit de DOM na de animatie
        setTimeout(() => {
            cards.forEach(c => c.remove());
        }, 550);
    },

    /**
     * Toont de vorige slag in de overlay
     */
    renderLastTrick: function(trick) {
        const overlay = document.getElementById('last-trick-overlay');
        const container = document.getElementById('last-trick-cards');
        
        if (!overlay || !container) return;

        container.innerHTML = '';
        trick.forEach(play => {
            const cardWrapper = document.createElement('div');
            cardWrapper.innerHTML = this.createCardHTML(play.card);
            container.appendChild(cardWrapper.firstElementChild);
        });

        overlay.classList.remove('hidden');
        
        // Sluit overlay bij klik
        overlay.onclick = () => overlay.classList.add('hidden');
    },

    // NIEUWE FUNCTIES FASE 3
    updateRound: function(round) {
        const el = document.getElementById('round-current');
        if(el) el.innerText = round;
    },

    showGameOverScreen: function(totalScore) {
        const overlay = document.getElementById('game-over-overlay');
        const scoreUs = document.getElementById('go-score-us');
        const scoreThem = document.getElementById('go-score-them');
        const title = document.getElementById('go-title');
        const msg = document.getElementById('go-message');

        // Vul data in
        scoreUs.innerText = totalScore.us;
        scoreThem.innerText = totalScore.them;
        
        if (totalScore.us > totalScore.them) {
            title.innerText = "GEWONNEN! 🏆";
            title.style.color = "var(--accent-gold)";
            msg.innerText = "Wat een prestatie! Sla je score op.";
        } else {
            title.innerText = "VERLOREN...";
            title.style.color = "#ccc";
            msg.innerText = "Helaas! Volgende keer beter.";
        }

        overlay.classList.remove('hidden');
    }
};