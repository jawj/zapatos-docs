
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
            if (false || (x != null && (false || !(Array.isArray(x) && x.length === 0)))) {
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
        type authorBooksSQL = s.authors.SQL | s.books.SQL;
type authorBooksSelectable = s.authors.Selectable & { books: s.books.Selectable[] };

const query = db.sql<authorBooksSQL, authorBooksSelectable[]>`
  SELECT ${"authors"}.*, jsonb_agg(${"books"}.*) AS ${"books"}
  FROM ${"authors"} JOIN ${"books"} 
  ON ${"authors"}.${"id"} = ${"books"}.${"authorId"}
  GROUP BY ${"authors"}.${"id"}`;

const authorBooks = await query.run(pool);

        /* original script ends */
        } catch(e) {
          console.log(e.name + ': ' + e.message);
          console.error('  -> error: ' + e.message);
        }

        await pool.end();
      