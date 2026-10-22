import React, { useEffect, useState } from 'react';
import {
  ManagerAccount,
  PublicAccountSummary,
  canClaimDailySupply,
  exportAccountCode,
  fetchAllAccountsLeaderboard,
  getLocalAccountsMap,
  getSupabaseConfig,
  importAccountCode,
  isSupabaseConfigured,
  loginManagerAccount,
  registerManagerAccount,
  setCustomSupabaseConfig,
  testSupabaseConnection,
} from '../services/accountService';
import { SINNERS, getSinnerAvatarUrl } from '../data/sinnersAndIdentities';
import { soundManager } from '../audio/SoundManager';
import {
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  Trophy,
  Download,
  Upload,
  LogOut,
  Gift,
  CheckCircle2,
  KeyRound,
  User,
  Database,
  X,
} from 'lucide-react';

interface AccountModalProps {
  currentAccount: ManagerAccount | null;
  requireAuth?: boolean;
  onSuccessAuth: (account: ManagerAccount) => void;
  onLogout: () => void;
  onClaimDaily: () => void;
  onUpdateProfile: (displayName: string, avatarSinnerId: number) => void;
  onClose?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  currentAccount,
  requireAuth = false,
  onSuccessAuth,
  onLogout,
  onClaimDaily,
  onUpdateProfile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'login' | 'register' | 'leaderboard' | 'transfer' | 'supabase'
  >(currentAccount ? 'profile' : 'login');

  // Supabase Config Form State
  const initialSb = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialSb.url);
  const [sbAnonKey, setSbAnonKey] = useState(initialSb.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);

  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register Form State
  const [regUser, setRegUser] = useState('');
  const [regDisplay, setRegDisplay] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regAvatar, setRegAvatar] = useState<number>(3);

  // Profile Edit State
  const [editDisplay, setEditDisplay] = useState(currentAccount?.displayName || '');
  const [editAvatar, setEditAvatar] = useState<number>(currentAccount?.avatarSinnerId || 3);

  // Transfer Code State
  const [importCodeStr, setImportCodeStr] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Feedback & Leaderboard
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<PublicAccountSummary[]>([]);

  const localAccounts = Object.values(getLocalAccountsMap());

  useEffect(() => {
    if (currentAccount) {
      setEditDisplay(currentAccount.displayName);
      setEditAvatar(currentAccount.avatarSinnerId);
    }
  }, [currentAccount]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchAllAccountsLeaderboard().then(setLeaderboard);
    }
  }, [activeTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    soundManager.playSfx('ui_click');

    const res = await loginManagerAccount({ username: loginUser, password: loginPass });
    setLoading(false);
    if (!res.ok || !res.account) {
      soundManager.playSfx('stagger');
      setErrorMsg(res.error || 'Đăng nhập thất bại!');
      return;
    }

    soundManager.playSfx('ruina_snap');
    onSuccessAuth(res.account);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    soundManager.playSfx('ui_click');

    const res = await registerManagerAccount({
      username: regUser,
      displayName: regDisplay || regUser.toUpperCase(),
      password: regPass,
      avatarSinnerId: regAvatar,
    });
    setLoading(false);

    if (!res.ok || !res.account) {
      soundManager.playSfx('stagger');
      setErrorMsg(res.error || 'Không thể tạo tài khoản!');
      return;
    }

    soundManager.playSfx('gacha_000');
    onSuccessAuth(res.account);
  };

  const handleImportSubmit = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = importAccountCode(importCodeStr);
    if (!res.ok || !res.account) {
      soundManager.playSfx('stagger');
      setErrorMsg(res.error || 'Mã tài khoản không hợp lệ!');
      return;
    }
    soundManager.playSfx('gacha_000');
    setSuccessMsg(`Đã khôi phục tài khoản "${res.account.displayName}" (${res.account.uid})!`);
    onSuccessAuth(res.account);
  };

  return (
    <div
      onClick={() => {
        if (!requireAuth && onClose) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="limbus-panel max-w-4xl w-full rounded-2xl border-2 border-amber-400/90 shadow-[0_0_80px_rgba(220,38,38,0.5)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Terminal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-stone-950 to-black border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/90 border border-amber-300 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="font-bebas text-2xl tracking-[0.2em] text-amber-300 leading-none">
                MEPHISTOPHELES MANAGER AUTHENTICATION TERMINAL
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Hệ thống Tài khoản Quản lý LCB — Lưu trữ riêng biệt Lunacy, Nhân cách 000, E.G.O & Tiến độ từng tài khoản
              </p>
            </div>
          </div>

          {!requireAuth && onClose && (
            <button
              type="button"
              onClick={() => {
                soundManager.playSfx('ui_click');
                onClose();
              }}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-black/80 border-b border-stone-800 flex flex-wrap items-center gap-2">
          {currentAccount && (
            <button
              type="button"
              onClick={() => {
                soundManager.playSfx('ui_click');
                setErrorMsg(null);
                setSuccessMsg(null);
                setActiveTab('profile');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border cursor-pointer transition ${
                activeTab === 'profile'
                  ? 'bg-red-900 border-amber-300 text-amber-200 shadow'
                  : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              HỒ SƠ CỦA TÔI ({currentAccount.displayName})
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              setErrorMsg(null);
              setSuccessMsg(null);
              setActiveTab('login');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === 'login'
                ? 'bg-red-900 border-amber-300 text-amber-200 shadow'
                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            ĐĂNG NHẬP / ĐỔI TÀI KHOẢN
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              setErrorMsg(null);
              setSuccessMsg(null);
              setActiveTab('register');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === 'register'
                ? 'bg-amber-500 border-amber-200 text-black shadow'
                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            TẠO TÀI KHOẢN MỚI (+3,900 LUNACY)
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              setErrorMsg(null);
              setSuccessMsg(null);
              setActiveTab('leaderboard');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === 'leaderboard'
                ? 'bg-purple-900 border-amber-300 text-amber-200 shadow'
                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            BẢNG XẾP HẠNG TÀI KHOẢN
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              setErrorMsg(null);
              setSuccessMsg(null);
              setActiveTab('transfer');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === 'transfer'
                ? 'bg-sky-900 border-sky-300 text-sky-100 shadow'
                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            MÃ SAO LƯU / CHUYỂN MÁY
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              setErrorMsg(null);
              setSuccessMsg(null);
              setActiveTab('supabase');
            }}
            className={`ml-auto px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === 'supabase'
                ? 'bg-emerald-900 border-emerald-300 text-emerald-100 shadow'
                : isSupabaseConfigured()
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {isSupabaseConfigured() ? '☁️ SUPABASE CLOUD: ONLINE' : '☁️ CẤU HÌNH SUPABASE'}
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-red-950/90 border border-red-400 text-xs font-bold text-red-200">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* =====================================================================
              TAB 1: CURRENT ACCOUNT PROFILE & DAILY SUPPLY
             ===================================================================== */}
          {activeTab === 'profile' && currentAccount && (
            <div className="space-y-5">
              {/* Top Profile Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-stone-900/90 to-black border border-amber-400/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-300 bg-black shadow-xl shrink-0">
                    <img
                      src={getSinnerAvatarUrl(currentAccount.avatarSinnerId)}
                      alt={currentAccount.displayName}
                      className="w-full h-full object-cover object-center"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/85 text-center text-[9px] font-mono-num font-bold text-amber-300">
                      LV.{currentAccount.save.managerLevel}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-mono-num text-[10px] font-extrabold">
                        UID: {currentAccount.uid}
                      </span>
                      <span className="text-xs font-mono-num text-stone-400">
                        @{currentAccount.username}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-black text-white mt-1">
                      {currentAccount.displayName}
                    </h3>
                    <p className="text-xs text-emerald-300 mt-0.5">
                      ● Đang đăng nhập & Tự động lưu trữ thời gian thực (Auto-Sync Active)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={!canClaimDailySupply(currentAccount)}
                    onClick={() => {
                      soundManager.playSfx('gacha_000');
                      onClaimDaily();
                      setSuccessMsg(
                        'Đã nhận Quà Điểm Danh Quản Lý Hàng Ngày: +1,300 Lunacy, +60 Enkephalin, +30 Thread, +10 EXP Tickets!'
                      );
                    }}
                    className={`px-4 py-2.5 rounded-xl font-display font-black text-xs flex items-center gap-2 border cursor-pointer transition ${
                      canClaimDailySupply(currentAccount)
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 border-amber-200 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'bg-stone-900 border-stone-700 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    {canClaimDailySupply(currentAccount)
                      ? 'NHẬN QUÀ HÀNG NGÀY (+1,300 LUNACY)'
                      : 'ĐÃ NHẬN QUÀ HÔM NAY'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSfx('ui_click');
                      onLogout();
                      setActiveTab('login');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-red-950 border border-red-500/60 text-xs font-bold text-red-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    ĐĂNG XUẤT
                  </button>
                </div>
              </div>

              {/* Isolated Account Inventory Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-black/75 border border-rose-500/50 text-center">
                  <div className="text-[10px] text-rose-300 uppercase font-bold">Lunacy Hiện Có</div>
                  <div className="font-mono-num text-xl font-black text-rose-200 mt-1">
                    {currentAccount.save.lunacy.toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/75 border border-emerald-500/50 text-center">
                  <div className="text-[10px] text-emerald-300 uppercase font-bold">Enkephalin</div>
                  <div className="font-mono-num text-xl font-black text-emerald-200 mt-1">
                    {currentAccount.save.enkephalin}/{currentAccount.save.maxEnkephalin}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/75 border border-sky-500/50 text-center">
                  <div className="text-[10px] text-sky-300 uppercase font-bold">Thread & EXP</div>
                  <div className="font-mono-num text-xl font-black text-sky-200 mt-1">
                    {currentAccount.save.thread} / {currentAccount.save.expTickets}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/75 border border-amber-500/50 text-center">
                  <div className="text-[10px] text-amber-300 uppercase font-bold">Nhân Cách Sở Hữu</div>
                  <div className="font-mono-num text-xl font-black text-amber-200 mt-1">
                    {currentAccount.save.unlockedIdentityIds.length} ID
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/75 border border-purple-500/50 text-center">
                  <div className="text-[10px] text-purple-300 uppercase font-bold">E.G.O Sở Hữu</div>
                  <div className="font-mono-num text-xl font-black text-purple-200 mt-1">
                    {currentAccount.save.unlockedEgoIds.length} E.G.O
                  </div>
                </div>
              </div>

              {/* Customize Manager Name & Avatar */}
              <div className="p-4 rounded-xl bg-black/60 border border-stone-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Chỉnh Sửa Hồ Sơ Quản Lý (Tên Hiển Thị & Avatar Tội Nhân)
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={editDisplay}
                    onChange={(e) => setEditDisplay(e.target.value)}
                    placeholder="Tên hiển thị Quản lý..."
                    className="px-3.5 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm text-white focus:border-amber-400 outline-none flex-1 min-w-[220px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playSfx('ruina_snap');
                      onUpdateProfile(editDisplay.trim() || currentAccount.displayName, editAvatar);
                      setSuccessMsg('Đã lưu Tên hiển thị & Avatar mới cho tài khoản!');
                    }}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer"
                  >
                    LƯU THAY ĐỔI HỒ SƠ
                  </button>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-1">
                  {SINNERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        soundManager.playSfx('ui_click');
                        setEditAvatar(s.id);
                      }}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-square cursor-pointer transition ${
                        editAvatar === s.id
                          ? 'border-amber-300 scale-105 ring-2 ring-amber-400'
                          : 'border-stone-800 opacity-65 hover:opacity-100'
                      }`}
                      title={s.name}
                    >
                      <img
                        src={s.portraitUrl}
                        alt={s.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: LOGIN & QUICK ACCOUNT SWITCHER
             ===================================================================== */}
          {activeTab === 'login' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Login Form */}
              <form
                onSubmit={handleLoginSubmit}
                className="p-5 rounded-2xl bg-black/70 border border-amber-500/40 space-y-4"
              >
                <div className="font-display text-lg font-black text-amber-200 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-amber-400" />
                  ĐĂNG NHẬP TÀI KHOẢN QUẢN LÝ
                </div>
                <p className="text-xs text-stone-400">
                  Nhập Tên tài khoản & Mật khẩu để tải đúng số Lunacy, Nhân cách 000 và E.G.O của riêng bạn.
                </p>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                    Tên Đăng Nhập (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Ví dụ: dante_vn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                    Mật Khẩu (Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:brightness-110 border border-amber-300 text-white font-display font-black text-sm tracking-wider cursor-pointer shadow-lg"
                >
                  {loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP VÀO XE BUÝT MEPHISTOPHELES'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs text-amber-300 hover:underline cursor-pointer font-bold"
                  >
                    Chưa có tài khoản? Bấm vào đây để Tạo Tài Khoản Mới (+3,900 Lunacy) →
                  </button>
                </div>
              </form>

              {/* Right: Saved Accounts on this Device */}
              <div className="p-5 rounded-2xl bg-black/60 border border-stone-800 flex flex-col justify-between">
                <div>
                  <div className="font-display text-sm font-black text-amber-300 uppercase tracking-wider mb-1">
                    TÀI KHOẢN ĐÃ LƯU TRÊN MÁY NÀY ({localAccounts.length})
                  </div>
                  <p className="text-xs text-stone-400 mb-3">
                    Chọn nhanh một tài khoản bên dưới để điền tên đăng nhập (mỗi tài khoản giữ nguyên số Lunacy & đội hình riêng):
                  </p>

                  {localAccounts.length === 0 ? (
                    <div className="p-6 rounded-xl bg-stone-950/80 border border-stone-800 text-center text-xs text-stone-400">
                      Chưa có tài khoản nào trên trình duyệt này. Hãy bấm sang tab{' '}
                      <strong className="text-amber-300">Tạo Tài Khoản Mới</strong>!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {localAccounts.map((acc) => {
                        const isCurrent = currentAccount?.username === acc.username;
                        return (
                          <div
                            key={acc.username}
                            onClick={() => {
                              soundManager.playSfx('ui_click');
                              setLoginUser(acc.username);
                              if (acc.username === 'dante') {
                                setLoginPass('123456');
                              }
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              loginUser === acc.username
                                ? 'bg-amber-950/40 border-amber-400'
                                : 'bg-stone-950/90 border-stone-800 hover:border-stone-600'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={getSinnerAvatarUrl(acc.avatarSinnerId)}
                                alt=""
                                className="w-11 h-11 rounded-lg object-cover object-center border border-amber-400/50 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-display font-bold text-xs text-white truncate">
                                    {acc.displayName}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-400 text-[9px] text-emerald-300 font-bold">
                                      ĐANG DÙNG
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono-num text-stone-400">
                                  @{acc.username} • {acc.uid}
                                </div>
                                <div className="text-[10px] font-mono-num text-rose-300 font-bold">
                                  💎 {(acc.save?.lunacy ?? 0).toLocaleString()} Lunacy •{' '}
                                  {acc.save?.unlockedIdentityIds?.length || 0} ID •{' '}
                                  {acc.save?.unlockedEgoIds?.length || 0} E.G.O
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold text-amber-300 px-2 py-1 rounded bg-amber-500/10 border border-amber-400/40 shrink-0">
                              Chọn
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90">
                  💡 <strong>Mẹo:</strong> Tài khoản mặc định trước đó của bạn (nếu có) đã được tự động chuyển sang tài khoản <code className="text-amber-300 font-bold">dante</code> (Mật khẩu mặc định: <code className="text-amber-300 font-bold">123456</code>).
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: REGISTER NEW ACCOUNT
             ===================================================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-black/70 border border-amber-500/40 space-y-3.5">
                <div className="font-display text-lg font-black text-amber-300 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  ĐĂNG KÝ TÀI KHOẢN QUẢN LÝ MỚI
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                    Tên Đăng Nhập (Username — viết liền không dấu) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    placeholder="Ví dụ: hoang_lcb, dante_01..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                    Tên Hiển Thị Trong Game (Manager Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regDisplay}
                    onChange={(e) => setRegDisplay(e.target.value)}
                    placeholder="Ví dụ: DANTE, VERGILIUS, HOÀNG..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                    Mật Khẩu Bảo Vệ Tài Khoản *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Tối thiểu 3 ký tự..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 hover:brightness-110 text-black font-display font-black text-sm tracking-wider cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                >
                  {loading ? 'ĐANG KHỞI TẠO...' : 'HOÀN TẤT ĐĂNG KÝ & NHẬN 3,900 LUNACY'}
                </button>
              </div>

              {/* Right: Choose Sinner Avatar & Starter Package Info */}
              <div className="p-5 rounded-2xl bg-black/60 border border-stone-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                    CHỌN AVATAR TỘI NHÂN ĐẠI DIỆN ({SINNERS.find((s) => s.id === regAvatar)?.name})
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {SINNERS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          soundManager.playSfx('ui_click');
                          setRegAvatar(s.id);
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 aspect-square cursor-pointer transition ${
                          regAvatar === s.id
                            ? 'border-amber-300 scale-105 ring-2 ring-amber-400'
                            : 'border-stone-800 opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={s.portraitUrl}
                          alt={s.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center text-amber-200 truncate px-0.5">
                          {s.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Account Starter Gift Box */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-950/70 via-stone-900 to-black border border-amber-400/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    QUÀ KHỞI ĐẦU RIÊNG CHO TÀI KHOẢN MỚI:
                  </div>
                  <ul className="text-xs text-stone-200 space-y-1 font-mono-num">
                    <li>• 💎 <strong>3,900 Lunacy</strong> (Đủ quay 30 lần Gacha Target Extraction)</li>
                    <li>• ⚡ <strong>140/160 Enkephalin</strong> + <strong>12 Modules</strong></li>
                    <li>• 🔥 <strong>160 Thread</strong> + <strong>20 EXP Tickets</strong> + <strong>120 Shards × 12 Tội đồ</strong></li>
                    <li>• ⭐ <strong>4 Nhân cách 000 Khởi đầu</strong> + <strong>4 E.G.O Cấp Cao</strong></li>
                  </ul>
                </div>
              </div>
            </form>
          )}

          {/* =====================================================================
              TAB 4: SERVER LEADERBOARD (ALL ACCOUNTS)
             ===================================================================== */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-base font-black text-amber-300">
                    BẢNG XẾP HẠNG CÁC TÀI KHOẢN QUẢN LÝ LCB ({leaderboard.length})
                  </h4>
                  <p className="text-xs text-stone-400">
                    Danh sách toàn bộ tài khoản đã tạo trên Server & Máy chủ LAN/Radmin VPN cùng lượng Lunacy & Bộ sưu tập riêng:
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {leaderboard.map((acc, idx) => (
                  <div
                    key={acc.username}
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                      currentAccount?.username === acc.username
                        ? 'bg-amber-950/40 border-amber-400'
                        : 'bg-black/70 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-stone-900 border border-amber-400/50 font-bebas text-lg text-amber-300 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <img
                        src={getSinnerAvatarUrl(acc.avatarSinnerId)}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover object-center border border-amber-400/50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm text-white">
                            {acc.displayName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 font-mono-num text-[10px] text-amber-300">
                            {acc.uid}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono-num">
                          @{acc.username} • Manager Lv.{acc.managerLevel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono-num text-xs">
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400">LUNACY</div>
                        <div className="font-bold text-rose-300">{acc.lunacy.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400">SƯU TẬP</div>
                        <div className="font-bold text-amber-300">
                          {acc.unlockedIds} ID / {acc.unlockedEgos} E.G.O
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400">ẢNH ĐÃ QUA</div>
                        <div className="font-bold text-emerald-300">{acc.clearedStages} Stages</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 5: EXPORT / IMPORT ACCOUNT TRANSFER CODE
             ===================================================================== */}
          {activeTab === 'transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Code */}
              <div className="p-5 rounded-2xl bg-black/70 border border-amber-500/40 space-y-3">
                <div className="font-display text-sm font-black text-amber-300 flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  XUẤT MÃ SAO LƯU TÀI KHOẢN HIỆN TẠI
                </div>
                <p className="text-xs text-stone-400">
                  Sao chép mã dưới đây để mang tài khoản (cùng toàn bộ Lunacy, Nhân cách 000, E.G.O) sang trình duyệt khác hoặc máy tính khác:
                </p>
                {currentAccount ? (
                  <>
                    <textarea
                      readOnly
                      value={exportAccountCode(currentAccount)}
                      rows={4}
                      className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono-num text-amber-200 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(exportAccountCode(currentAccount));
                        soundManager.playSfx('ui_click');
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2500);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer"
                    >
                      {copiedCode ? '✓ ĐÃ SAO CHÉP MÃ TÀI KHOẢN!' : 'SAO CHÉP MÃ TÀI KHOẢN (COPY CODE)'}
                    </button>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-950 text-xs text-stone-400">
                    Hãy đăng nhập một tài khoản trước để xuất mã sao lưu.
                  </div>
                )}
              </div>

              {/* Import Code */}
              <div className="p-5 rounded-2xl bg-black/70 border border-sky-500/40 space-y-3">
                <div className="font-display text-sm font-black text-sky-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-400" />
                  NHẬP MÃ KHÔI PHỤC TÀI KHOẢN
                </div>
                <p className="text-xs text-stone-400">
                  Dán mã <code className="text-sky-300">LCB-ACC-...</code> của bạn vào đây để khôi phục ngay lập tức tài khoản và số Lunacy:
                </p>
                <textarea
                  value={importCodeStr}
                  onChange={(e) => setImportCodeStr(e.target.value)}
                  placeholder="Dán mã LCB-ACC-... vào đây"
                  rows={4}
                  className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono-num text-white outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs cursor-pointer"
                >
                  KHÔI PHỤC & ĐĂNG NHẬP TÀI KHOẢN NÀY
                </button>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 6: SUPABASE CLOUD DATABASE CONFIGURATION & SQL SCHEMA
             ===================================================================== */}
          {activeTab === 'supabase' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: URL & Anon Key Config */}
              <div className="p-5 rounded-2xl bg-black/70 border border-emerald-500/40 space-y-3.5">
                <div className="font-display text-sm font-black text-emerald-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  KẾT NỐI CƠ SỞ DỮ LIỆU SUPABASE CLOUD
                </div>
                <p className="text-xs text-stone-400">
                  Khi chạy trên <strong>Vercel</strong>, bạn chỉ cần thêm 2 biến môi trường{' '}
                  <code className="text-amber-300">VITE_SUPABASE_URL</code> và{' '}
                  <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code>. Hoặc bạn có thể dán trực tiếp vào đây để kết nối ngay lập tức:
                </p>

                <div>
                  <label className="block text-xs font-bold text-emerald-300 uppercase mb-1">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://xxxxxxxxxxxx.supabase.co"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs font-mono-num text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300 uppercase mb-1">
                    Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={sbAnonKey}
                    onChange={(e) => setSbAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs font-mono-num text-white focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      soundManager.playSfx('ui_click');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setCustomSupabaseConfig(sbUrl, sbAnonKey);
                      setLoading(true);
                      const res = await testSupabaseConnection();
                      setLoading(false);
                      if (res.ok) {
                        soundManager.playSfx('gacha_000');
                        setSuccessMsg(res.message);
                      } else {
                        soundManager.playSfx('stagger');
                        setErrorMsg(res.message);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer"
                  >
                    {loading ? 'ĐANG KIỂM TRA...' : 'LƯU & KIỂM TRA KẾT NỐI SUPABASE'}
                  </button>
                </div>
              </div>

              {/* Right: 1-Click SQL Schema Copy */}
              <div className="p-5 rounded-2xl bg-black/70 border border-amber-500/40 space-y-3">
                <div className="font-display text-sm font-black text-amber-300">
                  MÃ SQL TẠO BẢNG TRÊN SUPABASE (CHỈ CẦN CHẠY 1 LẦN)
                </div>
                <p className="text-xs text-stone-400">
                  Vào <strong>Supabase Dashboard → SQL Editor → New Query</strong>, dán đoạn SQL dưới đây (hoặc lấy trong file <code className="text-amber-300">supabase_schema.sql</code>) và bấm <strong>RUN</strong>:
                </p>
                <textarea
                  readOnly
                  rows={7}
                  value={`create table if not exists public.lcb_accounts (
  username text primary key,
  uid text not null unique,
  display_name text not null,
  password_hash text not null,
  avatar_sinner_id integer not null default 3,
  last_daily_claim_date text,
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);
alter table public.lcb_accounts enable row level security;
create policy "Public Read" on public.lcb_accounts for select to anon using (true);
create policy "Public Insert" on public.lcb_accounts for insert to anon with check (true);
create policy "Public Update" on public.lcb_accounts for update to anon using (true) with check (true);`}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-[10px] font-mono-num text-amber-200 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`create table if not exists public.lcb_accounts (
  username text primary key,
  uid text not null unique,
  display_name text not null,
  password_hash text not null,
  avatar_sinner_id integer not null default 3,
  last_daily_claim_date text,
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);
alter table public.lcb_accounts enable row level security;
drop policy if exists "Public Read" on public.lcb_accounts;
create policy "Public Read" on public.lcb_accounts for select to anon using (true);
drop policy if exists "Public Insert" on public.lcb_accounts;
create policy "Public Insert" on public.lcb_accounts for insert to anon with check (true);
drop policy if exists "Public Update" on public.lcb_accounts;
create policy "Public Update" on public.lcb_accounts for update to anon using (true) with check (true);`);
                    soundManager.playSfx('ui_click');
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer"
                >
                  {copiedSql ? '✓ ĐÃ COPY MÃ SQL!' : 'COPY MÃ SQL TẠO BẢNG SUPABASE'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
