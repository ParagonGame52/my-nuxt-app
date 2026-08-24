import { createHash, randomBytes } from 'crypto'
import { getDb } from './db'
import type { H3Event } from 'h3'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const check = createHash('sha256').update(password + salt).digest('hex')
  return check === hash
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export interface SessionUser {
  id: number
  name: string
  email: string
  balance: number
  is_admin: number // 0 = user, 1 = staff admin, 2 = super admin
  is_super_admin: boolean
  shipping_name?: string
  shipping_phone?: string
  shipping_address?: string
  avatar?: string
  points?: number
  total_spent?: number
  tier?: string
}

export async function getUserFromEvent(event: H3Event): Promise<SessionUser | null> {
  const db = getDb()
  const token = getCookie(event, 'session_token')
  if (!token) return null

  const session = await db.prepare(`
    SELECT s.user_id, u.name, u.email, u.balance, u.is_admin, u.shipping_name, u.shipping_phone, u.shipping_address, u.avatar, u.points, u.total_spent, u.tier
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as { 
    user_id: number; 
    name: string; 
    email: string; 
    balance: number; 
    is_admin: number;
    shipping_name: string | null;
    shipping_phone: string | null;
    shipping_address: string | null;
    avatar: string | null;
    points: number | null;
    total_spent: number | null;
    tier: string | null;
  } | undefined

  if (!session) return null

  const isAdminNum = Number(session.is_admin || 0)

  return {
    id: session.user_id,
    name: session.name,
    email: session.email,
    balance: Number(session.balance || 0),
    is_admin: isAdminNum,
    is_super_admin: isAdminNum >= 2,
    shipping_name: session.shipping_name || '',
    shipping_phone: session.shipping_phone || '',
    shipping_address: session.shipping_address || '',
    avatar: session.avatar || '',
    points: Number(session.points || 0),
    total_spent: Number(session.total_spent || 0),
    tier: session.tier || 'bronze'
  }
}

export async function requireAdmin(event: H3Event): Promise<SessionUser> {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }
  return user
}

export async function requireSuperAdmin(event: H3Event): Promise<SessionUser> {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 2) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์ดำเนินการ เฉพาะแอดมินสูงสุด (Super Admin) เท่านั้น' })
  }
  return user
}
