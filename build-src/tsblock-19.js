import * as xyz from './zapatos/src';
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
import * as db from './zapatos/src';
import pool from './pgPool';
try {
    /* original script begins */
    function dbNowQuery() {
        const query = db.sql `SELECT now()`;
        query.runResultTransform = qr => qr.rows[0].now;
        return query;
    }
    const dbNow = await dbNowQuery().run(pool);
    // dbNow is a Date: the result you can toggle below has come via JSON.stringify
    /* original script ends */
}
catch (e) {
    console.log(e.name + ': ' + e.message);
    console.error('  -> error: ' + e.message);
}
await pool.end();
