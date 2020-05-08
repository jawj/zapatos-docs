
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any) => {
            if (x != null && !(Array.isArray(x) && x.length === 0)) {
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          },
          transactionListener: (x: any) => {
            console.log('%%transaction%:' + x + '%%');
          },
        });
        
          import * as db from './zapatos/src';
          import * as s from './zapatos/schema';
          import { pool } from './pgPool';
        

        /* original script begins */
        const 
  titleLike = `Pride%`,
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{ 
      title: db.sql<db.SQL>`${db.self} LIKE ${db.param(titleLike)}`,
      createdAt: db.sql<db.SQL>`${db.self} > now() - INTERVAL '200 years'`,
    }}`.run(pool);

        /* original script ends */

        await pool.end();
      