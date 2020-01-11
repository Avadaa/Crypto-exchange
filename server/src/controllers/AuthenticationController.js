const Register = require('../pages/register.js')
const Login = require('../pages/login.js')
const Trade = require('../pages/trade.js')
const db = require('../dbQueries');
const ethereum = require('../Ethereum/ethereum')
const ethereumConfig = require('../../config/ethereum')
const jwt = require('jsonwebtoken')
const cookiesConf = require('../../config/cookies')
const speakeasy = require('speakeasy')
const qr = require('qrcode')

async function getBalances(userId) {
    let balanceQuery = `SELECT * FROM users WHERE "id" = '${userId}'`
    let balances = (await db.query(balanceQuery))[0];

    balances.success = true;

    delete balances['id'];
    delete balances['username'];
    delete balances['pwhash'];

    return balances;
}


module.exports = {
    register(req, res) {
        Register.register(req, res);
    },

    login(req, res) {
        Login.login(req, res)
    },

    async user(req, res) {
        let userInfoQuery = `SELECT * FROM users WHERE id = '${req.body.userId}'`
        let userWalletInfo = await db.query(userInfoQuery)


        res.send({
            balance: {
                balanceETH: userWalletInfo[0].balanceETH,
                balanceUSD: userWalletInfo[0].balanceUSD,
                reservedETH: userWalletInfo[0].reservedETH,
                reservedUSD: userWalletInfo[0].reservedUSD
            }
        })
    },

    async withdraw(req, res) {
        let error;
        if (req.body.currency == 'ETH')
            error = await ethereum.sendCustomAddressETH(
                req.body.userId,
                req.body.address,
                req.body.amount
            );
        if (req.body.currency == 'USD')
            error = await ethereum.sendCustomAddressUSD(
                req.body.userId,
                req.body.address,
                req.body.amount
            );
        if (error)
            res.send({
                messages: [error],
                success: false
            })
        else {

            // Quick workaround for await not actually waiting for the new balance when withdrawing
            setTimeout(async () => {
                let userInfoQuery = `SELECT * FROM users WHERE id = '${req.body.userId}'`;
                let userInfo = await db.query(userInfoQuery);

                res.send({
                    messages: [`Withdraw processed. Amount: ${req.body.amount}`],
                    success: true,
                    balanceETH: userInfo[0].balanceETH,
                    balanceUSD: userInfo[0].balanceUSD,
                    reservedETH: userInfo[0].reservedETH,
                    reservedUSD: userInfo[0].reservedUSD,
                });

            }, 1000);
        }
    },

    async deposit(req, res) {

        let walletQuery = `SELECT * FROM wallets WHERE "userId" = '${req.body.userId}'`
        let walletInfo = (await db.query(walletQuery))[0];

        // Calculating the max amount of ETH that's gonna be spent on the transaction
        // EG: User deposits 0.1 ETH, and max fees would be 0.0018ETH we'd only send 0.0982
        const Web3 = require('web3');
        const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/0d86b1f81dba4e6c999d80d8ae860ec0"));
        const maxGasMoney = ethereumConfig.gasLimit * ethereumConfig.gwei * 0.000000001; // in ether


        let depositBalanceETH = await ethereum.getBalanceETH(walletInfo.wallet.address);
        let depositBalanceUSDT = await ethereum.getBalanceUSDT(walletInfo.wallet.address);


        if (depositBalanceUSDT != 0 && depositBalanceETH > maxGasMoney * 0.9) {
            let error = await ethereum.sendToColdWalletUSDT(
                walletInfo.userId,
                walletInfo.wallet.privateKey,
                walletInfo.wallet.address,
                depositBalanceUSDT
            );

            if (error == undefined) {
                let balances = await getBalances(req.body.userId)

                res.send(balances);
            }
        }
        else if (depositBalanceUSDT == 0 && depositBalanceETH > maxGasMoney) {
            let error = await ethereum.sendToColdWalletETH(
                walletInfo.userId,
                walletInfo.wallet.privateKey,
                walletInfo.wallet.address,
                depositBalanceETH - maxGasMoney
            );

            if (error == undefined) {
                let balances = await getBalances(req.body.userId)

                res.send(balances);
            }
        }
        else
            res.send({ success: false });

    },


    async depositHistory(req, res) {
        let historyQuery = `SELECT hash, date, amount, currency FROM deposits WHERE "userId" = '${req.body.userId}'`;
        let depositHistory = (await db.query(historyQuery));

        res.send(depositHistory);


    },
    async withdrawHistory(req, res) {
        let historyQuery = `SELECT hash, date, amount, currency FROM withdraws WHERE "userId" = '${req.body.userId}'`;
        let withdrawHistory = (await db.query(historyQuery));

        res.send(withdrawHistory);

    },
    obInfo(req, res) {
        let obInfo = Trade.obInfo();
        res.send(obInfo);
    },
    async uploadAvatar(req, res) {
        let avatarQuery = `UPDATE users SET avatar = '${req.body.avatar}' WHERE id = ${req.body.userId}`;
        (res.send(await db.query(avatarQuery)));

        //console.log(req.body);
    },

    async getAvatar(req, res) {
        let avatarQuery = `SELECT avatar FROM users WHERE id = ${req.body.userId}`;
        res.send(await db.query(avatarQuery));
    },

    async getHistory(req, res) {
        let historyQuery = `SELECT * FROM history WHERE "userId" = '${req.body.userId}'`;
        let orderHistory = await db.query(historyQuery);
        if (orderHistory.length > 100)
            orderHistory = orderHistory.slice(orderHistory.length - 100, orderHistory.length);

        // Db sometimes messes up the order of which the entries are stored in
        orderHistory.sort((a, b) => a.id - b.id)

        // Sending only the last 100 orders
        res.send(orderHistory);
    },
    async changeName(req, res) {
        let usernameUniqueQuery = `SELECT username FROM users WHERE username = '${req.body.newName}'`

        let uniqueRes = await db.query(usernameUniqueQuery);
        if (uniqueRes.length == 0) {
            let usernameChangequery = `UPDATE users SET username = '${req.body.newName}' WHERE id = ${req.body.userId}`;
            await db.query(usernameChangequery)
            res.send({ success: true, msg: "Username changed", username: req.body.newName });
        }
        else
            res.send({ success: false, msg: "Username already taken" })
    },

    async changePw(req, res) {
        const bcrypt = require('bcryptjs');
        const bcryptSaltRounds = 10;

        let msg = []
        let success = false;

        bcrypt.hash(req.body.pwNew, bcryptSaltRounds, async (err, hash) => {
            if (err)
                msg.push("Unexpected error")

            else {
                let pwChangeQuery = `UPDATE users SET pwHash = '${hash}' WHERE id = ${req.body.userId}`
                let pwRes = await db.query(pwChangeQuery);

                if (pwRes.length == 0) {
                    success = true;
                    msg.push("Password changed")
                }
                else
                    msg.push("Unexpected error")

                res.send({ success, msg });
            }
        })
    },
    // Checks user's jwt token's authenticity
    async checkToken(req, res) {
        try {
            jwt.verify(req.body.token, cookiesConf.secret, (err, data) => {
                if (err) {
                    res.send(false);
                    console.log('User ' + req.body.userId + ' failed to authenticate')

                    throw err;
                };
                if (data.userId == req.body.userId)
                    res.send(true);
                else
                    res.send(false);
            })
        }
        catch (e) {
            console.log('User ' + req.body.userId + ' failed to authenticate')

        }

    },
    // Checks if user has enabled twofa
    async twoFaState(req, res) {
        let twoFaQuery = `SELECT "twofaenabled" FROM users WHERE id = ${req.body.userId}`
        let enabled = await db.query(twoFaQuery);
        res.send(enabled[0].twofaenabled);
    },
    async twoFaQR(req, res) {
        let secret = speakeasy.generateSecret();

        let secretQuery = `UPDATE users SET twofasecret = '${secret.base32}' WHERE id = ${req.body.userId}`
        await db.query(secretQuery)

        let url = speakeasy.otpauthURL({ secret: secret.ascii, label: `Ezgains Exchange ${req.body.username}` })
        qr.toDataURL(url, (err, img) => {
            res.send(img)
        })
    },
    // Checks user's input on twofa
    async checkTwoFa(req, res) {
        let secretQuery = `SELECT "twofasecret" FROM users WHERE id = ${req.body.userId}`
        let secret = await db.query(secretQuery);
        let verify = await Login.checkTwoFa(req.body.input, secret[0].twofasecret);

        if (verify) {
            let twoFaQuery = `UPDATE users SET "twofaenabled" = true WHERE id = ${req.body.userId}`
            await db.query(twoFaQuery);
        }
        console.log(verify)
        res.send(verify)
    },
    async disableTwoFa(req, res) {
        let twoFaQuery = `UPDATE users SET "twofaenabled" = false WHERE id = ${req.body.userId}`
        await db.query(twoFaQuery);
        res.send()
    }
}