let Imap = require('imap');
let MailParser = require("mailparser").MailParser;
const CONF=require('./conf').getCONF();
const USER=CONF['MAIL']['USER'];
const PASSWORD=CONF['MAIL']['PASSWORD'];
const HOST=CONF['MAIL']['HOST'];
const PORT=CONF['MAIL']['PORT'];
let mails=[];
let imap = new Imap({
    user: USER, //你的邮箱账号
    password: PASSWORD, //你的邮箱密码
    host: HOST, //邮箱服务器的主机地址
    port: PORT, //邮箱服务器的端口地址
    tls: true, //使用安全传输协议
    tlsOptions: { rejectUnauthorized: false } //禁用对证书有效性的检查
});

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

function getMails() {
    return new Promise((resolve) => {
        imap.once('ready', function () {
            openInbox(function (err) {
                if (err) {
                    resolve({status: 'error', log: 'getVerifyCode error:' + err});
                }
                imap.search(['UNSEEN',['SINCE', new Date()]], function (err, results) {//搜寻2017-05-20以后未读的邮件
                    if (err) {
                        resolve({status: 'error', log: 'getVerifyCode error:' + err});
                    }
                    let f = imap.fetch(results, {bodies: '', markSeen: true});//抓取邮件（默认情况下邮件服务器的邮件是未读状态）
                    f.on('message', function (msg) {
                        let mailparser = new MailParser();
                        msg.on('body', function (stream) {
                            stream.pipe(mailparser);//将为解析的数据流pipe到mailparser
                            mailparser.on("data", function (data) {
                                if (data.type === 'text') {
                                    mails.push(data.html.toString());
                                }else{
                                    resolve({status: 'error', log: 'getVerifyCode error:' + err});
                                }
                            });
                        });
                    });
                    f.once('error', function (err) {
                        resolve({status: 'error', log: 'getVerifyCode error:' + err});
                    });
                    f.once('end', function () {
                        imap.end();
                    });
                });
            });
        });
        imap.once('error', function (err) {
            resolve({status: 'error', log: 'getVerifyCode error:' + err});
        });
        imap.once('end', function () {
            resolve({status: 'success', data: mails});
        });
        imap.connect();
    });
}

module.exports = {
    getMails
};