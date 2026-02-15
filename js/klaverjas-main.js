/**
 * KLAVERJAS MAIN (Versie 2.4 - Met Firebase Leaderboard)
 */
const KlaverjasMain = {
    gameSpeed: 900,      
    playingTeam: null,   
    bidderIndex: 0,
    passesCount: 0,
    isFirstTrick: true,

    init: function() {
        this.showMenu();
    },

    showMenu: function() {
        // Verberg alles behalve menu
        ['game-view', 'leaderboard-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        document.getElementById('main-menu').classList.remove('hidden');
    },

    showLeaderboard: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('leaderboard-view').classList.remove('hidden');
        
        // Roep de service aan (die window.LeaderboardService is nu beschikbaar)
        if (window.LeaderboardService) {
            window.LeaderboardService.getTopScores('highscore-list');
        } else {
            console.error("Leaderboard service nog niet geladen");
        }
    },

    startGame: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-view').classList.remove('hidden');

        KJCore.init(); 
        KJUI.init(); 
        KJUI.updateScore({ us: 0, them: 0 }); 
        KJUI.setTrump(null);
        KJUI.updateRound(KJCore.currentRound);

        const oldCards = document.querySelectorAll('.table-anim-card');
        oldCards.forEach(c => c.remove());

        this.playingTeam = null;
        this.isFirstTrick = true; 
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
            if (KJCore.isValidMove(card, playerIndex)) {
                validCards.push({ card: card, index: index });
            }
        });

        if (validCards.length === 0) return;

        const getPower = (c) => {
            if (c.suit === KJCore.trumpSuit) return 100 + KJConfig.VALUES_TRUMP[c.rank].strength;
            if (KJCore.currentTrick.length > 0 && c.suit === KJCore.currentTrick[0].card.suit) {
                return KJConfig.VALUES_NORMAL[c.rank].strength;
            }
            return 0;
        };

        let chosenMove = validCards[0];

        if (KJCore.currentTrick.length > 0) {
            const currentWinner = KJCore.getTrickWinner(KJCore.currentTrick);
            const partnerIndex = (playerIndex + 2) % 4;
            const opponentWins = (currentWinner.playerIndex !== partnerIndex);
            const highestPowerOnTable = getPower(currentWinner.card);

            if (opponentWins) {
                const winningCards = validCards.filter(move => getPower(move.card) > highestPowerOnTable);
                if (winningCards.length > 0) {
                    winningCards.sort((a, b) => getPower(a.card) - getPower(b.card));
                    chosenMove = winningCards[0];
                } else {
                    validCards.sort((a, b) => getPower(a.card) - getPower(b.card));
                    chosenMove = validCards[0];
                }
            } else {
                const highPoints = validCards.filter(move => 
                    move.card.suit !== KJCore.trumpSuit && 
                    (move.card.rank === 'A' || move.card.rank === '10')
                );
                
                if (highPoints.length > 0) {
                    chosenMove = highPoints[0];
                } else {
                    validCards.sort((a, b) => getPower(a.card) - getPower(b.card));
                    chosenMove = validCards[0];
                }
            }
        } else {
            const aces = validCards.filter(m => m.card.rank === 'A' && m.card.suit !== KJCore.trumpSuit);
            if (aces.length > 0) {
                chosenMove = aces[0];
            } else {
                validCards.sort((a, b) => getPower(a.card) - getPower(b.card));
                chosenMove = validCards[0];
            }
        }

        KJUI.playCardAnimation(chosenMove.card, playerIndex);
        const result = KJCore.playCard(chosenMove.index);
        
        setTimeout(() => {
            this.handleTurnResult(result);
        }, 600); 
    },
    
    handleTurnResult: function(result) {
        if (result === 'TRICK_COMPLETE') {
            const winner = KJCore.getTrickWinner(KJCore.currentTrick);
            const isLastTrick = (KJCore.hands[0].length === 0);
            KJCore.lastTrick = [...KJCore.currentTrick]; 

            setTimeout(() => {
                let points = KJCore.calculateScore(KJCore.currentTrick, isLastTrick);
                let roemSlag = KJCore.calculateRoem(KJCore.currentTrick);
                let roemHand = 0;

                if (this.isFirstTrick) {
                    for (let i = 0; i < 4; i++) {
                        roemHand += KJCore.checkHandRoem(i);
                    }
                    this.isFirstTrick = false; 
                }

                let totaalRoem = roemSlag + roemHand;
                
                if (totaalRoem > 0) {
                    KJUI.showMessage(`ROEM! +${totaalRoem}`, 1500);
                } else {
                    KJUI.showMessage(`Speler ${winner.playerIndex} pakt de slag`, 1000);
                }

                KJCore.tricksWon[winner.playerIndex]++;
                if (winner.playerIndex === 0 || winner.playerIndex === 2) {
                    KJCore.points.us += (points + totaalRoem);
                } else {
                    KJCore.points.them += (points + totaalRoem);
                }
                KJUI.updateScore(KJCore.points);

                setTimeout(() => {
                    KJUI.clearTableAnimated(winner.playerIndex);
                    
                    setTimeout(() => {
                        KJCore.currentTrick = [];
                        KJCore.turnIndex = winner.playerIndex;
                        
                        if (isLastTrick) {
                            this.finalizeRound();
                        } else {
                            this.nextTurn();
                        }
                    }, 600); 
                }, 1000);

            }, 800); 
        } else {
            this.nextTurn();
        }
    },

    finalizeRound: function() {
        const result = KJCore.resolveRound(this.playingTeam);
        const isGameOver = result.nextRoundNumber > KJConfig.ROUNDS_PER_GAME;

        KJUI.updateRound(Math.min(result.nextRoundNumber, KJConfig.ROUNDS_PER_GAME));

        setTimeout(() => {
            if (isGameOver) {
                KJUI.showGameOverScreen(result.totalScore);
                
                // === GAME OVER KNOPPEN ===
                const btnSave = document.getElementById('btn-save-score');
                const btnMenu = document.getElementById('btn-to-menu');
                const input = document.getElementById('player-name-input');

                // Opslaan Knop
                btnSave.onclick = async () => {
                    const name = input.value;
                    if(!name) { alert("Vul je naam in!"); return; }
                    
                    btnSave.innerText = "Bezig...";
                    
                    // Gebruik de nieuwe Leaderboard Service
                    if (window.LeaderboardService) {
                        const success = await window.LeaderboardService.saveScore(name, result.totalScore.us);
                        if (success) {
                            alert("Score opgeslagen!");
                            location.reload(); 
                        } else {
                            btnSave.innerText = "PROBEER OPNIEUW";
                        }
                    } else {
                        alert("Fout: Service niet geladen.");
                    }
                };

                // Terug knop
                btnMenu.onclick = () => {
                    location.reload(); 
                };

            } else {
                let msgTitle = result.type === 'NAT' ? "NAT!" : (result.type.includes('PIT') ? "PIT!" : "Ronde Voorbij");
                const fullMsg = `${msgTitle}\nWij: ${result.roundScore.us} - Zij: ${result.roundScore.them}\nTotaal: Wij ${result.totalScore.us} - Zij ${result.totalScore.them}`;
                
                if (confirm(fullMsg + "\n\nVolgende ronde?")) {
                    this.startGame(); 
                }
            }
        }, 1500);
    },

    updateMyHand: function() { KJUI.renderHand(KJCore.hands[0]); },

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
    
    // NIEUW: Koppel Topscores en Terug knop
    bind('btn-topscores', () => KlaverjasMain.showLeaderboard());
    bind('btn-back-menu', () => KlaverjasMain.showMenu());

    bind('btn-rules', () => alert("Regels: Verplicht bekennen. Overtroeven verplicht als tegenstander wint."));
    bind('btn-restart', () => { if(confirm("Opnieuw beginnen?")) KlaverjasMain.startGame(); });
    bind('btn-pass', () => KlaverjasMain.pass());
    bind('btn-last-trick', () => KlaverjasMain.toggleLastTrick());

    ['h','d','s','c'].forEach(s => bind('btn-trump-'+s, () => KlaverjasMain.chooseTrump(s)));
});