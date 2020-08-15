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
import pool from './pgPool';
try {
    /* original script begins */
    const 
    // insert one
    steve = await db.insert('authors', {
        name: 'Steven Hawking',
        isLiving: false,
    }).run(pool), 
    // insert many
    [time, me] = await db.insert('books', [{
            authorId: steve.id,
            title: 'A Brief History of Time',
            createdAt: db.sql `now()`,
        }, {
            authorId: steve.id,
            title: 'My Brief History',
            createdAt: db.sql `now()`,
        }]).run(pool), tags = await db.insert('tags', [
        { bookId: time.id, tag: 'physics' },
        { bookId: me.id, tag: 'physicist' },
        { bookId: me.id, tag: 'autobiography' },
    ]).run(pool);
    /* original script ends */
}
catch (e) {
    console.log(e.name + ': ' + e.message);
    console.error('  -> error: ' + e.message);
}
await pool.end();
