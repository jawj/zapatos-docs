
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
        const [accountA, accountB] = await db.insert('bankAccounts', 
  [{ balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number) =>
  db.transaction(pool, db.Isolation.Serializable, txnClient => Promise.all([
    db.update('bankAccounts',
      { balance: db.sql<db.SQL>`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('bankAccounts',
      { balance: db.sql<db.SQL>`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

try {
  const [[updatedAccountA], [updatedAccountB]] = await transferMoney(accountA.id, accountB.id, 60);
} catch(err) {
  console.log(err.message, '/', err.detail);
}

        /* original script ends */

        await pool.end();
      