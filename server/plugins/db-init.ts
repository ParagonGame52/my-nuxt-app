import { getPool } from '../utils/db'
import { createHash, randomBytes } from 'crypto'

function seedHashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

export default defineNitroPlugin(async (nitroApp) => {
  const pool = getPool()

  // Try connecting to verify credentials
  try {
    const client = await pool.connect()
    console.log('Successfully connected to PostgreSQL database')

    // Create tables
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
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'มีสินค้าพร้อมส่ง',
        tag VARCHAR(255) NOT NULL,
        images TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT NOT NULL,
        category VARCHAR(255) NOT NULL DEFAULT 'STREETWEAR',
        stock INTEGER NOT NULL DEFAULT 10,
        sizes TEXT NOT NULL DEFAULT '[]'
      );
      
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
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
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS topup_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
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
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(255) NOT NULL DEFAULT '',
        badge VARCHAR(255) NOT NULL DEFAULT 'โปรโมชั่น',
        discount_text VARCHAR(255) NOT NULL DEFAULT '',
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
        is_active INTEGER NOT NULL DEFAULT 1,
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
        odds INTEGER NOT NULL DEFAULT 100
      );

      ALTER TABLE gacha_chest_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE gacha_chest_items ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';
      ALTER TABLE gacha_chest_items ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;
      ALTER TABLE gacha_chest_items ADD COLUMN IF NOT EXISTS tier VARCHAR(255) DEFAULT 'normal';
      ALTER TABLE gacha_chest_items ALTER COLUMN product_id DROP NOT NULL;
      ALTER TABLE gacha_chest_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;

      -- Migration: add avatar column to users if not exists
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

      -- Migration: add membership columns
      ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) NOT NULL DEFAULT 'bronze';

      -- Migration: add soft delete column to orders
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_deleted INTEGER NOT NULL DEFAULT 0;

      -- Migration: populate existing records with product info if name is NULL
      UPDATE gacha_chest_items gci
      SET name = p.name,
          image = (p.images::jsonb->>0),
          price = p.price,
          tier = COALESCE(p.tag, 'normal')
      FROM products p
      WHERE gci.product_id = p.id AND gci.name IS NULL;

      -- Migration: add image_url to support_tickets and ticket_messages
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
      ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

      -- Migration: move existing ticket messages/replies into ticket_messages table
      INSERT INTO ticket_messages (ticket_id, sender, message, created_at)
      SELECT id, 'user', message, created_at
      FROM support_tickets st
      WHERE NOT EXISTS (
        SELECT 1 FROM ticket_messages tm WHERE tm.ticket_id = st.id AND tm.sender = 'user'
      );

      INSERT INTO ticket_messages (ticket_id, sender, message, created_at)
      SELECT id, 'admin', admin_reply, COALESCE(updated_at, created_at)
      FROM support_tickets st
      WHERE admin_reply IS NOT NULL AND admin_reply != ''
        AND NOT EXISTS (
          SELECT 1 FROM ticket_messages tm WHERE tm.ticket_id = st.id AND tm.sender = 'admin'
        );
    `)

    // Seed default admin if not exists
    const adminEmail = 'admin@dipdrip.com'
    const adminRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail])
    if (adminRes.rowCount === 0) {
      const adminPassHash = seedHashPassword('123456')
      await client.query(`
        INSERT INTO users (name, email, password_hash, balance, is_admin)
        VALUES ($1, $2, $3, $4, $5)
      `, ['แอดมินสูงสุด', adminEmail, adminPassHash, 999999, 1])
      console.log('Seeded default admin user')
    }

    // Seed default products if empty
    const prodRes = await client.query('SELECT COUNT(*) as count FROM products')
    const productCount = parseInt(prodRes.rows[0].count, 10)
    if (productCount === 0) {
      const defaultProducts = [
        {
          name: 'Minimalist Autumn Cozy Set - ชุดเสื้อกันหนาวไหมพรมพร้อมกระโปรงเอวสูง',
          price: 590,
          original_price: 890,
          status: 'มีสินค้าพร้อมส่ง',
          tag: 'BEST SELLER',
          images: JSON.stringify(['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600']),
          description: 'เซ็ตชุดฤดูหนาวสไตล์ minimal สีเบจนุ่มๆ',
          details: JSON.stringify(['ผ้าไหมพรม', 'ทรง oversized', 'มีไซส์ S-XL']),
          category: 'MINIMAL',
          stock: 15,
          sizes: JSON.stringify([
            { name: 'S', stock: 4 },
            { name: 'M', stock: 5 },
            { name: 'L', stock: 4 },
            { name: 'XL', stock: 2 }
          ])
        },
        {
          name: 'Urban Streetwear Cargo Set - กางเกงคาร์โก้ + เสื้อ crop สุดฮิต',
          price: 790,
          original_price: 1190,
          status: 'มีสินค้าพร้อมส่ง',
          tag: 'NEW',
          images: JSON.stringify(['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600']),
          description: 'เซ็ตสตรีทแวร์สุดคูล คาร์โก้กว้าง + crop top',
          details: JSON.stringify(['ผ้า cotton 100%', 'กางเกงมีกระเป๋าข้าง', 'ไซส์ S-XXL']),
          category: 'STREETWEAR',
          stock: 20,
          sizes: JSON.stringify([
            { name: 'S', stock: 5 },
            { name: 'M', stock: 6 },
            { name: 'L', stock: 5 },
            { name: 'XL', stock: 3 },
            { name: 'XXL', stock: 1 }
          ])
        },
        {
          name: 'Soft Girl Pastel Coord - ชุดเซ็ตพาสเทลสไตล์เกาหลี',
          price: 650,
          original_price: 950,
          status: 'มีสินค้าพร้อมส่ง',
          tag: 'HOT',
          images: JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600']),
          description: 'ชุดเซ็ตสีพาสเทลสไตล์เกาหลีหวานๆ',
          details: JSON.stringify(['ผ้าชีฟอง', 'สีไม่ตก', 'ไซส์ XS-L']),
          category: 'KOREAN',
          stock: 7,
          sizes: JSON.stringify([
            { name: 'XS', stock: 2 },
            { name: 'S', stock: 2 },
            { name: 'M', stock: 1 },
            { name: 'L', stock: 2 }
          ])
        }
      ]

      for (const p of defaultProducts) {
        await client.query(
          `INSERT INTO products (name, price, original_price, status, tag, images, description, details, category, stock, sizes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [p.name, p.price, p.original_price, p.status, p.tag, p.images, p.description, p.details, p.category, p.stock, p.sizes]
        )
      }
      console.log('Seeded default products')
    }

    // ── Migrations ────────────────────────────────────────────────────
    // Add slip_url column to topup_requests (idempotent)
    try {
      await client.query(`ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS slip_url TEXT`)
      console.log('Migration: slip_url column ensured in topup_requests')
    } catch (e) {
      console.warn('Migration slip_url skipped:', e)
    }

    // Add target_category, promo_type, min_spend to promotions
    try {
      await client.query(`
        ALTER TABLE promotions ADD COLUMN IF NOT EXISTS target_category VARCHAR(255) DEFAULT 'ALL';
        ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promo_type VARCHAR(50) DEFAULT 'product';
        ALTER TABLE promotions ADD COLUMN IF NOT EXISTS min_spend INTEGER DEFAULT 0;
      `)
      console.log('Migration: promotions category & shipping promo columns ensured')
    } catch (e) {
      console.warn('Migration promotions columns skipped:', e)
    }

    // Add shipping columns to orders
    try {
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 50;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_discount INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_price INTEGER NOT NULL DEFAULT 0;
      `)
      console.log('Migration: orders shipping columns ensured')
    } catch (e) {
      console.warn('Migration orders columns skipped:', e)
    }

    // Ensure withdrawal_requests table & CASCADE constraint
    try {
      await client.query(`
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
        ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_user_id_fkey;
        ALTER TABLE withdrawal_requests ADD CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `)
      console.log('Migration: withdrawal_requests table and CASCADE ensured')
    } catch (e) {
      console.warn('Migration withdrawal_requests skipped:', e)
    }

    client.release()
    console.log('Database initialization complete')
  } catch (err) {
    console.error('Database initialization error:', err)
  }
})
