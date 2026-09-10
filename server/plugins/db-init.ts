import { getPool } from '../utils/db'
import { createHash, randomBytes } from 'crypto'

function seedHashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

export default defineNitroPlugin(async () => {
  const pool = getPool()
  let client: any = null

  try {
    client = await pool.connect()
    console.log('Successfully connected to PostgreSQL database')

    // Acquire PostgreSQL Advisory Lock to prevent concurrent DDL deadlocks across Nitro workers/HMR
    const lockRes = await client.query('SELECT pg_try_advisory_lock(888999) AS locked')
    if (!lockRes.rows[0]?.locked) {
      console.log('Database initialization skipped: already locked by another worker')
      return
    }

    try {
      // 1. Create Core Tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          balance INTEGER NOT NULL DEFAULT 0,
          is_admin INTEGER NOT NULL DEFAULT 0,
          shipping_name VARCHAR(255),
          shipping_phone VARCHAR(255),
          shipping_address TEXT,
          avatar TEXT,
          banner_url TEXT,
          banner_theme VARCHAR(255),
          points INTEGER NOT NULL DEFAULT 0,
          total_spent INTEGER NOT NULL DEFAULT 0,
          tier VARCHAR(50) NOT NULL DEFAULT 'bronze',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL UNIQUE,
          user_agent TEXT,
          ip_address VARCHAR(50),
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price INTEGER NOT NULL,
          original_price INTEGER NOT NULL,
          status VARCHAR(255) NOT NULL DEFAULT 'มีสินค้าพร้อมส่ง',
          tag VARCHAR(255) NOT NULL DEFAULT 'สินค้าใหม่',
          images TEXT NOT NULL,
          description TEXT NOT NULL,
          details TEXT NOT NULL,
          category VARCHAR(255) NOT NULL DEFAULT 'STREETWEAR',
          stock INTEGER NOT NULL DEFAULT 10,
          sizes TEXT NOT NULL DEFAULT '[]',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS cart_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          product_name VARCHAR(255) NOT NULL,
          product_price INTEGER NOT NULL,
          product_img VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        );
        
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          total_price INTEGER NOT NULL,
          status VARCHAR(255) NOT NULL DEFAULT 'pending',
          payment_method VARCHAR(255) NOT NULL DEFAULT 'wallet',
          slip_image VARCHAR(255),
          shipping_name VARCHAR(255),
          shipping_phone VARCHAR(255),
          shipping_address TEXT,
          shipping_cost INTEGER NOT NULL DEFAULT 50,
          shipping_discount INTEGER NOT NULL DEFAULT 0,
          subtotal_price INTEGER NOT NULL DEFAULT 0,
          tier_discount INTEGER NOT NULL DEFAULT 0,
          tier_name VARCHAR(50) DEFAULT 'bronze',
          is_deleted INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          product_price INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          product_img TEXT
        );
        
        CREATE TABLE IF NOT EXISTS topup_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount INTEGER NOT NULL,
          status VARCHAR(255) NOT NULL DEFAULT 'pending',
          slip_url TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS support_tickets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          image_url TEXT,
          status VARCHAR(255) NOT NULL DEFAULT 'open',
          admin_reply TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ticket_messages (
          id SERIAL PRIMARY KEY,
          ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
          sender VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS promotions (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          image VARCHAR(255) NOT NULL DEFAULT '',
          badge VARCHAR(255) NOT NULL DEFAULT 'โปรโมชั่น',
          discount_text VARCHAR(255) NOT NULL DEFAULT '',
          start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          end_date TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
          is_active INTEGER NOT NULL DEFAULT 1,
          target_category VARCHAR(255) DEFAULT 'ALL',
          promo_type VARCHAR(50) DEFAULT 'product',
          min_spend INTEGER DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS gacha_chests (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price INTEGER NOT NULL,
          image VARCHAR(255) NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS gacha_chest_items (
          id SERIAL PRIMARY KEY,
          chest_id INTEGER NOT NULL REFERENCES gacha_chests(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          name VARCHAR(255),
          image TEXT DEFAULT '',
          price INTEGER DEFAULT 0,
          tier VARCHAR(255) DEFAULT 'normal',
          odds INTEGER NOT NULL DEFAULT 100,
          stock INTEGER DEFAULT NULL
        );

        CREATE TABLE IF NOT EXISTS withdrawal_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount NUMERIC(12,2) NOT NULL,
          bank_name TEXT,
          bank_account TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS product_reviews (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          title VARCHAR(255) DEFAULT '',
          comment TEXT DEFAULT '',
          body TEXT DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(product_id, user_id)
        );
      `)

      // 2. Safe Idempotent Column Additions
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(50) NOT NULL DEFAULT 'bronze';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_theme VARCHAR(255);
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_img TEXT;
        ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS slip_url TEXT;
        ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_category VARCHAR(255) DEFAULT 'ALL';
        ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promo_type VARCHAR(50) DEFAULT 'product';
        ALTER TABLE promotions ADD COLUMN IF NOT EXISTS min_spend INTEGER DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 50;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_discount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_price INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tier_discount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tier_name VARCHAR(50) DEFAULT 'bronze';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_deleted INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '';
        ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '';
        ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `)

      // 3. Seed Default Admin if not exists
      const adminEmail = 'admin@dipdrip.com'
      const adminRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail])
      if (adminRes.rowCount === 0) {
        const adminPassHash = seedHashPassword('123456')
        await client.query(`
          INSERT INTO users (name, email, password_hash, balance, is_admin, tier)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['แอดมินสูงสุด', adminEmail, adminPassHash, 999999, 2, 'diamond'])
        console.log('Seeded default admin user with diamond tier')
      }

      console.log('Database initialization complete')
    } finally {
      // Release advisory lock
      await client.query('SELECT pg_advisory_unlock(888999)')
    }
  } catch (err) {
    console.error('Database initialization error:', err)
  } finally {
    if (client) {
      client.release()
    }
  }
})
