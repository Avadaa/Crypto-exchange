const db = require('../dbQueries');



const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const cookiesConfig = require('../../config/cookies');

function jwtSignUser(user) {

    return jwt.sign(user, cookiesConfig.secret, {
        expiresIn: cookiesConfig.maxAge
    })

}

module.exports = {
    async login(req, res) {
        let loginQuery = `SELECT * FROM users WHERE username = '${req.body.username}'`;
        let errorMsg = [];


        let dbRes = await db.query(loginQuery);

        // No matching users in the database
        if (dbRes.length == 0 || req.body.password.length == 0)
            errorMsg.push('Incorrect credentials');

        else {
            await bcrypt.compare(req.body.password, dbRes[0].pwhash, function (err, result) {

                if (result == false)  // Wrong pw
                    res.status(200).send({
                        errors: ['Incorrect credentials']
                    });


                else {
                    if (err) throw err;

                    else {

                        let user = {
                            userId: dbRes[0].id
                        }


                        res.send({
                            user,
                            token: jwtSignUser(user),
                            errors: []
                        })
                    }

                }
            });
        }


        if (errorMsg.length > 0)
            res.status(200).send({
                errors: errorMsg
            });
    }
}