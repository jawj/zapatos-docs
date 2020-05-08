import * as xyz from './zapatos/src';
xyz.setConfig({
    queryListener: (x) => {
        console.log('%%text%:' + x.text + '%%');
        if (x.values.length) {
            console.log('%%values%:[' + x.values.map((v) => JSON.stringify(v)).join(', ') + ']%%');
        }
    },
    resultListener: (x) => {
        if (x != null && !(Array.isArray(x) && x.length === 0)) {
            console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
        }
    },
    transactionListener: (x) => {
        console.log('%%transaction%:' + x + '%%');
    },
});
import * as db from './zapatos/src';
import { pool } from './pgPool';
/* original script begins */
const bookAuthorTags = await db.select('books', db.all, {
    lateral: {
        author: db.selectOne('authors', { id: db.parent('authorId') }),
        tags: db.select('tags', { bookId: db.parent('id') }),
    }
}).run(pool);
/* original script ends */
await pool.end();
