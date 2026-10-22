// Hybrid Sound Engine: Official Limbus Company & Mili OST + Real Combat SFX + WebAudio Synthesis

export type SfxKey =
  | 'ui_click'
  | 'ui_hover'
  | 'ruina_snap'
  | 'ruina_death'
  | 'dante_tick'
  | 'coin_spin'
  | 'coin_heads'
  | 'coin_tails'
  | 'coin_break'
  | 'clash_clang'
  | 'clash_win'
  | 'hit_slash'
  | 'hit_pierce'
  | 'hit_blunt'
  | 'hit_crit'
  | 'stagger'
  | 'tremor_burst'
  | 'ego_activate'
  | 'gacha_chain'
  | 'gacha_lever_charge'
  | 'gacha_door_slam'
  | 'gacha_mirror_drop'
  | 'gacha_glass_shatter'
  | 'gacha_fakeout'
  | 'gacha_000'
  | 'vo_danteh'
  | 'vo_don'
  | 'vo_wild_hunt'
  | 'vo_ishmael'
  | 'heal';

export type BgmKey =
  | 'title'
  | 'lobby'
  | 'team'
  | 'extract'
  | 'story'
  | 'battle'
  | 'battle_middle'
  | 'boss_kromer'
  | 'boss_dongbaek'
  | 'boss_ahab'
  | 'boss_violet'
  | 'boss_hero'
  | 'victory'
  | 'none';

export interface BgmTrackMeta {
  key: Exclude<BgmKey, 'none'>;
  title: string;
  artist: string;
  tag: string;
  src: string;
}

export const BGM_TRACKS: BgmTrackMeta[] = [
  {
    key: 'title',
    title: 'In Hell We Live, Lament',
    artist: 'Mili feat. KIHOW',
    tag: 'Opening Theme',
    src: '/assets/audio/bgm/in_hell_we_live_lament.mp3',
  },
  {
    key: 'lobby',
    title: 'Mephistopheles Window',
    artist: 'Studio EIM',
    tag: 'Main Lobby',
    src: '/assets/audio/bgm/lobby_main.mp3',
  },
  {
    key: 'team',
    title: 'Corridor of the Mirror',
    artist: 'Studio EIM',
    tag: 'Sinners & Mirror Dungeon',
    src: '/assets/audio/bgm/dungeon_prep.mp3',
  },
  {
    key: 'extract',
    title: 'Mirror World Extraction',
    artist: 'Studio EIM',
    tag: 'Gacha Extraction',
    src: '/assets/audio/bgm/extraction_gacha.mp3',
  },
  {
    key: 'story',
    title: 'Aboard Mephistopheles',
    artist: 'Studio EIM',
    tag: 'Story Cutscene',
    src: '/assets/audio/bgm/story_mephistopheles.mp3',
  },
  {
    key: 'battle',
    title: 'Inquisitor Suppression (Canto III C2)',
    artist: 'Studio EIM',
    tag: 'Combat Theme',
    src: '/assets/audio/bgm/battle_canto3.mp3',
  },
  {
    key: 'battle_middle',
    title: 'Vengeance of The Middle (Ricardo)',
    artist: 'Studio EIM',
    tag: 'Canto V Boss Theme',
    src: '/assets/audio/bgm/battle_ricardo_middle.mp3',
  },
  {
    key: 'boss_kromer',
    title: 'Between Two Worlds (Realm of Darkness)',
    artist: 'Mili',
    tag: 'Canto III Boss (Kromer)',
    src: '/assets/audio/bgm/boss_between_two_worlds.mp3',
  },
  {
    key: 'boss_dongbaek',
    title: 'Fly, My Wings',
    artist: 'Mili',
    tag: 'Canto IV Boss (Dongbaek)',
    src: '/assets/audio/bgm/boss_fly_my_wings.mp3',
  },
  {
    key: 'boss_ahab',
    title: 'Compass',
    artist: 'Mili',
    tag: 'Canto V Boss (Captain Ahab)',
    src: '/assets/audio/bgm/boss_compass.mp3',
  },
  {
    key: 'boss_violet',
    title: 'Through Patches of Violet',
    artist: 'Mili',
    tag: 'Canto VI Boss (Erlking)',
    src: '/assets/audio/bgm/boss_patches_of_violet.mp3',
  },
  {
    key: 'boss_hero',
    title: 'Hero',
    artist: 'Mili',
    tag: 'Canto VII Boss (La Manchaland)',
    src: '/assets/audio/bgm/boss_hero.mp3',
  },
  {
    key: 'victory',
    title: 'Suppression Complete',
    artist: 'Studio EIM',
    tag: 'Victory Theme',
    src: '/assets/audio/bgm/victory_theme.mp3',
  },
];

const BGM_FILE_MAP: Record<Exclude<BgmKey, 'none'>, string> = Object.fromEntries(
  BGM_TRACKS.map((t) => [t.key, t.src])
) as Record<Exclude<BgmKey, 'none'>, string>;

const AUDIO_FILE_MAP: Partial<Record<SfxKey, string>> = {
  ui_click: '/assets/audio/ui_select.mp3',
  ui_hover: '/assets/audio/ui_hover.mp3',
  ruina_snap: '/assets/audio/ruina_snap.mp3',
  ruina_death: '/assets/audio/ruina_death.mp3',
  coin_spin: '/assets/audio/coin_flip.mp3',
  coin_heads: '/assets/audio/coin_ding.mp3',
  coin_tails: '/assets/audio/coin_full.mp3',
  clash_win: '/assets/audio/clash_win.mp3',
  hit_pierce: '/assets/audio/solemn_lament.mp3',
  stagger: '/assets/audio/stagger.mp3',
  tremor_burst: '/assets/audio/tremor_burst.mp3',
  ego_activate: '/assets/audio/distortion_bell.mp3',
  vo_danteh: '/assets/audio/vo_danteh.mp3',
  vo_don: '/assets/audio/vo_don_limbus.mp3',
  vo_wild_hunt: '/assets/audio/vo_wild_hunt.mp3',
  vo_ishmael: '/assets/audio/vo_ishmael_oarsmen.mp3',
};

const PARRY_CLIPS = [
  '/assets/audio/parry_1.mp3',
  '/assets/audio/parry_2.mp3',
  '/assets/audio/parry_3.mp3',
];

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private sfxCache: Map<string, HTMLAudioElement> = new Map();
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgmKey: BgmKey = 'none';
  private contextBgmKey: BgmKey = 'lobby';
  private jukeboxOverrideKey: BgmKey | 'auto' = 'auto';
  private listeners: Set<() => void> = new Set();
  private parryIndex = 0;
  private unlockBound = false;

  public sfxMuted = false;
  public bgmMuted = false;
  private sfxVolume = 0.72;
  private bgmVolume = 0.48;

  constructor() {
    if (typeof window !== 'undefined') {
      this.bindAutoUnlock();
    }
  }

  private bindAutoUnlock() {
    if (this.unlockBound || typeof window === 'undefined') return;
    this.unlockBound = true;
    const unlock = () => {
      this.resumeBgmIfNeeded();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getActiveTrackMeta(): BgmTrackMeta | null {
    if (this.currentBgmKey === 'none') return null;
    return BGM_TRACKS.find((t) => t.key === this.currentBgmKey) || null;
  }

  public getJukeboxOverride(): BgmKey | 'auto' {
    return this.jukeboxOverrideKey;
  }

  public setJukeboxOverride(mode: BgmKey | 'auto') {
    this.jukeboxOverrideKey = mode;
    const target = mode === 'auto' ? this.contextBgmKey : mode;
    this.startBgmInternal(target, true);
    this.notify();
  }

  public nextJukeboxTrack() {
    const playable = BGM_TRACKS.filter((t) => t.key !== 'victory');
    const currIdx = playable.findIndex((t) => t.key === this.currentBgmKey);
    const nextTrack = playable[(currIdx + 1) % playable.length];
    this.setJukeboxOverride(nextTrack.key);
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.min(1, Math.max(0, vol));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
    this.notify();
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public preloadAll() {
    if (typeof window === 'undefined') return;
    [...Object.values(AUDIO_FILE_MAP), ...PARRY_CLIPS].forEach((url) => {
      if (url && !this.sfxCache.has(url)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sfxCache.set(url, audio);
      }
    });
  }

  public setMuted(bgmMuted: boolean, sfxMuted: boolean) {
    this.bgmMuted = bgmMuted;
    this.sfxMuted = sfxMuted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = bgmMuted;
      if (!bgmMuted && this.bgmAudio.paused) {
        this.bgmAudio.play().catch(() => {});
      }
    }
    this.notify();
  }

  public playBgm(key: BgmKey) {
    if (typeof window === 'undefined') return;
    this.contextBgmKey = key;
    const effectiveKey = this.jukeboxOverrideKey === 'auto' ? key : this.jukeboxOverrideKey;
    this.startBgmInternal(effectiveKey, false);
  }

  private startBgmInternal(key: BgmKey, forceRestart: boolean) {
    if (typeof window === 'undefined') return;

    // Avoid restarting the same track if it is already loaded/playing
    if (!forceRestart && this.currentBgmKey === key && this.bgmAudio) {
      this.resumeBgmIfNeeded();
      return;
    }

    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.src = '';
      } catch {
        // Ignore cleanup errors
      }
      this.bgmAudio = null;
    }

    this.currentBgmKey = key;
    if (key === 'none') {
      this.notify();
      return;
    }

    const src = BGM_FILE_MAP[key];
    if (!src) return;

    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = this.bgmVolume;
      audio.muted = this.bgmMuted;
      this.bgmAudio = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Will auto-resume on first pointerdown/keydown via bindAutoUnlock
        });
      }
      this.notify();
    } catch {
      // Ignore audio initialization errors
    }
  }

  public resumeBgmIfNeeded() {
    if (this.bgmAudio && this.bgmAudio.paused && !this.bgmMuted) {
      this.bgmAudio.play().catch(() => {});
    }
  }

  public playEgoVoice(sinnerId: number) {
    this.resumeBgmIfNeeded();
    if (this.sfxMuted) return;
    const clamped = Math.min(12, Math.max(1, sinnerId));
    this.playAudioFile(`/assets/audio/ego/ego_sinner_${clamped}.wav`, 0.95, 1.0);
  }

  private playAudioFile(url: string, volumeScale = 1.0, playbackRate = 1.0): boolean {
    try {
      const clone = new Audio(url);
      clone.volume = Math.min(1, Math.max(0, this.sfxVolume * volumeScale));
      clone.playbackRate = playbackRate;
      clone.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  public playSfx(key: SfxKey) {
    this.resumeBgmIfNeeded();
    if (this.sfxMuted) return;

    if (key === 'clash_clang') {
      const clip = PARRY_CLIPS[this.parryIndex % PARRY_CLIPS.length];
      this.parryIndex++;
      this.playAudioFile(clip, 0.85, 0.96 + Math.random() * 0.1);
    } else {
      const fileUrl = AUDIO_FILE_MAP[key];
      if (fileUrl) {
        const rate = key === 'coin_heads' ? 1.06 : key === 'coin_tails' ? 0.82 : 1.0;
        const vol =
          key === 'stagger' || key === 'ego_activate' || key === 'tremor_burst'
            ? 0.92
            : key === 'clash_win' || key === 'ruina_snap'
            ? 0.85
            : key === 'ui_hover'
            ? 0.45
            : 0.72;
        this.playAudioFile(fileUrl, vol, rate);
      }
    }

    // Layer procedural WebAudio synthesis for crisp tactile punch
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (key) {
      case 'ui_hover': {
        this.synthTone(ctx, now, 680, 920, 0.03, 'sine', 0.06);
        break;
      }
      case 'ui_click': {
        this.synthTone(ctx, now, 520, 260, 0.05, 'triangle', 0.12);
        break;
      }
      case 'dante_tick': {
        this.synthTone(ctx, now, 1200, 380, 0.07, 'sawtooth', 0.22);
        this.synthTone(ctx, now + 0.09, 980, 310, 0.08, 'triangle', 0.25);
        break;
      }
      case 'coin_spin': {
        this.synthTone(ctx, now, 1850, 2480, 0.08, 'sine', 0.16);
        break;
      }
      case 'coin_heads': {
        this.synthTone(ctx, now, 1567.98, 2093.0, 0.16, 'sine', 0.22);
        this.synthTone(ctx, now + 0.03, 2637.02, 3135.96, 0.2, 'triangle', 0.16);
        break;
      }
      case 'coin_tails': {
        this.synthTone(ctx, now, 420, 195, 0.16, 'sawtooth', 0.2);
        break;
      }
      case 'coin_break': {
        this.synthNoise(ctx, now, 0.18, 1900, 0.35);
        this.synthTone(ctx, now, 980, 180, 0.19, 'sawtooth', 0.3);
        break;
      }
      case 'clash_clang': {
        this.synthNoise(ctx, now, 0.12, 2800, 0.24);
        this.synthTone(ctx, now, 1420, 620, 0.13, 'square', 0.18);
        break;
      }
      case 'clash_win': {
        this.synthNoise(ctx, now, 0.2, 3200, 0.28);
        this.synthTone(ctx, now, 880, 1760, 0.22, 'sawtooth', 0.22);
        break;
      }
      case 'hit_slash': {
        this.synthNoise(ctx, now, 0.16, 2400, 0.38);
        this.synthTone(ctx, now, 920, 140, 0.16, 'sawtooth', 0.32);
        break;
      }
      case 'hit_pierce': {
        this.synthNoise(ctx, now, 0.12, 3600, 0.32);
        this.synthTone(ctx, now, 1650, 220, 0.14, 'square', 0.25);
        break;
      }
      case 'hit_blunt': {
        this.synthNoise(ctx, now, 0.2, 650, 0.45);
        this.synthTone(ctx, now, 190, 42, 0.22, 'sine', 0.48);
        break;
      }
      case 'hit_crit': {
        this.synthNoise(ctx, now, 0.24, 2900, 0.42);
        this.synthTone(ctx, now, 587.33, 1174.66, 0.24, 'sawtooth', 0.32);
        this.synthTone(ctx, now + 0.04, 1760, 880, 0.2, 'triangle', 0.28);
        break;
      }
      case 'stagger': {
        this.synthNoise(ctx, now, 0.35, 1800, 0.38);
        this.synthTone(ctx, now, 740, 110, 0.38, 'sawtooth', 0.3);
        break;
      }
      case 'tremor_burst': {
        this.synthTone(ctx, now, 150, 35, 0.32, 'sawtooth', 0.38);
        break;
      }
      case 'ego_activate': {
        this.synthTone(ctx, now, 220, 880, 0.5, 'sawtooth', 0.25);
        break;
      }
      case 'gacha_chain': {
        for (let i = 0; i < 6; i++) {
          this.synthNoise(ctx, now + i * 0.065, 0.055, 2600, 0.28);
          this.synthTone(ctx, now + i * 0.065, 680 + i * 115, 390, 0.06, 'square', 0.2);
        }
        break;
      }
      case 'gacha_lever_charge': {
        this.synthTone(ctx, now, 110, 440, 0.55, 'sawtooth', 0.28);
        this.synthTone(ctx, now, 220, 880, 0.55, 'triangle', 0.22);
        for (let i = 0; i < 8; i++) {
          this.synthNoise(ctx, now + i * 0.065, 0.04, 3000 + i * 200, 0.22);
        }
        break;
      }
      case 'gacha_door_slam': {
        this.playAudioFile('/assets/audio/tremor_burst.mp3', 0.85, 0.9);
        this.synthTone(ctx, now, 140, 28, 0.48, 'sine', 0.55);
        this.synthNoise(ctx, now, 0.38, 800, 0.45);
        break;
      }
      case 'gacha_mirror_drop': {
        this.playAudioFile('/assets/audio/coin_ding.mp3', 0.55, 1.15);
        this.synthTone(ctx, now, 1100, 520, 0.08, 'triangle', 0.2);
        break;
      }
      case 'gacha_glass_shatter': {
        this.playAudioFile('/assets/audio/stagger.mp3', 0.78, 1.12);
        this.synthNoise(ctx, now, 0.26, 3800, 0.4);
        this.synthTone(ctx, now, 1760, 880, 0.22, 'sawtooth', 0.28);
        break;
      }
      case 'gacha_fakeout': {
        this.playAudioFile('/assets/audio/distortion_bell.mp3', 0.85, 1.08);
        this.synthTone(ctx, now, 180, 1480, 0.45, 'sawtooth', 0.38);
        break;
      }
      case 'gacha_000': {
        this.playAudioFile('/assets/audio/clash_win.mp3', 0.8, 1.04);
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          this.synthTone(ctx, now + idx * 0.06, freq, freq * 1.02, 0.38, 'triangle', 0.26);
        });
        break;
      }
      case 'heal': {
        this.synthTone(ctx, now, 523.25, 783.99, 0.22, 'sine', 0.22);
        this.synthTone(ctx, now + 0.08, 659.25, 1046.5, 0.28, 'triangle', 0.2);
        break;
      }
      default:
        break;
    }
  }

  private synthTone(
    ctx: AudioContext,
    startTime: number,
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    gainVal: number
  ) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

      gain.gain.setValueAtTime(gainVal * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Ignore WebAudio scheduling exceptions
    }
  }

  private synthNoise(
    ctx: AudioContext,
    startTime: number,
    duration: number,
    filterFreq: number,
    gainVal: number
  ) {
    try {
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, startTime);
      filter.Q.setValueAtTime(1.4, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + duration);
    } catch {
      // Ignore WebAudio scheduling exceptions
    }
  }
}

export const soundManager = new SoundManagerImpl();
