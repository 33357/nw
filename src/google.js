let googleAuth=require('google_authenticator').authenticator;
let nya=new googleAuth();
const CONF=require('./conf').getCONF();
const GOOGLE_SECRET = CONF['ACCOUNT']['GOOGLE_SECRET'];

function getGoogleCode() {
    return nya.getCode(GOOGLE_SECRET);
}

module.exports = {
    getGoogleCode
};