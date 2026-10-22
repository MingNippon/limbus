import React, { useEffect, useState } from 'react';
import { StoryCutsceneLine } from '../types/game';
import { soundManager, SfxKey } from '../audio/SoundManager';
import { FastForward, ChevronRight, Clock } from 'lucide-react';

interface StoryCutsceneModalProps {
  title: string;
  backgroundUrl: string;
  lines: StoryCutsceneLine[];
  onComplete: () => void;
}

export const StoryCutsceneModal: React.FC<StoryCutsceneModalProps> = ({
  title,
  backgroundUrl,
  lines,
  onComplete,
}) => {
  const [index, setIndex] = useState(0);
  const current = lines[index];

  useEffect(() => {
    if (!current) {
      onComplete();
      return;
    }
    if (current.sfx) {
      soundManager.playSfx(current.sfx as SfxKey);
    } else {
      soundManager.playSfx('ui_hover');
    }
  }, [index, current, onComplete]);

  if (!current) return null;

  const handleNext = () => {
    soundManager.playSfx('ui_click');
    if (index + 1 < lines.length) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      onClick={handleNext}
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden cursor-pointer select-none ${
        current.bgEffect === 'shake' ? 'animate-heavy-shake' : ''
      }`}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
        style={{ backgroundImage: `url('${backgroundUrl}')`, filter: 'brightness(0.55) contrast(1.15)' }}
      />
      {current.bgEffect === 'red_flash' && (
        <div className="absolute inset-0 bg-red-900/35 animate-pulse pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/80 pointer-events-none" />

      {/* Top Theatre Header */}
      <div className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-amber-500/30 bg-black/70">
        <div className="flex items-center gap-3">
          <img src="/assets/ui/red_ribbon.png" alt="" className="h-7 w-auto object-contain" />
          <span className="font-display text-sm font-bold tracking-widest text-amber-200 uppercase">
            STORY LOG // {title}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundManager.playSfx('ui_click');
            onComplete();
          }}
          className="px-4 py-1.5 rounded bg-red-950/90 hover:bg-red-800 border border-amber-400/60 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer"
        >
          <FastForward className="w-3.5 h-3.5" />
          SKIP CUTSCENE
        </button>
      </div>

      {/* Character Standing Sprite */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-16 overflow-hidden">
        {current.portraitUrl ? (
          <div
            className={`transition-all duration-300 flex items-end ${
              current.side === 'left'
                ? 'mr-auto ml-16'
                : current.side === 'right'
                ? 'ml-auto mr-16'
                : 'mx-auto'
            }`}
          >
            <img
              src={current.portraitUrl}
              alt={current.speaker}
              className="max-h-[420px] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]"
            />
          </div>
        ) : (
          <div className="mx-auto mb-16 flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-red-950/90 border-4 border-amber-400 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-pulse">
              <Clock className="w-14 h-14 text-amber-300" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Limbus Dialogue Box */}
      <div className="relative z-20 px-10 pb-8">
        <div className="max-w-5xl mx-auto limbus-panel rounded-xl p-6 border-2 border-amber-500/60 relative shadow-2xl">
          {/* Speaker Nameplate */}
          <div className="flex items-center gap-3 mb-3">
            <div className="px-4 py-1 rounded bg-gradient-to-r from-red-900 to-red-950 border border-amber-400/80 shadow">
              <span className="font-display text-lg font-extrabold text-amber-200 tracking-wide">
                {current.speaker}
              </span>
            </div>
            {current.title && (
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400/80">
                — {current.title}
              </span>
            )}
            <span className="ml-auto text-xs font-mono-num text-stone-400">
              {index + 1} / {lines.length}
            </span>
          </div>

          {/* Dialogue Text */}
          <p className="text-lg text-stone-100 leading-relaxed min-h-[64px] font-medium">
            {current.text}
          </p>

          <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-300 mt-2 animate-pulse">
            <span>CLICK TO CONTINUE</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
