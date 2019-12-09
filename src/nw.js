let request=require('./request');
let qs=require('querystring');
let html=require('./html');
let google=require('./google');
let mail=require('./mail');
let codeTime=null;

async function getLoginCookie(email,password,LOGIN_URL,GOOGLE_VERIFY_URL) {
    let form=qs.stringify({
        email:email,
        password:password
    });
    let result = await request.doRequest(LOGIN_URL,
        'POST',
        {
            'Content-Length': form.length,
            'Content-Type': 'application/x-www-form-urlencoded',
        }, form
    );
    if (result['status'] == 'error') {
        return{status: 'error', log: 'getCookie error,' + result['log']};
    } else if (result['status'] == 'success') {
        let googleCode=google.getGoogleCode();
        form=qs.stringify({
            googlecode: googleCode
        });
        result = await request.doRequest(GOOGLE_VERIFY_URL,
            'POST',
            {
                'Content-Length': form.length,
                'Content-Type': 'application/x-www-form-urlencoded',
            }, form
        );
        if (result['status'] == 'error') {
            return {status: 'error', log: 'getCookie error,' + result['log']};
        } else if (result['status'] == 'success') {
            return {status: 'success'};
        }
    }
}

async function getDepositData(DEPOSIT_URL){
    let blockData=await getBlockData(DEPOSIT_URL);
    if(blockData['status']!='error') {
        let data=blockData['data'];
        let isSuccess = false;
        let lock = true;
        let depositData = {
            nums: [],
            times: []
        };
        for (let i = 0; i < data.block.length; i++) {
            if (data.block[i] == '<td class="right aligned">') {
                depositData.nums.push(data.data[i + 1]);
                lock = false;
                isSuccess = true;
            }//筛选转账数额标签
            if (data.block[i] == '<td>' && lock == false) {
                depositData.times.push(data.data[i + 1]);
                lock = true;
            }//筛选到账时间标签
        }
        if (isSuccess) {
            for (let i = 0; i < depositData['times'].length; i++) {
                depositData['times'][i] = new Date(depositData['times'][i]);
                depositData['nums'][i] = parseFloat(depositData['nums'][i].replace(/,/g, ''));
            }
            return {status: 'success', data: depositData};
        } else {
            return {status: 'error', log: 'getDepositData error: error data'};
        }
    }else{
        return {status: 'error', log: 'getDepositData error,'+blockData['log']};
    }
}

async function getWithdrawData(WITHDRAW_URL) {
    let blockData = await getBlockData(WITHDRAW_URL);
    if(blockData['status']!='error') {
        let datas = {
            nums: [],
            days: [],
            mins: [],
            addresses: [],
            statuses: []
        };//数据数组
        let data=blockData['data'];
        let lockNums = false;
        let lockStatuses = true;
        let lockTimes = true;
        let isSuccess = false;
        for (let i = 0; i < data.block.length; i++) {
            if (data.block[i] == '<td class=\"\">') {
                datas.addresses.push(data.data[i + 1]);
            }
            if (data.block[i] == '<td class="right aligned">') {
                isSuccess = true;
                if (!lockNums) {
                    datas.nums.push(data.data[i + 1]);
                    lockTimes = false;
                }
                lockNums = !lockNums;
            }
            if (data.block[i] == '<td>' && lockTimes == false) {
                datas.days.push(data.data[i + 1]);
            }
            if (data.block[i] == '<br />' && lockTimes == false) {
                datas.mins.push(data.data[i + 1]);
                lockTimes = true;
            }
            if (data.block[i] == '<td class="right aligned">') {
                if (!lockStatuses) {
                    datas.statuses.push(data.data[i + 1]);
                }
                lockStatuses = !lockStatuses;
            }
        }
        if (isSuccess) {
            for (let i = 0; i < datas.days.length; i++) {
                datas.days[i] = datas.days[i].replace(/\r/g, '');
                datas.days[i] = datas.days[i].replace(/\t/g, '');
                datas.days[i] = datas.days[i].replace(/\n/g, '');
                datas.mins[i] = datas.mins[i].replace(/\r/g, '');
                datas.mins[i] = datas.mins[i].replace(/\t/g, '');
                datas.mins[i] = datas.mins[i].replace(/\n/g, '');
                datas.addresses[i] = datas.addresses[i].replace(/\r/g, '');
                datas.addresses[i] = datas.addresses[i].replace(/\t/g, '');
                datas.addresses[i] = datas.addresses[i].replace(/\n/g, '');
                datas.addresses[i] = datas.addresses[i].replace(/提币地址: /g, '');
                datas.statuses[i] = datas.statuses[i].replace(/\r/g, '');
                datas.statuses[i] = datas.statuses[i].replace(/\t/g, '');
                datas.statuses[i] = datas.statuses[i].replace(/\n/g, '');
            }
            let withdrawData = {
                nums: [],
                times: [],
                addresses: [],
                statuses: []
            };
            for (let i = 0; i < datas.days.length; i++) {
                withdrawData.nums.push(parseInt(datas.nums[i]));
                withdrawData.times.push(new Date(datas.days[i] + ' ' + datas.mins[i]));
                withdrawData.addresses.push(datas.addresses[i]);
                withdrawData.statuses.push(datas.statuses[i]);
            }
            return {status: 'success', data: withdrawData};
        } else {
            return {status: 'error', log: 'getWithdrawData error, isSuccess:'+isSuccess};
        }
    }else{
        return {status: 'error', log: 'getWithdrawData error,'+blockData['log']};
    }
}

async function getBlockData(url) {
    let result = await request.doRequest(url, 'POST');
    if(result['status']=='success'){
        return{status: 'success', data: html.getBlock(result['data'])};
    }else{
        return({status: 'error', log: 'getBlockData error:' + result['log']});
    }
}

async function getVerifyCode(){
    let result=await mail.getMails();
    if(result['status']=='success'){
        let code;
        for (let i=0;i<result['data'].length;i++) {
            if(result['data'][i].substring(0,15)=='<!doctype html>'){
                let data=html.getBlock(result['data'][i]);
                let lock=true;
                for(let j=0;j<data.block.length;j++){
                    if(data.block[j] == '<font size="3"  color="#69b3c2"'+'>'){
                        lock=false;
                    }
                    if(data.block[j] == '<b'+'>'&&lock==false){
                        code=data.data[j+1];
                        lock=true;
                    }
                }
            }
        }
        return {status:'success',data:code}
    }else{
        return {status:'error',log:'getVerifyCode error:'+result['log']}
    }
}

async function sendVerifyCode(SEND_CODE_API,tmp){
    if(new Date()-codeTime>60000||codeTime==null) {
        SEND_CODE_API+='?tmp='+tmp;
        let result = await request.doRequest(SEND_CODE_API, 'GET');
        if (result['status'] == 'success') {
            let json = JSON.parse(result['data']);
            if (json['status'] == 1) {
                codeTime = new Date();
                return {status: 'success'};
            } else {
                return {status: 'error', log: 'sendVerifyCode error:' + json['data']};
            }
        } else {
            return ({status: 'error', log: 'sendVerifyCode error,' + result['log']});
        }
    }else{
        return ({status: 'error', log: 'sendVerifyCode error: too fast'});
    }
}

async function withdraw(WITHDRAW_API,address_id,num,verifycode,googlecode,fast){
    WITHDRAW_API=WITHDRAW_API+'?wallet_address='+address_id+'&extract='+num+'&verifycode='+verifycode+'&googlecode='+googlecode+'&eth_address_id='+address_id+'&nash_extract='+num+'&fast_transfer='+fast;
    let result=await request.doRequest(WITHDRAW_API, 'GET');
    if(result['status']=='success'){
        if(result['data'].substring(0,1)!='<'){
            let json = JSON.parse(result['data']);
            if (json['status'] == 1) {
                return {status: 'success'};
            } else {
                return {status: 'error', log: 'withdraw error:' + json['data']};
            }
        }else{
            return {status: 'success'};
        }
    }else{
        return ({status: 'error', log: 'withdraw error,'+result['log']});
    }
}

async function getAddressId(WITHDRAW_URL,address){
    let blockData = await getBlockData(WITHDRAW_URL);
    if(blockData['status']!='error') {
        let num;
        let sAddress;
        let data=blockData['data'];
        for (let i = 0; i < data.block.length; i++) {
            if (data.block[i].substring(0,30) == '<div class="item" data-value="') {
                num=data.block[i].substring(30).replace('">','');
            }
            if (data.block[i] == '<span class="right floated" data-memo="null"'+'>') {
                sAddress=data.data[i+1];
                if(sAddress==address){
                    return{status: 'success', data:num};
                }
            }
        }
        return {status: 'error', log: 'getAddressId error: No Address'};
    }else{
        return {status: 'error', log: 'getAddressId error,'+blockData['log']};
    }
}

async function addNASHAddress(ADD_ADDRESS_URL,label,address,verifycode,googlecode){
    ADD_ADDRESS_URL+='?label='+label+'&eth_address='+address+'&verifycode='+verifycode+'&googlecode='+googlecode+'&currency=nash&memo='+null;
    let result=await request.doRequest(ADD_ADDRESS_URL, 'GET');
    if(result['status']=='success'){
        if(result['data'].substring(0,1)!='<') {
            let json = JSON.parse(result['data']);
            if (json['status'] == 1) {
                return ({status: 'success'});
            } else {
                return ({status: 'error', log: 'addNASHAddress error:' + json['data']});
            }
        }else{
            return ({status: 'success'});
        }
    }else{
        return ({status: 'error', log: 'addNASHAddress error,'+result['log']});
    }
}

async function refresh(url){
    let result=await request.doRequest(url, 'GET');
    if(result['status']=='success'){
        return ({status: 'success'});
    }else{
        return ({status: 'error', log: 'refresh error,'+result['log']});
    }
}

module.exports = {
    getLoginCookie,
    getDepositData,
    getWithdrawData,
    sendVerifyCode,
    addNASHAddress,
    withdraw,
    getVerifyCode,
    refresh,
    getAddressId
};