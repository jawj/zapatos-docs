import * as xyz from './zapatos/src';
xyz.setConfig({
    queryListener: (x) => {
        console.log('%%text%:' + x.text + '%%');
        if (x.values.length)
            console.log('%%values%:[' +
                x.values.map((v) => JSON.stringify(v)).join(', ') + ']%%');
    },
    resultListener: (x) => {
        if (x.length)
            console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
    }
});
/* original script begins */
import * as db from './zapatos/src';
import { pool } from './pgPool';
const author = {
    name: 'Gabriel Garcia Marquez',
    isLiving: false,
}, [insertedAuthor] = await db.sql `
      INSERT INTO ${"authors"} (${db.cols(author)})
      VALUES(${db.vals(author)}) RETURNING *`
    .run(pool);
/* original script ends */
pool.end();
