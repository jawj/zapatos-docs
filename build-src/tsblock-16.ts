
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any) => {
            if (x && !(Array.isArray(x) && x.length === 0)) {
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          }
        });
        
          import * as db from './zapatos/src';
          import * as s from './zapatos/schema';
          import { pool } from './pgPool';
        

        /* original script begins */
        function dbNowQuery() {
  const query = db.sql<never, Date>`SELECT now()`;
  query.runResultTransform = qr => qr.rows[0].now;
  return query;
}

const dbNow = await dbNowQuery().run(pool);
// dbNow is a Date: the result you can toggle below has come via JSON.stringify

        /* original script ends */

        await pool.end();
      