//csvファイルを使用したプログラミングテスト
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
            const N = argv[1]
            reader.on("line", (data) => {
                //csvファイルのデータを読み込み
                lines.push(data);
            });
            //読み込み終了時の処理
            reader.on('close', () => {
                resolve([lines,N])
            });
        }catch(e){
            console.log('エラー発生')
            rejects(e)
        }
    })
}

ReadData(process.argv.slice(2))
    .then((value)=>{
        //データを配列にして格納
        const N = value[1]
        const data = value[0].map((value,index) => {
            return value.split(',')
        }).filter(e=>e)
        console.log(FindError(data,N))
    })

function FindError(log,N){
    let timeout_server = {}
    let error_server = []
    log.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
            // エラーと判別した際、初めてエラーが起こったサーバの時刻を引く
            if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1].split('/')[0],'start':Number(timeout_server[v[1]][0]),'stop':Number(v[0]) + Number(v[2])*0.01})
            //エラーと判別してた最後のサーバの時刻を引く
            // if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1],'time_diff':Number(v[0]) - Number(timeout_server[v[1]][timeout_server[v[1]].length - 1]) + Number(v[2])*0.01})
            
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