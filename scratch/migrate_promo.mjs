import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dip_drip'
})

async function run() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'promotions'")
  console.log('Columns in promotions:', res.rows)

  // Alter start_date and end_date columns to TEXT or TIMESTAMPTZ
  console.log('Altering start_date and end_date to TIMESTAMPTZ...')
  await pool.query("ALTER TABLE promotions ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ")
  await pool.query("ALTER TABLE promotions ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ")
  
  const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'promotions'")
  console.log('Updated columns:', res2.rows)

  await pool.end()
}

run().catch(console.error)
