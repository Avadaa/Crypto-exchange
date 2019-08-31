const db = require('knex')(require('../config/database'));

module.exports = {
    query: async (query) => {
        let result;
        await db.raw(query).then((res) => {
            result = res.rows;


        }).catch((err) => {
            console.log(err);
            result = 0;
        });

        return result;
    }
}
