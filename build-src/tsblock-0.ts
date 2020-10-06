
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any) => {
            if (x != null && (false || !(Array.isArray(x) && x.length === 0))) {
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          },
          transactionListener: (x: any) => {
            console.log('%%transaction%:' + x + '%%');
          },
        });
        
          import * as db from './zapatos/src';
          import { conditions as dc } from './zapatos/src';
          import * as s from './zapatos/schema';
          import pool from './pgPool';
        

        try {
        /* original script begins */
        const
  author: s.authors.Insertable = {
    name: 'Gabriel Garcia Marquez',
    isLiving: false,
  },
  [insertedAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
      INSERT INTO ${"authors"} (${db.cols(author)})
      VALUES (${db.vals(author)}) RETURNING *`
    .run(pool);

        /* original script ends */
        } catch(e) {
          console.log(e.name + ': ' + e.message);
          console.error('  -> error: ' + e.message);
        }

        await pool.end();
      