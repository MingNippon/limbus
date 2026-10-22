import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PlayerSaveState, RiskLevel } from '../types/game';
import { IDENTITIES, SINNERS } from '../data/sinnersAndIdentities';
import { EGOS } from '../data/egos';

export interface ManagerAccount {
  uid: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatarSinnerId: number;
  createdAt: string;
  lastLoginAt: string;
  lastDailyClaimDate?: string;
  save: PlayerSaveState;
}

export interface PublicAccountSummary {
  uid: string;
  username: string;
  displayName: string;
  avatarSinnerId: number;
  managerLevel: number;
  lunacy: number;
  unlockedIds: number;
  unlockedEgos: number;
  clearedStages: number;
  lastLoginAt: string;
}

const ACCOUNTS_DB_KEY = 'limbus_accounts_db_v1';
const ACTIVE_USERNAME_KEY = 'limbus_active_account_username_v1';
const LEGACY_SAVE_KEY = 'limbus_company_complete_save_v1';
const SUPABASE_CONFIG_KEY = 'limbus_supabase_custom_config_v1';

let cachedSupabase: SupabaseClient | null = null;
let cachedConfigSig = '';
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; source: 'env' | 'custom' | 'none' } {
  const envUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: String(parsed.url).trim(),
          anonKey: String(parsed.anonKey).trim(),
          source: 'custom',
        };
      }
    }
  } catch {
    // ignore
  }

  return { url: '', anonKey: '', source: 'none' };
}

export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem(SUPABASE_CONFIG_KEY);
    } else {
      localStorage.setItem(
        SUPABASE_CONFIG_KEY,
        JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
      );
    }
    cachedSupabase = null;
    cachedConfigSig = '';
  } catch {
    // ignore
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return null;
  const sig = `${cfg.url}::${cfg.anonKey}`;
  if (cachedSupabase && cachedConfigSig === sig) {
    return cachedSupabase;
  }
  try {
    cachedSupabase = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false },
    });
    cachedConfigSig = sig;
    return cachedSupabase;
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseClient());
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const sb = getSupabaseClient();
  if (!sb) {
    return {
      ok: false,
      message: 'Chưa nhập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.',
    };
  }
  try {
    const { error } = await sb.from('lcb_accounts').select('username').limit(1);
    if (error) {
      if (error.message.includes('lcb_accounts') || error.code === '42P01') {
        return {
          ok: false,
          message:
            'Đã kết nối tới Supabase nhưng chưa có bảng "lcb_accounts"! Hãy copy đoạn SQL trong file supabase_schema.sql dán vào SQL Editor trên Supabase rồi bấm RUN.',
        };
      }
      return { ok: false, message: `Lỗi Supabase: ${error.message}` };
    }
    return {
      ok: true,
      message: 'Kết nối Supabase Cloud thành công! Bảng lcb_accounts đã sẵn sàng lưu tài khoản & Lunacy.',
    };
  } catch (err) {
    return {
      ok: false,
      message: `Không thể kết nối tới Supabase URL: ${(err as Error).message}`,
    };
  }
}

export function hashPassword(rawPassword: string): string {
  const salted = `lcb_mephistopheles_salt::${rawPassword.trim()}`;
  let h1 = 0xdeadbeef ^ salted.length;
  let h2 = 0x41c6ce57 ^ salted.length;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function generateUid(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `LCB-${num}`;
}

export function createInitialSaveState(): PlayerSaveState {
  const baseIdentityIds = IDENTITIES.filter((i) => i.rarity === 1).map((i) => i.id);
  const starter000Ids = [
    'yisang_spicebush',
    'don_w_corp',
    'meursault_kimsatgat',
    'sinclair_n_corp',
  ];
  const unlockedIdentityIds = Array.from(new Set([...baseIdentityIds, ...starter000Ids]));

  const equippedIdentityBySinner: Record<number, string> = {};
  SINNERS.forEach((s) => {
    const starter3 = IDENTITIES.find((i) => i.sinnerId === s.id && starter000Ids.includes(i.id));
    const base = IDENTITIES.find((i) => i.sinnerId === s.id && i.rarity === 1)!;
    equippedIdentityBySinner[s.id] = starter3 ? starter3.id : base.id;
  });

  const baseEgoIds = EGOS.filter((e) => e.riskLevel === 'ZAYIN').map((e) => e.id);
  const starterHighEgos = [
    'ego_yisang_sunshower',
    'ego_faust_fluid_sac',
    'ego_don_telepole',
    'ego_heath_binds',
  ];
  const unlockedEgoIds = Array.from(new Set([...baseEgoIds, ...starterHighEgos]));

  const equippedEgosBySinner: Record<number, Partial<Record<RiskLevel, string>>> = {};
  SINNERS.forEach((s) => {
    const map: Partial<Record<RiskLevel, string>> = {};
    EGOS.filter((e) => e.sinnerId === s.id && unlockedEgoIds.includes(e.id)).forEach((e) => {
      map[e.riskLevel] = e.id;
    });
    equippedEgosBySinner[s.id] = map;
  });

  const identityLevels: Record<string, number> = {};
  const identityUpties: Record<string, 1 | 2 | 3 | 4> = {};
  IDENTITIES.forEach((id) => {
    identityLevels[id.id] = id.rarity === 3 ? 25 : 15;
    identityUpties[id.id] = id.rarity === 3 ? 3 : 2;
  });

  const egoshards: Record<number, number> = {};
  SINNERS.forEach((s) => {
    egoshards[s.id] = 120;
  });

  return {
    managerLevel: 1,
    lunacy: 3900,
    enkephalin: 140,
    maxEnkephalin: 160,
    enkephalinModules: 12,
    thread: 160,
    expTickets: 20,
    egoshards,
    unlockedIdentityIds,
    unlockedEgoIds,
    equippedIdentityBySinner,
    equippedEgosBySinner,
    identityLevels,
    identityUpties,
    deployedSinnerIds: [1, 2, 3, 5, 7, 10],
    lobbySinnerId: 3,
    clearedStageIds: [],
    starlight: 120,
    mirrorRun: null,
    bgmMuted: false,
    sfxMuted: false,
  };
}

export function normalizeSaveState(rawSave?: Partial<PlayerSaveState> | null): PlayerSaveState {
  const base = createInitialSaveState();
  if (!rawSave) return base;
  return {
    ...base,
    ...rawSave,
    egoshards: { ...base.egoshards, ...(rawSave.egoshards || {}) },
    equippedIdentityBySinner: {
      ...base.equippedIdentityBySinner,
      ...(rawSave.equippedIdentityBySinner || {}),
    },
    equippedEgosBySinner: {
      ...base.equippedEgosBySinner,
      ...(rawSave.equippedEgosBySinner || {}),
    },
    identityLevels: { ...base.identityLevels, ...(rawSave.identityLevels || {}) },
    identityUpties: { ...base.identityUpties, ...(rawSave.identityUpties || {}) },
  };
}

export function getLocalAccountsMap(): Record<string, ManagerAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, ManagerAccount>;
      return parsed || {};
    }
  } catch {
    // ignore parse error
  }

  try {
    const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacyRaw) {
      const legacySave = normalizeSaveState(JSON.parse(legacyRaw));
      const now = new Date().toISOString();
      const defaultAcc: ManagerAccount = {
        uid: 'LCB-00000013',
        username: 'dante',
        displayName: 'DANTE (Executive Manager)',
        passwordHash: hashPassword('123456'),
        avatarSinnerId: legacySave.lobbySinnerId || 3,
        createdAt: now,
        lastLoginAt: now,
        save: legacySave,
      };
      const initialMap = { dante: defaultAcc };
      localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(initialMap));
      return initialMap;
    }
  } catch {
    // ignore migration error
  }

  return {};
}

export function saveLocalAccountsMap(map: Record<string, ManagerAccount>): void {
  try {
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(map));
  } catch {
    // ignore quota error
  }
}

export function getActiveAccount(): ManagerAccount | null {
  try {
    const activeUser = localStorage.getItem(ACTIVE_USERNAME_KEY);
    if (!activeUser) return null;
    const map = getLocalAccountsMap();
    const found = map[activeUser.toLowerCase()];
    if (!found) return null;
    return {
      ...found,
      save: normalizeSaveState(found.save),
    };
  } catch {
    return null;
  }
}

export function setActiveAccountUsername(username: string | null): void {
  try {
    if (!username) {
      localStorage.removeItem(ACTIVE_USERNAME_KEY);
    } else {
      localStorage.setItem(ACTIVE_USERNAME_KEY, username.toLowerCase());
    }
  } catch {
    // ignore
  }
}

async function upsertAccountToSupabase(account: ManagerAccount): Promise<{
  ok: boolean;
  error?: string;
}> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false };

  try {
    const { error } = await sb.from('lcb_accounts').upsert(
      {
        username: account.username.toLowerCase(),
        uid: account.uid,
        display_name: account.displayName,
        password_hash: account.passwordHash,
        avatar_sinner_id: account.avatarSinnerId,
        last_daily_claim_date: account.lastDailyClaimDate || null,
        save_data: account.save,
        created_at: account.createdAt,
        last_login_at: account.lastLoginAt,
      },
      { onConflict: 'username' }
    );
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function registerManagerAccount(params: {
  username: string;
  displayName: string;
  password: string;
  avatarSinnerId: number;
}): Promise<{ ok: boolean; account?: ManagerAccount; error?: string }> {
  const cleanUser = params.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  const cleanDisplay = params.displayName.trim() || cleanUser.toUpperCase();
  if (cleanUser.length < 3) {
    return {
      ok: false,
      error: 'Tên đăng nhập phải có ít nhất 3 ký tự (chữ cái, số, dấu gạch dưới).',
    };
  }
  if (params.password.trim().length < 3) {
    return { ok: false, error: 'Mật khẩu phải có ít nhất 3 ký tự.' };
  }

  const now = new Date().toISOString();
  const initialSave = createInitialSaveState();
  initialSave.lobbySinnerId = params.avatarSinnerId;

  const newAccount: ManagerAccount = {
    uid: generateUid(),
    username: cleanUser,
    displayName: cleanDisplay,
    passwordHash: hashPassword(params.password),
    avatarSinnerId: params.avatarSinnerId,
    createdAt: now,
    lastLoginAt: now,
    save: initialSave,
  };

  // 1. Check & Insert into Supabase Cloud Database if configured
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data: existing, error: checkErr } = await sb
        .from('lcb_accounts')
        .select('username')
        .eq('username', cleanUser)
        .maybeSingle();

      if (!checkErr && existing) {
        return {
          ok: false,
          error: 'Tên tài khoản này đã được người chơi khác đăng ký trên Supabase Cloud!',
        };
      }

      const { error: insertErr } = await sb.from('lcb_accounts').insert({
        username: newAccount.username,
        uid: newAccount.uid,
        display_name: newAccount.displayName,
        password_hash: newAccount.passwordHash,
        avatar_sinner_id: newAccount.avatarSinnerId,
        last_daily_claim_date: null,
        save_data: newAccount.save,
        created_at: newAccount.createdAt,
        last_login_at: newAccount.lastLoginAt,
      });

      if (insertErr) {
        if (insertErr.code === '23505') {
          return { ok: false, error: 'Tên tài khoản đã tồn tại trên Supabase Cloud!' };
        }
      }
    } catch {
      // Fallback to local if network fails
    }
  } else {
    // Check local map if Supabase is not configured
    const localMap = getLocalAccountsMap();
    if (localMap[cleanUser]) {
      return {
        ok: false,
        error: 'Tên tài khoản này đã tồn tại! Vui lòng chọn tên khác hoặc Đăng nhập.',
      };
    }
  }

  // 2. Also sync to local dev server if running locally
  try {
    const res = await fetch('/api/accounts/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount),
    });
    if (res.status === 409 && !sb) {
      const errData = await res.json();
      return { ok: false, error: errData.error || 'Tài khoản đã tồn tại trên Server!' };
    }
  } catch {
    // Ignore on Vercel static deployment
  }

  const localMap = getLocalAccountsMap();
  localMap[cleanUser] = newAccount;
  saveLocalAccountsMap(localMap);
  setActiveAccountUsername(cleanUser);

  return { ok: true, account: newAccount };
}

export async function loginManagerAccount(params: {
  username: string;
  password: string;
}): Promise<{ ok: boolean; account?: ManagerAccount; error?: string }> {
  const cleanUser = params.username.trim().toLowerCase();
  const pwdHash = hashPassword(params.password);

  // 1. Authenticate against Supabase Cloud Database first!
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data: row, error } = await sb
        .from('lcb_accounts')
        .select('*')
        .eq('username', cleanUser)
        .maybeSingle();

      if (!error && row) {
        if (row.password_hash !== pwdHash) {
          return { ok: false, error: 'Mật khẩu không chính xác!' };
        }
        const now = new Date().toISOString();
        const cloudAcc: ManagerAccount = {
          uid: row.uid,
          username: row.username,
          displayName: row.display_name,
          passwordHash: row.password_hash,
          avatarSinnerId: row.avatar_sinner_id || 3,
          createdAt: row.created_at || now,
          lastLoginAt: now,
          lastDailyClaimDate: row.last_daily_claim_date || undefined,
          save: normalizeSaveState(row.save_data),
        };

        // Update last_login_at in background
        sb.from('lcb_accounts')
          .update({ last_login_at: now })
          .eq('username', cleanUser)
          .then(() => {});

        const localMap = getLocalAccountsMap();
        localMap[cleanUser] = cloudAcc;
        saveLocalAccountsMap(localMap);
        setActiveAccountUsername(cleanUser);
        return { ok: true, account: cloudAcc };
      }
    } catch {
      // Fallback if offline
    }
  }

  // 2. Check Local Dev Server DB (`/api/accounts/login`)
  try {
    const res = await fetch('/api/accounts/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUser, passwordHash: pwdHash }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.account) {
        const syncedAccount: ManagerAccount = {
          ...data.account,
          passwordHash: pwdHash,
          save: normalizeSaveState(data.account.save),
        };
        const localMap = getLocalAccountsMap();
        localMap[cleanUser] = syncedAccount;
        saveLocalAccountsMap(localMap);
        setActiveAccountUsername(cleanUser);
        // If Supabase is active, migrate this account up to Supabase automatically!
        if (sb) {
          upsertAccountToSupabase(syncedAccount);
        }
        return { ok: true, account: syncedAccount };
      }
    } else if (res.status === 401) {
      return { ok: false, error: 'Mật khẩu không chính xác!' };
    }
  } catch {
    // Fallback to localStorage
  }

  // 3. Check Browser Local Storage DB
  const localMap = getLocalAccountsMap();
  const localAcc = localMap[cleanUser];
  if (!localAcc) {
    return {
      ok: false,
      error: `Không tìm thấy tài khoản "${cleanUser}". Hãy bấm sang tab Tạo Tài Khoản Mới!`,
    };
  }
  if (localAcc.passwordHash !== pwdHash) {
    return { ok: false, error: 'Mật khẩu không chính xác!' };
  }

  const updatedAcc: ManagerAccount = {
    ...localAcc,
    lastLoginAt: new Date().toISOString(),
    save: normalizeSaveState(localAcc.save),
  };
  localMap[cleanUser] = updatedAcc;
  saveLocalAccountsMap(localMap);
  setActiveAccountUsername(cleanUser);

  if (sb) {
    upsertAccountToSupabase(updatedAcc);
  }

  return { ok: true, account: updatedAcc };
}

export function persistAccountSave(
  account: ManagerAccount,
  nextSave: PlayerSaveState,
  profileUpdates?: { displayName?: string; avatarSinnerId?: number; lastDailyClaimDate?: string }
): ManagerAccount {
  const updated: ManagerAccount = {
    ...account,
    displayName: profileUpdates?.displayName ?? account.displayName,
    avatarSinnerId: profileUpdates?.avatarSinnerId ?? account.avatarSinnerId,
    lastDailyClaimDate: profileUpdates?.lastDailyClaimDate ?? account.lastDailyClaimDate,
    lastLoginAt: new Date().toISOString(),
    save: nextSave,
  };

  // 1. Immediate save to Browser LocalStorage
  const localMap = getLocalAccountsMap();
  localMap[account.username.toLowerCase()] = updated;
  saveLocalAccountsMap(localMap);

  // 2. Debounced sync to Supabase Cloud Database (so rapid clicks don't spam requests)
  if (getSupabaseClient()) {
    if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => {
      upsertAccountToSupabase(updated);
    }, 300);
  }

  // 3. Sync to Local Dev Server (`accounts_db.json`) if running locally
  fetch('/api/accounts/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch(() => {});

  return updated;
}

export function canClaimDailySupply(account: ManagerAccount): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return account.lastDailyClaimDate !== today;
}

export async function fetchAllAccountsLeaderboard(): Promise<PublicAccountSummary[]> {
  const merged = new Map<string, PublicAccountSummary>();

  // 1. Local accounts
  const localMap = getLocalAccountsMap();
  Object.values(localMap).forEach((acc) => {
    merged.set(acc.username, {
      uid: acc.uid,
      username: acc.username,
      displayName: acc.displayName,
      avatarSinnerId: acc.avatarSinnerId,
      managerLevel: acc.save.managerLevel || 1,
      lunacy: acc.save.lunacy || 0,
      unlockedIds: acc.save.unlockedIdentityIds?.length || 0,
      unlockedEgos: acc.save.unlockedEgoIds?.length || 0,
      clearedStages: acc.save.clearedStageIds?.length || 0,
      lastLoginAt: acc.lastLoginAt,
    });
  });

  // 2. Supabase Cloud accounts
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data: rows, error } = await sb
        .from('lcb_accounts')
        .select('uid, username, display_name, avatar_sinner_id, save_data, last_login_at')
        .order('last_login_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(rows)) {
        rows.forEach((r) => {
          const s = (r.save_data || {}) as Partial<PlayerSaveState>;
          merged.set(r.username, {
            uid: r.uid,
            username: r.username,
            displayName: r.display_name,
            avatarSinnerId: r.avatar_sinner_id || 3,
            managerLevel: s.managerLevel || 1,
            lunacy: s.lunacy ?? 0,
            unlockedIds: Array.isArray(s.unlockedIdentityIds) ? s.unlockedIdentityIds.length : 0,
            unlockedEgos: Array.isArray(s.unlockedEgoIds) ? s.unlockedEgoIds.length : 0,
            clearedStages: Array.isArray(s.clearedStageIds) ? s.clearedStageIds.length : 0,
            lastLoginAt: r.last_login_at,
          });
        });
      }
    } catch {
      // ignore
    }
  }

  // 3. Local Dev Server accounts
  try {
    const res = await fetch('/api/accounts/list');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.accounts)) {
        data.accounts.forEach((srvAcc: PublicAccountSummary) => {
          if (!merged.has(srvAcc.username)) {
            merged.set(srvAcc.username, srvAcc);
          }
        });
      }
    }
  } catch {
    // ignore
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (b.clearedStages !== a.clearedStages) return b.clearedStages - a.clearedStages;
    if (b.unlockedIds !== a.unlockedIds) return b.unlockedIds - a.unlockedIds;
    return b.lunacy - a.lunacy;
  });
}

export function exportAccountCode(account: ManagerAccount): string {
  const payload = JSON.stringify(account);
  const encoded = btoa(encodeURIComponent(payload));
  return `LCB-ACC-${encoded}`;
}

export function importAccountCode(code: string): {
  ok: boolean;
  account?: ManagerAccount;
  error?: string;
} {
  try {
    const trimmed = code.trim();
    const rawBase64 = trimmed.startsWith('LCB-ACC-') ? trimmed.slice(8) : trimmed;
    const jsonStr = decodeURIComponent(atob(rawBase64));
    const parsed = JSON.parse(jsonStr) as ManagerAccount;
    if (!parsed || !parsed.username || !parsed.save) {
      return { ok: false, error: 'Mã sao lưu tài khoản không hợp lệ!' };
    }
    const normalized: ManagerAccount = {
      ...parsed,
      username: parsed.username.toLowerCase(),
      lastLoginAt: new Date().toISOString(),
      save: normalizeSaveState(parsed.save),
    };
    const localMap = getLocalAccountsMap();
    localMap[normalized.username] = normalized;
    saveLocalAccountsMap(localMap);
    setActiveAccountUsername(normalized.username);

    upsertAccountToSupabase(normalized);

    fetch('/api/accounts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    }).catch(() => {});

    return { ok: true, account: normalized };
  } catch {
    return { ok: false, error: 'Không thể giải mã chuỗi tài khoản. Vui lòng kiểm tra lại!' };
  }
}
