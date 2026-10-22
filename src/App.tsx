import React, { useEffect, useState } from 'react';
import {
  CantoStage,
  EgoData,
  IdentityData,
  PlayerSaveState,
} from './types/game';
import { IDENTITIES, SINNERS } from './data/sinnersAndIdentities';
import { EGOS } from './data/egos';
import { EGO_GIFTS } from './data/constants';
import { BGM_TRACKS, BgmKey, soundManager } from './audio/SoundManager';
import { TitleScreen } from './components/TitleScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { SinnersScreen } from './components/SinnersScreen';
import { DriveScreen } from './components/DriveScreen';
import { ExtractScreen } from './components/ExtractScreen';
import { BattleScreen } from './components/BattleScreen';
import { StoryCutsceneModal } from './components/StoryCutsceneModal';
import { CodexModal } from './components/CodexModal';
import { AccountModal } from './components/AccountModal';
import {
  ManagerAccount,
  canClaimDailySupply,
  createInitialSaveState,
  getActiveAccount,
  persistAccountSave,
  setActiveAccountUsername,
} from './services/accountService';
import {
  Bus,
  Users,
  Compass,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Zap,
  Ticket,
  Flame,
  Music,
  SkipForward,
  UserCheck,
} from 'lucide-react';

export function App() {
  const [started, setStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'window' | 'sinners' | 'drive' | 'extract'>('window');
  const [showCodex, setShowCodex] = useState(false);
  const [showJukebox, setShowJukebox] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [, setAudioTick] = useState(0);

  const [currentAccount, setCurrentAccount] = useState<ManagerAccount | null>(() =>
    getActiveAccount()
  );

  const [save, setSave] = useState<PlayerSaveState>(() => {
    const acc = getActiveAccount();
    if (acc && acc.save) {
      return acc.save;
    }
    return createInitialSaveState();
  });

  // Active Stage & Cutscene Pipeline
  const [activeStage, setActiveStage] = useState<CantoStage | null>(null);
  const [activeMirrorNodeId, setActiveMirrorNodeId] = useState<string | null>(null);
  const [stagePhase, setStagePhase] = useState<'pre_cutscene' | 'battle' | 'post_cutscene' | null>(
    null
  );

  useEffect(() => {
    soundManager.preloadAll();
    return soundManager.subscribe(() => setAudioTick((t) => t + 1));
  }, []);

  // Automatically persist `save` to the currently logged-in account (both local & server)
  useEffect(() => {
    if (currentAccount) {
      const updatedAcc = persistAccountSave(currentAccount, save);
      setCurrentAccount(updatedAcc);
    }
    soundManager.setMuted(save.bgmMuted, save.sfxMuted);
  }, [save]);

  useEffect(() => {
    if (!started) return;
    if ((stagePhase === 'pre_cutscene' || stagePhase === 'post_cutscene') && activeStage) {
      soundManager.playBgm('story');
    } else if (stagePhase === 'battle' && activeStage) {
      soundManager.playBgm(activeStage.bgmKey);
    } else if (activeTab === 'extract') {
      soundManager.playBgm('extract');
    } else if (activeTab === 'sinners' || activeTab === 'drive') {
      soundManager.playBgm('team');
    } else {
      soundManager.playBgm('lobby');
    }
  }, [started, activeTab, stagePhase, activeStage]);

  const handleLaunchStage = (stage: CantoStage, mirrorNodeId?: string) => {
    setActiveStage(stage);
    setActiveMirrorNodeId(mirrorNodeId || null);
    if (stage.preCutscene && stage.preCutscene.length > 0) {
      setStagePhase('pre_cutscene');
    } else {
      setStagePhase('battle');
    }
  };

  const handleBattleVictory = (survivingState: {
    hpPercents: Record<number, number>;
    spValues: Record<number, number>;
  }) => {
    if (!activeStage) return;

    // Grant Stage Rewards & Update Mirror Dungeon if applicable
    setSave((prev) => {
      const nextShards = { ...prev.egoshards };
      prev.deployedSinnerIds.forEach((id) => {
        nextShards[id] = (nextShards[id] || 0) + activeStage.rewards.shards;
      });

      let nextMirror = prev.mirrorRun;
      if (activeMirrorNodeId && prev.mirrorRun) {
        const r = prev.mirrorRun;
        const nodeObj = r.nodes.find((n) => n.id === activeMirrorNodeId);
        const unownedGifts = EGO_GIFTS.filter((g) => !r.collectedGiftIds.includes(g.id));
        const bonusGift =
          (nodeObj?.type === 'elite' || nodeObj?.type === 'boss') && unownedGifts.length > 0
            ? unownedGifts[Math.floor(Math.random() * unownedGifts.length)].id
            : undefined;

        const nextGifts = bonusGift
          ? Array.from(new Set([...r.collectedGiftIds, bonusGift]))
          : r.collectedGiftIds;

        if (nodeObj?.type === 'boss') {
          if (r.floor < r.maxFloors) {
            nextMirror = {
              ...r,
              floor: r.floor + 1,
              costCurrency: r.costCurrency + 160,
              starlightEarned: r.starlightEarned + 40,
              collectedGiftIds: nextGifts,
              currentNodeId: null,
              completedNodeIds: [],
              sinnerHpPercents: survivingState.hpPercents,
              sinnerSpValues: survivingState.spValues,
              nodes: r.nodes, // Regenerated when entering Mirror tab or below
            };
          } else {
            nextMirror = null;
          }
        } else {
          nextMirror = {
            ...r,
            costCurrency: r.costCurrency + (nodeObj?.type === 'elite' ? 140 : 90),
            collectedGiftIds: nextGifts,
            currentNodeId: activeMirrorNodeId,
            completedNodeIds: [...r.completedNodeIds, activeMirrorNodeId],
            sinnerHpPercents: survivingState.hpPercents,
            sinnerSpValues: survivingState.spValues,
            nodes: r.nodes.map((n) =>
              n.id === activeMirrorNodeId ? { ...n, completed: true } : n
            ),
          };
        }
      }

      return {
        ...prev,
        lunacy: prev.lunacy + activeStage.rewards.lunacy,
        expTickets: prev.expTickets + activeStage.rewards.expTickets,
        thread: prev.thread + activeStage.rewards.thread,
        egoshards: nextShards,
        clearedStageIds: Array.from(new Set([...prev.clearedStageIds, activeStage.id])),
        mirrorRun: nextMirror,
      };
    });

    if (activeStage.postCutscene && activeStage.postCutscene.length > 0) {
      setStagePhase('post_cutscene');
    } else {
      setActiveStage(null);
      setActiveMirrorNodeId(null);
      setStagePhase(null);
    }
  };

  const handleBattleDefeat = () => {
    setActiveStage(null);
    setActiveMirrorNodeId(null);
    setStagePhase(null);
  };

  const handleGrantManagerSupply = () => {
    setSave((prev) => {
      const nextShards = { ...prev.egoshards };
      SINNERS.forEach((s) => {
        nextShards[s.id] = (nextShards[s.id] || 0) + 100;
      });
      return {
        ...prev,
        lunacy: prev.lunacy + 2600,
        thread: prev.thread + 100,
        expTickets: prev.expTickets + 30,
        enkephalin: prev.maxEnkephalin,
        egoshards: nextShards,
      };
    });
  };

  const handleAuthSuccess = (acc: ManagerAccount) => {
    setCurrentAccount(acc);
    setSave(acc.save);
    setShowAccountModal(false);
  };

  const handleLogout = () => {
    setActiveAccountUsername(null);
    setCurrentAccount(null);
    setShowAccountModal(false);
    setStarted(false);
  };

  const handleClaimDailySupply = () => {
    if (!currentAccount || !canClaimDailySupply(currentAccount)) return;
    const today = new Date().toISOString().slice(0, 10);
    const nextSave: PlayerSaveState = {
      ...save,
      lunacy: save.lunacy + 1300,
      enkephalin: Math.min(save.maxEnkephalin + 60, save.enkephalin + 60),
      thread: save.thread + 30,
      expTickets: save.expTickets + 10,
      managerLevel: save.managerLevel + 1,
    };
    const updatedAcc = persistAccountSave(currentAccount, nextSave, {
      lastDailyClaimDate: today,
    });
    setCurrentAccount(updatedAcc);
    setSave(nextSave);
  };

  const handleUpdateProfile = (displayName: string, avatarSinnerId: number) => {
    if (!currentAccount) return;
    const nextSave: PlayerSaveState = {
      ...save,
      lobbySinnerId: avatarSinnerId,
    };
    const updatedAcc = persistAccountSave(currentAccount, nextSave, {
      displayName,
      avatarSinnerId,
    });
    setCurrentAccount(updatedAcc);
    setSave(nextSave);
  };

  if (!started) {
    return (
      <>
        <TitleScreen
          currentAccount={currentAccount}
          onStartGame={() => {
            if (!currentAccount) {
              setShowAccountModal(true);
              return;
            }
            setStarted(true);
            soundManager.playBgm('lobby');
          }}
          onOpenAccountModal={() => setShowAccountModal(true)}
        />
        {showAccountModal && (
          <AccountModal
            currentAccount={currentAccount}
            requireAuth={!currentAccount}
            onSuccessAuth={(acc) => {
              handleAuthSuccess(acc);
              setStarted(true);
              soundManager.playBgm('lobby');
            }}
            onLogout={handleLogout}
            onClaimDaily={handleClaimDailySupply}
            onUpdateProfile={handleUpdateProfile}
            onClose={() => setShowAccountModal(false)}
          />
        )}
      </>
    );
  }

  // Prepare Deployed Sinners list for BattleScreen
  const deployedBattleList = save.deployedSinnerIds.map((sinnerId) => {
    const sinner = SINNERS.find((s) => s.id === sinnerId)!;
    const eqId = save.equippedIdentityBySinner[sinnerId];
    const identity: IdentityData =
      IDENTITIES.find((i) => i.id === eqId) ||
      IDENTITIES.find((i) => i.sinnerId === sinnerId)!;

    const eqEgoMap = save.equippedEgosBySinner[sinnerId] || {};
    const equippedEgos: EgoData[] = Object.values(eqEgoMap)
      .map((egoId) => EGOS.find((e) => e.id === egoId))
      .filter((e): e is EgoData => Boolean(e));
    if (equippedEgos.length === 0) {
      const baseEgo = EGOS.find((e) => e.sinnerId === sinnerId);
      if (baseEgo) equippedEgos.push(baseEgo);
    }

    return {
      sinner,
      identity,
      egos: equippedEgos,
      level: save.identityLevels[identity.id] || 15,
      uptie: save.identityUpties[identity.id] || 2,
      initialHpPercent: activeMirrorNodeId
        ? save.mirrorRun?.sinnerHpPercents[sinnerId]
        : undefined,
      initialSp: activeMirrorNodeId ? save.mirrorRun?.sinnerSpValues[sinnerId] : 0,
    };
  });

  // If in Pre/Post Cutscene or Battle
  if (activeStage && stagePhase === 'pre_cutscene') {
    return (
      <StoryCutsceneModal
        title={`${activeStage.stageCode} — ${activeStage.title}`}
        backgroundUrl={activeStage.backgroundUrl}
        lines={activeStage.preCutscene}
        onComplete={() => setStagePhase('battle')}
      />
    );
  }

  if (activeStage && stagePhase === 'post_cutscene') {
    return (
      <StoryCutsceneModal
        title={`${activeStage.stageCode} — Aftermath`}
        backgroundUrl={activeStage.backgroundUrl}
        lines={activeStage.postCutscene}
        onComplete={() => {
          setActiveStage(null);
          setActiveMirrorNodeId(null);
          setStagePhase(null);
        }}
      />
    );
  }

  if (activeStage && stagePhase === 'battle') {
    return (
      <div className="w-screen h-screen flex flex-col bg-[#08070a] overflow-hidden">
        <BattleScreen
          stage={activeStage}
          deployedSinners={deployedBattleList}
          activeGiftIds={
            activeMirrorNodeId && save.mirrorRun ? save.mirrorRun.collectedGiftIds : []
          }
          onVictory={handleBattleVictory}
          onDefeat={handleBattleDefeat}
        />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col justify-between bg-[#09080a] text-[#eae4dc] overflow-hidden select-none">
      {/* ==================== TOP GLOBAL RESOURCE HUD BAR ==================== */}
      <header className="relative z-30 h-14 px-6 bg-gradient-to-b from-black via-[#120e14] to-[#0c0a0e] border-b border-amber-500/40 flex items-center justify-between shadow-xl">
        {/* Left: Executive Manager Profile & Account Switcher */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundManager.playSfx('ui_click');
              setShowAccountModal(true);
            }}
            title="Hồ Sơ Tài Khoản Quản Lý • Đổi Tài Khoản • Điểm Danh Nhận Lunacy"
            className="flex items-center gap-3 px-2.5 py-1 rounded-xl bg-black/70 hover:bg-stone-900 border border-amber-400/60 cursor-pointer transition group"
          >
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-red-950 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(220,38,38,0.6)]">
              <img
                src={`/assets/sinners/sinner_${currentAccount?.avatarSinnerId || save.lobbySinnerId || 3}.webp`}
                alt=""
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xs sm:text-sm text-amber-200 tracking-wider group-hover:text-white">
                  {currentAccount?.displayName || 'DANTE'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/60 font-mono-num text-[10px] font-bold text-amber-300">
                  LV.{save.managerLevel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono-num">
                <span>{currentAccount?.uid || 'LCB-GUEST'}</span>
                <span className="text-amber-300 font-bold flex items-center gap-0.5">
                  • <UserCheck className="w-3 h-3 inline" /> Tài Khoản
                </span>
              </div>
            </div>
          </button>

          {currentAccount && canClaimDailySupply(currentAccount) && (
            <button
              type="button"
              onClick={() => {
                soundManager.playSfx('ui_click');
                setShowAccountModal(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 border border-amber-200 text-black font-extrabold text-[10px] animate-pulse cursor-pointer shadow"
            >
              🎁 +1,300 LUNACY
            </button>
          )}
        </div>

        {/* Center: Currencies (Enkephalin, Modules, Lunacy, Thread, EXP Tickets) */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/75 border border-emerald-500/40 text-xs font-mono-num"
            title="Enkephalin & Enkephalin Modules"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold">
              {save.enkephalin}/{save.maxEnkephalin}
            </span>
            <span className="text-stone-500">|</span>
            <span className="text-emerald-200">Mod: {save.enkephalinModules}</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/75 border border-rose-500/50 text-xs font-mono-num"
            title="Lunacy (Used for Extraction Gacha)"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-200 font-bold">{save.lunacy.toLocaleString()}</span>
            <span className="text-[10px] text-rose-400 uppercase">Lunacy</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/75 border border-sky-500/40 text-xs font-mono-num"
            title="Thread (Used for Uptie & Dispensary)"
          >
            <Flame className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-200 font-bold">{save.thread}</span>
            <span className="text-[10px] text-sky-400 uppercase">Thread</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-black/75 border border-amber-500/40 text-xs font-mono-num"
            title="Identity Training EXP Tickets"
          >
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200 font-bold">{save.expTickets}</span>
            <span className="text-[10px] text-amber-400 uppercase">EXP</span>
          </div>
        </div>

        {/* Right: Mephistopheles Jukebox, Dante's Notes Codex & Audio Controls */}
        <div className="relative flex items-center gap-2">
          {/* Jukebox Now Playing & Playlist Toggle */}
          <div className="flex items-center rounded-lg bg-purple-950/75 border border-purple-400/60 overflow-hidden shadow">
            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                setShowJukebox((v) => !v);
              }}
              className="px-2.5 py-1.5 hover:bg-purple-900/70 text-xs font-bold text-purple-100 flex items-center gap-1.5 cursor-pointer max-w-[230px]"
              title="Mephistopheles OST Jukebox — Chọn bài hát Mili / Studio EIM"
            >
              <Music className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
              <span className="truncate">
                {soundManager.getActiveTrackMeta()?.title || 'Select BGM'}
              </span>
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                soundManager.nextJukeboxTrack();
              }}
              className="px-2 py-1.5 bg-purple-900/60 hover:bg-purple-800 border-l border-purple-500/40 text-amber-300 cursor-pointer"
              title="Bài tiếp theo (Next OST Track)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {showJukebox && (
            <div className="absolute right-0 top-12 w-80 limbus-panel rounded-xl border-2 border-amber-400/80 p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                <div>
                  <div className="font-display text-xs font-black text-amber-200 tracking-wider uppercase">
                    MEPHISTOPHELES OST JUKEBOX
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Official Mili & Studio EIM Soundtrack (13 Tracks)
                  </div>
                </div>
                <button
                  onClick={() => setShowJukebox(false)}
                  className="text-xs text-stone-400 hover:text-white px-1.5 py-0.5 rounded bg-stone-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 mb-2.5 px-2 py-1.5 rounded bg-black/60 border border-stone-800">
                <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[10px] text-stone-300 w-14">Âm lượng:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={soundManager.getBgmVolume()}
                  onChange={(e) => soundManager.setBgmVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-400 cursor-pointer h-1.5"
                />
                <span className="text-[10px] font-mono-num text-amber-300 w-8 text-right">
                  {Math.round(soundManager.getBgmVolume() * 100)}%
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                <button
                  onClick={() => {
                    soundManager.playSfx('ui_click');
                    soundManager.setJukeboxOverride('auto');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between ${
                    soundManager.getJukeboxOverride() === 'auto'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                      : 'bg-black/60 border-stone-800 text-stone-300 hover:border-stone-600'
                  }`}
                >
                  <span>🔄 AUTO (Tự động đổi theo màn chơi & Boss)</span>
                  {soundManager.getJukeboxOverride() === 'auto' && (
                    <span className="text-[10px] text-amber-300">ACTIVE</span>
                  )}
                </button>

                {BGM_TRACKS.map((tr) => {
                  const isPlaying = soundManager.getActiveTrackMeta()?.key === tr.key;
                  const isLocked = soundManager.getJukeboxOverride() === tr.key;
                  return (
                    <button
                      key={tr.key}
                      onClick={() => {
                        soundManager.playSfx('ui_click');
                        soundManager.setJukeboxOverride(tr.key as BgmKey);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isPlaying
                          ? 'bg-purple-950/90 border-amber-400 text-amber-100'
                          : 'bg-black/50 border-stone-800/80 text-stone-300 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          {isPlaying && <span className="text-amber-300">▶</span>}
                          <span>{tr.title}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          {tr.artist} • <span className="text-purple-300">{tr.tag}</span>
                        </div>
                      </div>
                      {isLocked && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] text-amber-300 shrink-0">
                          LOCKED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setShowCodex(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-400/70 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Dante’s Notes
          </button>

          <button
            onClick={() =>
              setSave((prev) => ({
                ...prev,
                bgmMuted: !prev.bgmMuted,
                sfxMuted: !prev.sfxMuted,
              }))
            }
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
            title="Toggle Audio Mute"
          >
            {save.sfxMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-300" />
            )}
          </button>
        </div>
      </header>

      {/* ==================== MAIN SCREEN VIEWPORT ==================== */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'window' && (
          <LobbyScreen
            save={save}
            onUpdateSave={setSave}
            onNavigateTab={setActiveTab}
            onQuickStartStage={(st) => handleLaunchStage(st)}
          />
        )}
        {activeTab === 'sinners' && (
          <SinnersScreen save={save} onUpdateSave={setSave} />
        )}
        {activeTab === 'drive' && (
          <DriveScreen
            save={save}
            onUpdateSave={setSave}
            onLaunchStage={handleLaunchStage}
          />
        )}
        {activeTab === 'extract' && (
          <ExtractScreen save={save} onUpdateSave={setSave} />
        )}
      </main>

      {/* ==================== BOTTOM LIMBUS NAVIGATION DOCK ==================== */}
      <nav className="relative z-30 h-16 px-8 bg-gradient-to-t from-black via-[#120e14] to-[#17121a] border-t-2 border-amber-500/50 flex items-center justify-center gap-4 shadow-2xl">
        {(
          [
            { id: 'window', label: 'WINDOW', sub: 'Mephistopheles Lobby', icon: Bus },
            { id: 'sinners', label: 'SINNERS', sub: '12 Sinners • ID • E.G.O', icon: Users },
            { id: 'drive', label: 'DRIVE', sub: 'Story • Mirror Dungeon', icon: Compass },
            { id: 'extract', label: 'EXTRACT', sub: 'Gacha • Dispensary', icon: Sparkles },
          ] as const
        ).map((tab) => {
          const IconComp = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playSfx('ui_click');
                setActiveTab(tab.id);
              }}
              className={`px-7 py-2 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-red-900 via-red-800 to-amber-900/90 border-amber-300 scale-105 shadow-[0_0_20px_rgba(220,38,38,0.6)]'
                  : 'bg-black/65 border-stone-800 hover:border-amber-500/50 text-stone-400 hover:text-stone-200'
              }`}
            >
              <IconComp className={`w-5 h-5 ${active ? 'text-amber-300' : 'text-stone-400'}`} />
              <div className="text-left">
                <div
                  className={`font-display text-sm font-black tracking-wider leading-none ${
                    active ? 'text-amber-100' : 'text-stone-300'
                  }`}
                >
                  {tab.label}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">{tab.sub}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Codex / Dante's Notes Modal */}
      {showCodex && (
        <CodexModal
          onClose={() => setShowCodex(false)}
          onGrantSupply={handleGrantManagerSupply}
          onResetSave={() => {
            const fresh = createInitialSaveState();
            setSave(fresh);
            setShowCodex(false);
          }}
        />
      )}

      {/* Account Management & Switcher Modal */}
      {showAccountModal && (
        <AccountModal
          currentAccount={currentAccount}
          onSuccessAuth={handleAuthSuccess}
          onLogout={handleLogout}
          onClaimDaily={handleClaimDailySupply}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowAccountModal(false)}
        />
      )}
    </div>
  );
}

export default App;
