
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
        const 
  // insert one
  steve = await db.insert('authors', { 
    name: 'Stephen Hawking', 
    isLiving: false, 
  }).run(pool),

  // insert many
  [time, me] = await db.insert('books', [
    { authorId: steve.id, title: 'A Brief History of Time' },
    { authorId: steve.id, title: 'My Brief History' },
  ]).run(pool),

  // insert even more
  [...tags] = await db.insert('tags', [
    { bookId: time.id, tag: 'physics' },
    { bookId: time.id, tag: 'physicist' },
    { bookId: me.id, tag: 'autobiography' },
  ]).run(pool);

        /* original script ends */

        pool.end();
      