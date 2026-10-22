import React, { useState } from 'react';
import { CantoStage, PlayerSaveState } from '../types/game';
import { CANTO_STAGES, LUXCAVATION_STAGES } from '../data/stagesAndStory';
import { MirrorDungeonScreen } from './MirrorDungeonScreen';
import { soundManager } from '../audio/SoundManager';
import { Map, Compass, Flame, CheckCircle2, Play, Sparkles } from 'lucide-react';

interface DriveScreenProps {
  save: PlayerSaveState;
  onUpdateSave: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
  onLaunchStage: (stage: CantoStage, mirrorNodeId?: string) => void;
}

export const DriveScreen: React.FC<DriveScreenProps> = ({
  save,
  onUpdateSave,
  onLaunchStage,
}) => {
  const [mode, setMode] = useState<'story' | 'mirror' | 'luxcavation'>('story');

  return (
    <div className="w-full h-full flex flex-col p-5 overflow-hidden">
      {/* Top Mode Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setMode('story');
            }}
            className={`px-5 py-2.5 rounded-lg font-display font-bold text-sm tracking-wider border flex items-center gap-2 cursor-pointer transition ${
              mode === 'story'
                ? 'bg-red-900 border-amber-400 text-amber-200 shadow-lg'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            INFERNO MAIN STORY (CANTOS I–VI)
          </button>

          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setMode('mirror');
            }}
            className={`px-5 py-2.5 rounded-lg font-display font-bold text-sm tracking-wider border flex items-center gap-2 cursor-pointer transition ${
              mode === 'mirror'
                ? 'bg-purple-900 border-amber-400 text-amber-200 shadow-lg'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            MIRROR DUNGEON {save.mirrorRun?.active ? `(FLOOR ${save.mirrorRun.floor})` : ''}
          </button>

          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setMode('luxcavation');
            }}
            className={`px-5 py-2.5 rounded-lg font-display font-bold text-sm tracking-wider border flex items-center gap-2 cursor-pointer transition ${
              mode === 'luxcavation'
                ? 'bg-amber-600 border-amber-200 text-black shadow-lg'
                : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            LUXCAVATION (EXP & THREAD)
          </button>
        </div>

        <div className="text-xs text-stone-400 font-mono-num">
          Cleared Chapters: <strong className="text-amber-300">{save.clearedStageIds.length}</strong> /{' '}
          {CANTO_STAGES.length}
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {(mode === 'story' ? CANTO_STAGES : LUXCAVATION_STAGES).map((stage) => {
            const cleared = save.clearedStageIds.includes(stage.id);
            return (
              <div
                key={stage.id}
                className="limbus-panel rounded-2xl overflow-hidden flex flex-col justify-between border border-amber-500/40 hover:border-amber-300 transition group"
              >
                {/* Stage Banner */}
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={stage.backgroundUrl}
                    alt={stage.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-red-900/90 border border-amber-400 font-bebas text-base text-amber-200">
                      STAGE {stage.stageCode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono-num text-stone-300 border border-stone-700">
                      Rec. Lv.{stage.recommendedLevel}
                    </span>
                  </div>

                  {cleared && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      CLEARED
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="font-display text-lg font-black text-amber-100 drop-shadow">
                      {stage.title}
                    </h3>
                    <p className="text-xs text-stone-300 truncate">{stage.subtitle}</p>
                  </div>
                </div>

                {/* Stage Rewards & Enter Button */}
                <div className="p-4 flex flex-col gap-3 bg-stone-950/90">
                  <div className="flex items-center justify-between text-xs font-mono-num bg-black/60 px-3 py-2 rounded-lg border border-stone-800">
                    <span className="text-rose-300">+{stage.rewards.lunacy} Lunacy</span>
                    <span className="text-amber-300">+{stage.rewards.expTickets} EXP</span>
                    <span className="text-sky-300">+{stage.rewards.thread} Thread</span>
                    <span className="text-purple-300">+{stage.rewards.shards} Shards</span>
                  </div>

                  {stage.preCutscene.length > 0 && (
                    <div className="text-[11px] text-amber-300/80 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Includes Story Cutscene & Abnormality Boss Event
                    </div>
                  )}

                  <button
                    onClick={() => {
                      soundManager.playSfx('dante_tick');
                      onLaunchStage(stage);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-display font-bold text-sm tracking-wider flex items-center justify-center gap-2 border border-amber-300 shadow-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    ENTER STAGE ({stage.stageCode})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
