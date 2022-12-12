let test = {
    'A':{ip:[1,2,3,3,32,5],avg:[]}
}

// test['A'].avg.push(test['A'].reduce((a,b)=>a + Number(b.ip),0))
test['A'].avg.push(test['A'].ip.reduce((a,b) => a+b))

test['A'].ip.length = 0
// console.log(test)
console.log(parseInt('12',8))