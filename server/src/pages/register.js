const db = require('../dbQueries');

const ethereum = require('../Ethereum/ethereum');

const bcrypt = require('bcryptjs');
const bcryptSaltRounds = 10;

const jwt = require('jsonwebtoken');
const cookiesConfig = require('../../config/cookies');

function jwtSignUser(user) {

    return jwt.sign(user, cookiesConfig.secret, {
        expiresIn: cookiesConfig.maxAge
    })

}

module.exports = {
    register(req, res) {
        bcrypt.hash(req.body.password, bcryptSaltRounds, async (err, hash) => {
            if (err) console.log(err);
            else {


                // Input user information into db
                let regQueryUserInfo = `INSERT INTO users("username", "pwhash", "balanceETH", "balanceUSD", "reservedETH", "reservedUSD") VALUES('${req.body.username}', '${hash}', '0', '0', '0', '0') RETURNING id`;

                let dbResInsertUserInfo = await db.query(regQueryUserInfo);
                let userId = dbResInsertUserInfo[0].id;



                // Input user's wallet information into a different table
                let wallet = ethereum.getAddress(hash); // Use password hash as wallet password
                let regQueryWalletInfo = `INSERT INTO wallets("userId", "wallet") VALUES('${userId}', '${JSON.stringify(wallet)}')`;

                await db.query(regQueryWalletInfo);

                let user = {
                    userId: userId,
                    username: req.body.username,
                    address: wallet.address,
                    balanceETH: 0,
                    balanceUSD: 0,
                    reservedETH: 0,
                    reservedUSD: 0,

                }

                console.log('User ' + userId + '    ' + req.body.username + ' has registered');


                res.send({
                    user,
                    token: jwtSignUser(user),
                    errors: []
                })

            }
        });
    }
}