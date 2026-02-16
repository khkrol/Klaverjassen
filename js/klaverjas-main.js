/**
 * KLAVERJAS MAIN (Versie 2.8 - Debug & Fix)
 */
const KlaverjasMain = {
    gameSpeed: 900,      
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
        const savedSpeed = localStorage.getItem('klaverjas_speed') || 'normal';
        this.setGameSpeed(savedSpeed);

        const savedRules = localStorage.getItem('klaverjas_rules') || 'rotterdam';
        this.setRuleSet(savedRules);
        
        this.bindEvents();
        this.showMenu();
    },

    bindEvents: function() {
        // Koppel alle knoppen aan functies
        const clicks = {
            'btn-start-game': () => this.startGame(),
            'btn-topscores': () => this.showLeaderboard(),
            'btn-rules': () => this.showRules(),
            'btn-settings': () => this.showSettings(),
            'btn-back-menu': () => this.showMenu(),
            'btn-back-rules': () => this.showMenu(),
            'btn-back-settings': () => this.showMenu(),
            'btn-restart': () => { if(confirm("Opnieuw beginnen?")) this.startGame(); },
            'btn-pass': () => this.pass(),
            'btn-last-trick': () => this.toggleLastTrick(),
            'spd-slow': () => this.setGameSpeed('slow'),
            'spd-normal': () => this.setGameSpeed('normal'),
            'spd-fast': () => this.setGameSpeed('fast'),
            'rule-rotterdam': () => this.setRuleSet('rotterdam'),
            'rule-amsterdam': () => this.setRuleSet('amsterdam')
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
        ['game-view', 'leaderboard-view', 'rules-view', 'settings-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        document.getElementById('main-menu').classList.remove('hidden');
    },

    showLeaderboard: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('leaderboard-view').classList.remove('hidden');
        if (window.LeaderboardService) window.LeaderboardService.getTopScores('highscore-list');
    },

    showRules: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('rules-view').classList.remove('hidden');
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

    updateSettingsUI: function() {
        const savedSpeed = localStorage.getItem('klaverjas_speed') || 'normal';
        ['slow', 'normal', 'fast'].forEach(type => {
            const btn = document.getElementById('spd-' + type);
            if(btn) btn.classList.remove('btn-active');
        });
        const activeSpeedBtn = document.getElementById('spd-' + savedSpeed);
        if(activeSpeedBtn) activeSpeedBtn.classList.add('btn-active');
        
        const speedLabels = { slow: "Rustig", normal: "Normaal", fast: "Vlot" };
        const lblSpeed = document.getElementById('current-speed-label');
        if(lblSpeed) lblSpeed.innerText = `Huidig: ${speedLabels[savedSpeed]}`;

        const savedRules = localStorage.getItem('klaverjas_rules') || 'rotterdam';
        ['rotterdam', 'amsterdam'].forEach(type => {
            const btn = document.getElementById('rule-' + type);
            if(btn) btn.classList.remove('btn-active');
        });
        const activeRuleBtn = document.getElementById('rule-' + savedRules);
        if(activeRuleBtn) activeRuleBtn.classList.add('btn-active');

        const ruleLabels = { rotterdam: "Rotterdams (Altijd troeven)", amsterdam: "Amsterdams (Maatslag = Vrij)" };
        const lblRule = document.getElementById('current-rule-label');
        if(lblRule) lblRule.innerText = `Huidig: ${ruleLabels[savedRules]}`;
    },

    startGame: function() {
        try {
            // Veiligheidscheck: Zijn de andere scripts geladen?
            if (typeof KJCore === 'undefined' || typeof KJUI === 'undefined' || typeof KJConfig === 'undefined') {
                throw new Error("Een van de spel-bestanden (Core, UI of Config) is niet geladen!");
            }

            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');

            KJCore.init(); 
            KJUI.init(); 
            KJUI.updateScore({ us: 0, them: 0 }); 
            KJUI.setTrump(null);
            
            if(KJCore.currentRound) {
                KJUI.updateRound(KJCore.currentRound);
            }

            // Oude kaarten verwijderen
            const oldCards = document.querySelectorAll('.table-anim-card');
            oldCards.forEach(c => c.remove());

            this.playingTeam = null;
            this.isFirstTrick = true; 
            
            // Render de hand van de speler
            this.updateMyHand();
            
            // Start het bieden
            this.startBiddingPhase();

        } catch (error) {
            console.error(error);
            alert("Er ging iets mis bij het starten: " + error.message);
        }
    },

    startBiddingPhase: function() {
        this.bidderIndex = (KJCore.dealerIndex + 1) % 4;
        this.passesCount = 0;
        
        const bidderName = this.getPlayerNameSubject(this.bidderIndex);
        KJUI.showMessage(`${bidderName} mag bieden.`);
        
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
            // Speler is aan de beurt
            KJUI.showMessage("Kies Troef of Pas", 0);
            KJUI.showTrumpSelection(true);
        } else {
            // Computer is aan de beurt
            KJUI.showTrumpSelection(false);
            const bidderName = this.getPlayerNameSubject(this.bidderIndex);
            KJUI.showMessage(`${bidderName} denkt na...`, 0);
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
            // Korte vertraging voor computer
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
            KJUI.showMessage("Dat mag niet! Bekennen of Troeven.");
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

        // Eenvoudige AI: Als maat wint niets doen, anders proberen te winnen
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
                // Maat ligt, speel punten (Aas of 10) indien geen troef
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
            // AI start: Aas (niet troef) is vaak goed
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
                const winnerName = this.getPlayerName(winner.playerIndex);

                if (totaalRoem > 0) {
                    KJUI.showMessage(`ROEM! +${totaalRoem} (${winnerName} pakt slag)`, 2000);
                } else {
                    KJUI.showMessage(`${winnerName} pakt de slag`, 1000);
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
        KJUI.showMessage("Einde Ronde", 0);

        setTimeout(() => {
            if (isGameOver) {
                KJUI.showGameOverScreen(result.totalScore);
                this.setupGameOverButtons(result.totalScore);
            } else {
                let msgTitle = result.type === 'NAT' ? "NAT!" : (result.type.includes('PIT') ? "PIT!" : "Ronde Voorbij");
                const fullMsg = `${msgTitle}\nWij: ${result.roundScore.us} - Zij: ${result.roundScore.them}\nTotaal: Wij ${result.totalScore.us} - Zij ${result.totalScore.them}`;
                
                if (confirm(fullMsg + "\n\nVolgende ronde?")) {
                    this.startGame(); 
                }
            }
        }, 1500);
    },
    
    setupGameOverButtons: function(totalScore) {
        const btnSave = document.getElementById('btn-save-score');
        const btnMenu = document.getElementById('btn-to-menu');
        const input = document.getElementById('player-name-input');

        btnSave.onclick = async () => {
            const name = input.value;
            if(!name) { alert("Vul je naam in!"); return; }
            
            btnSave.innerText = "Bezig...";
            
            if (window.LeaderboardService) {
                const success = await window.LeaderboardService.saveScore(name, totalScore.us);
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

        btnMenu.onclick = () => {
            location.reload(); 
        };
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

document.addEventListener('DOMContentLoaded', () => {
    KlaverjasMain.init();
});