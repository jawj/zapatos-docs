
        import * as xyz from 'zapatos/db';
        xyz.setConfig({
          queryListener: (x: any, txnId?: number) => {
            if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any, txnId?: number) => {
            if (x != null && (false || !(Array.isArray(x) && x.length === 0))) {
              if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          },
          transactionListener: (x: any, txnId?: number) => {
            if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
            console.log('%%transaction%:' + x + '%%');
          },
        });
        
          import * as db from 'zapatos/db';
          import { conditions as dc } from 'zapatos/db';
          import type * as s from 'zapatos/schema';
          import pool from './pgPool';
        

        try {
        /* original script begins */
        function dbNowQuery() {
  const query = db.sql<never, Date>`SELECT now()`;
  query.runResultTransform = qr => qr.rows[0].now;
  return query;
}

const dbNow = await dbNowQuery().run(pool);
// dbNow is a Date: the result you can toggle below has come via JSON.stringify

        /* original script ends */
        } catch(e) {
          console.log(e.name + ': ' + e.message);
          console.error('  -> error: ' + e.message);
        }

        await pool.end();
      