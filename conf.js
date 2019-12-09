let fs=require('fs');
let path = require('path');
const CONF=JSON.parse(fs.readFileSync(path.join(__dirname, '../conf.json')));

function getCONF() {
    return CONF;
}

module.exports = {
    getCONF
};