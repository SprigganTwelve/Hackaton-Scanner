
const Crypto = require('crypto-js')
const secretKey = process.env.SECRET_CRYPTO_KEY || "hgsdkgskfgjkfgjkqsgfsjfgb"

class CryptoSecurityService
{
    static encode(data)
    {
         return Crypto.AES.encrypt(data, secretKey).toString()
    }

   static decode(encrypted){
        return Crypto.AES.decrypt(encrypted, secretKey);
   }
}


module.exports = CryptoSecurityService