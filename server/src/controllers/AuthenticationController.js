const Register = require('../pages/register.js')
const Login = require('../pages/login.js')
const Trade = require('../pages/trade.js')
const db = require('../dbQueries');
const ethereum = require('../Ethereum/ethereum')
const ethereumConfig = require('../../config/ethereum')



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

        let error = await ethereum.sendCustomAddress(
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
        const maxGasMoney = web3.fromWei(web3.toWei(ethereumConfig.gasLimit * ethereumConfig.gwei, 'gwei'), 'ether')


        let depositBalance = await ethereum.getBalance(walletInfo.wallet.address);


        if (depositBalance > maxGasMoney) {
            let error = await ethereum.sendToColdWallet(
                walletInfo.userId,
                walletInfo.wallet.privateKey,
                walletInfo.wallet.address,
                depositBalance
            );

            if (error == undefined) {
                let balanceQuery = `SELECT * FROM users WHERE "id" = '${req.body.userId}'`
                let balances = (await db.query(balanceQuery))[0];

                balances.success = true;

                delete balances['id'];
                delete balances['username'];
                delete balances['pwhash'];


                res.send(balances);
            }

        }
        else
            res.send({ success: false });

    },

    async depositHistory(req, res) {
        let historyQuery = `SELECT hash, date, amount FROM deposits WHERE "userId" = '${req.body.userId}'`;
        let depositHistory = (await db.query(historyQuery));

        res.send(depositHistory);


    },
    async withdrawHistory(req, res) {
        let historyQuery = `SELECT hash, date, amount FROM withdraws WHERE "userId" = '${req.body.userId}'`;
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
        orderHistory = orderHistory.slice(0, 100);

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
    }
}