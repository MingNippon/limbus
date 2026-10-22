import React, { useState } from 'react';
import { EgoData, IdentityData, PlayerSaveState, SinAffinity, SinnerData } from '../types/game';
import { SINNERS, IDENTITIES } from '../data/sinnersAndIdentities';
import { EGOS } from '../data/egos';
import { ATTACK_TYPE_INFO, DEFENSE_TYPE_INFO, RISK_LEVEL_COLOR, SIN_INFO } from '../data/constants';
import { soundManager } from '../audio/SoundManager';
import {
  CheckCircle2,
  ArrowUpCircle,
  Sparkles,
  Shield,
  Volume2,
  Users,
  Lock,
  Star,
} from 'lucide-react';

interface SinnersScreenProps {
  save: PlayerSaveState;
  onUpdateSave: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
}

export const SinnersScreen: React.FC<SinnersScreenProps> = ({ save, onUpdateSave }) => {
  const [selectedSinnerId, setSelectedSinnerId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'identities' | 'ego'>('identities');
  const [mobileTab, setMobileTab] = useState<'roster' | 'workshop'>('roster');
  const [previewPose, setPreviewPose] = useState<string>('idle');
  const [slashVfxId, setSlashVfxId] = useState<number | null>(null);

  const triggerSkillPoseCombo = (slot: 1 | 2 | 3) => {
    const seq =
      slot === 1
        ? ['move', 's1_1', 's1_2', 's1_3', 'idle']
        : slot === 2
        ? ['move', 's2_1', 's2_2', 's2_3', 'idle']
        : ['move', 's3_1', 's3_2', 's3_3', 's3_4', 'idle'];
    seq.forEach((pose, idx) => {
      setTimeout(() => {
        setPreviewPose(pose);
        if (pose.startsWith('s')) {
          setSlashVfxId(((selectedSinnerId + idx * 3) % 12) + 1);
          soundManager.playSfx(slot === 3 ? 'clash_win' : 'hit_slash');
        } else {
          setSlashVfxId(null);
        }
      }, idx * 240);
    });
  };

  const selectedSinner: SinnerData =
    SINNERS.find((s) => s.id === selectedSinnerId) || SINNERS[0];
  const sinnerIdentities: IdentityData[] = IDENTITIES.filter(
    (id) => id.sinnerId === selectedSinner.id
  );
  const equippedIdentityId =
    save.equippedIdentityBySinner[selectedSinner.id] || sinnerIdentities[0].id;
  const [inspectedIdentityId, setInspectedIdentityId] = useState<string>(equippedIdentityId);

  const inspectedIdentity: IdentityData =
    sinnerIdentities.find((i) => i.id === inspectedIdentityId) ||
    sinnerIdentities.find((i) => i.id === equippedIdentityId) ||
    sinnerIdentities[0];

  const sinnerEgos: EgoData[] = EGOS.filter((e) => e.sinnerId === selectedSinner.id);
  const currentLevel = save.identityLevels[inspectedIdentity.id] || 1;
  const currentUptie = save.identityUpties[inspectedIdentity.id] || 1;
  const isIdentityUnlocked = save.unlockedIdentityIds.includes(inspectedIdentity.id);
  const isSinnerDeployed = save.deployedSinnerIds.includes(selectedSinner.id);

  const handleToggleDeploy = (sinnerId: number) => {
    soundManager.playSfx('ui_click');
    onUpdateSave((prev) => {
      const exists = prev.deployedSinnerIds.includes(sinnerId);
      if (exists) {
        if (prev.deployedSinnerIds.length <= 1) return prev; // Keep at least 1 Sinner deployed
        return {
          ...prev,
          deployedSinnerIds: prev.deployedSinnerIds.filter((id) => id !== sinnerId),
        };
      }
      if (prev.deployedSinnerIds.length >= 6) {
        // Replace the 6th slot
        return {
          ...prev,
          deployedSinnerIds: [...prev.deployedSinnerIds.slice(0, 5), sinnerId],
        };
      }
      return {
        ...prev,
        deployedSinnerIds: [...prev.deployedSinnerIds, sinnerId],
      };
    });
  };

  const handleEquipIdentity = (identityId: string) => {
    if (!save.unlockedIdentityIds.includes(identityId)) return;
    soundManager.playSfx('ruina_snap');
    onUpdateSave((prev) => ({
      ...prev,
      equippedIdentityBySinner: {
        ...prev.equippedIdentityBySinner,
        [selectedSinner.id]: identityId,
      },
    }));
  };

  const handleLevelUp = () => {
    if (currentLevel >= 50 || save.expTickets < 1) return;
    soundManager.playSfx('heal');
    onUpdateSave((prev) => ({
      ...prev,
      expTickets: prev.expTickets - 1,
      identityLevels: {
        ...prev.identityLevels,
        [inspectedIdentity.id]: Math.min(50, (prev.identityLevels[inspectedIdentity.id] || 1) + 5),
      },
    }));
  };

  const handleUptie = () => {
    if (currentUptie >= 4 || save.thread < 20) return;
    soundManager.playSfx('gacha_000');
    const nextTier = Math.min(4, currentUptie + 1) as 1 | 2 | 3 | 4;
    onUpdateSave((prev) => ({
      ...prev,
      thread: prev.thread - 20,
      identityUpties: {
        ...prev.identityUpties,
        [inspectedIdentity.id]: nextTier,
      },
    }));
  };

  const handleToggleEgoEquip = (ego: EgoData) => {
    if (!save.unlockedEgoIds.includes(ego.id)) return;
    soundManager.playSfx('ego_activate');
    onUpdateSave((prev) => {
      const currentMap = prev.equippedEgosBySinner[selectedSinner.id] || {};
      return {
        ...prev,
        equippedEgosBySinner: {
          ...prev.equippedEgosBySinner,
          [selectedSinner.id]: {
            ...currentMap,
            [ego.riskLevel]: ego.id,
          },
        },
      };
    });
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-3 sm:gap-4 p-2.5 sm:p-4 overflow-hidden">
      {/* MOBILE SEGMENTED VIEW SWITCHER (Visible only on <lg screens) */}
      <div className="flex lg:hidden items-center justify-between gap-2 p-1.5 bg-stone-950/90 rounded-xl border border-amber-500/30 shrink-0">
        <button
          onClick={() => {
            soundManager.playSfx('ui_click');
            setMobileTab('roster');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-display tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'roster'
              ? 'bg-red-900 border border-amber-400 text-amber-200 shadow-md'
              : 'bg-stone-900/80 text-stone-400 border border-stone-800 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          ROSTER ({save.deployedSinnerIds.length}/6)
        </button>
        <button
          onClick={() => {
            soundManager.playSfx('ui_click');
            setMobileTab('workshop');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold font-display tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'workshop'
              ? 'bg-red-900 border border-amber-400 text-amber-200 shadow-md'
              : 'bg-stone-900/80 text-stone-400 border border-stone-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          #{selectedSinner.numberStr} {selectedSinner.name}
        </button>
      </div>

      {/* LEFT: 12 SINNERS ROSTER GRID */}
      <div
        className={`limbus-panel rounded-xl p-3 sm:p-3.5 flex flex-col min-h-0 overflow-hidden ${
          mobileTab === 'roster'
            ? 'flex flex-1 w-full lg:w-[36%] lg:max-w-md lg:flex-initial'
            : 'hidden lg:flex lg:w-[36%] lg:max-w-md lg:flex-initial'
        }`}
      >
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="font-display text-sm sm:text-base font-bold text-amber-200 tracking-wider">
              LCB ROSTER ({save.deployedSinnerIds.length}/6 DEPLOYED)
            </h2>
          </div>
          <span className="text-[10px] sm:text-[11px] text-stone-400">Tap to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 overflow-y-auto pr-1 flex-1 min-h-0 touch-scroll">
          {SINNERS.map((sinner) => {
            const eqId = save.equippedIdentityBySinner[sinner.id];
            const eqIdentity =
              IDENTITIES.find((i) => i.id === eqId) ||
              IDENTITIES.find((i) => i.sinnerId === sinner.id)!;
            const deployIdx = save.deployedSinnerIds.indexOf(sinner.id);
            const isSelected = sinner.id === selectedSinner.id;
            const lv = save.identityLevels[eqIdentity.id] || 1;
            const ut = save.identityUpties[eqIdentity.id] || 1;

            return (
              <div
                key={sinner.id}
                onClick={() => {
                  soundManager.playSfx('ui_click');
                  setSelectedSinnerId(sinner.id);
                  const eq = save.equippedIdentityBySinner[sinner.id];
                  if (eq) setInspectedIdentityId(eq);
                  setMobileTab('workshop');
                }}
                className={`relative rounded-lg border overflow-hidden cursor-pointer transition flex flex-col justify-between group shrink-0 h-auto min-h-[190px] ${
                  isSelected
                    ? 'border-amber-300 ring-2 ring-amber-400/80 bg-amber-950/30'
                    : deployIdx !== -1
                    ? 'border-red-500/60 bg-stone-950/90 hover:border-amber-400/60'
                    : 'border-stone-800 bg-black/70 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Top Badges & Face Portrait (centered at 30% to keep full face & eyes in focus) */}
                <div className="relative h-28 sm:h-32 w-full bg-gradient-to-b from-stone-900 to-black overflow-hidden shrink-0">
                  <img
                    src={sinner.portraitUrl}
                    alt={sinner.name}
                    className="w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none" />

                  <span className="absolute top-1 left-1 font-bebas text-xs sm:text-sm text-amber-300 bg-black/85 px-1.5 py-0.5 rounded border border-amber-500/40 z-10 leading-none">
                    #{sinner.numberStr}
                  </span>

                  {deployIdx !== -1 && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-red-800 border border-amber-300 text-[8px] sm:text-[9px] font-extrabold text-amber-200 shadow z-10 leading-none">
                      SLOT #{deployIdx + 1}
                    </span>
                  )}

                  {/* Rarity 0 / 000 */}
                  <div className="absolute bottom-1 left-1.5 flex items-center gap-0.5 z-10">
                    {Array.from({ length: eqIdentity.rarity }).map((_, idx) => (
                      <span
                        key={idx}
                        className="w-2.5 h-3.5 rounded-full border border-amber-200 bg-amber-400 inline-block shadow"
                      />
                    ))}
                  </div>

                  <span className="absolute bottom-1 right-1.5 text-[9px] sm:text-[10px] font-mono-num font-bold text-amber-200 bg-black/85 px-1 rounded z-10">
                    Lv.{lv} • UT{ut}
                  </span>
                </div>

                {/* Bottom Name & Deploy Toggle */}
                <div className="p-2 bg-stone-950 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-xs font-bold text-white truncate">
                      {sinner.name}
                    </span>
                    <span className="text-[10px] font-mono-num text-purple-300 shrink-0">
                      {save.egoshards[sinner.id] || 0} Shards
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300/90 truncate">{eqIdentity.title}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDeploy(sinner.id);
                    }}
                    className={`mt-1 w-full py-1 rounded text-[10px] font-extrabold tracking-wider border transition cursor-pointer ${
                      deployIdx !== -1
                        ? 'bg-red-900/80 border-red-400 text-amber-200 hover:bg-red-800'
                        : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white hover:border-amber-400'
                    }`}
                  >
                    {deployIdx !== -1 ? `DEPLOYED (#${deployIdx + 1})` : 'DEPLOY TO SQUAD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: IDENTITY & E.G.O WORKSHOP */}
      <div
        className={`limbus-panel rounded-xl p-3.5 sm:p-5 flex flex-col min-h-0 flex-1 overflow-hidden ${
          mobileTab === 'workshop' ? 'flex w-full' : 'hidden lg:flex'
        }`}
      >
        {/* Top Sinner Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-3 mb-4">
          <div className="flex items-center gap-3.5">
            <img
              src={`/assets/sinners/emblem_${selectedSinner.id}.webp`}
              alt=""
              className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bebas text-2xl text-amber-400">
                  SINNER #{selectedSinner.numberStr}
                </span>
                <h2 className="font-display text-2xl font-black text-white">
                  {selectedSinner.name}
                </h2>
                <span className="text-xs text-stone-400">({selectedSinner.koreanName})</span>
              </div>
              <p className="text-xs italic text-amber-200/80">“{selectedSinner.motto}”</p>
            </div>
          </div>

          {/* Tab Switcher: Identities vs E.G.O */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                setActiveTab('identities');
              }}
              className={`px-4 py-2 rounded-lg font-display font-bold text-xs tracking-wider border cursor-pointer transition ${
                activeTab === 'identities'
                  ? 'bg-red-900 border-amber-400 text-amber-200 shadow-lg'
                  : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
              }`}
            >
              IDENTITIES ({sinnerIdentities.length})
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                setActiveTab('ego');
              }}
              className={`px-4 py-2 rounded-lg font-display font-bold text-xs tracking-wider border cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === 'ego'
                  ? 'bg-red-900 border-amber-400 text-amber-200 shadow-lg'
                  : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              E.G.O LOADOUT ({sinnerEgos.length})
            </button>
          </div>
        </div>

        {activeTab === 'identities' ? (
          <div className="flex-1 flex flex-col overflow-y-auto pr-1 space-y-4 min-h-0 touch-scroll pb-6">
            {/* Identity Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {sinnerIdentities.map((idItem) => {
                const unlocked = save.unlockedIdentityIds.includes(idItem.id);
                const equipped = equippedIdentityId === idItem.id;
                const inspected = inspectedIdentity.id === idItem.id;
                const lv = save.identityLevels[idItem.id] || 1;
                const ut = save.identityUpties[idItem.id] || 1;

                return (
                  <div
                    key={idItem.id}
                    onClick={() => {
                      soundManager.playSfx('ui_click');
                      setInspectedIdentityId(idItem.id);
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3.5 cursor-pointer transition ${
                      inspected
                        ? 'bg-amber-950/35 border-amber-400 ring-1 ring-amber-300'
                        : 'bg-black/60 border-stone-800 hover:border-stone-600'
                    }`}
                  >
                    <div className="relative w-16 h-20 rounded-lg bg-stone-950 border border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={idItem.portraitUrl}
                        alt={idItem.name}
                        className={`h-full w-auto object-contain ${!unlocked ? 'grayscale opacity-50' : ''}`}
                      />
                      {!unlocked && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400 text-[10px] font-extrabold text-amber-300">
                          {'0'.repeat(idItem.rarity)}
                        </span>
                        <span className="font-display font-bold text-sm text-white truncate">
                          {idItem.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">{idItem.world}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-mono-num">
                        <span className="text-amber-300">Lv.{lv}/50</span>
                        <span className="text-sky-300">Uptie {ut}/4</span>
                      </div>
                    </div>

                    <div>
                      {unlocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipIdentity(idItem.id);
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-extrabold border cursor-pointer ${
                            equipped
                              ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200'
                              : 'bg-amber-500 hover:bg-amber-400 border-amber-200 text-black'
                          }`}
                        >
                          {equipped ? 'EQUIPPED' : 'EQUIP'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-red-400 uppercase px-2 py-1 rounded bg-red-950/60 border border-red-700/50">
                          Locked (Extract)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inspected Identity Stats, Live Multi-Pose Sprite Preview, Level Up & Uptie Controls */}
            <div className="bg-black/60 p-4 rounded-xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Interactive Live Combat Pose Stage */}
                <div
                  onClick={() => triggerSkillPoseCombo(3)}
                  title="Click to test Skill 3 Multi-Pose Slash Combo!"
                  className="relative w-28 h-28 bg-gradient-to-b from-stone-900 via-red-950/40 to-black rounded-xl border border-amber-400/60 flex items-center justify-center overflow-hidden cursor-pointer group shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.9)]"
                >
                  {slashVfxId && (
                    <img
                      src={`/assets/steam/vfx/slash_${slashVfxId}.webp`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none animate-ping"
                      style={{ animationDuration: '280ms' }}
                    />
                  )}
                  <img
                    key={previewPose}
                    src={`/assets/steam/chars/sinner_${selectedSinner.id}/${previewPose}.webp`}
                    alt={inspectedIdentity.name}
                    className="h-24 w-auto object-contain z-10 transition-transform duration-150 group-hover:scale-110 drop-shadow-[0_6px_12px_rgba(0,0,0,0.95)]"
                  />
                  <span className="absolute bottom-0.5 inset-x-1 text-center bg-black/85 text-[9px] font-mono-num font-bold text-amber-300 uppercase rounded">
                    POSE: {previewPose}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-amber-200">
                      {inspectedIdentity.name}
                    </h3>
                    {inspectedIdentity.isNegativeCoin && (
                      <span className="px-2 py-0.5 rounded bg-red-900/90 border border-red-400 text-[10px] font-bold text-red-200">
                        MINUS COIN ID
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-stone-300 mt-1 font-mono-num">
                    <span>
                      Max HP:{' '}
                      <strong className="text-emerald-400">
                        {Math.round(inspectedIdentity.hpBase + currentLevel * 2.8 + currentUptie * 12)}
                      </strong>
                    </span>
                    <span>
                      Speed:{' '}
                      <strong className="text-amber-300">
                        {inspectedIdentity.speedMin} - {inspectedIdentity.speedMax}
                      </strong>
                    </span>
                    <span>
                      Slash: <strong>×{inspectedIdentity.resistances.slash}</strong> | Pierce:{' '}
                      <strong>×{inspectedIdentity.resistances.pierce}</strong> | Blunt:{' '}
                      <strong>×{inspectedIdentity.resistances.blunt}</strong>
                    </span>
                  </div>
                  {/* Pose Tester Mini Buttons */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {(['idle', 'move', 'guard', 'dmg'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          soundManager.playSfx('ui_click');
                          setPreviewPose(p);
                          setSlashVfxId(null);
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono-num font-bold uppercase border cursor-pointer ${
                          previewPose === p
                            ? 'bg-amber-400 text-black border-amber-200'
                            : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {([1, 2, 3] as const).map((slot) => (
                      <button
                        key={slot}
                        onClick={() => triggerSkillPoseCombo(slot)}
                        className="px-2 py-0.5 rounded text-[9px] font-mono-num font-extrabold uppercase bg-red-900/80 hover:bg-red-800 text-amber-200 border border-amber-400/60 cursor-pointer"
                      >
                        TEST S{slot} SLASH
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isIdentityUnlocked && (
                <div className="flex items-center gap-2.5">
                  <button
                    disabled={currentLevel >= 50 || save.expTickets < 1}
                    onClick={handleLevelUp}
                    className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    LEVEL UP (+5 Lv / 1 Ticket)
                  </button>
                  <button
                    disabled={currentUptie >= 4 || save.thread < 20}
                    onClick={handleUptie}
                    className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Star className="w-4 h-4" />
                    UPTIE {currentUptie < 4 ? `TIER ${currentUptie + 1} (20 Thread)` : 'MAX (IV)'}
                  </button>
                </div>
              )}
            </div>

            {/* 3 Offensive Skills + Defense Skill + Combat Passive */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                SKILL DECK (3× Skill 1 • 2× Skill 2 • 1× Skill 3)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {inspectedIdentity.skills.map((sk) => {
                  const sinMeta = SIN_INFO[sk.sin];
                  return (
                    <div
                      key={sk.id}
                      onClick={() => triggerSkillPoseCombo(sk.slot)}
                      title={`Click to preview Skill ${sk.slot} Multi-Pose Slash Animation!`}
                      className="p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer hover:brightness-110 transition"
                      style={{
                        backgroundColor: sinMeta.bgHex,
                        borderColor: sinMeta.borderHex,
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono-num font-bold text-amber-300">
                            SKILL {sk.slot} ({sk.slot === 1 ? '×3' : sk.slot === 2 ? '×2' : '×1'}) • CLICK TO ANIMATE
                          </span>
                          <div className="flex items-center gap-1">
                            <img src={sinMeta.icon} alt="" className="w-4 h-4" />
                            <img src={ATTACK_TYPE_INFO[sk.attackType].icon} alt="" className="w-4 h-4" />
                          </div>
                        </div>
                        <h4 className="font-display font-bold text-sm text-white">{sk.name}</h4>
                        <div className="flex items-center justify-between mt-2 bg-black/50 px-2.5 py-1 rounded">
                          <span className="font-mono-num text-xs font-bold text-amber-300">
                            Base {sk.basePower} | Coin {sk.coinPower >= 0 ? `+${sk.coinPower}` : sk.coinPower}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: sk.coins }).map((_, idx) => (
                              <img
                                key={idx}
                                src={
                                  sk.slot === 3
                                    ? '/assets/steam/ui/SuperCoin.webp'
                                    : '/assets/steam/ui/BattleUI_NewCoin_0.webp'
                                }
                                alt="c"
                                className="w-4 h-4 object-contain"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {sk.effects.map((ef, i) => (
                            <p key={i} className="text-[11px] text-stone-200 leading-snug">
                              • {ef.description}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Defense & Passive Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-black/60 border border-stone-800 flex items-center gap-3">
                  <img
                    src={DEFENSE_TYPE_INFO[inspectedIdentity.defenseSkill.type].icon}
                    alt=""
                    className="w-9 h-9 object-contain"
                  />
                  <div>
                    <div className="text-xs font-bold text-sky-300">
                      Defense Skill: {inspectedIdentity.defenseSkill.name} (
                      {DEFENSE_TYPE_INFO[inspectedIdentity.defenseSkill.type].viName})
                    </div>
                    <div className="text-[11px] text-stone-300 font-mono-num">
                      Base {inspectedIdentity.defenseSkill.basePower} +{inspectedIdentity.defenseSkill.coinPower} •{' '}
                      {inspectedIdentity.defenseSkill.effectText}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/60 border border-stone-800 flex items-center gap-3">
                  <img
                    src={SIN_INFO[inspectedIdentity.passiveSin].icon}
                    alt=""
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      Passive: {inspectedIdentity.passiveName} ({inspectedIdentity.passiveReqCount}×{' '}
                      {SIN_INFO[inspectedIdentity.passiveSin].name})
                    </div>
                    <div className="text-[11px] text-stone-300">{inspectedIdentity.passiveDesc}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* E.G.O LOADOUT TAB */
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 touch-scroll pb-6">
            {sinnerEgos.map((ego) => {
              const unlocked = save.unlockedEgoIds.includes(ego.id);
              const equippedForRisk =
                save.equippedEgosBySinner[selectedSinner.id]?.[ego.riskLevel] === ego.id;
              const riskColor = RISK_LEVEL_COLOR[ego.riskLevel];

              return (
                <div
                  key={ego.id}
                  className="p-4 rounded-xl bg-black/65 border border-amber-500/40 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-extrabold border"
                        style={{
                          color: riskColor.text,
                          backgroundColor: riskColor.bg,
                          borderColor: riskColor.border,
                        }}
                      >
                        {ego.riskLevel}
                      </span>
                      <img src={SIN_INFO[ego.sin].icon} alt="" className="w-5 h-5" />
                      <img src={ATTACK_TYPE_INFO[ego.attackType].icon} alt="" className="w-5 h-5" />
                      <h3 className="font-display text-lg font-bold text-amber-200">{ego.name}</h3>
                      <span className="text-xs text-stone-400">({ego.abnormalityName})</span>
                    </div>

                    <p className="text-xs italic text-amber-100/90 mt-1.5">“{ego.quote}”</p>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono-num">
                      <span className="text-amber-300 font-bold">
                        Power: {ego.basePower} +{ego.coinPower} (AOE Weight {ego.attackWeight})
                      </span>
                      <span className="text-sky-300">Sanity Cost: -{ego.spCost} SP</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">Sin Cost:</span>
                        {Object.entries(ego.sinCost).map(([s, c]) => (
                          <span
                            key={s}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700"
                          >
                            <img src={SIN_INFO[s as SinAffinity].icon} alt="" className="w-3.5 h-3.5" />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-stone-300 mt-1.5">
                      {ego.effects.map((e) => e.description).join(' • ')}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => soundManager.playEgoVoice(selectedSinner.id)}
                      className="px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Voice Preview
                    </button>

                    {unlocked ? (
                      <button
                        onClick={() => handleToggleEgoEquip(ego)}
                        className={`px-4 py-2 rounded font-extrabold text-xs flex items-center gap-1.5 cursor-pointer ${
                          equippedForRisk
                            ? 'bg-emerald-900/80 border border-emerald-400 text-emerald-200'
                            : 'bg-amber-500 hover:bg-amber-400 text-black'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {equippedForRisk ? 'EQUIPPED' : 'EQUIP E.G.O'}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded bg-red-950/70 border border-red-700/50 text-xs font-bold text-red-300">
                        Locked (Dispensary / Extract)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
