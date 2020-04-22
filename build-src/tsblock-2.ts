
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
        

        /* original script begins */
        import * as db from './zapatos/src';
import { pool } from './pgPool';

const bookAuthorTags = await db.select('books', db.all, {
  lateral: {
    author: db.selectOne('authors', { id: db.parent('authorId') }),
    tags: db.select('tags', { bookId: db.parent('id') }),
  }
}).run(pool);

bookAuthorTags.map(b => 
  `${b.author!.name}: ${b.title} (${b.tags.map(t => t.tag).join(', ')})`);

        /* original script ends */

        pool.end();
      