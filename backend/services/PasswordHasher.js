

const bcrypt = require('bcrypt')

class PasswordHasher
{

    /**
     * This function is used to hash a password
     * for security
     * @param {string} password 
     * @returns 
     */
    static async hash({password})
    {
        const saltRounds = 10;
        const hashPaswword = await bcrypt.hash(password, saltRounds);
        return hashPaswword;
    }

    static async compare({password, hashedPassword})
    {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports =  PasswordHasher 