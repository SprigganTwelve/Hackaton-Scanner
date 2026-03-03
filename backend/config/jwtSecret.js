

const getJwtSecret = ()=>{
    return process.env.JWT_SECRET || 'sehdhdhodusdgsd354ds5s4dqsdhqd' //Your secret JWT
}

module.exports = getJwtSecret