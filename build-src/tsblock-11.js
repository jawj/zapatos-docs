import * as xyz from './zapatos/src';
xyz.setConfig({
    queryListener: (x) => {
        console.log('%%text%:' + x.text + '%%');
        if (x.values.length) {
            console.log('%%values%:[' + x.values.map((v) => JSON.stringify(v)).join(', ') + ']%%');
        }
    },
    resultListener: (x) => {
        if (x != null && (false || !(Array.isArray(x) && x.length === 0))) {
            console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
        }
    },
    transactionListener: (x) => {
        console.log('%%transaction%:' + x + '%%');
    },
});
import * as db from './zapatos/src';
import pool from './pgPool';
try {
    /* original script begins */
    const author = {
        name: 'Joseph Conrad',
        isLiving: false,
    }, [insertedAuthor] = await db.sql `
    INSERT INTO ${"authors"} (${db.cols(author)})
    VALUES (${db.vals(author)}) RETURNING *`.run(pool);
    /* original script ends */
}
catch (e) {
    console.log(e.name + ': ' + e.message);
    console.error('  -> error: ' + e.message);
}
await pool.end();
