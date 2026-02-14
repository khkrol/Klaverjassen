/**
 * KLAVERJAS MAIN (Versie 2.2 - Met Vorige Slag ondersteuning)
 */
const KlaverjasMain = {
    gameSpeed: 900,      
    playingTeam: null,   
    bidderIndex: 0,
    passesCount: 0,

    init: function() {
        this.showMenu();
    },

    showMenu: function() {
        const menu = document.getElementById('main-menu');
        const game = document.getElementById('game-view');
        if(menu) menu.classList.remove('hidden');
        if(game) game.classList.add('hidden');
    },

    startGame: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-view').classList.remove('hidden');

        KJCore.init(); 
        KJUI.init(); 
        KJUI.updateScore({ us: 0, them: 0 }); 
        KJUI.setTrump(null);
        
        const oldCards = document.querySelectorAll('.table-anim-card');
        oldCards.forEach(c => c.remove());

        this.playingTeam = null;
        this.updateMyHand();
        this.startBiddingPhase();
    },

    startBiddingPhase: function() {
        this.bidderIndex = (KJCore.dealerIndex + 1) % 4;
        this.passesCount = 0;
        KJUI.showMessage(`Speler ${this.bidderIndex} mag bieden.`);
        this.askBidder();
    },

    askBidder: function() {
        KJUI.updateActivePlayer(this.bidderIndex);

        if (this.passesCount >= 4) {
            KJUI.showMessage("Iedereen past. Nieuwe ronde...", 2000);
            setTimeout(() => {
                KJCore.reDeal(); 
                KJUI.setTrump(null);
                this.updateMyHand();
                this.startBiddingPhase(); 
            }, 2000);
            return;
        }

        if (this.bidderIndex === 0) {
            KJUI.showMessage("Kies Troef of Pas", 0);
            KJUI.showTrumpSelection(true);
        } else {
            KJUI.showTrumpSelection(false);
            KJUI.showMessage(`Speler ${this.bidderIndex} denkt na...`, 0);
            setTimeout(() => this.computerBid(this.bidderIndex), 1000);
        }
    },

    computerBid: function(playerIndex) {
        const hand = KJCore.hands[playerIndex];
        const suits = ['h', 'd', 's', 'c'];
        let bestSuit = null;
        let maxPoints = 0;

        suits.forEach(suit => {
            let points = 0;
            let trumpCount = 0;
            hand.forEach(card => {
                if (card.suit === suit) {
                    trumpCount++;
                    if (card.rank === 'J') points += 20;
                    if (card.rank === '9') points += 14;
                    if (card.rank === 'A') points += 10;
                } else if (card.rank === 'A') points += 5;
            });
            points += (trumpCount * 10);
            if (points > maxPoints) { maxPoints = points; bestSuit = suit; }
        });

        if (maxPoints > 45 && bestSuit) {
            this.chooseTrump(bestSuit, playerIndex);
        } else {
            this.pass();
        }
    },

    chooseTrump: function(suit, playerIndex = 0) {
        KJCore.trumpSuit = suit;
        this.playingTeam = (playerIndex === 0 || playerIndex === 2) ? 'us' : 'them';
        KJUI.setTrump(suit);
        KJUI.showTrumpSelection(false);
        const suitName = Object.values(KJConfig.SUITS).find(s => s.id === suit).name;
        KJUI.showMessage(`${playerIndex === 0 ? 'Jij speelt' : 'Speler ' + playerIndex + ' speelt'} ${suitName}!`);
        KJCore.turnIndex = (KJCore.dealerIndex + 1) % 4;
        setTimeout(() => this.nextTurn(), 1500);
    },

    pass: function() {
        KJUI.showMessage(`Speler ${this.bidderIndex} past.`);
        if (this.bidderIndex === 0) KJUI.showTrumpSelection(false);
        this.passesCount++;
        this.bidderIndex = (this.bidderIndex + 1) % 4; 
        setTimeout(() => this.askBidder(), 800);
    },

    nextTurn: function() {
        const playerIndex = KJCore.turnIndex;
        KJUI.updateActivePlayer(playerIndex);

        if (playerIndex === 0) {
            KJUI.showMessage("Jouw beurt", 0);
        } else {
            setTimeout(() => this.computerMove(playerIndex), this.gameSpeed);
        }
    },

    onCardClick: function(cardIndex) {
        if (KJCore.turnIndex !== 0) return; 
        const card = KJCore.hands[0][cardIndex];
        
        if (KJCore.isValidMove(card, 0)) {
            KJUI.playCardAnimation(card, 0);
            const result = KJCore.playCard(cardIndex);
            this.updateMyHand();
            this.handleTurnResult(result);
        } else {
            KJUI.shakeHand(); 
            KJUI.showMessage("Dat mag niet!");
        }
    },

    computerMove: function(playerIndex) {
        const hand = KJCore.hands[playerIndex];
        const validCards = [];
        hand.forEach((card, index) => {
            if (KJCore.isValidMove(card, playerIndex)) validCards.push({ card: card, index: index });
        });

        if (validCards.length === 0) return;

        validCards.sort((a, b) => {
            const getVal = (c) => (c.suit === KJCore.trumpSuit) ? KJConfig.VALUES_TRUMP[c.rank].points : KJConfig.VALUES_NORMAL[c.rank].points;
            return getVal(a.card) - getVal(b.card);
        });

        const chosenMove = validCards[0];
        KJUI.playCardAnimation(chosenMove.card, playerIndex);
        const result = KJCore.playCard(chosenMove.index);
        this.handleTurnResult(result);
    },
    
    handleTurnResult: function(result) {
        if (result === 'TRICK_COMPLETE') {
            const winner = KJCore.getTrickWinner(KJCore.currentTrick);
            const isLastTrick = (KJCore.hands[0].length === 0);
            
            // Sla de slag op voordat we de tafel leegmaken
            KJCore.lastTrick = [...KJCore.currentTrick]; 

            setTimeout(() => {
                let points = KJCore.calculateScore(KJCore.currentTrick, isLastTrick);
                let roem = KJCore.calculateRoem(KJCore.currentTrick);
                
                if (roem > 0) KJUI.showMessage(`ROEM! +${roem}`, 2000);
                else KJUI.showMessage(`Speler ${winner.playerIndex} pakt hem`, 1000);

                KJCore.tricksWon[winner.playerIndex]++;
                if (winner.playerIndex === 0 || winner.playerIndex === 2) KJCore.points.us += (points + roem);
                else KJCore.points.them += (points + roem);
                
                KJUI.updateScore(KJCore.points);
                KJCore.currentTrick = [];
                KJUI.clearTableAnimated(winner.playerIndex);
                
                KJCore.turnIndex = winner.playerIndex;
                if (isLastTrick) this.finalizeRound();
                else this.nextTurn();
            }, 1200); 
        } else {
            this.nextTurn();
        }
    },

    finalizeRound: function() {
        const result = KJCore.resolveRound(this.playingTeam);
        setTimeout(() => {
            let msgTitle = result.type === 'NAT' ? "NAT!" : (result.type.includes('PIT') ? "PIT!" : "Ronde Voorbij");
            const fullMsg = `${msgTitle}\nWij: ${result.roundScore.us} - Zij: ${result.roundScore.them}\nTotaal: Wij ${result.totalScore.us} - Zij ${result.totalScore.them}`;
            
            if (confirm(fullMsg + "\n\nVolgende ronde?")) {
                KJCore.reDeal();
                KJUI.updateScore({ us: 0, them: 0 });
                this.updateMyHand();
                this.startBiddingPhase();
            }
        }, 1500);
    },

    updateMyHand: function() { KJUI.renderHand(KJCore.hands[0]); },

    /**
     * NIEUW: Koppeling met de UI voor de vorige slag
     */
    toggleLastTrick: function() {
        if (KJCore.lastTrick.length === 0) {
            KJUI.showMessage("Nog geen vorige slag!", 1500);
            return;
        }
        KJUI.renderLastTrick(KJCore.lastTrick);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    KlaverjasMain.init();
    const bind = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

    bind('btn-start-game', () => KlaverjasMain.startGame());
    bind('btn-rules', () => alert("Regels: Verplicht bekennen. Overtroeven verplicht als tegenstander wint."));
    bind('btn-restart', () => { if(confirm("Opnieuw beginnen?")) KlaverjasMain.startGame(); });
    bind('btn-pass', () => KlaverjasMain.pass());
    
    // De knop voor de vorige slag activeren!
    bind('btn-last-trick', () => KlaverjasMain.toggleLastTrick());

    ['h','d','s','c'].forEach(s => bind('btn-trump-'+s, () => KlaverjasMain.chooseTrump(s)));
});