import React, { useState, useEffect } from 'react';
import { CantoStage, PlayerSaveState } from '../types/game';
import { CANTO_STAGES, LUXCAVATION_STAGES } from '../data/stagesAndStory';
import { MirrorDungeonScreen } from './MirrorDungeonScreen';
import { soundManager } from '../audio/SoundManager';
import { Map, Compass, Flame, CheckCircle2, Play, Sparkles, Skull, Award } from 'lucide-react';

interface DriveScreenProps {
  save: PlayerSaveState;
  onUpdateSave: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
  onLaunchStage: (stage: CantoStage, mirrorNodeId?: string) => void;
  initialMode?: 'story' | 'mirror' | 'luxcavation';
  onModeChange?: (mode: 'story' | 'mirror' | 'luxcavation') => void;
}

export const DriveScreen: React.FC<DriveScreenProps> = ({
  save,
  onUpdateSave,
  onLaunchStage,
  initialMode,
  onModeChange,
}) => {
  // If player has an active Mirror Dungeon run, default to mirror mode
  const [mode, setMode] = useState<'story' | 'mirror' | 'luxcavation'>(() => {
    if (initialMode) return initialMode;
    if (save.mirrorRun && save.mirrorRun.floor >= 1) return 'mirror';
    return 'story';
  });

  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const switchMode = (next: 'story' | 'mirror' | 'luxcavation') => {
    soundManager.playSfx('ui_click');
    setMode(next);
    onModeChange?.(next);
  };

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-5 overflow-hidden">
      {/* Top Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4 shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => switchMode('story')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg font-display font-bold text-xs sm:text-sm tracking-wider border flex items-center gap-1.5 sm:gap-2 cursor-pointer transition ${
              mode === 'story'
                ? 'bg-red-900 border-amber-400 text-amber-200 shadow-lg'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>INFERNO MAIN STORY (CANTOS I–VI)</span>
          </button>

          <button
            onClick={() => switchMode('mirror')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg font-display font-bold text-xs sm:text-sm tracking-wider border flex items-center gap-1.5 sm:gap-2 cursor-pointer transition ${
              mode === 'mirror'
                ? 'bg-purple-900 border-amber-400 text-amber-200 shadow-lg'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>
              MIRROR DUNGEON {save.mirrorRun ? `(TẦNG ${save.mirrorRun.floor})` : ''}
            </span>
          </button>

          <button
            onClick={() => switchMode('luxcavation')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg font-display font-bold text-xs sm:text-sm tracking-wider border flex items-center gap-1.5 sm:gap-2 cursor-pointer transition ${
              mode === 'luxcavation'
                ? 'bg-amber-600 border-amber-200 text-black shadow-lg font-black'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>LUXCAVATION (EXP & THREAD)</span>
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-stone-400 font-mono-num">
          {mode === 'story' ? (
            <>
              Cleared Cantos:{' '}
              <strong className="text-amber-300">{save.clearedStageIds.length}</strong> /{' '}
              {CANTO_STAGES.length}
            </>
          ) : mode === 'mirror' ? (
            <>
              Starlight: <strong className="text-purple-300">{save.starlight}</strong>
            </>
          ) : (
            <>
              Thread: <strong className="text-sky-300">{save.thread}</strong> • EXP:{' '}
              <strong className="text-amber-300">{save.expTickets}</strong>
            </>
          )}
        </div>
      </div>

      {/* Mode Content */}
      {mode === 'mirror' ? (
        <div className="flex-1 overflow-hidden">
          <MirrorDungeonScreen
            save={save}
            onUpdateSave={onUpdateSave}
            onStartMirrorBattle={(st, nodeId) => onLaunchStage(st, nodeId)}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto touch-scroll pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start content-start">
            {(mode === 'story' ? CANTO_STAGES : LUXCAVATION_STAGES).map((stage) => {
              const cleared = save.clearedStageIds.includes(stage.id);
              const isLux = mode === 'luxcavation';

              return (
                <div
                  key={stage.id}
                  className="limbus-panel rounded-2xl overflow-hidden flex flex-col border border-amber-500/40 hover:border-amber-300 transition group shadow-xl"
                >
                  {/* Top Artwork Banner */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black shrink-0">
                    <img
                      src={stage.backgroundUrl}
                      alt={stage.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                    {/* Top Badges Row: Never overlaps title */}
                    <div className="absolute top-2.5 inset-x-3 flex items-center justify-between gap-2 z-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded bg-red-950/95 border border-amber-400 font-bebas text-sm sm:text-base text-amber-200 tracking-wider shadow">
                          STAGE {stage.stageCode}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono-num text-amber-300 font-bold border border-amber-500/40 shadow">
                          Rec. Lv.{stage.recommendedLevel}
                        </span>
                        {isLux && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/90 text-black font-extrabold text-[10px] tracking-wider uppercase shadow">
                            DAILY BONUS
                          </span>
                        )}
                      </div>

                      {cleared && (
                        <div className="px-2 py-0.5 rounded bg-emerald-950/95 border border-emerald-400 text-[10px] font-bold text-emerald-300 flex items-center gap-1 shadow">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          CLEARED
                        </div>
                      )}
                    </div>

                    {/* Bottom overlay inside image: Chapter tag only */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black/80 border border-stone-700 text-[10px] font-mono-num text-stone-300 uppercase tracking-widest">
                        {isLux ? 'ABNORMALITY SUPPRESSION' : `CANTO ${stage.cantoNumber || 'I'}`}
                      </span>
                    </div>
                  </div>

                  {/* Clean Dedicated Title Section: Placed OUTSIDE image so text NEVER overlaps */}
                  <div className="p-3.5 sm:p-4 bg-gradient-to-b from-stone-950 to-[#0e0c10] border-t border-amber-500/30 flex flex-col gap-2.5">
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-black text-amber-100 leading-snug line-clamp-1">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">{stage.subtitle}</p>
                    </div>

                    {/* Enemies preview chips */}
                    {stage.enemies && stage.enemies.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-300 font-mono-num bg-black/50 p-1.5 rounded border border-stone-800">
                        <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-stone-400">Targets:</span>
                        <span className="text-amber-200 truncate">
                          {stage.enemies.slice(0, 3).map((e) => e.replace(/_/g, ' ')).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Rewards Summary Bar */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono-num bg-black/70 p-2 rounded-lg border border-stone-800">
                      <div className="truncate">
                        <span className="text-stone-500 block text-[9px]">LUNACY</span>
                        <strong className="text-rose-300">+{stage.rewards.lunacy}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-stone-500 block text-[9px]">EXP</span>
                        <strong className="text-amber-300">+{stage.rewards.expTickets}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-stone-500 block text-[9px]">THREAD</span>
                        <strong className="text-sky-300">+{stage.rewards.thread}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-stone-500 block text-[9px]">SHARDS</span>
                        <strong className="text-purple-300">+{stage.rewards.shards}</strong>
                      </div>
                    </div>

                    {stage.preCutscene && stage.preCutscene.length > 0 && (
                      <div className="text-[11px] text-amber-300/90 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Includes Story Cutscene & Dialogue</span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        soundManager.playSfx('dante_tick');
                        onLaunchStage(stage);
                      }}
                      className="w-full mt-1 py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-amber-600 to-red-800 hover:brightness-110 text-white font-display font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 border border-amber-300 shadow-lg cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current text-amber-200" />
                      ENTER STAGE ({stage.stageCode})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
