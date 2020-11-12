import * as xyz from 'zapatos/db';
xyz.setConfig({
    queryListener: (x, txnId) => {
        if (txnId != null)
            console.log('%%txnId%:' + txnId + '%%');
        console.log('%%text%:' + x.text + '%%');
        if (x.values.length) {
            console.log('%%values%:[' + x.values.map((v) => JSON.stringify(v)).join(', ') + ']%%');
        }
    },
    resultListener: (x, txnId) => {
        if (x != null && (false || !(Array.isArray(x) && x.length === 0))) {
            if (txnId != null)
                console.log('%%txnId%:' + txnId + '%%');
            console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
        }
    },
    transactionListener: (x, txnId) => {
        if (txnId != null)
            console.log('%%txnId%:' + txnId + '%%');
        console.log('%%transaction%:' + x + '%%');
    },
});
import * as db from 'zapatos/db';
import { conditions as dc } from 'zapatos/db';
import pool from './pgPool';
try {
    /* original script begins */
    const titleLike = 'Northern%', books = await db.sql `
    SELECT * FROM ${"books"} WHERE ${{
        title: dc.like(titleLike),
        createdAt: dc.gt(db.sql `now() - INTERVAL '7 days'`),
    }}`.run(pool);
    /* original script ends */
}
catch (e) {
    console.log(e.name + ': ' + e.message);
    console.error('  -> error: ' + e.message);
}
await pool.end();
