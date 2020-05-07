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
const query = db.sql `
  SELECT ${"books"}.*, to_jsonb(${"authors"}.*) as ${"author"}
  FROM ${"books"} JOIN ${"authors"} 
  ON ${"books"}.${"authorId"} = ${"authors"}.${"id"}`;
const bookAuthors = await query.run(pool);
/* original script ends */
await pool.end();
