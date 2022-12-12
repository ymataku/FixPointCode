"use strict";
const fs = require('fs');
const readline = require("readline")

/**
 * 
 * @param {list} argv:標準入力のオプションを格納 
 * @returns プロミス型でcsvファイルから取り出したデータと標準入力の第一引数を返す。
 */
function ReadData(argv){
    return new Promise((resolve,rejects)=>{
        try{
            const stream = fs.createReadStream(argv[0], "utf8");
            const reader = readline.createInterface({ input: stream });
            let lines = []
            reader.on("line", (data) => {
                //csvファイルのデータを読み込み
                lines.push(data);
            });
            //読み込み終了時の処理
            reader.on('close', () => {
                resolve(lines)
            });
        }catch(e){
            console.log('エラー発生')
            rejects(e)
        }
    })
}

function FindError(log){
    let timeout_server = {}
    let error_server = []
    log.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
            error_server.push({'ip':v[1].split('/')[0],'start':Number(timeout_server[v[1]][0]),'stop':Number(v[0]) + Number(v[2])*0.01})
            delete timeout_server[v[1]]
            return
        }
        Object.keys(timeout_server).includes(v[1]) ? timeout_server[v[1]].push(v[0]):timeout_server[v[1]] = [v[0]]
        
    })
    
    const timeout_keys = Object.keys(timeout_server)
    if(timeout_keys.length === 0) return error_server

    timeout_keys.forEach(key=>{
        error_server.push({'ip':key,'start':timeout_server[key][0],'stop':'-'})
    })
    return error_server
   
}

ReadData(process.argv.slice(2))
    .then((value)=>{
        const data = value.map((value,index) => {
            return value.split(',')
        }).filter(e=>e)
        const error_server = FindError(data)
        if(error_server.length === 0){
            console.log('エラーは発生していません')
            return 
        }
        
        error_server.forEach(e=>{
            const start = e.start.toString()
            const end = e.stop.toString()
            const start_date = new Date(Number(start.slice(0,4)), Number(start.slice(4,6)) - 1, Number(start.slice(6,8)), Number(start.slice(8,10)), Number(start.slice(10,12)), Number(start.slice(12,14)))
            if(end === '-'){
                console.log('IPアドレス: '+e.ip+' エラーの発生期間 '+start_date.toLocaleString()+' ~ 不明')
                return
            }
            
            const end_date = new Date(Number(end.slice(0,4)), Number(end.slice(4,6)) - 1, Number(end.slice(6,8)), Number(end.slice(8,10)), Number(end.slice(10,12)), Number(end.slice(12,14)))
            console.log('IPアドレス: '+e.ip+' , '+' エラーの発生期間: '+start_date.toLocaleString()+' ~ '+end_date.toLocaleString()+'.'+end.split('.')[1])
        })
    })