import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query("select current_database()").then(res => {
  console.log("CONNECTED DB:", res.rows[0].current_database);
});

export default pool;
