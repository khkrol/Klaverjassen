/**
 * KLAVERJAS MAIN (Versie 3.2 - Rotatie Fix Compleet)
 */
const KlaverjasMain = {
    gameSpeed: 900,      
    busy: false,
    playingTeam: null,   
    bidderIndex: 0,
    passesCount: 0,
    isFirstTrick: true,

    getPlayerName: function(index) {
        const names = ['Zuid', 'West', 'Noord', 'Oost'];
        return (index === 0) ? "Jij" : names[index];
    },

    getPlayerNameSubject: function(index) {
        const names = ['Zuid', 'West', 'Noord', 'Oost'];
        return (index === 0) ? "Jij" : names[index];
    },

init: function() {
    // Check of Config en Core geladen zijn
    if (typeof KJConfig === 'undefined' || typeof KJCore === 'undefined') {
        console.error("CRITISCH: Core bestanden niet geladen.");
        return;
    }

    this.bindEvents();
    this.showMenu();
    this.updateSettingsUI();
    
    console.log("Klaverjas Main geladen. Klaar voor start.");
},

bindEvents: function() {
        const clicks = {
            'btn-start-game': () => this.startGame(true),
            'btn-topscores': () => this.showLeaderboard(),
            'btn-rules': () => this.showRules(),
            'btn-info': () => this.showInfo(),
            'btn-back-info': () => this.showMenu(),
            'btn-settings': () => this.showSettings(),
            'btn-back-menu': () => this.showMenu(),
            'btn-back-rules': () => this.showMenu(),
            'btn-back-settings': () => this.showMenu(),
            'btn-restart': () => { if(confirm("Opnieuw beginnen?")) this.startGame(true); },
            'btn-pass': () => this.pass(),
            'btn-last-trick': () => this.toggleLastTrick(),
            'spd-slow': () => this.setGameSpeed('slow'),
            'spd-normal': () => this.setGameSpeed('normal'),
            'spd-fast': () => this.setGameSpeed('fast'),
            'rule-rotterdam': () => this.setRuleSet('rotterdam'),
            'rule-amsterdam': () => this.setRuleSet('amsterdam'),
            'mode-normal': () => this.setBiddingMode('normal'),
            'mode-drents': () => this.setBiddingMode('drents'),
            'btn-play-drents': () => this.acceptDrentsBid(),
            'btn-info-rules-toggle': () => document.getElementById('info-overlay-rules').classList.remove('hidden'),
            'btn-close-rules-info': () => document.getElementById('info-overlay-rules').classList.add('hidden'),
            'btn-info-mode-toggle': () => document.getElementById('info-overlay-mode').classList.remove('hidden'),
            'btn-close-mode-info': () => document.getElementById('info-overlay-mode').classList.add('hidden'),
            'btn-score-sheet': () => KJUI.toggleScoreSheet(true),
            'btn-close-sheet': () => KJUI.toggleScoreSheet(false)
        };

        for (const [id, handler] of Object.entries(clicks)) {
            const el = document.getElementById(id);
            if (el) el.onclick = handler;
        }

        ['h','d','s','c'].forEach(s => {
            const el = document.getElementById('btn-trump-'+s);
            if(el) el.onclick = () => this.chooseTrump(s);
        });
    },

    showMenu: function() {
        ['game-view', 'leaderboard-view', 'rules-view', 'settings-view', 'info-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        document.getElementById('main-menu').classList.remove('hidden');
    },

    showLeaderboard: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('leaderboard-view').classList.remove('hidden');
        if (window.LeaderboardService) window.LeaderboardService.getTopScores('klaverjas','highscore-list');
    },

    showRules: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('rules-view').classList.remove('hidden');
    },

    showInfo: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('info-view').classList.remove('hidden');
},

    showSettings: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('settings-view').classList.remove('hidden');
        this.updateSettingsUI();
    },

    setGameSpeed: function(speedType) {
        let speedMs = 900; 
        if (speedType === 'slow') speedMs = 1500;
        if (speedType === 'fast') speedMs = 400;
        this.gameSpeed = speedMs;
        localStorage.setItem('klaverjas_speed', speedType);
        this.updateSettingsUI();
    },

    setRuleSet: function(ruleType) {
        KJCore.ruleSet = ruleType;
        localStorage.setItem('klaverjas_rules', ruleType);
        this.updateSettingsUI();
    },

    setBiddingMode: function(mode) {
        KJCore.biddingMode = mode;
        localStorage.setItem('klaverjas_mode', mode);
        this.updateSettingsUI();
    },

updateSettingsUI: function() {
    // 1. SNELHEID
    const savedSpeed = localStorage.getItem('klaverjas_speed') || 'normal';
    ['slow', 'normal', 'fast'].forEach(type => {
        const btn = document.getElementById('spd-' + type);
        if(btn) btn.classList.remove('btn-active');
    });
    const activeSpeedBtn = document.getElementById('spd-' + savedSpeed);
    if(activeSpeedBtn) activeSpeedBtn.classList.add('btn-active');

    // 2. REGELS (Tekst labels verwijderd)
    const savedRules = localStorage.getItem('klaverjas_rules') || 'amsterdam';
    ['rotterdam', 'amsterdam'].forEach(type => {
        const btn = document.getElementById('rule-' + type);
        if(btn) btn.classList.remove('btn-active');
    });
    const activeRuleBtn = document.getElementById('rule-' + savedRules);
    if(activeRuleBtn) activeRuleBtn.classList.add('btn-active');

    // 3. MODE (Tekst labels verwijderd)
    const savedMode = localStorage.getItem('klaverjas_mode') || 'drents';
    ['normal', 'drents'].forEach(type => {
        const btn = document.getElementById('mode-' + type);
        if(btn) btn.classList.remove('btn-active');
    });
    const activeModeBtn = document.getElementById('mode-' + savedMode);
    if(activeModeBtn) activeModeBtn.classList.add('btn-active');
},

startGame: function(isNewGame = false) {
        try {
            if (typeof KJCore === 'undefined' || typeof KJUI === 'undefined' || typeof KJConfig === 'undefined') {
                throw new Error("Een van de spel-bestanden (Core, UI of Config) is niet geladen!");
            }

            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');

            // --- ROTATIE LOGICA & TURFLIJST RESET ---
            if (isNewGame) {
                // NIEUW SPEL (Ronde 1):
                // Reset punten in de CORE (niet in Main)
                KJCore.matchPoints = { us: 0, them: 0 };
                
                // Reset de geschiedenis/turflijst in de CORE
                KJCore.matchHistory = []; 
                KJUI.updateScoreSheet([], { us: 0, them: 0 }); // Maak de lijst visueel ook leeg

                // Zet deler op West (1), zodat bieder Noord (2) begint
                KJCore.dealerIndex = 1; 
            } else {
                // VOLGENDE RONDE (Ronde 2+):
                // Schuif deler eentje op
                KJCore.dealerIndex = (KJCore.dealerIndex + 1) % 4;
            }

            KJCore.init(); 
            KJUI.init(); 
            KJUI.updateScore(KJCore.matchPoints); // Update totaalscore
            KJUI.setTrump(null);
            
            KJCore.biddingRound = 1;
            KJCore.proposedSuit = null;
            
            if(KJCore.currentRound) {
                KJUI.updateRound(KJCore.currentRound);
            }

            // Oude animaties verwijderen
            const oldCards = document.querySelectorAll('.table-anim-card');
            oldCards.forEach(c => c.remove());

            this.playingTeam = null;
            this.isFirstTrick = true; 
            
            this.updateMyHand();
            this.startBiddingPhase();

        } catch (error) {
            console.error(error);
            alert("Er ging iets mis bij het starten: " + error.message);
        }
    },

    startBiddingPhase: function() {
        this.bidderIndex = (KJCore.dealerIndex + 1) % 4;
        this.passesCount = 0;
        KJCore.biddingRound = 1; 

        if (KJCore.biddingMode === 'drents') {
            const suits = ['h', 'd', 's', 'c'];
            KJCore.proposedSuit = suits[Math.floor(Math.random() * suits.length)];
            const randomRank = ['J', '9', 'A', '10', 'K', 'Q'][Math.floor(Math.random() * 6)];
            
            if (KJUI.showBidCard) {
                KJUI.showBidCard({ suit: KJCore.proposedSuit, rank: randomRank });
                const suitName = Object.values(KJConfig.SUITS).find(k => k.id === KJCore.proposedSuit).name;
                KJUI.showMessage(`Gedraaid: ${suitName}`);
            }
        }
        
        const bidderName = this.getPlayerNameSubject(this.bidderIndex);
        setTimeout(() => {
            KJUI.showMessage(`${bidderName} mag spreken.`);
            this.askBidder();
        }, 1000);
    },

    askBidder: function() {
        KJUI.updateActivePlayer(this.bidderIndex);

        if (this.passesCount >= 4) {
            if (KJCore.biddingMode === 'drents' && KJCore.biddingRound === 1) {
                this.handleDrentsForcedRound();
                return;
            }

            KJUI.showMessage("Iedereen past. Nieuwe ronde...", 2000);
            if(KJUI.hideBidCard) KJUI.hideBidCard(); 
            
            setTimeout(() => {
                KJCore.reDeal(); 
                KJUI.setTrump(null);
                this.updateMyHand();
                this.startBiddingPhase(); 
            }, 2000);
            return;
        }

        if (this.bidderIndex === 0) {
            if (KJUI.showTrumpSelection) {
                KJUI.showTrumpSelection(true, KJCore.biddingMode, KJCore.proposedSuit);
            }
            KJUI.showMessage("Jouw beurt: Kiezen of Passen?", 0);
        } else {
            if (KJUI.showTrumpSelection) KJUI.showTrumpSelection(false);
            const bidderName = this.getPlayerNameSubject(this.bidderIndex);
            KJUI.showMessage(`${bidderName} denkt na...`, 0);
            setTimeout(() => this.computerBid(this.bidderIndex), 1000);
        }
    },

    handleDrentsForcedRound: function() {
        KJCore.biddingRound = 2;
        KJUI.showMessage("Iedereen past! Verplicht spelen...", 1500);
        
        const suits = ['h', 'd', 's', 'c'];
        let newSuit = KJCore.proposedSuit;
        while (newSuit === KJCore.proposedSuit) {
            newSuit = suits[Math.floor(Math.random() * suits.length)];
        }
        
        KJCore.proposedSuit = newSuit;
        
        const randomRank = ['J', '9', 'A'][Math.floor(Math.random() * 3)];
        if(KJUI.showBidCard) KJUI.showBidCard({ suit: newSuit, rank: randomRank });
        
        const forehand = (KJCore.dealerIndex + 1) % 4;
        const forehandName = this.getPlayerNameSubject(forehand);
        const suitName = Object.values(KJConfig.SUITS).find(k => k.id === newSuit).name;
        
        setTimeout(() => {
            KJUI.showMessage(`${forehandName} MOET spelen op ${suitName}!`);
            this.chooseTrump(newSuit, forehand);
        }, 1500);
    },

    acceptDrentsBid: function() {
        if (KJCore.biddingMode === 'drents' && KJCore.proposedSuit) {
            this.chooseTrump(KJCore.proposedSuit, 0);
        }
    },

    computerBid: function(playerIndex) {
        const hand = KJCore.hands[playerIndex];
        
        const calculateSuitPoints = (suit) => {
            let points = 0;
            let trumpCount = 0;
            let hasNel = false;
            let hasJas = false;

            hand.forEach(card => {
                if (card.suit === suit) {
                    trumpCount++;
                    if (card.rank === 'J') { points += 20; hasJas = true; }
                    else if (card.rank === '9') { points += 14; hasNel = true; }
                    else if (card.rank === 'A') points += 10;
                    else points += 5; 
                } else if (card.rank === 'A') {
                    points += 5;
                }
            });
            if (hasJas && hasNel) points += 15;
            points += (trumpCount * 5); 
            return points;
        };

        if (KJCore.biddingMode === 'drents') {
            const points = calculateSuitPoints(KJCore.proposedSuit);
            const threshold = 40; 

            if (points > threshold) {
                this.chooseTrump(KJCore.proposedSuit, playerIndex);
            } else {
                this.pass();
            }
        } else {
            const suits = ['h', 'd', 's', 'c'];
            let bestSuit = null;
            let maxPoints = 0;

            suits.forEach(suit => {
                let p = calculateSuitPoints(suit);
                if (p > maxPoints) { maxPoints = p; bestSuit = suit; }
            });

            if (maxPoints > 45 && bestSuit) {
                this.chooseTrump(bestSuit, playerIndex);
            } else {
                this.pass();
            }
        }
    },

    chooseTrump: function(suit, playerIndex = 0) {
        KJCore.trumpSuit = suit;
        this.playingTeam = (playerIndex === 0 || playerIndex === 2) ? 'us' : 'them';
        
        KJUI.setTrump(suit);
        KJUI.showTrumpSelection(false);
        if(KJUI.hideBidCard) KJUI.hideBidCard();

        const suitName = Object.values(KJConfig.SUITS).find(s => s.id === suit).name;
        KJUI.showMessage(`${this.getPlayerNameSubject(playerIndex)} speelt ${suitName}!`);
        
        KJCore.turnIndex = (KJCore.dealerIndex + 1) % 4;
        setTimeout(() => this.nextTurn(), 1500);
    },

    pass: function() {
        KJUI.showMessage(`${this.getPlayerNameSubject(this.bidderIndex)} past.`);
        
        if (this.bidderIndex === 0) KJUI.showTrumpSelection(false);
        this.passesCount++;
        this.bidderIndex = (this.bidderIndex + 1) % 4; 
        setTimeout(() => this.askBidder(), 800);
    },

    nextTurn: function() {
        const playerIndex = KJCore.turnIndex;
        KJUI.updateActivePlayer(playerIndex);

        if (playerIndex === 0) {
            this.updateMyHand(); 
            KJUI.showMessage("Jouw beurt", 0);
        } else {
            setTimeout(() => this.computerMove(playerIndex), this.gameSpeed);
        }
    },

onCardClick: function(cardIndex) {
    // 1. Check: Is het mijn beurt en ben ik niet al bezig?
    if (KJCore.turnIndex !== 0 || this.busy) return; 

    const card = KJCore.hands[0][cardIndex];
    const validation = KJCore.validateMove(card, 0);

    if (validation.valid) {
        this.busy = true; 
        KJUI.vibrate(15);

        // 2. Start de animatie (visueel)
        // Dit maakt een kopie die over het scherm vliegt
        KJUI.playCardAnimation(card, 0);

        // 3. Update de Core data (logica)
        // De kaart wordt nu écht uit de array KJCore.hands[0] verwijderd
        const result = KJCore.playCard(cardIndex);

        // 4. DE OPLOSSING: Teken de hand DIRECT opnieuw
        // Omdat de kaart uit de array is, wordt de hand nu getekend ZONDER die kaart.
        // De overgebleven kaarten schuiven meteen netjes tegen elkaar aan.
        // Of als het de laatste kaart was, is de hand nu direct leeg.
        this.updateMyHand();

        // 5. Wacht op de animatie en handel de beurt af
        setTimeout(() => {
            this.handleTurnResult(result);
            this.busy = false; 
        }, 600); // 600ms wachten tot de kaart op tafel ligt

    } else {
        KJUI.showMessage(validation.reason);
        if(KJUI.shakeHand) KJUI.shakeHand();
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

        // NIEUWE SITUATIE in klaverjas-main.js
        const getPower = (c) => {
            // Hier gebruiken we nu de variabele uit de config
            if (c.suit === KJCore.trumpSuit) return KJConfig.TRUMP_BONUS + KJConfig.VALUES_TRUMP[c.rank].strength;
            
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
            
            let cardPoints = KJCore.calculateScore(KJCore.currentTrick, isLastTrick);
            let roemResult = KJCore.calculateRoem(KJCore.currentTrick);
            let roemPoints = roemResult.total;

            KJCore.lastTrick = {
                cards: [...KJCore.currentTrick],
                winnerIndex: winner.playerIndex,
                points: cardPoints,
                roem: roemResult 
            };

            const totalPoints = cardPoints + roemPoints;
            const winnerName = this.getPlayerName(winner.playerIndex);

            KJCore.tricksWon[winner.playerIndex]++;
            
            if (winner.playerIndex === 0 || winner.playerIndex === 2) {
                KJCore.points.us += totalPoints;
            } else {
                KJCore.points.them += totalPoints;
            }
            
            KJUI.updateScore(KJCore.points);

            let message = `${winnerName} pakt slag`;

            if (roemPoints > 0) {
                const roemTekst = roemResult.desc.join(' + ');
                message = `${winnerName}: ${cardPoints} + ${roemTekst}!`;
                KJUI.shakeHand(); 
            } else if (cardPoints > 0) {
                message = `${winnerName} (${cardPoints} punten)`;
            }

            KJUI.showMessage(message, 2000);

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
            }, 1500); 
        } else {
            this.nextTurn();
        }
    },

// In KlaverjasMain object...

finalizeRound: function() {
    const result = KJCore.resolveRound(this.playingTeam);
    const isGameOver = result.nextRoundNumber > KJConfig.ROUNDS_PER_GAME;

    // Update de UI teller
    KJUI.updateRound(Math.min(result.nextRoundNumber, KJConfig.ROUNDS_PER_GAME));
    KJUI.showMessage("Einde Ronde", 0);

    setTimeout(() => {
        if (isGameOver) {
            // Einde spel scenario
            KJUI.showGameOverScreen(result.totalScore);
            this.setupGameOverButtons(result.totalScore);
        } else {
            // Tussentijdse ronde scenario (NIEUW)
            this.showRoundEndScreen(result);
        }
    }, 1000);
},

// NIEUWE FUNCTIE: Toon de mooie ronde popup
showRoundEndScreen: function(result) {
    const overlay = document.getElementById('round-end-overlay');
    const btnNext = document.getElementById('btn-next-round');
    
    // Vul de data in
    document.getElementById('re-score-us').innerText = "+" + result.roundScore.us;
    document.getElementById('re-score-them').innerText = "+" + result.roundScore.them;
    document.getElementById('re-total-us').innerText = result.totalScore.us;
    document.getElementById('re-total-them').innerText = result.totalScore.them;
    
    // Bepaal titel en bericht (Pit/Nat)
    const titleEl = document.getElementById('re-title');
    const msgEl = document.getElementById('re-message');
    
    if (result.type === 'NAT') {
        titleEl.innerText = "NAT! 💦";
        titleEl.style.color = "#ef5350"; // Rood
        msgEl.innerText = "De punten gaan naar de tegenstander.";
    } else if (result.type === 'PIT') {
        titleEl.innerText = "PIT! 🔥";
        titleEl.style.color = "#ffca28"; // Goud
        msgEl.innerText = "Alle slagen gewonnen! (+100 punten)";
    } else {
        titleEl.innerText = "RONDE VOORBIJ";
        titleEl.style.color = "var(--accent-gold)";
        msgEl.innerText = "";
    }

    // Toon scherm
    overlay.classList.remove('hidden');

    // Knop functionaliteit (éénmalig binden of old-school onclick resetten)
    btnNext.onclick = () => {
        overlay.classList.add('hidden');
        this.startGame(false); // Start volgende ronde
    };
},
    
// In js/klaverjas-main.js -> KlaverjasMain object:

setupGameOverButtons: function(totalScore) {
        const btnSave = document.getElementById('btn-save-score');
        const btnMenu = document.getElementById('btn-to-menu');
        const input = document.getElementById('player-name-input');
        const msgLabel = document.getElementById('go-message'); 

        btnSave.onclick = async () => {
            const name = input.value;
            
            // --- NIEUWE VALIDATIE ---
            if(!name) { 
                // Geen alert, maar visuele feedback
                input.style.borderColor = "#ff5252"; // Rood
                input.style.boxShadow = "0 0 10px rgba(255, 82, 82, 0.5)";
                
                // Bewaar originele tekst
                const originalText = btnSave.innerText;
                
                btnSave.innerText = "NAAM VERPLICHT!";
                btnSave.style.background = "#b71c1c"; // Donkerrood
                
                // Reset na 2 seconden
                setTimeout(() => {
                    input.style.borderColor = ""; 
                    input.style.boxShadow = "";
                    btnSave.innerText = originalText;
                    btnSave.style.background = ""; 
                }, 2000);
                return; 
            }
            // -------------------------
            
            // 1. Visuele feedback: Bezig...
        btnSave.innerText = "⏳ BEZIG...";
        btnSave.disabled = true;
        
        if (window.LeaderboardService) {
            const success = await window.LeaderboardService.saveScore('klaverjas', name, totalScore.us);
            
            if (success) {
                // 2. SUCCES: Verander de knop en tekst
                btnSave.innerText = "✅ OPGESLAGEN!";
                btnSave.style.background = "#4CAF50"; // Groen
                btnSave.style.borderColor = "#2E7D32";
                
                msgLabel.innerText = "Bedankt voor het spelen!";
                msgLabel.style.color = "var(--accent-gold)";

                // 3. Wacht even en herlaad dan
                setTimeout(() => {
                    location.reload(); 
                }, 1500); 

            } else {
                // FOUT
                btnSave.innerText = "PROBEER OPNIEUW";
                btnSave.disabled = false;
            }
        } else {
            console.error("Service niet geladen");
        }
    };

    btnMenu.onclick = () => {
        location.reload(); 
    };
},

    updateMyHand: function() { KJUI.renderHand(KJCore.hands[0]); },

    toggleLastTrick: function() {
        // We sturen ALTIJD door naar de UI, die bepaalt zelf wat hij laat zien (Slag of Troef-info)
        KJUI.renderLastTrick(KJCore.lastTrick);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    KlaverjasMain.init();
});