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

ReadData(process.argv.slice(2))
    .then((value)=>{
        //データを配列にして格納
        const N = value[1]
        const m = value[2]
        const t = value[3]
        const data = value[0].map((value,index) => {
            return value.split(',')
        }).filter(e=>e)
        console.log(ServerLode(data,N,m,t))
    })

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

    let server_load = []
    let server_fuka = {}
    for(let i=2;i<data.length;i++){
        if(data[i][2] === '-') continue
        Object.keys(server_fuka).includes(data[i][1])? server_fuka[data[i][1]].reply.push(data[i][2]):server_fuka[data[i][1]] = {'reply':[data[i][2]],'avg':[],'start_time':data[i][0]}
        if(server_fuka[data[i][1]].reply.length >= m) {
            const  sum = server_fuka[data[i][1]].reply.reduce((a,b)=>a + b)
            server_fuka[data[i][1]].avg.push([sum/m,server_fuka[data[i][1]].start_time,data[i][0]])
            server_fuka[data[i][1]].reply.length = 0
        }

        // if((Number(data[i][2]) + Number(data[i-1][2]) + Number(data[i-2][2]))/m > t) server_load.push([(Number(data[i][2]) + Number(data[i-1][2]) + Number(data[i-2][2]))/m,Number(data[i-2][0]),Number(data[i][0])])
    }
    const keys = Object.keys(server_fuka)
    let fuka = []
    keys.forEach(key=>{
        server_fuka[key].avg.forEach(v=>{
            if(v[0]>=t) fuka.push([v[1],v[2],key])
        })
        
        // if(server_fuka[e].avg[0] >= t) console.log(server_fuka[e].avg[1]+':'+server_fuka[e].avg[2])
    })
    let network_error = []
    for(let i in fuka){
        let error_info = fuka[i]
        for(let j in fuka){
            if(error_info[0] == fuka[j][0] || error_info[1] !== fuka[j][1]) continue
            if((error_info[3]<fuka[j][3])&&(error_info[2]>fuka[j][2])) {
                network_error.push({'error_start':error_info[2],'error_stop':error_info[3],'network_ip':error_info[1],'ip':error_info[0]})
                continue
            }
            if((error_info[3] > fuka[j][2])&&(error_info[3] < fuka[j][3])&&(error_info[2]<fuka[j][2])) network_error.push({'error_start':error_info[1],'error_stop':fuka[j][2],'ip':error_info[2]})   
        }
    }
    console.log(network_error)

    return fuka
    // return server_fuka
    // console.log(server_load)
    // let test = []
    // let count = 0
    // // console.log(server_load)
    // for(let i=0;i<server_load.length - 1;i++){
    //     if(server_load[i][2] < server_load[i+1][1]) {
    //         test.push([server_load[i][1],server_load[i][2]])
    //         count = 0
    //     }
    //     if(server_load[i][2] >= server_load[i+1][1]){
    //         if(count == 1){
    //             let tmp = test[test.length - 1][0]
    //             test.pop()
    //             test.push([tmp,server_load[i+1][2]])
    //         }else{
    //             test.push([server_load[i][1],server_load[i][2]])
    //         }
    //         count = 1
    //     }
    // }
    // return test
}
