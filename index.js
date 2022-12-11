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
        // console.log(FindError(data))
        // console.log(FindError2(data,3))
        ServerStatus(data,3,3,3)
        // test4(data,3,3,3)
    })


function FindError(data){
    const error_server = data.map(v=>{
        if(v[2] == '-') return v
    }).filter(e=>e)
    
    let result = []
    error_server.forEach(e=>{
        let test = data.map(v=>{
            if(v[2] == '-') return
            if(v[1] == e[1] && (Number(v[0]) - Number(e[0]) > 0)) return [v[1],Number(v[0]) - Number(e[0]) + Number(v[2])*0.01] 
        }).filter(e=>e)
        if(test[0]) result.push(test[0])
    })
    return result
}
function FindError2(data,N){
    let timeout_server = {}
    let error_server = []
    data.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
            if(timeout_server[v[1]].count >= N)error_server.push({'ip':v[1],'time_diff':Number(v[0]) - Number(timeout_server[v[1]].time) + Number(v[2])*0.01})
            delete timeout_server[v[1]]
            return
        }
        Object.keys(timeout_server).includes(v[1]) ? timeout_server[v[1]].count = timeout_server[v[1]].count + 1:timeout_server[v[1]] = {'count':1,'time':v[0]}
    })
    return error_server
}
//いい感じにできたから残しとく
function ServerStatus(data,N,m,t){
    let timeout_server = {}
    let error_server = []
    data.forEach(v=>{
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
    console.log(error_server)
}

function test(data,N,m,t){
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



function test4(data,N,m,t){
    let timeout_server = {}
    let error_server = []
    const ip = data.map(v=>v[1]).filter((v,i,arr)=>{
        if(arr.indexOf(v) == i) return v
    })

    const ip_split = ip.map(v=>v.split('/'))
    let network_status = {}
    ip_split.forEach(v=>{
        const subnet_mask = cidr2subnetmask(Number(v[1]))
        const network_ip = long2ip(getNetworkAddr(ip2long(v[0]),ip2long(subnet_mask)))
        console.log(v[0])
        Object.keys(network_status).includes(network_ip) ? network_status[network_ip].push({'ip':v[0],'info':[]}):network_status[network_ip] =[{'ip':v[0],'info':[]}]
    })

    data.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
           
            // エラーと判別した際、初めてエラーが起こったサーバの時刻を引く
            if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1].split('/')[0],'cidr':v[1].split('/')[1],'start':Number(timeout_server[v[1]][0]),'stop':Number(v[0]) + Number(v[2])*0.01})
            //エラーと判別してた最後のサーバの時刻を引く
            // if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1],'time_diff':Number(v[0]) - Number(timeout_server[v[1]][timeout_server[v[1]].length - 1]) + Number(v[2])*0.01})
            delete timeout_server[v[1]]
            return
        }
        Object.keys(timeout_server).includes(v[1]) ? timeout_server[v[1]].push(v[0]):timeout_server[v[1]] = [v[0]]
        
    })
    console.log(network_status)
    let network_keys = Object.keys(network_status)
    error_server.forEach(v=>{
        const subnet_mask = cidr2subnetmask(Number(v.cidr))
        const network_ip = long2ip(getNetworkAddr(ip2long(v.ip),ip2long(subnet_mask)))
        if(!(network_keys.includes(network_ip))) return
        network_status[network_ip].forEach(e=>{
            if(e.ip !== v.ip) return
            e.info.push({'start':v.start,'stop':v.stop})
        })
    })

    //ネットワークに問題が起きているかを判別する処理
    network_keys.forEach(key=>{
        for(let i in network_status[key]){
            if(network_status[key][i].info.length == 0){
                delete network_status[key]
                break
            }
        }
    })
    if(Object.keys(network_status).length == 0) {
        console.log('ネットワークに異常はありません')
        return
    }
    
    //サブネット内に一つしかサーバがない場合、そのサーバから反応がない時間があるかを調べる
    let network_error = []
    network_keys = Object.keys(network_status)
    network_keys.forEach(key=>{
        if(network_status[key].length !== 1) return
        network_status[key][0].info.forEach(e=>{
            network_error.push({'error_start':e.start,'error_stop':e.stop,'ip':network_status[key][0].ip,'network_ip':key})
        }) 
        delete network_status[key]
    })
    
    let tmp = []
    const keys = Object.keys(network_status)
    keys.forEach(key=>{
        network_status[key].forEach((v,i,arr)=>{
            v.info.forEach(e=>{
                tmp.push([v.ip,key,e.start,e.stop])
            })
        })
    })
    
    //サブネット内に二つ以上のサーバがある場合に、全てのサーバから応答がない時間があるかを判別
    for(let i in tmp){
        let test = tmp[i]
        for(let j in tmp){
            if(test[0] == tmp[j][0] || test[1] !== tmp[j][1]) continue
            if((test[3]<tmp[j][3])&&(test[2]>tmp[j][2])) {
                network_error.push({'error_start':test[2],'error_stop':test[3],'network_ip':test[1],'ip':test[0]})
                continue
            }
            if((test[3] > tmp[j][2])&&(test[3] < tmp[j][3])&&(test[2]<tmp[j][2])) network_error.push({'error_start':test[2],'error_stop':test[3],'network_ip':test[1],'ip':test[0]+':'+tmp[j][0]})   
        }
    }

    network_error.forEach(e=>{
        console.log("ネットワークのエラー発生時間: "+e.error_start+" ネットワークのエラー終了時間: "+e.error_stop+" ネットワークIPアドレス: "+e.network_ip)
    })
    
}
const cidr2long = (cidr) => parseInt(String("").padStart(cidr, '1').padEnd(32, '0'), 2)
const cidr2subnetmask = (num) => long2ip(cidr2long(Number(num)))
const getNetworkAddr = (ip, subnetmask) => (ip & subnetmask) >>> 0
const ip2bin = (ip) => ip.split(".").map(e => Number(e).toString(2).padStart(8, '0')).join('')
const long2ip = (num) => {
    let bin = Number(num).toString(2).padStart(32, '0')
    return [
        bin.slice(0, 8),
        bin.slice(8, 16),
        bin.slice(16, 24),
        bin.slice(24, 32),
    ].map(e => parseInt(e, 2)).join('.')
}
const ip2long = (ip) => parseInt(ip2bin(ip), 2)