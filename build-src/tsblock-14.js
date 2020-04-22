import * as xyz from './zapatos/src';
xyz.setConfig({
    queryListener: (x) => {
        console.log('%%text%:' + x.text + '%%');
        if (x.values.length) {
            console.log('%%values%:[' + x.values.map((v) => JSON.stringify(v)).join(', ') + ']%%');
        }
    },
    resultListener: (x) => {
        if (x && !(Array.isArray(x) && x.length === 0)) {
            console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
        }
    }
});
import * as db from './zapatos/src';
import { pool } from './pgPool';
/* original script begins */
async function getBooksWhereAll(...conditions) {
    for (let i = conditions.length - 1; i > 0; i--) {
        conditions.splice(i, 0, db.sql ` AND `);
    }
    return db.sql `
    SELECT * FROM ${"books"} WHERE ${conditions}`.run(pool);
}
const books = await getBooksWhereAll(db.sql `(${"title"} LIKE 'One%')`, db.sql `(${"authorId"} = 12)`);
/* original script ends */
pool.end();
