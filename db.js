const {Pool} = require("pg");

var arg = []

const pool = new Pool({
    host: arg[0].replace(/(\r\n|\n|\r)/gm, ""),
    user: arg[0].replace(/(\r\n|\n|\r)/gm, ""),
    password: arg[0].replace(/(\r\n|\n|\r)/gm, ""),
    port: arg[0].replace(/(\r\n|\n|\r)/gm, ""),
    database: arg[0].replace(/(\r\n|\n|\r)/gm, "")
});

module.exports = pool;
