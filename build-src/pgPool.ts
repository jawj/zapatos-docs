import pg from 'pg';
export default new pg.Pool({
  connectionString: process.env.ZDBURL
});
