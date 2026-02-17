/**
 * KLAVERJAS CORE (VERSIE 2.5 - MET AMSTERDAM/ROTTERDAM REGELS)
 */

const KJCore = {
// Voeg dit toe bovenaan in KJCore object properties:
    biddingMode: 'drents',   // Was 'normal'
    ruleSet: 'amsterdam',    // Was 'rotterdam'
    proposedSuit: null,    // De kleur van de gedraaide kaart
    biddingRound: 1,       // 1 = vrijwillig, 2 = verplicht (na 4x pas in Drents)

    // SPEL STATUS
    deck: [],             
    hands: [[],[],[],[]], 
    currentTrick: [],     
    lastTrick: [],        
    trumpSuit: null,      
    turnIndex: 0,         
    dealerIndex: 3,
    
    // NIEUW: De actieve regelset (standaard rotterdam)
    ruleSet: 'rotterdam',

    // Ronde teller
    currentRound: 1,      

    // PUNTEN STATUS
    points: { us: 0, them: 0 },      
    matchPoints: { us: 0, them: 0 }, 
    tricksWon: [0, 0, 0, 0],         

    init: function() {
        this.deck = KJConfig.createDeck(); 
        this.shuffle(this.deck);
        this.deal();
        
        this.currentTrick = [];
        this.lastTrick = [];
        this.points = { us: 0, them: 0 }; 
        this.tricksWon = [0, 0, 0, 0]; 
        this.trumpSuit = null;
        
        // --- NIEUW: Reset Bidding State ---
        this.proposedSuit = null;
        this.biddingRound = 1; 
        // ----------------------------------

        if (this.matchPoints.us === 0 && this.matchPoints.them === 0) {
            this.currentRound = 1;
        }

        this.turnIndex = (this.dealerIndex + 1) % 4; 
    },

    reDeal: function() {
        this.dealerIndex = (this.dealerIndex + 1) % 4;
        this.init();
    },

    shuffle: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    deal: function() {
        this.hands = [[], [], [], []];
        let p = (this.dealerIndex + 1) % 4; 
        for (let i = 0; i < this.deck.length; i++) {
            this.hands[p].push(this.deck[i]);
            p = (p + 1) % 4; 
        }
        this.hands.forEach(hand => this.sortHand(hand));
    },

sortHand: function(hand) {
    // OUD: { 'h': 0, 'd': 1, 's': 2, 'c': 3 } (Rood, Rood, Zwart, Zwart)
    
    // NIEUW: Om-en-om kleuren voor beter contrast
    const suitOrder = { 'h': 0, 's': 1, 'd': 2, 'c': 3 }; 
    
    hand.sort((a, b) => {
        if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }
        // Sorteer Aas (index 7) als hoogste, 7 (index 0) als laagste
        return KJConfig.RANKS.indexOf(a.rank) - KJConfig.RANKS.indexOf(b.rank);
    });
},

    checkHandRoem: function(playerIndex) {
        let totalRoem = 0;
        const hand = [...this.hands[playerIndex]];
        
        // 1. Carré
        const counts = {};
        hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
        for (let rank in counts) {
            if (counts[rank] === 4) {
                totalRoem += (rank === 'J' ? 200 : 100);
            }
        }

        // 2. Reeksen
        const suits = { 'h': [], 'd': [], 's': [], 'c': [] };
        hand.forEach(c => suits[c.suit].push(KJConfig.RANKS.indexOf(c.rank)));
        
        for (let s in suits) {
            const indices = suits[s].sort((a, b) => a - b);
            let consecutive = 1;
            for (let i = 0; i < indices.length - 1; i++) {
                if (indices[i+1] === indices[i] + 1) {
                    consecutive++;
                } else {
                    if (consecutive === 3) totalRoem += 20;
                    if (consecutive >= 4) totalRoem += 50;
                    consecutive = 1;
                }
            }
            if (consecutive === 3) totalRoem += 20;
            if (consecutive >= 4) totalRoem += 50;
        }

        return totalRoem;
    },

    // --- VERVANG DE OUDE isValidMove DOOR DEZE NIEUWE VALIDATIE ---

    /**
     * Controleert of een zet geldig is en geeft de reden terug als het niet mag.
     * Gebaseerd op Fase 1 van het verbeterplan: Validatie Core Engine.
     */
    validateMove: function(card, playerIndex) {
        // 1. Is het wel jouw beurt?
        if (playerIndex !== this.turnIndex) {
            return { valid: false, reason: "Wacht op je beurt." };
        }
        
        // 2. Eerste kaart van de slag? Alles mag.
        if (this.currentTrick.length === 0) {
            return { valid: true };
        }

        const hand = this.hands[playerIndex];
        const firstCard = this.currentTrick[0].card;
        const requestedSuit = firstCard.suit; 
        const hasRequested = hand.some(c => c.suit === requestedSuit);

        // 3. REGEL: Kleur bekennen gaat ALTIJD voor.
        if (hasRequested) {
            if (card.suit !== requestedSuit) {
                return { valid: false, reason: `Je moet ${KJConfig.SUITS[Object.keys(KJConfig.SUITS).find(k => KJConfig.SUITS[k].id === requestedSuit)].name} bekennen.` };
            }
            return { valid: true };
        }

        // Als we hier zijn, kun je niet bekennen. 
        // Nu wordt het interessant: Moet je troeven?

        const hasTrump = hand.some(c => c.suit === this.trumpSuit);
        
        // Wie wint de slag OP DIT MOMENT?
        const currentWinner = this.getTrickWinner(this.currentTrick);
        const partnerIndex = (playerIndex + 2) % 4;
        const partnerHasSlag = (currentWinner.playerIndex === partnerIndex);

        // --- HIER KOMT DE SPLITSING: AMSTERDAMS VS ROTTERDAMS [cite: 10] ---
        
        if (hasTrump) {
            // Situatie: Je kunt niet bekennen, maar je hebt wel troef.
            
            // CHECK: Mag ik 'duiken' (niet troeven) omdat mijn maat de slag heeft?
            // Bij Rotterdam: NEE, je moet altijd troeven (introefplicht)[cite: 16].
            // Bij Amsterdam: JA, als maat slag heeft, mag je alles gooien[cite: 15].
            
            const magDuiken = (this.ruleSet === 'amsterdam' && partnerHasSlag);

            // Wat is de hoogste troef op tafel?
            let highestTrumpStrength = -1;
            let trumpPlayed = false;
            
            this.currentTrick.forEach(p => {
                if (p.card.suit === this.trumpSuit) {
                    trumpPlayed = true;
                    const str = KJConfig.VALUES_TRUMP[p.card.rank].strength;
                    if (str > highestTrumpStrength) highestTrumpStrength = str;
                }
            });

            // SCENARIO A: Er is nog NIET getroefd in deze slag.
            if (!trumpPlayed) {
                if (magDuiken) {
                    // Amsterdams & Maat heeft m -> Alles mag!
                    return { valid: true };
                } else {
                    // Rotterdams OF maat heeft hem niet -> Troefverplichting!
                    if (card.suit !== this.trumpSuit) {
                        return { valid: false, reason: "Je moet introeven!" };
                    }
                    return { valid: true };
                }
            }

            // SCENARIO B: Er is AL WEL getroefd.
            else {
                // Kan ik overtroeven?
                const canOverTrump = hand.some(c => 
                    c.suit === this.trumpSuit && 
                    KJConfig.VALUES_TRUMP[c.rank].strength > highestTrumpStrength
                );

                if (canOverTrump) {
                    // Je KUNT overtroeven.
                    if (magDuiken) {
                        // Amsterdams & Maat heeft slag -> Je hoeft niet over je maat heen.
                        return { valid: true }; 
                    } else {
                        // Rotterdams OF tegenstander heeft slag -> Je MOET overtroeven[cite: 16].
                        if (card.suit !== this.trumpSuit) {
                            return { valid: false, reason: "Je moet overtroeven!" };
                        }
                        // Je speelt wel troef, maar een te lage?
                        if (KJConfig.VALUES_TRUMP[card.rank].strength <= highestTrumpStrength) {
                            return { valid: false, reason: "Je moet een hogere troef spelen!" };
                        }
                        return { valid: true };
                    }
                } else {
                    // Je kunt NIET overtroeven (je hebt alleen lage troeven).
                    
                    // Heb je nog andere kleuren dan troef?
                    const hasOtherSuits = hand.some(c => c.suit !== this.trumpSuit);
                    
                    if (card.suit === this.trumpSuit) {
                        // Je probeert onder te troeven. Mag dat?
                        // Alleen als je niet anders kan (geen andere kleuren)[cite: 16].
                        if (hasOtherSuits) {
                            return { valid: false, reason: "Je mag niet ondertroeven!" };
                        } 
                        return { valid: true }; 
                    } else {
                        // Je gooit een andere kleur (bijgooien).
                        return { valid: true };
                    }
                }
            }
        }

        // Als je niet kunt bekennen en geen troef hebt, mag je alles gooien.
        return { valid: true };
    },
    
    // Behoud deze functie voor backward compatibility, maar laat hem verwijzen naar de nieuwe
    isValidMove: function(card, playerIndex) {
        return this.validateMove(card, playerIndex).valid;
    },

    playCard: function(cardIndex) {
        const player = this.turnIndex;
        const card = this.hands[player][cardIndex];

        this.currentTrick.push({ playerIndex: player, card: card });
        this.hands[player].splice(cardIndex, 1);
        this.turnIndex = (this.turnIndex + 1) % 4;

        if (this.currentTrick.length === 4) return 'TRICK_COMPLETE'; 
        return 'NEXT_PLAYER';
    },

    getTrickWinner: function(trick) {
        let winner = trick[0]; 
        const askedSuit = trick[0].card.suit;

        for (let i = 1; i < trick.length; i++) {
            const challenger = trick[i];
            const getStrength = (c) => {
                if (c.suit === this.trumpSuit) return 100 + KJConfig.VALUES_TRUMP[c.rank].strength;
                if (c.suit === askedSuit) return KJConfig.VALUES_NORMAL[c.rank].strength;
                return 0; 
            };

            if (getStrength(challenger.card) > getStrength(winner.card)) {
                winner = challenger;
            }
        }
        return winner;
    },

    calculateScore: function(trick, isLastTrick = false) {
        let points = 0;
        let details = []; // Voor debugging

        trick.forEach(play => {
            const c = play.card;
            let p = 0;
            if (c.suit === this.trumpSuit) {
                p = KJConfig.VALUES_TRUMP[c.rank].points;
            } else {
                p = KJConfig.VALUES_NORMAL[c.rank].points;
            }
            points += p;
            if (p > 0) details.push(`${c.rank}${c.suit}=${p}`);
        });

        if (isLastTrick) {
            points += 10;
            details.push("Laatste Slag=+10");
        }
        
        // Fase 1: Foutdetectie en Logging 
        console.log(`🧮 Slag punten: ${points} (${details.join(', ')})`);
        
        return points;
    },

/**
     * Berekent roem op basis van kaarten OP TAFEL (Jouw Variant).
     * Regels: 
     * - Stuk (20): Heer + Vrouw van troef in de slag (ongeacht wie speelt).
     * - Reeksen: 3 of 4 opeenvolgende kaarten van 1 kleur in de slag.
     */
    calculateRoem: function(trick) {
        let roemPoints = 0;
        let descriptions = []; 
        // We kijken alleen naar de kaarten in de slag (op tafel), niet naar de hand
        const cards = trick.map(p => p.card);

        // 1. Check STUK (Heer + Vrouw van Troef) 
        // We gebruiken .some(), dus het maakt niet uit wie ze gegooid heeft
        const hasTrumpKing = cards.some(c => c.rank === 'K' && c.suit === this.trumpSuit);
        const hasTrumpQueen = cards.some(c => c.rank === 'Q' && c.suit === this.trumpSuit);
        
        if (hasTrumpKing && hasTrumpQueen) {
            roemPoints += 20;
            descriptions.push("Stuk (20)");
        }

        // 2. Check CARRÉ (4 gelijke kaarten op tafel)
        const firstRank = cards[0].rank;
        const isCarre = cards.every(c => c.rank === firstRank);
        
        if (isCarre) {
            if (firstRank === 'J') {
                roemPoints += 200;
                descriptions.push("4 Boeren (200)");
            } else {
                roemPoints += 100;
                descriptions.push(`4 x ${firstRank} (100)`);
            }
            return { total: roemPoints, desc: descriptions };
        }

        // 3. Check REEKSEN (3 of 4 opeenvolgend in dezelfde kleur op tafel)
        const suits = {};
        cards.forEach(c => {
            if (!suits[c.suit]) suits[c.suit] = [];
            suits[c.suit].push(c);
        });

        Object.values(suits).forEach(suitCards => {
            // Er moeten minimaal 3 kaarten van dezelfde kleur op tafel liggen
            if (suitCards.length >= 3) {
                // Sorteer ze op volgorde (7,8,9,10,J,Q,K,A)
                suitCards.sort((a, b) => KJConfig.RANKS.indexOf(a.rank) - KJConfig.RANKS.indexOf(b.rank));
                
                let consecutive = 1; 
                let maxConsecutive = 1;
                
                for (let i = 0; i < suitCards.length - 1; i++) {
                    const idxCurrent = KJConfig.RANKS.indexOf(suitCards[i].rank);
                    const idxNext = KJConfig.RANKS.indexOf(suitCards[i+1].rank);
                    
                    if (idxNext === idxCurrent + 1) {
                        consecutive++;
                    } else {
                        consecutive = 1;
                    }
                    if (consecutive > maxConsecutive) maxConsecutive = consecutive;
                }

                if (maxConsecutive === 3) {
                    roemPoints += 20;
                    descriptions.push("Drieluik (20)");
                } else if (maxConsecutive === 4) {
                    roemPoints += 50;
                    descriptions.push("Vierluik (50)");
                }
            }
        });

        return { total: roemPoints, desc: descriptions };
    },

resolveRound: function(playingTeam) {
        // 1. Punten tellen
        let scorePlaying = (playingTeam === 'us') ? this.points.us : this.points.them;
        let scoreDefending = (playingTeam === 'us') ? this.points.them : this.points.us;
        let resultType = 'NORMAL';

        // 2. Check voor PIT
        if (scoreDefending === 0) {
            scorePlaying += 100; 
            if (playingTeam === 'us') this.points.us += 100;
            else this.points.them += 100;
            resultType = 'PIT';
        }

        // 3. Check voor NAT
        if (scorePlaying <= scoreDefending && resultType !== 'PIT') {
            if (playingTeam === 'us') {
                this.points.them += this.points.us;
                this.points.us = 0;
            } else {
                this.points.us += this.points.them;
                this.points.them = 0;
            }
            resultType = 'NAT';
        }

        // --- NIEUW: Opslaan in geschiedenis ---
        // Zorg dat matchHistory bestaat (veiligheid)
        if (!this.matchHistory) this.matchHistory = [];
        
        this.matchHistory.push({
            round: this.currentRound,
            scoreUs: this.points.us,
            scoreThem: this.points.them,
            type: resultType,
            playingTeam: playingTeam
        });
        // --------------------------------------

        // 4. Totaalscore bijwerken
        this.matchPoints.us += this.points.us;
        this.matchPoints.them += this.points.them;
        
        // 5. Ronde teller ophogen
        this.currentRound++;

        return { 
            type: resultType, 
            roundScore: { ...this.points }, 
            totalScore: { ...this.matchPoints },
            nextRoundNumber: this.currentRound 
        };
    },
};