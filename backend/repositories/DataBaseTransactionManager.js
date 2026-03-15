const pool = require('../config/database/mysql.client');


class DataBaseTransactionManager
{

    /**
     * Execute database operations inside a transaction
     * 
     * @param {function({
     *      connexion: import('mysql2').PoolConnection,
     *      commit: Promise<()=>void>, 
     *      rollback: Promise<()=>void>
     * }): Promise<any>} transactionFunction
     * Callback containing the DB operations to execute atomically.
     */
    static async executeTransaction(transactionFunction) {
        const connexion = await pool.getConnection();
        try {
            await connexion.beginTransaction();

            const result = await transactionFunction({

                connexion,

                commit: async () => {
                    await connexion.commit();
                    connexion.release();
                },

                rollback: async () => {
                    await connexion.rollback();
                    connexion.release();
                }

            });

            return result;

        }
        catch (error) {

            await connexion.rollback();
            connexion.release();
            throw error;
        }
    }
}

module.exports = DataBaseTransactionManager;