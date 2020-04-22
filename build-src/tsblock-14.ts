
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
        async function getBooksWhereAll(...conditions: db.SQLFragment[]) {
  for (let i = conditions.length - 1; i > 0; i--) {
    conditions.splice(i, 0, db.sql` AND `);
  }
  return db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${conditions}`.run(pool);
}

const books = await getBooksWhereAll(
  db.sql<s.books.SQL>`(${"title"} LIKE 'One%')`,
  db.sql<s.books.SQL>`(${"authorId"} = 12)`
);

        /* original script ends */

        pool.end();
      