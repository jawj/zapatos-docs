import pg from 'pg';
export const pool = new pg.Pool({
    connectionString: `postgresql://localhost/${process.env.ZDBNAME}`,
});
