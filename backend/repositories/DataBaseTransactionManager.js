

const pool = require('../config/database/mysql.client');

class DataBaseTransactionManager {
    /**
     * Handle callback function that contains database operations to be executed as a transaction
     * @param {function({connexion, commit, rollback})} transactionFunction - the callback function that contains the database operations to be executed as a transaction. This function receives an object as a parameter that contains the following properties:
     */
    static async executeTransaction(transactionFunction) {
        const connexion = await pool.getConnection();
        connexion.beginTransaction();
        transactionFunction({
            connexion,
            commit: connexion.commit,
            rollback: connexion.rollback
        });
    }
}

module.exports = DataBaseTransactionManager;