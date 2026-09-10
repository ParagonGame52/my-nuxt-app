import pg from 'pg'
import { AsyncLocalStorage } from 'async_hooks'

const { Pool, types } = pg

// Parse BIGINT (type ID 20) as integer
types.setTypeParser(20, (val) => parseInt(val, 10))
// Parse NUMERIC (type ID 1700) as float
types.setTypeParser(1700, (val) => parseFloat(val))

// AsyncLocalStorage to hold transaction clients
const asyncLocalStorage = new AsyncLocalStorage<pg.PoolClient>()

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dip_drip'
  pool = new Pool({
    connectionString,
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
  })

  return pool
}

// Translate SQLite query to PostgreSQL query on the fly
function sqliteToPostgres(sql: string): string {
  let index = 1
  let inSingleQuote = false
  let inDoubleQuote = false
  let result = ''

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    if (char === "'" && sql[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote
      result += char
    } else if (char === '"' && sql[i - 1] !== '\\') {
      inDoubleQuote = !inDoubleQuote
      result += char
    } else if (char === '?' && !inSingleQuote && !inDoubleQuote) {
      result += `$${index++}`
    } else {
      result += char
    }
  }

  // Replace SQLite date/time functions
  result = result.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
  result = result.replace(/date\('now'\)/gi, 'CURRENT_DATE')
  result = result.replace(/date\('now',\s*'-6 days'\)/gi, "(CURRENT_DATE - INTERVAL '6 days')")
  result = result.replace(/date\('now',\s*'\+7 days'\)/gi, "(CURRENT_DATE + INTERVAL '7 days')")
  result = result.replace(/date\((?!'now'|\s*'now')([^)]+)\)/gi, '($1)::date')

  return result
}

export const db = {
  prepare(sql: string) {
    return {
      async all(...args: any[]): Promise<any> {
        const client = asyncLocalStorage.getStore() || getPool()
        const translatedSql = sqliteToPostgres(sql)
        const res = await client.query(translatedSql, args)
        return res.rows
      },
      async get(...args: any[]): Promise<any> {
        const client = asyncLocalStorage.getStore() || getPool()
        const translatedSql = sqliteToPostgres(sql)
        const res = await client.query(translatedSql, args)
        return res.rows[0]
      },
      async run(...args: any[]): Promise<any> {
        const client = asyncLocalStorage.getStore() || getPool()
        let translatedSql = sqliteToPostgres(sql)

        const trimmed = sql.trim().toUpperCase()
        const isInsert = trimmed.startsWith('INSERT INTO')
        if (isInsert && !trimmed.includes('RETURNING')) {
          translatedSql += ' RETURNING id'
        }

        const res = await client.query(translatedSql, args)

        const lastInsertRowid = isInsert ? (res.rows[0]?.id || 0) : 0
        return {
          changes: res.rowCount || 0,
          lastInsertRowid
        }
      }
    }
  },

  transaction(cb: (...args: any[]) => any): any {
    return async (...args: any[]) => {
      const existingClient = asyncLocalStorage.getStore()
      if (existingClient) {
        return await cb(...args)
      }

      const client = await getPool().connect()
      try {
        await client.query('BEGIN')
        const result = await asyncLocalStorage.run(client, async () => {
          return await cb(...args)
        })
        await client.query('COMMIT')
        return result
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    }
  },

  async exec(sql: string): Promise<any> {
    const client = asyncLocalStorage.getStore() || getPool()
    const translatedSql = sqliteToPostgres(sql)
    await client.query(translatedSql)
  }
}

export function getDb() {
  return db
}
