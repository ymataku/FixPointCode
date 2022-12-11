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

ReadData(process.argv.slice(2))
    .then((value)=>{
        //データを配列にして格納
        const data = value.map((value,index) => {
            return value.split(',')
        }).filter(e=>e)
        console.log(ServerLode(data,3,3,3))
    })

function ServerLode(data,N,m,t){
    let timeout_server = {}
    let error_server = []
    data.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
            // エラーと判別した際、初めてエラーが起こったサーバの時刻を引く
            if(timeout_server[v[1]].length >= N) error_server.push([v[1],timeout_server[v[1]].join(',')])
            //エラーと判別してた最後のサーバの時刻を引く
            // if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1],'time_diff':Number(v[0]) - Number(timeout_server[v[1]][timeout_server[v[1]].length - 1]) + Number(v[2])*0.01})
            delete timeout_server[v[1]]
            return
        }
        Object.keys(timeout_server).includes(v[1]) ? timeout_server[v[1]].push(v[0]):timeout_server[v[1]] = [v[0]]
    })
    
    error_server.forEach(e=>{
        const error_time = e[1].split(',')
        const error_server = e[0]
        data = data.filter(v=>{
            if(!(error_server == v[1] && error_time.includes(v[0]))) return v
        })
    })
    let server_load = []
    for(let i=2;i<data.length;i++){
        // console.log('hello')
        if(data[i][2] == '-' || data[i-1][2] == '-' || data[i-2][2] == '-') continue
        if((Number(data[i][2]) + Number(data[i-1][2]) + Number(data[i-2][2]))/3 > t) server_load.push([(Number(data[i][2]) + Number(data[i-1][2]) + Number(data[i-2][2]))/3,Number(data[i-2][0]),Number(data[i][0])])
        
    }
    let test = []
    let count = 0
    console.log(server_load)
    for(let i=0;i<server_load.length - 1;i++){
        if(server_load[i][2] < server_load[i+1][1]) {
            test.push([server_load[i][1],server_load[i][2]])
            count = 0
        }
        if(server_load[i][2] >= server_load[i+1][1]){
            if(count == 1){
                let tmp = test[test.length - 1][0]
                // console.log(test.length)
                test.pop()
                test.push([tmp,server_load[i+1][2]])
                
                // console.log(tmp)
            }else{
                test.push([server_load[i][1],server_load[i][2]])
            }
            count = 1
        }
        // console.log(i+":"+test)
    }
    console.log(test)
}
