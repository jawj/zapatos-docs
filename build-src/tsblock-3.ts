
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) console.log('%%values%:' + JSON.stringify(x.values, null, 2) + '%%');
          },
          resultListener: (x: any) => {
            if (x.length) console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
          }
        });
        /* original script begins */

        import * as db from './zapatos/src';
import { pool } from './pgPool';

const [accountA, accountB] = await db.insert('accounts', 
  [{ balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number) =>
  db.transaction(pool, db.Isolation.Serializable, txnClient => Promise.all([
    db.update('accounts',
      { balance: db.sql<db.SQL>`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('accounts',
      { balance: db.sql<db.SQL>`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

try {
  const [updatedAccountA, updatedAccountB] = await transferMoney(accountA.id, accountB.id, 60);
} catch(err) {
  console.log(err.message, '/', err.detail);
}


        /* original script ends */
        pool.end();
      