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
export var IsolationLevel;
(function (IsolationLevel) {
    // these are the only meaningful values in Postgres: 
    // see https://www.postgresql.org/docs/11/sql-set-transaction.html
    IsolationLevel["Serializable"] = "SERIALIZABLE";
    IsolationLevel["RepeatableRead"] = "REPEATABLE READ";
    IsolationLevel["ReadCommitted"] = "READ COMMITTED";
    IsolationLevel["SerializableRO"] = "SERIALIZABLE, READ ONLY";
    IsolationLevel["RepeatableReadRO"] = "REPEATABLE READ, READ ONLY";
    IsolationLevel["ReadCommittedRO"] = "READ COMMITTED, READ ONLY";
    IsolationLevel["SerializableRODeferrable"] = "SERIALIZABLE, READ ONLY, DEFERRABLE";
})(IsolationLevel || (IsolationLevel = {}));
let txnSeq = 0;
/**
 * Provide a database client to the callback, whose queries are then wrapped in a
 * database transaction. The transaction is committed, retried, or rolled back as
 * appropriate.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param isolationLevel The desired `IsolationLevel` (e.g `Serializable`)
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function transaction(txnClientOrPool, isolationLevel, callback) {
    if (Object.prototype.hasOwnProperty.call(txnClientOrPool, '_zapatos')) {
        return callback(txnClientOrPool);
    }
    const txnId = txnSeq++, txnClient = await txnClientOrPool.connect(), config = getConfig(), { transactionListener } = config, maxAttempts = config.transactionAttemptsMax, { minMs, maxMs } = config.transactionRetryDelay;
    txnClient._zapatos = { isolationLevel, txnId };
    try {
        for (let attempt = 1;; attempt++) {
            try {
                if (attempt > 1 && transactionListener)
                    transactionListener(`Retrying transaction, attempt ${attempt} of ${maxAttempts}`, txnId);
                await sql `START TRANSACTION ISOLATION LEVEL ${raw(isolationLevel)}`.run(txnClient);
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
                        if (transactionListener)
                            transactionListener(`Transaction rollback (code ${err.code}) on attempt ${attempt} of ${maxAttempts}, retrying in ${delayBeforeRetry}ms`, txnId);
                        await wait(delayBeforeRetry);
                    }
                    else {
                        if (transactionListener)
                            transactionListener(`Transaction rollback (code ${err.code}) on attempt ${attempt} of ${maxAttempts}, giving up`, txnId);
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
        delete txnClient._zapatos;
        txnClient.release();
    }
}
/**
 * Shortcut for `transaction` with isolation level `Serializable`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function serializable(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.Serializable, callback);
}
/**
 * Shortcut for `transaction` with isolation level `RepeatableRead`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function repeatableRead(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.RepeatableRead, callback);
}
/**
 * Shortcut for `transaction` with isolation level `ReadCommitted`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function readCommitted(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.ReadCommitted, callback);
}
/**
 * Shortcut for `transaction` with isolation level `SerializableRO`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function serializableRO(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.SerializableRO, callback);
}
/**
 * Shortcut for `transaction` with isolation level `RepeatableReadRO`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function repeatableReadRO(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.RepeatableReadRO, callback);
}
/**
 * Shortcut for `transaction` with isolation level `ReadCommittedRO`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function readCommittedRO(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.ReadCommittedRO, callback);
}
/**
 * Shortcut for `transaction` with isolation level `SerializableRODeferrable`.
 * @param txnClientOrPool The `pg.Pool` from which to check out the database client
 * or an appropriate client to be passed through
 * @param callback A callback function that runs queries on the client provided to it
 */
export async function serializableRODeferrable(txnClientOrPool, callback) {
    return transaction(txnClientOrPool, IsolationLevel.SerializableRODeferrable, callback);
}
