import React, { useEffect, useState } from 'react';
import { soundManager } from '../audio/SoundManager';
import { OFFICIAL_MILI_LYRICS } from '../data/steamOfficialData';
import { ManagerAccount } from '../services/accountService';
import { Clock, Film, Image as ImageIcon, Play, Sparkles, UserCheck, UserPlus } from 'lucide-react';

interface TitleScreenProps {
  currentAccount: ManagerAccount | null;
  onStartGame: () => void;
  onOpenAccountModal: () => void;
}

const STEAM_CGS = [
  { id: 'video', label: 'Official Title Video (Steam)', src: '/assets/steam/videos/limbus_title_1.mp4' },
  { id: 'cg1', label: 'Key Art CG I — Mephistopheles', src: '/assets/steam/ui/LoadingCGSelect_01_KR.webp' },
  { id: 'cg2', label: 'Key Art CG II — 12 Sinners', src: '/assets/steam/ui/LoadingCGSelect_02_EN.webp' },
  { id: 'cg3', label: 'Key Art CG III — Golden Bough', src: '/assets/steam/ui/LoadingCGSelect_03_KR.webp' },
  { id: 'cg4', label: 'Key Art CG IV — Mirror Worlds', src: '/assets/steam/ui/LoadingCGSelect_04_KR.webp' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentAccount,
  onStartGame,
  onOpenAccountModal,
}) => {
  const [bgMode, setBgMode] = useState<string>('video');
  const [showIntroLogo, setShowIntroLogo] = useState<boolean>(true);
  const [lyricIndex, setLyricIndex] = useState<number>(0);

  const titleLyrics = OFFICIAL_MILI_LYRICS.title || [];

  useEffect(() => {
    soundManager.playBgm('title');
  }, []);

  useEffect(() => {
    if (titleLyrics.length === 0) return;
    const interval = setInterval(() => {
      setLyricIndex((prev) => (prev + 1) % titleLyrics.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [titleLyrics.length]);

  const activeCg = STEAM_CGS.find((c) => c.id === bgMode) || STEAM_CGS[0];

  return (
    <div
      onClick={() => {
        if (!currentAccount) {
          soundManager.playSfx('ui_click');
          onOpenAccountModal();
          return;
        }
        soundManager.playSfx('dante_tick');
        onStartGame();
      }}
      className="relative w-screen h-screen flex flex-col items-center justify-between py-10 px-6 overflow-hidden cursor-pointer select-none bg-[#070608]"
    >
      {/* Optional Project Moon Logo Intro Video Overlay */}
      {showIntroLogo && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            soundManager.resumeBgmIfNeeded();
            setShowIntroLogo(false);
          }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer"
        >
          <video
            src="/assets/steam/videos/logo_intro_noSE.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setShowIntroLogo(false)}
            onError={() => setShowIntroLogo(false)}
            className="w-full h-full object-contain max-w-4xl"
          />
          <div className="absolute bottom-8 px-4 py-1.5 rounded-full bg-black/80 border border-amber-500/40 text-xs text-amber-200 font-mono-num animate-pulse">
            CLICK ANYWHERE TO SKIP INTRO // PROJECT MOON OFFICIAL STEAM BUILD
          </div>
        </div>
      )}

      {/* Official Steam Video or 2048x2048 Key Art Background */}
      {bgMode === 'video' ? (
        <video
          src="/assets/steam/videos/limbus_title_1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.65) contrast(1.15)' }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-all duration-700"
          style={{
            backgroundImage: `url('${activeCg.src}')`,
            filter: 'brightness(0.6) contrast(1.18)',
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/80 pointer-events-none" />

      {/* Top Bar: Project Moon Motto & Steam Background Switcher */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 px-5 py-1.5 rounded-full bg-black/80 border border-amber-500/50 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-display text-xs tracking-[0.25em] text-amber-200 uppercase">
            PROJECT MOON // FACE THE SIN, SAVE THE E.G.O
          </span>
        </div>

        {/* Steam Visual Switcher */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-black/80 border border-stone-700 rounded-xl p-1"
        >
          {STEAM_CGS.map((cg) => (
            <button
              key={cg.id}
              type="button"
              onClick={() => {
                soundManager.playSfx('ui_click');
                setBgMode(cg.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                bgMode === cg.id
                  ? 'bg-red-900 border border-amber-400 text-amber-200'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {cg.id === 'video' ? (
                <Film className="w-3 h-3 text-amber-300" />
              ) : (
                <ImageIcon className="w-3 h-3 text-amber-300" />
              )}
              {cg.id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Center Logo, Dante Clock Motif & Live Mili Lyrics */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-red-900/90 to-black border-4 border-amber-400 flex items-center justify-center shadow-[0_0_70px_rgba(220,38,38,0.85)] mb-5">
          <div className="absolute inset-1.5 rounded-full border border-dashed border-amber-300/60 animate-gear-slow" />
          <img
            src="/assets/ui/logo.png"
            alt="Limbus Company"
            className="w-20 h-20 object-contain drop-shadow-[0_0_12px_#facc15]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <Clock className="w-12 h-12 text-amber-300 absolute opacity-35" />
        </div>

        <h1 className="font-display text-6xl sm:text-7xl font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-red-500 drop-shadow-[0_6px_25px_rgba(0,0,0,0.95)]">
          LIMBUS COMPANY
        </h1>

        <div className="mt-3 px-6 py-1.5 hazard-stripes rounded border border-red-500/60 shadow-lg">
          <span className="font-bebas text-xl tracking-[0.25em] text-amber-200">
            STEAM OFFICIAL ASSETS EDITION — BUS MEPHISTOPHELES
          </span>
        </div>

        {/* Live Synchronized Mili Lyrics ("In Hell We Live, Lament") */}
        {titleLyrics.length > 0 && (
          <div className="mt-5 px-6 py-2 rounded-full bg-black/75 border border-red-500/40 shadow-[0_0_25px_rgba(220,38,38,0.45)]">
            <span className="text-xs text-rose-400 font-mono-num uppercase tracking-widest mr-2">
              ♪ Mili — In Hell We Live, Lament:
            </span>
            <span className="font-display italic text-sm text-amber-200 tracking-wide">
              “{titleLyrics[lyricIndex]}”
            </span>
          </div>
        )}

        <p className="text-sm text-stone-300 max-w-xl mt-4 leading-relaxed">
          12 Tội Nhân (Sinners) • Hệ Thống Đọ Chiêu & Tung Đồng Xu (Clash & Coin Toss) • Cộng Hưởng 7 Đại Tội • Thức Tỉnh & Ăn Mòn E.G.O • Cốt Truyện Cantos I–VII & Mirror Dungeon
        </p>
      </div>

      {/* Bottom Account Status & Touch to Start */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col items-center gap-3"
      >
        {currentAccount ? (
          <div className="flex flex-wrap items-center justify-center gap-3 px-5 py-2 rounded-2xl bg-black/85 border border-amber-400/70 shadow-2xl">
            <img
              src={`/assets/sinners/sinner_${currentAccount.avatarSinnerId || 3}.webp`}
              alt=""
              className="w-10 h-10 rounded-lg object-cover object-top border border-amber-300"
            />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm text-amber-200">
                  {currentAccount.displayName}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/50 font-mono-num text-[10px] text-amber-300 font-bold">
                  {currentAccount.uid}
                </span>
              </div>
              <div className="text-[11px] font-mono-num text-rose-300 font-bold">
                💎 {currentAccount.save.lunacy.toLocaleString()} Lunacy •{' '}
                {currentAccount.save.unlockedIdentityIds.length} ID •{' '}
                {currentAccount.save.unlockedEgoIds.length} E.G.O
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundManager.playSfx('ui_click');
                onOpenAccountModal();
              }}
              className="ml-2 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-400/60 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              Đổi / Tạo Tài Khoản
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              onOpenAccountModal();
            }}
            className="px-6 py-2.5 rounded-xl bg-black/85 hover:bg-stone-900 border-2 border-amber-400 text-amber-200 font-display font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-xl"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            CHƯA ĐĂNG NHẬP — BẤM ĐỂ TẠO TÀI KHOẢN MỚI (+3,900 LUNACY) HOẶC ĐĂNG NHẬP
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (!currentAccount) {
              soundManager.playSfx('ui_click');
              onOpenAccountModal();
              return;
            }
            soundManager.playSfx('dante_tick');
            onStartGame();
          }}
          className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-red-800 via-amber-600 to-red-800 border-2 border-amber-300 text-white font-display font-black text-lg tracking-[0.2em] flex items-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          {currentAccount
            ? `BOARD MEPHISTOPHELES AS ${currentAccount.displayName.toUpperCase()}`
            : 'ĐĂNG NHẬP / ĐĂNG KÝ TÀI KHOẢN ĐỂ VÀO GAME'}
        </button>
        <span className="text-[11px] font-mono-num text-stone-400">
          VER 2.5.0 // MULTI-ACCOUNT CLOUD & LOCAL SAVE + STEAM ASSETS INTEGRATED
        </span>
      </div>
    </div>
  );
};
