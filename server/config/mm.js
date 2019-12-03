module.exports = {
    ID: 1, // Market maker's user id
    SPREAD: 0.05, // USD
    REALSPREAD: 0.05,

    SPREADBETWEEN: 0.05, // spread between orders on one sides of the book

    FIRSTAMOUNT: 10.0, // Amount in BTC how big the best order per side is
    ABSORBAMOUNT: 10.0, // How many coins can a side take before the orders are moved further away
    SLEEPAFTERABSORB: 5000, // How long before the spread is brought back to normal after a dump / pump into limits

    ORDERAMOUNT: 5, // How many layers of orders are there going to be in the book per side

    TAKERFEE: 0.00075,
    MARKETPOW: 2,
    MARKETMULTIPLY: 0.1 // Forumla = spread to order ^ MARKETPOW * MARKETMULTIPLY
    // The formula tells how many coins the algo can buy / sell at market at that price
    // If there was an ask at $9000, at $9010 the algo would market buy 10 coins. (if offsets = 1.1, 0.015)
    // At $9011 it'd buy again. This time 11 ^ 2 * 0.1 - 10 (already abought) = 2.1
}