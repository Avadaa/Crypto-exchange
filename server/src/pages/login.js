const db = require('../dbQueries');

const bcrypt = require('bcryptjs');


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
                        req.session.userId = dbRes[0].id;

                        //return res.redirect('/trade');
                        console.log(req.session.userId);
                        return req.session.userId;
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