/**
 * KLAVERJAS CORE (VERSIE 2.5 - MET AMSTERDAM/ROTTERDAM REGELS)
 */

const KJCore = {
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
        const suitOrder = { 'h': 0, 'd': 1, 's': 2, 'c': 3 };
        hand.sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }
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

    // AANGEPAST: isValidMove met Amsterdam vs Rotterdam logica
    isValidMove: function(card, playerIndex) {
        // 1. Is het wel jouw beurt?
        if (playerIndex !== this.turnIndex) return false;
        
        // 2. Eerste kaart van de slag? Alles mag.
        if (this.currentTrick.length === 0) return true;

        const hand = this.hands[playerIndex];
        const requestedSuit = this.currentTrick[0].card.suit; 
        const hasRequested = hand.some(c => c.suit === requestedSuit);

        // 3. REGEL: Kleur bekennen gaat ALTIJD voor.
        if (hasRequested) {
            return card.suit === requestedSuit;
        }

        // Als we hier zijn, kun je niet bekennen. 
        // Nu wordt het interessant: Moet je troeven?

        const hasTrump = hand.some(c => c.suit === this.trumpSuit);
        
        // Wie wint de slag OP DIT MOMENT?
        const currentWinner = this.getTrickWinner(this.currentTrick);
        const partnerIndex = (playerIndex + 2) % 4;
        const partnerHasSlag = (currentWinner.playerIndex === partnerIndex);

        // --- HIER KOMT DE SPLITSING: AMSTERDAMS VS ROTTERDAMS ---
        
        // Situatie: Je hebt troeven. Moet je ze spelen?
        if (hasTrump) {
            
            // CHECK: Mag ik 'duiken' (niet troeven) omdat mijn maat de slag heeft?
            // Bij Rotterdam: NEE, je moet altijd troeven.
            // Bij Amsterdam: JA, als maat slag heeft, mag je alles gooien.
            
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

            // SCENARIO A: Er is nog NIET getroefd.
            if (!trumpPlayed) {
                if (magDuiken) {
                    // Amsterdams: Maat heeft m, er is niet getroefd -> Alles mag!
                    return true;
                } else {
                    // Rotterdams OF maat heeft hem niet -> Troefverplichting!
                    if (card.suit !== this.trumpSuit) return false;
                    return true;
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
                        return true; 
                    } else {
                        // Rotterdams OF tegenstander heeft slag -> Je MOET overtroeven.
                        if (card.suit !== this.trumpSuit) return false;
                        if (KJConfig.VALUES_TRUMP[card.rank].strength <= highestTrumpStrength) return false;
                        return true;
                    }
                } else {
                    // Je kunt NIET overtroeven (je hebt alleen lage troeven).
                    
                    // Heb je nog andere kleuren dan troef?
                    const hasOtherSuits = hand.some(c => c.suit !== this.trumpSuit);
                    
                    if (card.suit === this.trumpSuit) {
                        // Je probeert onder te troeven. Mag dat?
                        // Alleen als je niet anders kan (geen andere kleuren).
                        if (hasOtherSuits) return false; 
                        return true; 
                    } else {
                        // Je gooit een andere kleur (bijgooien).
                        return true;
                    }
                }
            }
        }

        // Als je niet kunt bekennen en geen troef hebt, mag je alles gooien.
        return true;
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
        trick.forEach(play => {
            const c = play.card;
            if (c.suit === this.trumpSuit) {
                points += KJConfig.VALUES_TRUMP[c.rank].points;
            } else {
                points += KJConfig.VALUES_NORMAL[c.rank].points;
            }
        });
        if (isLastTrick) points += 10;
        return points;
    },

    calculateRoem: function(trick) {
        let roemPoints = 0;
        const cards = trick.map(p => p.card);

        const hasTrumpKing = cards.some(c => c.rank === 'K' && c.suit === this.trumpSuit);
        const hasTrumpQueen = cards.some(c => c.rank === 'Q' && c.suit === this.trumpSuit);
        if (hasTrumpKing && hasTrumpQueen) roemPoints += 20;

        const firstRank = cards[0].rank;
        const isCarre = cards.every(c => c.rank === firstRank);
        if (isCarre) return roemPoints + 100;

        const suits = {};
        cards.forEach(c => {
            if (!suits[c.suit]) suits[c.suit] = [];
            suits[c.suit].push(c);
        });

        Object.values(suits).forEach(suitCards => {
            if (suitCards.length >= 3) {
                suitCards.sort((a, b) => KJConfig.RANKS.indexOf(a.rank) - KJConfig.RANKS.indexOf(b.rank));
                let consecutive = 1; 
                let maxConsecutive = 1;
                for (let i = 0; i < suitCards.length - 1; i++) {
                    const idxCurrent = KJConfig.RANKS.indexOf(suitCards[i].rank);
                    const idxNext = KJConfig.RANKS.indexOf(suitCards[i+1].rank);
                    if (idxNext === idxCurrent + 1) consecutive++;
                    else consecutive = 1;
                    if (consecutive > maxConsecutive) maxConsecutive = consecutive;
                }
                if (maxConsecutive === 3) roemPoints += 20;
                if (maxConsecutive === 4) roemPoints += 50;
            }
        });

        return roemPoints;
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
    }
};