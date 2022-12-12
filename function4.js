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

/**
 * 
 * @param {string} ip IPアドレスを.でつないだ32bitの文字列
 * @param {string} cidr CIDRの文字列
 * @returns 入力したIPアドレスのネットワークアドレスを返します。
 */
function GetNetworkIP(ip,cidr){
    const subnet_binary = String("").padStart(cidr, '1').padEnd(32, '0')
    const ip_binary = ip.split(".").map(e => Number(e).toString(2).padStart(8, '0')).join('')
    
    const networkip_number = (parseInt(ip_binary,2) & parseInt(subnet_binary,2)) >>> 0
    const networkip_binary =  networkip_number.toString(2).padStart(32, '0')
  
    const network_ip = [networkip_binary.slice(0, 8),networkip_binary.slice(8, 16),networkip_binary.slice(16, 24),networkip_binary.slice(24, 32)].map(e => parseInt(e, 2)).join('.')
    return network_ip
}


function NetworkError(log,N){
    //IPアドレスだけを取り出す
    const ip = log.map(v=>v[1]).filter((v,i,arr)=>{
        if(arr.indexOf(v) == i) return v
    })
    //IPアドレスとCIDRの情報を分けて取得
    const ip_split = ip.map(v=>v.split('/'))
    let network_status = {}
    //サブネットのネットワークアドレスとそれに属するサーバのIPアドレスを紐づけて、ネットワークの概略をnetwork_statusとして作成
    ip_split.forEach(v=>{
        const network_ip = GetNetworkIP(v[0],v[1])
        Object.keys(network_status).includes(network_ip) ? network_status[network_ip].push({'ip':v[0],'info':[]}):network_status[network_ip] =[{'ip':v[0],'info':[]}]
    })
   
    //エラーが発生したサーバの情報を取り出す
    let timeout_server = {}
    let error_server = []
    const m_s = 0.01
    log.forEach(v=>{
        if(!Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') return 
        if(Object.keys(timeout_server).includes(v[1]) && v[2] !== '-') {
            // エラーと判別した際、初めてエラーが起こったサーバの時刻を引く
            if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1].split('/')[0],'cidr':v[1].split('/')[1],'start':Number(timeout_server[v[1]][0]),'stop':Number(v[0]) + Number(v[2])*m_s})
            //エラーと判別してた最後のサーバの時刻を引く
            // if(timeout_server[v[1]].length >= N) error_server.push({'ip':v[1],'time_diff':Number(v[0]) - Number(timeout_server[v[1]][timeout_server[v[1]].length - 1]) + Number(v[2])*0.01})
            delete timeout_server[v[1]]
            return
        }
        Object.keys(timeout_server).includes(v[1]) ? timeout_server[v[1]].push(v[0]):timeout_server[v[1]] = [v[0]]
        
    })
    
    //エラーが発生したサーバの情報をnetwork_statusに格納していく
    let network_keys = Object.keys(network_status)
    error_server.forEach(v=>{
        const network_ip = GetNetworkIP(v.ip,v.cidr)
        if(!(network_keys.includes(network_ip))) return
        network_status[network_ip].forEach(e=>{
            if(e.ip !== v.ip) return
            e.info.push({'start':v.start,'stop':v.stop})
        })
    })

    /**
     * ネットワークに問題が起きているかを判別する処理
     * 先ほどのエラーサーバの情報が、サブネット内のすべてのサーバに与えられていれば、サーバ全てエラーを起こしている可能性がる。
     */
    network_keys.forEach(key=>{
        for(let i in network_status[key]){
            if(network_status[key][i].info.length == 0){
                delete network_status[key]
                break
            }
        }
    })
    if(Object.keys(network_status).length == 0) return []
    
    
    //サブネット内に一つしかサーバがない場合、そのサーバから反応がない時間を調べる
    let network_error = []
    network_keys = Object.keys(network_status)
    network_keys.forEach(key=>{
        if(network_status[key].length !== 1) return
        network_status[key][0].info.forEach(e=>{
            network_error.push({'error_start':e.start,'error_stop':e.stop,'ip':network_status[key][0].ip,'network_ip':key})
        }) 
        delete network_status[key]
    })

    /**
     * サブネット内に二つ以上のサーバがある場合に、全てのサーバから応答がない時間があるかを判別
     * network_statusに格納しているエラーサーバの情報を扱いやすいようにerror_statusに代入する
     */
    let error_status = []
    const keys = Object.keys(network_status)
    keys.forEach(key=>{
        network_status[key].forEach((v,i,arr)=>{
            v.info.forEach(e=>{
                error_status.push([v.ip,key,e.start,e.stop])
            })
        })
    })
    for(let i in error_status){
        const error = error_status[i]
        for(let j in error_status){
            if(error[0] == error_status[j][0] || error[1] !== error_status[j][1]) continue
            if((error[3]<error_status[j][3])&&(error[2]>error_status[j][2])) {
                network_error.push({'error_start':error[2],'error_stop':error[3],'network_ip':error[1],'ip':error[0]})
                continue
            }
            if((error[3] > error_status[j][2])&&(error[3] < error_status[j][3])&&(error[2]<error_status[j][2])) network_error.push({'error_start':error[2],'error_stop':error[3],'network_ip':error[1],'ip':error[0]+':'+error_status[j][0]})   
        }
    }
    
    return network_error
}


ReadData(process.argv.slice(2))
    .then((value)=>{
        //データを配列にして格納
        const N = value[1]
        const data = value[0].map((value,index) => {
            return value.split(',')
        }).filter(e=>e)
        
        const network_error = NetworkError(data,N)
        if(network_error.length === 0){
            console.log('ネットワークに異常はありません')
            return
        }
        network_error.forEach(e=>{
            const start = e.error_start.toString()
            const end = e.error_stop.toString()
            const start_date = new Date(Number(start.slice(0,4)), Number(start.slice(4,6)) - 1, Number(start.slice(6,8)), Number(start.slice(8,10)), Number(start.slice(10,12)), Number(start.slice(12,14)))
            if(end === '-'){
                console.log('ネットワークIPアドレス: '+e.network_ip+' エラーが起きた時刻: '+start_date.toLocaleString()+' 解消されていません')
                return
            }
            const end_date = new Date(Number(end.slice(0,4)), Number(end.slice(4,6)) - 1, Number(end.slice(6,8)), Number(end.slice(8,10)), Number(end.slice(10,12)), Number(end.slice(12,14)))
            console.log(" ネットワークIPアドレス: "+e.network_ip+' , '+"ネットワークのエラー発生期間: "+start_date.toLocaleString()+" ~ "+end_date.toLocaleString()+'.'+end.split('.')[1])
        })
    })