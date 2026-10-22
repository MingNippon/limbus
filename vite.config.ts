import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const DB_FILE_PATH = path.resolve(process.cwd(), 'accounts_db.json')

interface StoredAccountRecord {
  uid: string
  username: string
  displayName: string
  passwordHash: string
  avatarSinnerId: number
  createdAt: string
  lastLoginAt: string
  lastDailyClaimDate?: string
  save: Record<string, unknown>
}

function readAccountsDb(): Record<string, StoredAccountRecord> {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // fallback empty db
  }
  return {}
}

function writeAccountsDb(db: Record<string, StoredAccountRecord>) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8')
  } catch {
    // ignore write error
  }
}

function limbusAccountApiPlugin(): Plugin {
  return {
    name: 'limbus-account-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/accounts')) {
          return next()
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')

        if (req.method === 'GET' && req.url === '/api/accounts/list') {
          const db = readAccountsDb()
          const publicList = Object.values(db).map((acc) => {
            const s = (acc.save || {}) as Record<string, unknown>
            const unlockedIds = Array.isArray(s.unlockedIdentityIds) ? s.unlockedIdentityIds.length : 0
            const unlockedEgos = Array.isArray(s.unlockedEgoIds) ? s.unlockedEgoIds.length : 0
            const clearedStages = Array.isArray(s.clearedStageIds) ? s.clearedStageIds.length : 0
            return {
              uid: acc.uid,
              username: acc.username,
              displayName: acc.displayName,
              avatarSinnerId: acc.avatarSinnerId,
              managerLevel: typeof s.managerLevel === 'number' ? s.managerLevel : 1,
              lunacy: typeof s.lunacy === 'number' ? s.lunacy : 0,
              unlockedIds,
              unlockedEgos,
              clearedStages,
              lastLoginAt: acc.lastLoginAt,
            }
          })
          res.statusCode = 200
          res.end(JSON.stringify({ ok: true, accounts: publicList }))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              const db = readAccountsDb()

              if (req.url === '/api/accounts/register') {
                const username = String(payload.username || '').trim().toLowerCase()
                if (!username || username.length < 3) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ ok: false, error: 'Tên tài khoản phải từ 3 ký tự trở lên.' }))
                  return
                }
                if (db[username]) {
                  res.statusCode = 409
                  res.end(JSON.stringify({ ok: false, error: 'Tên tài khoản này đã tồn tại trên hệ thống!' }))
                  return
                }
                const now = new Date().toISOString()
                const record: StoredAccountRecord = {
                  uid: payload.uid || `LCB-${Math.floor(10000000 + Math.random() * 90000000)}`,
                  username,
                  displayName: String(payload.displayName || username).trim(),
                  passwordHash: String(payload.passwordHash || ''),
                  avatarSinnerId: Number(payload.avatarSinnerId) || 3,
                  createdAt: now,
                  lastLoginAt: now,
                  save: payload.save || {},
                }
                db[username] = record
                writeAccountsDb(db)
                const { passwordHash: _, ...safeAccount } = record
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, account: safeAccount }))
                return
              }

              if (req.url === '/api/accounts/login') {
                const username = String(payload.username || '').trim().toLowerCase()
                const passwordHash = String(payload.passwordHash || '')
                const record = db[username]
                if (!record) {
                  res.statusCode = 404
                  res.end(JSON.stringify({ ok: false, error: 'Không tìm thấy tài khoản này.' }))
                  return
                }
                if (record.passwordHash !== passwordHash) {
                  res.statusCode = 401
                  res.end(JSON.stringify({ ok: false, error: 'Mật khẩu không chính xác!' }))
                  return
                }
                record.lastLoginAt = new Date().toISOString()
                writeAccountsDb(db)
                const { passwordHash: _, ...safeAccount } = record
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true, account: safeAccount }))
                return
              }

              if (req.url === '/api/accounts/save') {
                const username = String(payload.username || '').trim().toLowerCase()
                const record = db[username]
                if (!record) {
                  // Auto-upsert if account was created locally first
                  const now = new Date().toISOString()
                  db[username] = {
                    uid: payload.uid || `LCB-${Math.floor(10000000 + Math.random() * 90000000)}`,
                    username,
                    displayName: String(payload.displayName || username),
                    passwordHash: String(payload.passwordHash || ''),
                    avatarSinnerId: Number(payload.avatarSinnerId) || 3,
                    createdAt: now,
                    lastLoginAt: now,
                    lastDailyClaimDate: payload.lastDailyClaimDate,
                    save: payload.save || {},
                  }
                } else {
                  record.save = payload.save || record.save
                  if (payload.displayName) record.displayName = String(payload.displayName)
                  if (payload.avatarSinnerId) record.avatarSinnerId = Number(payload.avatarSinnerId)
                  if (payload.lastDailyClaimDate) record.lastDailyClaimDate = String(payload.lastDailyClaimDate)
                  record.lastLoginAt = new Date().toISOString()
                }
                writeAccountsDb(db)
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true }))
                return
              }

              res.statusCode = 404
              res.end(JSON.stringify({ ok: false, error: 'Unknown endpoint' }))
            } catch {
              res.statusCode = 500
              res.end(JSON.stringify({ ok: false, error: 'Invalid JSON request' }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), limbusAccountApiPlugin()],
})
