// ============================================================
// Demo backend — a localStorage-backed stand-in for Supabase.
//
// Activates automatically when VITE_SUPABASE_URL / ANON_KEY are absent
// (see lib/supabase.ts). It implements just the subset of the Supabase
// client the app actually uses: a thenable query builder over a couple of
// "tables" plus a mock auth that keeps you signed in as a demo user.
//
// This lets you click through every feature with zero setup. Add real
// Supabase keys to .env.local and this module is never loaded.
// ============================================================

type Row = Record<string, any>

const PREFIX = 'tf_demo_'
const SEED_FLAG = `${PREFIX}seeded_v1`

export const DEMO_USER = { id: 'demo-user-001', email: 'demo@voya.app' }
const DEMO_SESSION = {
  user: DEMO_USER,
  access_token: 'demo-token',
  token_type: 'bearer',
  expires_in: 3600,
} as const

function read(table: string): Row[] {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + table) || '[]')
  } catch {
    return []
  }
}
function write(table: string, rows: Row[]) {
  localStorage.setItem(PREFIX + table, JSON.stringify(rows))
}

// Seed a profile + one rich sample trip on first run.
function seed() {
  if (localStorage.getItem(SEED_FLAG)) return
  write('profiles', [
    { id: DEMO_USER.id, username: 'wanderer', phone: null, created_at: new Date().toISOString() },
  ])
  write('trips', [
    {
      id: crypto.randomUUID(),
      title: 'Mediterranean Summer',
      destinations: [
        { city: 'Barcelona', country: 'Spain', countryCode: 'ES', from: '2026-07-04', to: '2026-07-08' },
        { city: 'Rome', country: 'Italy', countryCode: 'IT', from: '2026-07-08', to: '2026-07-12' },
      ],
      start_date: '2026-07-04',
      end_date: '2026-07-12',
      budget: 4200,
      currency: 'USD',
      owner_id: DEMO_USER.id,
      created_at: new Date().toISOString(),
      metadata: {
        travellers: [
          { id: 't-1', name: 'wanderer', budget: 2200 },
          { id: 't-2', name: 'Sam', budget: 2000 },
        ],
        budgetBreakdown: {
          flights: 1300, hotels: 1200, food: 700, activities: 500,
          shopping: 300, transport: 150, other: 50,
        },
        preferredAirlines: ['IB'],
        savedFlights: [
          { id: 'IB-0', airline: 'Iberia', from: 'JFK', to: 'Barcelona', date: '2026-07-04', price: 540, currency: 'USD' },
        ],
        savedHotels: [],
      },
    },
  ])
  localStorage.setItem(SEED_FLAG, '1')
}

// Chainable, awaitable query builder mirroring the bits of the
// supabase-js PostgREST builder the app relies on.
class Query implements PromiseLike<{ data: any; error: any }> {
  private preds: ((r: Row) => boolean)[] = []
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: any = null
  private wantSingle = false
  private wantMaybe = false
  private orderBy: { col: string; asc: boolean } | null = null
  private limitN: number | null = null

  constructor(private table: string) {}

  select() { return this }
  eq(col: string, val: any) { this.preds.push((r) => r[col] === val); return this }
  neq(col: string, val: any) { this.preds.push((r) => r[col] !== val); return this }
  in(col: string, vals: any[]) { this.preds.push((r) => vals.includes(r[col])); return this }
  ilike(col: string, pattern: string) {
    const needle = String(pattern).replace(/%/g, '').toLowerCase()
    this.preds.push((r) => String(r[col] ?? '').toLowerCase().includes(needle))
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, asc: opts?.ascending ?? true }
    return this
  }
  limit(n: number) { this.limitN = n; return this }
  single() { this.wantSingle = true; return this }
  maybeSingle() { this.wantMaybe = true; return this }
  insert(payload: any) { this.op = 'insert'; this.payload = payload; return this }
  update(payload: any) { this.op = 'update'; this.payload = payload; return this }
  upsert(payload: any) { this.op = 'upsert'; this.payload = payload; return this }
  delete() { this.op = 'delete'; return this }

  then<R1 = any, R2 = never>(
    resolve?: ((v: { data: any; error: any }) => R1 | PromiseLike<R1>) | null,
    reject?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve(this.exec()).then(resolve, reject)
  }

  private matches(r: Row): boolean {
    return this.preds.every((p) => p(r))
  }

  private exec(): { data: any; error: any } {
    const rows = read(this.table)

    if (this.op === 'insert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload]
      const created = list.map((p) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...p }))
      write(this.table, [...created, ...rows])
      return { data: this.wantSingle ? created[0] : created, error: null }
    }

    if (this.op === 'upsert') {
      const idx = rows.findIndex((r) => r.id === this.payload.id)
      if (idx >= 0) rows[idx] = { ...rows[idx], ...this.payload }
      else rows.unshift({ created_at: new Date().toISOString(), ...this.payload })
      write(this.table, rows)
      return { data: this.payload, error: null }
    }

    if (this.op === 'update') {
      const next = rows.map((r) => (this.matches(r) ? { ...r, ...this.payload } : r))
      write(this.table, next)
      return { data: null, error: null }
    }

    if (this.op === 'delete') {
      write(this.table, rows.filter((r) => !this.matches(r)))
      return { data: null, error: null }
    }

    // select
    let result = rows.filter((r) => this.matches(r))
    if (this.orderBy) {
      const { col, asc } = this.orderBy
      result = [...result].sort((a, b) =>
        a[col] === b[col] ? 0 : (a[col] > b[col] ? 1 : -1) * (asc ? 1 : -1),
      )
    }
    if (this.wantSingle) {
      return result.length
        ? { data: result[0], error: null }
        : { data: null, error: { message: 'No rows found' } }
    }
    if (this.wantMaybe) return { data: result[0] ?? null, error: null }
    if (this.limitN != null) result = result.slice(0, this.limitN)
    return { data: result, error: null }
  }
}

export function createDemoClient() {
  seed()
  return {
    auth: {
      async getSession() { return { data: { session: DEMO_SESSION }, error: null } },
      async getUser() { return { data: { user: DEMO_USER }, error: null } },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } }
      },
      async signInWithPassword() { return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null } },
      async signInWithOtp() {
        return { data: {}, error: { message: 'Demo mode: phone sign-in is disabled.' } }
      },
      async verifyOtp() { return { data: { session: DEMO_SESSION }, error: null } },
      async signUp() { return { data: { user: DEMO_USER, session: DEMO_SESSION }, error: null } },
      async resetPasswordForEmail() { return { data: {}, error: null } },
      async updateUser() { return { data: { user: DEMO_USER }, error: null } },
      async signOut() { return { error: null } },
    },
    from(table: string) {
      return new Query(table)
    },
  }
}
