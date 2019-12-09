function getBlock(body) {
    let blocks={
        block:[],
        data:[],
    };
    let block='';
    let data='';
    let lock=false;
    for(let i=0;i<body.length;i++){
        if(body[i]=='<') {
            blocks.data.push(data);
            data='';
            block='';
            lock = false;
        }
        if(body[i]=='>'){
            block += body[i];
            lock=true;
            blocks.block.push(block);
        }
        if(lock==false) {
            block += body[i];
        }
        if(lock==true&&body[i]!='>'){
            data+=body[i];
        }
    }
    return blocks;
}

module.exports = {
    getBlock
};