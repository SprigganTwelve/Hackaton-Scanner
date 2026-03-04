
const pool = require('../config/database/mysql.client')

class OwaspCategoryRepository
{
    static async getCategoryByName({name}){
        const [rows] = await pool.query(
            'SELECT id, name FORM owasp_category WHERE name=?',
            [name.trim()]
        )
        return { id: rows[0].id, name}
    }   
}

module.exports = OwaspCategoryRepository