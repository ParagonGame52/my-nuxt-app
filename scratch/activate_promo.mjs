import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dip_drip'
})

async function run() {
  const now = new Date()
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
  await pool.query("UPDATE promotions SET start_date = $1, end_date = $2, is_active = 1 WHERE id = 5", [now.toISOString(), later.toISOString()])
  await pool.end()
}

run().catch(console.error)
