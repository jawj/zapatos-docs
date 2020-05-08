
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
        type authorBooksSQL = s.authors.SQL | s.books.SQL;
type authorBooksSelectable = s.authors.Selectable & { books: s.books.Selectable[] };

const query = db.sql<authorBooksSQL, authorBooksSelectable[]>`
  SELECT ${"authors"}.*, jsonb_agg(${"books"}.*) AS ${"books"}
  FROM ${"authors"} JOIN ${"books"} 
  ON ${"authors"}.${"id"} = ${"books"}.${"authorId"}
  GROUP BY ${"authors"}.${"id"}`;

const authorBooks = await query.run(pool);

        /* original script ends */

        await pool.end();
      