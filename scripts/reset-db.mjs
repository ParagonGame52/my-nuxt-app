import pg from 'pg'
import { createHash, randomBytes } from 'crypto'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dip_drip'
const pool = new Pool({ connectionString })

function seedHashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

async function resetDb() {
  const client = await pool.connect()
  try {
    console.log('--- เริ่มต้นกระบวนการล้างและสร้างฐานข้อมูลใหม่ (Clean Reset & Seed) ---')
    
    // 1. Drop all tables
    console.log('1. กำลังลบตารางเดิมทั้งหมด (DROP ALL TABLES CASCADE)...')
    await client.query(`
      DROP TABLE IF EXISTS product_reviews CASCADE;
      DROP TABLE IF EXISTS ticket_messages CASCADE;
      DROP TABLE IF EXISTS support_tickets CASCADE;
      DROP TABLE IF EXISTS gacha_chest_items CASCADE;
      DROP TABLE IF EXISTS gacha_chests CASCADE;
      DROP TABLE IF EXISTS promotions CASCADE;
      DROP TABLE IF EXISTS withdrawal_requests CASCADE;
      DROP TABLE IF EXISTS topup_requests CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `)

    // 2. Re-create all 14 tables
    console.log('2. กำลังสร้างตารางทั้ง 14 ตาราง (CREATE TABLES)...')
    await client.query(`
      CREATE TABLE users (
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
      
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        user_agent TEXT,
        ip_address VARCHAR(50),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE products (
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
      
      CREATE TABLE cart_items (
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
      
      CREATE TABLE orders (
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
      
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        product_img TEXT
      );
      
      CREATE TABLE topup_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'pending',
        slip_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      );
      
      CREATE TABLE support_tickets (
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

      CREATE TABLE ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE promotions (
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
      
      CREATE TABLE gacha_chests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        image VARCHAR(255) NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE gacha_chest_items (
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

      CREATE TABLE withdrawal_requests (
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

      CREATE TABLE product_reviews (
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

    // 3. Seed Super Admin User Only
    console.log('3. กำลังเพิ่มข้อมูล Super Admin เริ่มต้น...')
    const adminPass = seedHashPassword('123456')

    await client.query(`
      INSERT INTO users (name, email, password_hash, balance, is_admin, tier, points, shipping_name, shipping_phone, shipping_address)
      VALUES 
      ('แอดมินสูงสุด', 'admin@dipdrip.com', $1, 999999, 2, 'diamond', 500, 'ผู้ดูแลระบบ Dip Drip', '0899999999', 'สำนักงานใหญ่ Dip Drip กรุงเทพมหานคร 10110')
    `, [adminPass])

    console.log('--- ล้างฐานข้อมูลเสร็จสิ้นเรียบร้อย (มีเฉพาะ Admin 1 บัญชี ตารางอื่นว่างเปล่าทั้งหมด) ---')
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการล้างฐานข้อมูล:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

resetDb().catch(() => process.exit(1))
