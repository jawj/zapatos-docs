/*
** DON'T EDIT THIS FILE (unless you're working on Zapatos) **
It's part of Zapatos, and will be overwritten when the database schema is regenerated

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/
import { isDatabaseError } from './pgErrors';
import { wait } from './utils';
import { sql, raw } from './core';
import { getConfig } from "./config";
export var Isolation;
(function (Isolation) {
    // these are the only meaningful values in Postgres: 
    // see https://www.postgresql.org/docs/11/sql-set-transaction.html
    Isolation["Serializable"] = "SERIALIZABLE";
    Isolation["RepeatableRead"] = "REPEATABLE READ";
    Isolation["ReadCommitted"] = "READ COMMITTED";
    Isolation["SerializableRO"] = "SERIALIZABLE, READ ONLY";
    Isolation["RepeatableReadRO"] = "REPEATABLE READ, READ ONLY";
    Isolation["ReadCommittedRO"] = "READ COMMITTED, READ ONLY";
    Isolation["SerializableRODeferrable"] = "SERIALIZABLE, READ ONLY, DEFERRABLE";
})(Isolation || (Isolation = {}));
let txnSeq = 0;
/**
 * Provide a database client to the callback, whose queries are then wrapped in a
 * database transaction. The transaction is committed, retried, or rolled back as
 * appropriate.
 * @param pool The `pg.Pool` from which to check out the database client
 * @param isolationMode The `Isolation` mode (e.g `Serializable`)
 * @param callback The callback function that runs queries on the provided client
 */
export async function transaction(pool, isolationMode, callback) {
    const txnId = txnSeq++, txnClient = await pool.connect(), config = getConfig(), maxAttempts = config.transactionAttemptsMax, { minMs, maxMs } = config.transactionRetryDelay;
    try {
        for (let attempt = 1;; attempt++) {
            try {
                if (attempt > 1)
                    console.log(`Retrying transaction #${txnId}, attempt ${attempt} of ${maxAttempts}`);
                await sql `START TRANSACTION ISOLATION LEVEL ${raw(isolationMode)}`.run(txnClient);
                const result = await callback(txnClient);
                await sql `COMMIT`.run(txnClient);
                return result;
            }
            catch (err) {
                await sql `ROLLBACK`.run(txnClient);
                // on trapping the following two rollback error codes, see:
                // https://www.postgresql.org/message-id/1368066680.60649.YahooMailNeo@web162902.mail.bf1.yahoo.com
                // this is also a good read:
                // https://www.enterprisedb.com/blog/serializable-postgresql-11-and-beyond
                if (isDatabaseError(err, "TransactionRollback_SerializationFailure", "TransactionRollback_DeadlockDetected")) {
                    if (attempt < maxAttempts) {
                        const delayBeforeRetry = Math.round(minMs + (maxMs - minMs) * Math.random());
                        console.log(`Transaction #${txnId} rollback (code ${err.code}) on attempt ${attempt} of ${maxAttempts}, retrying in ${delayBeforeRetry}ms`);
                        await wait(delayBeforeRetry);
                    }
                    else {
                        console.log(`Transaction #${txnId} rollback (code ${err.code}) on attempt ${attempt} of ${maxAttempts}, giving up`);
                        throw err;
                    }
                }
                else {
                    throw err;
                }
            }
        }
    }
    finally {
        txnClient.release();
    }
}
