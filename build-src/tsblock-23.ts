
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
        const 
  // insert one
  steve = await db.insert('authors', { 
    name: 'Steven Hawking', 
    isLiving: false,
  }).run(pool),

  // insert many
  [time, me] = await db.insert('books', [{ 
    authorId: steve.id, 
    title: 'A Brief History of Time',
    createdAt: db.sql`now()`,
  }, { 
    authorId: steve.id, 
    title: 'My Brief History',
    createdAt: db.sql`now()`,
  }]).run(pool),

  tags = await db.insert('tags', [
    { bookId: time.id, tag: 'physics' },
    { bookId: me.id, tag: 'physicist' },
    { bookId: me.id, tag: 'autobiography' },
  ]).run(pool),

  // insert with custom return values
  nutshell = await db.insert('books', { 
    authorId: steve.id, 
    title: 'The Universe in a Nutshell',
    createdAt: db.sql`now()`,
  }, {
    returning: ['id'],
    extras: { upperTitle: db.sql<s.books.SQL, string>`upper(${"title"})` },
  }).run(pool);


        /* original script ends */
        } catch(e) {
          console.log(e.name + ': ' + e.message);
          console.error('  -> error: ' + e.message);
        }

        await pool.end();
      