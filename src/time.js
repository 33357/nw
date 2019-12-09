let time;
let _name;

function setTime(name){
    time=new Date();
    _name=name;
}

function getTime(){
    console.log({name:_name,time:new Date()-time})
}

function changeDate(date) {
    let str=new Date(date.getTime()+8*60*60*1000).toISOString();
    let str2=str.replace('T', ' ');
    return str2.substring(0,str2.length-5);
}

module.exports = {
    setTime,
    getTime,
    changeDate
};