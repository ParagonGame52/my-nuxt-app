import { getDb } from './server/utils/db.js'

async function check() {
  const db = getDb()
  const cols = await db.prepare("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'promotions'").all()
  console.log('Columns in promotions table:', cols)

  // Alter start_date and end_date columns to TIMESTAMPTZ so it retains time (HH:mm:ss)
  console.log('Migrating start_date and end_date to TIMESTAMPTZ...')
  await db.prepare("ALTER TABLE promotions ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ").run()
  await db.prepare("ALTER TABLE promotions ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ").run()
  
  const colsAfter = await db.prepare("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'promotions'").all()
  console.log('Columns after migration:', colsAfter)
}

check().catch(console.error)
