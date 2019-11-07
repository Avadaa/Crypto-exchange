module.exports = {
    ID: 132, // Market maker's user id
    SPREAD: 1, // (wanted spread - 2) USD
    SPREADBETWEEN: 2.0, // spread between orders on one sids of the book

    FIRSTAMOUNT: 10.0, // Amount in BTC how big the best order per side is

    ORDERAMOUNT: 5, // How many layers of orders are there going to be in the book per side
    MULTIPLIER: 1.5, // Bids for example: (SPREADBETWEEN = 4.0)
    // $10000   10   BTC
    // $ 9996   15   BTC 
    // $ 9992   22.5 BTC

    MAKERFEE: 0.00075,
    MARKETPOW: 2,
    MARKETMULTIPLY: 0.1 // Forumla = spread to order ^ MARKETPOW * MARKETMULTIPLY
    // The formula tells how many coins the algo can buy / sell at market at that price
    // If there was an ask at $9000, at $9010 the algo would market buy 10 coins. (if offsets = 1.1, 0.015)
    // At $9011 it'd buy again. This time 11 ^ 2 * 0.1 - 10 (already abought) = 2.1
}