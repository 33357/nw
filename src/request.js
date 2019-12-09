let request=require('request');
let time=require('./time');
let cookie;

function doRequest(url,method,headers,body) {
    return new Promise((resolve) => {
        if(headers!=null&&headers!=undefined){
            headers.cookie=cookie;
        }else{
            headers={
                cookie:cookie
            }
        }
        time.setTime(url);
        request(
            {
                url:url,
                method: method,
                headers: headers,
                body: body,
            },
            function (err, res,body) {
                if (err) {
                    resolve({status: 'error', log: 'doRequest error:' + err});
                }
                time.getTime();
                let set_cookie = res.headers['set-cookie'];
                if(set_cookie!=undefined) {
                    for (let i = 0; i < set_cookie.length; i++) {
                        if (set_cookie[i].substring(0, 16) == 'neoworld_session') {
                            cookie = set_cookie[i];
                        }
                    }
                }
                resolve({status:'success',data:body});
            }
        );
    });
}

module.exports = {
    doRequest
};
