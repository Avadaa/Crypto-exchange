module.exports = {
    ID: 132, // Market maker's user id
    SPREAD: 4, // USD
    SPREADBETWEEN: 4.0, // spread between orders on one sids of the book

    FIRSTAMOUNT: 10.0, // Amount in BTC how big the best order per side is

    ORDERAMOUNT: 5, // How many layers of orders are there going to be in the book per side
    MULTIPLIER: 1.5 // Bids for example: (SPREADBETWEEN = 4.0)
    // $10000   10   BTC
    // $ 9996   15   BTC 
    // $ 9992   22.5 BTC
}