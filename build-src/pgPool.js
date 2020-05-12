import pg from 'pg';
export default new pg.Pool({
    connectionString: `postgresql://localhost/${process.env.ZDBNAME}`,
});
