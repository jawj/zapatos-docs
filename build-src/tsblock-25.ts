
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
          import pool from './pgPool';
        

        /* original script begins */
        const 
  anotherNewTransaction: s.appleTransactions.Insertable = {
    environment: 'PROD',
    originalTransactionId: '345678',
    accountId: 345,
    latestReceiptData: 'lALvEleO4Ehwk3T5',
  },
  result = await db.upsert('appleTransactions', anotherNewTransaction, 
    db.constraint('appleTransactionsPrimaryKey')).run(pool);

        /* original script ends */

        await pool.end();
      