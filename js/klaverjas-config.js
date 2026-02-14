/**
 * KLAVERJAS CONFIGURATIE
 * Hier staan de kaarten, punten en instellingen.
 */
const KJConfig = {
    // Suits met CSS klassen voor de kleuren
    SUITS: {
        HEARTS:   { id: 'h', symbol: '♥', cssClass: 'suit-red',   name: 'Harten' },
        DIAMONDS: { id: 'd', symbol: '♦', cssClass: 'suit-red',   name: 'Ruiten' },
        SPADES:   { id: 's', symbol: '♠', cssClass: 'suit-black', name: 'Schoppen' },
        CLUBS:    { id: 'c', symbol: '♣', cssClass: 'suit-black', name: 'Klaveren' }
    },

    RANKS: ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'],

    // Puntentelling (Normaal)
    VALUES_NORMAL: {
        '7':  { points: 0,  strength: 1 },
        '8':  { points: 0,  strength: 2 },
        '9':  { points: 0,  strength: 3 },
        'J':  { points: 2,  strength: 4 },
        'Q':  { points: 3,  strength: 5 },
        'K':  { points: 4,  strength: 6 },
        '10': { points: 10, strength: 7 },
        'A':  { points: 11, strength: 8 }
    },

    // Puntentelling (Troef)
    VALUES_TRUMP: {
        '7':  { points: 0,  strength: 1 },
        '8':  { points: 0,  strength: 2 },
        'Q':  { points: 3,  strength: 3 },
        'K':  { points: 4,  strength: 4 },
        '10': { points: 10, strength: 5 },
        'A':  { points: 11, strength: 6 },
        '9':  { points: 14, strength: 7 }, // Nel
        'J':  { points: 20, strength: 8 }  // Jas
    },

    ROEM: {
        STUK: 20, DRIELUIK: 20, VIERLUIK: 50, CARRÉ: 100
    },

    createDeck: function() {
        let deck = [];
        Object.values(this.SUITS).forEach(suit => {
            this.RANKS.forEach(rank => {
                deck.push({
                    suit: suit.id,
                    rank: rank,
                    id: suit.id + rank
                });
            });
        });
        return deck;
    }
};