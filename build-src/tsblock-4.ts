
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
          import pool from './pgPool.js';
        
          try {
          /* original script begins */
          const [accountA, accountB] = await db.insert('bankAccounts', 
  [{ balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number) =>
  db.serializable(pool, txnClient => Promise.all([
    db.update('bankAccounts',
      { balance: db.sql`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('bankAccounts',
      { balance: db.sql`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

try {
  const [[updatedAccountA], [updatedAccountB]] = await transferMoney(accountA.id, accountB.id, 60);
} catch(err: any) {
  console.log(err.message, '/', err.detail);
}

          /* original script ends */
          } catch(e: any) {
            console.log(e.name + ': ' + e.message);
            console.error('  -> error: ' + e.message);
          }

          await pool.end();
          