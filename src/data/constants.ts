import { AttackType, DefenseType, EgoGiftData, RiskLevel, SinAffinity, StatusEffectType } from '../types/game';

export const SIN_INFO: Record<
  SinAffinity,
  {
    name: string;
    viName: string;
    color: string;
    bgHex: string;
    borderHex: string;
    textHex: string;
    icon: string;
  }
> = {
  wrath: {
    name: 'Wrath',
    viName: 'Phẫn Nộ (Wrath)',
    color: '#ef4444',
    bgHex: '#450a0a',
    borderHex: '#dc2626',
    textHex: '#fca5a5',
    icon: '/assets/icons/sins/wrath.png',
  },
  lust: {
    name: 'Lust',
    viName: 'Sắc Dục (Lust)',
    color: '#f97316',
    bgHex: '#431407',
    borderHex: '#ea580c',
    textHex: '#fdba74',
    icon: '/assets/icons/sins/lust.png',
  },
  sloth: {
    name: 'Sloth',
    viName: 'Lười Biếng (Sloth)',
    color: '#eab308',
    bgHex: '#422006',
    borderHex: '#ca8a04',
    textHex: '#fde047',
    icon: '/assets/icons/sins/sloth.png',
  },
  gluttony: {
    name: 'Gluttony',
    viName: 'Phàm Ăn (Gluttony)',
    color: '#22c55e',
    bgHex: '#052e16',
    borderHex: '#16a34a',
    textHex: '#86efac',
    icon: '/assets/icons/sins/gluttony.png',
  },
  gloom: {
    name: 'Gloom',
    viName: 'U Sầu (Gloom)',
    color: '#06b6d4',
    bgHex: '#083344',
    borderHex: '#0891b2',
    textHex: '#67e8f9',
    icon: '/assets/icons/sins/gloom.png',
  },
  pride: {
    name: 'Pride',
    viName: 'Kiêu Ngạo (Pride)',
    color: '#3b82f6',
    bgHex: '#172554',
    borderHex: '#2563eb',
    textHex: '#93c5fd',
    icon: '/assets/icons/sins/pride.png',
  },
  envy: {
    name: 'Envy',
    viName: 'Đố Kỵ (Envy)',
    color: '#a855f7',
    bgHex: '#3b0764',
    borderHex: '#9333ea',
    textHex: '#d8b4fe',
    icon: '/assets/icons/sins/envy.png',
  },
};

export const ALL_SINS: SinAffinity[] = ['wrath', 'lust', 'sloth', 'gluttony', 'gloom', 'pride', 'envy'];

export const ATTACK_TYPE_INFO: Record<AttackType, { name: string; viName: string; icon: string }> = {
  slash: {
    name: 'Slash',
    viName: 'Chém (Slash)',
    icon: '/assets/icons/attack/slash.png',
  },
  pierce: {
    name: 'Pierce',
    viName: 'Đâm (Pierce)',
    icon: '/assets/icons/attack/pierce.png',
  },
  blunt: {
    name: 'Blunt',
    viName: 'Đập (Blunt)',
    icon: '/assets/icons/attack/blunt.png',
  },
};

export const DEFENSE_TYPE_INFO: Record<DefenseType, { name: string; viName: string; icon: string }> = {
  guard: {
    name: 'Guard',
    viName: 'Phòng Thủ (Guard)',
    icon: '/assets/icons/defense/guard.webp',
  },
  evade: {
    name: 'Evade',
    viName: 'Né Tránh (Evade)',
    icon: '/assets/icons/defense/evade.webp',
  },
  counter: {
    name: 'Counter',
    viName: 'Phản Công (Counter)',
    icon: '/assets/icons/defense/counter.webp',
  },
};

export const RISK_LEVEL_COLOR: Record<RiskLevel, { text: string; bg: string; border: string }> = {
  ZAYIN: { text: '#4ade80', bg: '#052e16', border: '#22c55e' },
  TETH: { text: '#38bdf8', bg: '#082f49', border: '#0284c7' },
  HE: { text: '#facc15', bg: '#422006', border: '#eab308' },
  WAW: { text: '#c084fc', bg: '#3b0764', border: '#9333ea' },
  ALEPH: { text: '#f87171', bg: '#450a0a', border: '#ef4444' },
};

export const STATUS_INFO: Record<
  StatusEffectType,
  {
    name: string;
    viName: string;
    icon: string;
    color: string;
    description: string;
  }
> = {
  burn: {
    name: 'Burn',
    viName: 'Thiêu Đốt (Burn)',
    icon: '/assets/icons/status/burn.png',
    color: '#ef4444',
    description: 'Cuối lượt: Gây sát thương chuẩn bằng Potency, sau đó giảm 1 Count.',
  },
  bleed: {
    name: 'Bleed',
    viName: 'Chảy Máu (Bleed)',
    icon: '/assets/icons/status/bleed.png',
    color: '#dc2626',
    description: 'Mỗi khi tung đồng xu tấn công: Nhận sát thương bằng Potency và giảm 1 Count.',
  },
  tremor: {
    name: 'Tremor',
    viName: 'Chấn Động (Tremor)',
    icon: '/assets/icons/status/tremor.png',
    color: '#eab308',
    description: 'Khi bị kích hoạt Tremor Burst: Đẩy ngưỡng Stagger lên bằng Potency và gây sát thương choáng.',
  },
  rupture: {
    name: 'Rupture',
    viName: 'Rách Toạc (Rupture)',
    icon: '/assets/icons/status/rupture.png',
    color: '#22c55e',
    description: 'Khi bị trúng đòn: Nhận thêm sát thương chuẩn bằng Potency và giảm 1 Count.',
  },
  sinking: {
    name: 'Sinking',
    viName: 'Trầm Luân (Sinking)',
    icon: '/assets/icons/status/sinking.png',
    color: '#06b6d4',
    description: 'Khi bị trúng đòn: Mất SP bằng Potency (hoặc nhận sát thương Gloom nếu không có SP).',
  },
  poise: {
    name: 'Poise',
    viName: 'Tĩnh Tâm (Poise)',
    icon: '/assets/icons/status/poise.png',
    color: '#93c5fd',
    description: 'Tăng tỷ lệ Chí Mạng (Crit +5% mỗi Potency). Khi Crit gây ×1.2 sát thương và giảm 1 Count.',
  },
  charge: {
    name: 'Charge',
    viName: 'Tích Điện (Charge)',
    icon: '/assets/icons/status/charge.png',
    color: '#38bdf8',
    description: 'Tài nguyên tích lũy để cường hóa các kỹ năng đặc biệt (như Rip Space, Mind Whip).',
  },
  paralyze: {
    name: 'Paralyze',
    viName: 'Tê Liệt (Paralyze)',
    icon: '/assets/icons/status/paralyze.png',
    color: '#fde047',
    description: 'Cố định giá trị của số đồng xu đầu tiên trong kỹ năng về 0.',
  },
  fragile: {
    name: 'Fragile',
    viName: 'Mong Manh (Fragile)',
    icon: '/assets/icons/status/fragile.webp',
    color: '#fb7185',
    description: 'Nhận thêm +10% sát thương từ mọi đòn đánh cho mỗi tầng Potency trong lượt này.',
  },
  protection: {
    name: 'Protection',
    viName: 'Bảo Hộ (Protection)',
    icon: '/assets/icons/status/protection.webp',
    color: '#60a5fa',
    description: 'Giảm 10% sát thương nhận vào cho mỗi tầng Potency trong lượt này.',
  },
  attack_up: {
    name: 'Attack Power Up',
    viName: 'Tăng Uy Lực (Power Up)',
    icon: '/assets/icons/status/attack_up.webp',
    color: '#f97316',
    description: 'Kỹ năng tấn công được cộng thêm Final Power bằng Potency trong lượt này.',
  },
  attack_down: {
    name: 'Attack Power Down',
    viName: 'Giảm Uy Lực (Power Down)',
    icon: '/assets/icons/status/attack_down.webp',
    color: '#818cf8',
    description: 'Kỹ năng tấn công bị trừ Final Power bằng Potency trong lượt này.',
  },
};

export const EGO_GIFTS: EgoGiftData[] = [
  {
    id: 'bloodflame_sword',
    name: 'Bloodflame Sword',
    tier: 3,
    sin: 'wrath',
    keyword: 'burn',
    iconUrl: '/assets/icons/gifts/bloodflame_sword.png',
    description: 'Khi bắt đầu trận đấu, gây 4 Burn (Count 3) lên mọi kẻ địch. Kỹ năng Wrath được +1 Clash Power.',
    cost: 180,
    combatEffect: {
      bonusClashPower: 1,
      bonusCoinPowerSin: 'wrath',
      startBattleStatusOnEnemies: { type: 'burn', potency: 4, count: 3 },
    },
  },
  {
    id: 'blood_sweat_tears',
    name: 'Blood, Sweat, and Tears',
    tier: 3,
    sin: 'lust',
    keyword: 'bleed',
    iconUrl: '/assets/icons/gifts/blood_sweat_tears.png',
    description: 'Mọi đòn đánh trúng đích gây thêm 2 Bleed (Count 2). Kỹ năng Lust +1 Coin Power.',
    cost: 190,
    combatEffect: {
      bonusCoinPowerSin: 'lust',
      bonusStatusOnHit: { type: 'bleed', potency: 2, count: 2 },
    },
  },
  {
    id: 'bell_of_truth',
    name: 'Bell of Truth',
    tier: 2,
    sin: 'sloth',
    keyword: 'tremor',
    iconUrl: '/assets/icons/gifts/bell_of_truth.png',
    description: 'Khi vào trận, gây 5 Tremor (Count 3) lên toàn bộ kẻ địch và nhận +1 Sloth E.G.O Resource.',
    cost: 150,
    combatEffect: {
      startBattleStatusOnEnemies: { type: 'tremor', potency: 5, count: 3 },
      freeStartingSin: 'sloth',
    },
  },
  {
    id: 'biovenom_vial',
    name: 'Bio-venom Vial',
    tier: 2,
    sin: 'gluttony',
    keyword: 'rupture',
    iconUrl: '/assets/icons/gifts/biovenom_vial.png',
    description: 'Đòn đánh trúng đích gây thêm 2 Rupture (Count 2). Kỹ năng Gluttony +1 Coin Power.',
    cost: 160,
    combatEffect: {
      bonusCoinPowerSin: 'gluttony',
      bonusStatusOnHit: { type: 'rupture', potency: 2, count: 2 },
    },
  },
  {
    id: 'black_sheet_music',
    name: 'Black Sheet Music',
    tier: 3,
    sin: 'gloom',
    keyword: 'sinking',
    iconUrl: '/assets/icons/gifts/black_sheet_music.png',
    description: 'Khi bắt đầu trận đấu, gây 4 Sinking (Count 3) lên toàn bộ kẻ địch. Đòn đánh trúng đích gây thêm 2 Sinking.',
    cost: 185,
    combatEffect: {
      startBattleStatusOnEnemies: { type: 'sinking', potency: 4, count: 3 },
      bonusStatusOnHit: { type: 'sinking', potency: 2, count: 1 },
    },
  },
  {
    id: 'angels_cut',
    name: "Angel's Cut",
    tier: 3,
    sin: 'pride',
    keyword: 'poise',
    iconUrl: '/assets/icons/gifts/angels_cut.png',
    description: 'Khi bắt đầu trận đấu, toàn bộ Sinner nhận 5 Poise (Count 4) và +1 Clash Power.',
    cost: 200,
    combatEffect: {
      bonusClashPower: 1,
      startBattleStatusOnAllies: { type: 'poise', potency: 5, count: 4 },
    },
  },
  {
    id: 'biogenerative_battery',
    name: 'Biogenerative Battery',
    tier: 2,
    sin: 'envy',
    keyword: 'charge',
    iconUrl: '/assets/icons/gifts/biogenerative_battery.png',
    description: 'Khi bắt đầu trận đấu, toàn bộ Sinner nhận 6 Charge Count và +1 Envy Resource.',
    cost: 155,
    combatEffect: {
      startBattleStatusOnAllies: { type: 'charge', potency: 1, count: 6 },
      freeStartingSin: 'envy',
    },
  },
  {
    id: 'blood_red_mane',
    name: 'Blood-red Mane',
    tier: 2,
    sin: 'wrath',
    keyword: 'general',
    iconUrl: '/assets/icons/gifts/blood_red_mane.png',
    description: 'Khi hạ gục kẻ địch, hồi 15% Max HP cho Sinner ra đòn và nhận +1 Wrath Resource.',
    cost: 140,
    combatEffect: {
      healOnKillPercent: 0.15,
      freeStartingSin: 'wrath',
    },
  },
  {
    id: 'accursed_codex',
    name: 'Accursed Codex',
    tier: 4,
    sin: 'pride',
    keyword: 'general',
    iconUrl: '/assets/icons/gifts/accursed_codex.png',
    description: 'Tạo tác cấp IV: Toàn bộ đồng minh được +2 Clash Power và bắt đầu trận với 2 Attack Power Up.',
    cost: 260,
    combatEffect: {
      bonusClashPower: 2,
      startBattleStatusOnAllies: { type: 'attack_up', potency: 2, count: 2 },
    },
  },
  {
    id: 'ancient_effigy',
    name: 'Ancient Effigy',
    tier: 4,
    sin: 'sloth',
    keyword: 'general',
    iconUrl: '/assets/icons/gifts/ancient_effigy.png',
    description: 'Tạo tác cấp IV: Bắt đầu trận đấu với 3 Protection cho toàn đội và gây 2 Fragile lên mọi kẻ địch.',
    cost: 250,
    combatEffect: {
      startBattleStatusOnAllies: { type: 'protection', potency: 3, count: 2 },
      startBattleStatusOnEnemies: { type: 'fragile', potency: 2, count: 2 },
    },
  },
];

export type ClashRating = 'DOMINATING' | 'FAVORED' | 'NEUTRAL' | 'STRUGGLING' | 'HOPELESS';

export function estimateClashOutcome(
  sinnerBase: number,
  sinnerCoin: number,
  sinnerCoins: number,
  sinnerSp: number,
  enemyBase: number,
  enemyCoin: number,
  enemyCoins: number,
  enemySp: number,
  bonusClashPower = 0
): { rating: ClashRating; color: string; viLabel: string; expectedSinner: number; expectedEnemy: number } {
  const sHeadsProb = Math.min(0.95, Math.max(0.05, 0.5 + sinnerSp / 100));
  const eHeadsProb = Math.min(0.95, Math.max(0.05, 0.5 + enemySp / 100));

  const expectedSinner = Math.max(
    0,
    Math.round(sinnerBase + bonusClashPower + sinnerCoins * sHeadsProb * sinnerCoin)
  );
  const expectedEnemy = Math.max(
    0,
    Math.round(enemyBase + enemyCoins * eHeadsProb * enemyCoin)
  );

  const diff = expectedSinner - expectedEnemy + (sinnerCoins - enemyCoins) * 1.2;

  if (diff >= 5) {
    return { rating: 'DOMINATING', color: '#4ade80', viLabel: 'ÁP ĐẢO (DOMINATING)', expectedSinner, expectedEnemy };
  }
  if (diff >= 2) {
    return { rating: 'FAVORED', color: '#a3e635', viLabel: 'ƯU THẾ (FAVORED)', expectedSinner, expectedEnemy };
  }
  if (diff >= -2) {
    return { rating: 'NEUTRAL', color: '#facc15', viLabel: 'CÂN BẰNG (NEUTRAL)', expectedSinner, expectedEnemy };
  }
  if (diff >= -5) {
    return { rating: 'STRUGGLING', color: '#fb923c', viLabel: 'BẤT LỢI (STRUGGLING)', expectedSinner, expectedEnemy };
  }
  return { rating: 'HOPELESS', color: '#ef4444', viLabel: 'TUYỆT VỌNG (HOPELESS)', expectedSinner, expectedEnemy };
}

export function getResistanceLabel(mult: number): { label: string; color: string } {
  if (mult >= 2.0) return { label: 'FATAL (×2.0)', color: '#ef4444' };
  if (mult >= 1.5) return { label: 'WEAK (×1.5)', color: '#f97316' };
  if (mult >= 1.0) return { label: 'NORMAL (×1.0)', color: '#e5e7eb' };
  return { label: 'INEFF. (×0.5)', color: '#9ca3af' };
}
