
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) console.log('%%values%:[' + 
              x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
          },
          resultListener: (x: any) => {
            if (x.length) console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
          }
        });

        /* original script begins */
        import * as db from './zapatos/src';
import { pool } from './pgPool';

const [doug, janey] = await db.insert('authors', [
  { name: 'Douglas Adams', isLiving: false },
  { name: 'Jane Austen', isLiving: false},
]).run(pool);

        /* original script ends */

        pool.end();
      