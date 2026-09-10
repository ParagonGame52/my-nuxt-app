import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dip_drip'
})

async function run() {
  const now = new Date()
  const later = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
  await pool.query("UPDATE promotions SET start_date = $1, end_date = $2 WHERE id = 5", [now.toISOString(), later.toISOString()])
  const res = await pool.query("SELECT * FROM promotions WHERE id = 5")
  console.log('Updated promo 5:', res.rows[0])
  await pool.end()
}

run().catch(console.error)
