const {Pool} = require("pg");
const fs = require('fs');

var file = fs.readFileSync('./db.txt', 'utf8');
var arg = file.split('\n');

const pool = new Pool({
    host: arg[0].replace(/(\r\n|\n|\r)/gm, ""),
    user: arg[1].replace(/(\r\n|\n|\r)/gm, ""),
    password: arg[2].replace(/(\r\n|\n|\r)/gm, ""),
    port: arg[3].replace(/(\r\n|\n|\r)/gm, ""),
    database: arg[4].replace(/(\r\n|\n|\r)/gm, "")
});

module.exports = pool;
