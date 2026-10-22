import React, { useState } from 'react';
import { CantoStage, PlayerSaveState } from '../types/game';
import { IDENTITIES, SINNERS } from '../data/sinnersAndIdentities';
import { CANTO_STAGES } from '../data/stagesAndStory';
import { soundManager, SfxKey } from '../audio/SoundManager';
import {
  MessageSquare,
  Volume2,
  Zap,
  Play,
  Compass,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LobbyScreenProps {
  save: PlayerSaveState;
  onUpdateSave: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
  onNavigateTab: (tab: 'window' | 'sinners' | 'drive' | 'extract') => void;
  onQuickStartStage: (stage: CantoStage) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  save,
  onUpdateSave,
  onNavigateTab,
  onQuickStartStage,
}) => {
  const [lineIdx, setLineIdx] = useState(0);

  const lobbySinner =
    SINNERS.find((s) => s.id === save.lobbySinnerId) || SINNERS[2]; // Default Don Quixote or Yi Sang
  const eqIdentityId = save.equippedIdentityBySinner[lobbySinner.id];
  const eqIdentity =
    IDENTITIES.find((i) => i.id === eqIdentityId) ||
    IDENTITIES.find((i) => i.sinnerId === lobbySinner.id)!;

  const nextStoryStage =
    CANTO_STAGES.find((st) => !save.clearedStageIds.includes(st.id)) ||
    CANTO_STAGES[CANTO_STAGES.length - 1];

  const handleCycleSinner = (dir: -1 | 1) => {
    soundManager.playSfx('ui_click');
    const currIdx = SINNERS.findIndex((s) => s.id === lobbySinner.id);
    const nextIdx = (currIdx + dir + SINNERS.length) % SINNERS.length;
    setLineIdx(0);
    onUpdateSave((prev) => ({ ...prev, lobbySinnerId: SINNERS[nextIdx].id }));
  };

  const handleInteractSinner = () => {
    if (lobbySinner.voiceSfxUrl) {
      soundManager.playSfx(lobbySinner.voiceSfxUrl as SfxKey);
    } else {
      soundManager.playEgoVoice(lobbySinner.id);
    }
    setLineIdx((prev) => (prev + 1) % lobbySinner.lobbyLines.length);
  };

  const handleConvertModule = () => {
    if (save.enkephalin < 20) return;
    soundManager.playSfx('heal');
    onUpdateSave((prev) => ({
      ...prev,
      enkephalin: prev.enkephalin - 20,
      enkephalinModules: prev.enkephalinModules + 1,
      expTickets: prev.expTickets + 1,
      thread: prev.thread + 5,
    }));
  };

  return (
    <div className="relative w-full h-full flex items-center justify-between px-8 py-6 overflow-hidden">
      {/* Mephistopheles Interior Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('/assets/backgrounds/mephistopheles_interior.png'), url('/assets/backgrounds/mephistopheles_lobby.jpg')`,
          filter: 'brightness(0.68) contrast(1.12)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/85 pointer-events-none" />

      {/* LEFT / CENTER: INTERACTIVE SINNER SHOWCASE */}
      <div className="relative z-10 flex-1 h-full flex flex-col justify-between max-w-2xl">
        {/* Sinner Header Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCycleSinner(-1)}
            className="p-2 rounded-lg limbus-panel hover:border-amber-400 text-amber-300 cursor-pointer"
            title="Previous Sinner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="limbus-panel px-4 py-2 rounded-xl flex items-center gap-3">
            <img
              src={`/assets/sinners/emblem_${lobbySinner.id}.webp`}
              alt=""
              className="w-10 h-10 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bebas text-lg text-amber-400">
                  SINNER #{lobbySinner.numberStr}
                </span>
                <span className="font-display font-bold text-lg text-white">
                  {lobbySinner.name}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400 text-[10px] font-extrabold text-amber-300">
                  {'0'.repeat(eqIdentity.rarity)}
                </span>
              </div>
              <div className="text-xs text-amber-200/90">{eqIdentity.name}</div>
            </div>
          </div>
          <button
            onClick={() => handleCycleSinner(1)}
            className="p-2 rounded-lg limbus-panel hover:border-amber-400 text-amber-300 cursor-pointer"
            title="Next Sinner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Standing Character Splash / Sprite */}
        <div
          onClick={handleInteractSinner}
          className="relative flex-1 flex items-center justify-center cursor-pointer group my-2"
          title="Click Sinner to speak & play voice line!"
        >
          <img
            src={lobbySinner.vnSpriteUrl || lobbySinner.portraitUrl}
            alt={lobbySinner.name}
            className="max-h-[390px] w-auto object-contain drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)] group-hover:scale-[1.03] transition duration-300"
          />
          <button
            type="button"
            className="absolute bottom-4 right-12 px-3 py-1.5 rounded-full bg-red-950/90 border border-amber-400 text-xs font-bold text-amber-200 flex items-center gap-1.5 shadow-lg"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            Voice / Dialogue
          </button>
        </div>

        {/* Interactive Speech Bubble */}
        <div
          onClick={handleInteractSinner}
          className="limbus-panel p-4 rounded-xl border-l-4 border-l-amber-400 cursor-pointer hover:bg-stone-900/90 transition"
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase mb-1">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {lobbySinner.name} — Aboard Mephistopheles
            </span>
            <span className="text-[10px] text-stone-400">Click to cycle voice line</span>
          </div>
          <p className="text-sm text-stone-100 italic leading-relaxed">
            “{lobbySinner.lobbyLines[lineIdx]}”
          </p>
        </div>
      </div>

      {/* RIGHT: MEPHISTOPHELES COMMAND CONSOLE */}
      <div className="relative z-10 w-[430px] flex flex-col gap-4">
        {/* Next Story Operation Card */}
        <div className="limbus-crimson-panel rounded-2xl p-5 border-2 border-amber-400/80 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-400 text-black font-bebas text-base tracking-wider">
              NEXT OPERATION // {nextStoryStage.stageCode}
            </span>
            <span className="text-xs text-amber-200 font-mono-num">
              Rec. Lv.{nextStoryStage.recommendedLevel}
            </span>
          </div>
          <h3 className="font-display text-2xl font-black text-white">
            {nextStoryStage.title}
          </h3>
          <p className="text-xs text-stone-300 mt-1">{nextStoryStage.subtitle}</p>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                soundManager.playSfx('dante_tick');
                onQuickStartStage(nextStoryStage);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black font-bebas text-2xl tracking-widest flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              DRIVE NOW
            </button>
            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                onNavigateTab('drive');
              }}
              className="px-4 py-3 rounded-xl bg-black/75 hover:bg-stone-900 border border-amber-400/50 text-amber-200 font-bold text-xs cursor-pointer"
            >
              All Stages
            </button>
          </div>
        </div>

        {/* Enkephalin Module Synthesizer */}
        <div className="limbus-panel rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-emerald-300">
                ENKEPHALIN MODULE SYNTHESIS
              </div>
              <div className="text-xs text-stone-400 font-mono-num">
                Enkephalin: {save.enkephalin}/{save.maxEnkephalin} • Modules: {save.enkephalinModules}
              </div>
            </div>
          </div>
          <button
            disabled={save.enkephalin < 20}
            onClick={handleConvertModule}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs cursor-pointer disabled:opacity-40 shrink-0"
          >
            CONVERT (-20 Enk)
          </button>
        </div>

        {/* Active Squad Deployment Strip */}
        <div className="limbus-panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-amber-300">
              ACTIVE DEPLOYMENT SQUAD ({save.deployedSinnerIds.length}/6)
            </span>
            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                onNavigateTab('sinners');
              }}
              className="text-xs text-amber-400 hover:underline cursor-pointer font-bold"
            >
              Edit Team & Uptie →
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {save.deployedSinnerIds.map((sId, idx) => {
              const s = SINNERS.find((x) => x.id === sId)!;
              const eqId = save.equippedIdentityBySinner[sId];
              const idObj = IDENTITIES.find((x) => x.id === eqId);
              return (
                <div
                  key={sId}
                  onClick={() => {
                    soundManager.playSfx('ui_click');
                    onUpdateSave((prev) => ({ ...prev, lobbySinnerId: sId }));
                  }}
                  className="relative rounded-lg overflow-hidden border border-amber-500/50 bg-black cursor-pointer hover:scale-105 transition"
                  title={`#${idx + 1}: ${idObj?.name || s.name}`}
                >
                  <img src={s.portraitUrl} alt={s.name} className="w-full h-16 object-cover object-top" />
                  <div className="bg-black/90 text-center text-[9px] font-mono-num text-amber-300 py-0.5">
                    #{s.numberStr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links to Mirror Dungeon & Extraction */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              onNavigateTab('drive');
            }}
            className="limbus-panel p-3.5 rounded-xl hover:border-amber-400 flex items-center gap-3 text-left cursor-pointer transition"
          >
            <Compass className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <div className="font-display font-bold text-xs text-white">MIRROR DUNGEON</div>
              <div className="text-[10px] text-stone-400">Roguelike & E.G.O Gifts</div>
            </div>
          </button>

          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              onNavigateTab('extract');
            }}
            className="limbus-panel p-3.5 rounded-xl hover:border-amber-400 flex items-center gap-3 text-left cursor-pointer transition"
          >
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="font-display font-bold text-xs text-white">EXTRACT & CRAFT</div>
              <div className="text-[10px] text-stone-400">000 IDs & Dispensary</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
