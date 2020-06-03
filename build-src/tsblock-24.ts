
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
        

        try {
        /* original script begins */
        const 
  newTransactions: s.appleTransactions.Insertable[] = [{
    environment: 'PROD',
    originalTransactionId: '123456',
    accountId: 123,
    latestReceiptData: 'TWFuIGlzIGRpc3Rp',
  }, {
    environment: 'PROD',
    originalTransactionId: '234567',
    accountId: 234,
    latestReceiptData: 'bmd1aXNoZWQsIG5v',
  }],
  result = await db.upsert('appleTransactions', newTransactions, 
    ['environment', 'originalTransactionId']).run(pool);

        /* original script ends */
        } catch(e) {
          console.log('error: ' + e.message);
          console.error('  -> error: ' + e.message);
        }

        await pool.end();
      