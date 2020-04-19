
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('<<<text>>>' + x.text + ';');
            if (x.values.length) console.log('<<<values>>>' + JSON.stringify(x.values, null, 2));
          },
          resultListener: (x: any) => {
            console.log('<<<result>>>' + JSON.stringify(x, null, 2));
          }
        });
        /* original script begins */

        import * as db from './zapatos/src';
import * as s from './zapatos/schema';
import { pool } from './pgPool';

const
  author: s.authors.Insertable = {
    name: 'Gabriel Garcia Marquez',
    isLiving: false,
  },
  [insertedAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
      INSERT INTO ${"authors"} (${db.cols(author)})
      VALUES(${db.vals(author)}) RETURNING *`
    .run(pool);

console.log(insertedAuthor.id);


        /* original script ends */
        pool.end();
      