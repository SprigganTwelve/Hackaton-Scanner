require('dotenv').config()
const Crypto = require('crypto-js')

const secretKey = process.env.SECRET_CRYPTO_KEY || "ma_cle_tres_secrete_123"

class CryptoSecurityService {
     /**
      * Produce hash with SHA256
      */
    static hash(data) {
        return Crypto.SHA256(data).toString(Crypto.enc.Hex);
    }

    /**
     * Encrypt plain text with AES
     * @param {string} plainText 
     * @returns 
     */
    static encrypt(plainText) {
        if (!plainText) return null;
        return Crypto.AES.encrypt(plainText, secretKey).toString();
    }

    /**
     * Decrypt encode plain text (with AES)
     * @param {string} cipherText 
     * @returns 
     */
    static decrypt(cipherText) {
        if (!cipherText) return null;
        const bytes = Crypto.AES.decrypt(cipherText, secretKey);
        return bytes.toString(Crypto.enc.Utf8);
    }
}

module.exports = CryptoSecurityService