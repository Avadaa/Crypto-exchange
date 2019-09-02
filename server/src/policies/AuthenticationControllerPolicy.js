const db = require('../dbQueries');


module.exports = {
    async register(req, res, next) {


        // Tesing that username and password are viable
        let errorMsg = [];

        if (req.body.username.length < 3)
            errorMsg.push(['Username has to be 3 or more characters long.', 0]);

        if (!req.body.password)
            errorMsg.push(['Choose a password.', 1])
        else {
            if (!req.body.password_retype)
                errorMsg.push(['Confirm password.', 2])
            else
                if (req.body.password != req.body.password_retype)
                    errorMsg.push(['Passwords do not match.', 2]);

            if (req.body.password.length < 6)
                errorMsg.push(['Password has to be 6 or more characters long.', 1]);

        }

        // Test if the username is taken
        let usernameQuery = `SELECT * FROM users WHERE username = '${req.body.username}'`;
        let dbResUsername = await db.query(usernameQuery);
        if (dbResUsername.length > 0)
            errorMsg.push(['The username you tried is currently taken. Please choose a new name for your account.', 0]);


        if (errorMsg.length > 0)
            res.status(200).send({
                errors: errorMsg
            })

        else
            next();

    },


    async withdraw(req, res, next) {
        let errorMsg = [];


        if (!req.body.amount || !req.body.address)
            errorMsg.push('Please give a destination address and an amount you would wish to withdraw.');

        else {
            let walletQuery = `SELECT * FROM users WHERE id = '${req.body.userId}'`;
            let wallet = await db.query(walletQuery);

            let availableETH = wallet[0].balanceETH - wallet[0].reservedETH;
            if (req.body.amount > availableETH)
                errorMsg.push('Please give a valid amount');

        }

        if (errorMsg.length == 0)
            next()
        else
            res.status(200).send({
                messages: errorMsg,
                success: false
            });


    }
}