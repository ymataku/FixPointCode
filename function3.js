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
            const file_path = './csv/'+argv[0]
            const stream = fs.createReadStream(file_path, "utf8");
            const reader = readline.createInterface({ input: stream });
            let lines = []
            const N = argv[1]
            const m = argv[2]
            const t = argv[3]
            reader.on("line", (data) => {
                //csvファイルのデータを読み込み
                lines.push(data);
            });
            //読み込み終了時の処理
            reader.on('close', () => {
                resolve([lines,N,m,t])
            });
        }catch(e){
            console.log('エラー発生')
            rejects(e)
        }
    })
}

function ServerLode(data,N,m,t){
    let timeout_server = {}
    let error_server = []
    data.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
            if(timeout_server[v[1]].length >= N) error_server.push([v[1],timeout_server[v[1]].join(',')])
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

    let server_load = {}
    data.forEach(e=>{
        if(e[2] === '-') return 
        Object.keys(server_load).includes(e[1])? server_load[e[1]].reply.push(e[2]):server_load[e[1]] = {'reply':[e[2]],'avg':[],'start_time':e[0]}
        if(server_load[e[1]].reply.length >= m) {
            const  sum = server_load[e[1]].reply.reduce((a,b)=>Number(a) + Number(b))
            server_load[e[1]].avg.push([(sum/m).toFixed(1),server_load[e[1]].start_time,e[0]])
            server_load[e[1]].reply.length = 0
        }  
    })
  
    const keys = Object.keys(server_load)
    let slow_term = []
    keys.forEach(key=>{
        server_load[key].avg.forEach(v=>{
            if(v[0]>=t) slow_term.push([v[1],v[2],key])
        })
    })
    return slow_term
}

ReadData(process.argv.slice(2))
    .then((value)=>{
        const N = value[1]
        const m = value[2]
        const t = value[3]
        const data = value[0].map((value,index) => {
            return value.split(',')
        }).filter(e=>e)

        const server_lode = ServerLode(data,N,m,t)
        if(server_lode.length === 0){
            console.log('サーバに負荷は低い状態です')
            return
        }

        server_lode.forEach(e=>{
            const start = e[0]
            const end = e[1]
            const start_date = new Date(Number(start.slice(0,4)), Number(start.slice(4,6)) - 1, Number(start.slice(6,8)), Number(start.slice(8,10)), Number(start.slice(10,12)), Number(start.slice(12,14)))
            const end_date = new Date(Number(end.slice(0,4)), Number(end.slice(4,6)) - 1, Number(end.slice(6,8)), Number(end.slice(8,10)), Number(end.slice(10,12)), Number(end.slice(12,14)))
            console.log('IPアドレス: '+e[2]+' , '+'負荷が大きかった期間: '+start_date.toLocaleString()+' ~ '+end_date.toLocaleString())
        })
    })