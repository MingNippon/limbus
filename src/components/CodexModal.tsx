import React from 'react';
import { ALL_SINS, SIN_INFO, STATUS_INFO } from '../data/constants';
import { StatusEffectType } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import { BookOpen, X, Gift, RotateCcw } from 'lucide-react';

interface CodexModalProps {
  onClose: () => void;
  onGrantSupply: () => void;
  onResetSave: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose, onGrantSupply, onResetSave }) => {
  const statusKeys = Object.keys(STATUS_INFO) as StatusEffectType[];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="limbus-panel max-w-4xl w-full max-h-[86vh] rounded-xl border-2 border-amber-500/70 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-stone-900 to-black border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="font-display text-xl font-bold text-amber-200">
                DANTE’S NOTES — SỔ TAY QUẢN LÝ ĐIỀU HÀNH (CODEX)
              </h2>
              <p className="text-xs text-stone-400">
                Complete Guide to Limbus Company Combat, Sanity, Clashing, E.G.O & Status Effects
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              onClose();
            }}
            className="p-1.5 rounded bg-stone-800 hover:bg-red-900 text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-200">
          {/* Core Combat Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/60 p-4 rounded-lg border border-amber-500/30">
              <h3 className="font-display font-bold text-amber-300 text-base mb-1.5">
                1. Clash & Coin Toss (Đọ Chiêu & Tung Đồng Xu)
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Khi Sinner nhắm vào Slot kỹ năng của kẻ địch, hai bên sẽ bước vào trạng thái <strong>CLASH</strong>.
                Mỗi bên tung toàn bộ số Đồng Xu (Coins) hiện có:
                <br />• <strong>Plus Coin (+):</strong> Ra mặt Ngửa (Heads) sẽ cộng thêm Coin Power vào Base Power.
                <br />• <strong>Minus Coin (-):</strong> (Ví dụ: <em>The One Who Shall Grip Sinclair</em>) Có Base Power cực lớn (tới 30!), ra mặt Sấp (Tails) sẽ giữ nguyên toàn bộ sức mạnh!
                <br />• Bên có tổng điểm thấp hơn sẽ bị <strong>vỡ 1 Đồng Xu</strong>. Đọ chiêu lặp lại cho tới khi một bên vỡ hết xu, người thắng sẽ tung đòn tấn công bằng số xu còn lại!
              </p>
            </div>

            <div className="bg-black/60 p-4 rounded-lg border border-amber-500/30">
              <h3 className="font-display font-bold text-amber-300 text-base mb-1.5">
                2. Sanity (SP) & E.G.O Awakening / Corrosion
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Chỉ số Tinh Thần <strong>Sanity (SP)</strong> dao động từ <strong>-45 đến +45</strong>.
                <br />• Xác suất tung ra mặt Ngửa (Heads) = <code>50% + SP%</code> (tối đa 95% ở +45 SP, tối thiểu 5% ở -45 SP).
                <br />• Thắng Clash giúp tăng mạnh SP.
                <br />• Mỗi kỹ năng sử dụng sẽ tích lũy <strong>Tài nguyên 7 Đại Tội (Sin Resources)</strong>. Khi đủ Sin Resources, bấm nút <strong>E.G.O</strong> dưới chân Sinner để triệu hồi tuyệt kỹ E.G.O (ZAYIN / TETH / HE / WAW) kèm giọng lồng tiếng thật!
              </p>
            </div>

            <div className="bg-black/60 p-4 rounded-lg border border-amber-500/30">
              <h3 className="font-display font-bold text-amber-300 text-base mb-1.5">
                3. Sin Resonance & Absolute Resonance
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Trên bảng <strong>Skill Dashboard</strong> ở đáy màn hình, nếu bạn kết nối:
                <br />• <strong>Sin Resonance:</strong> 2+ kỹ năng cùng màu Tội Lỗi (Sin Affinity) sẽ cộng thêm Clash Power.
                <br />• <strong>Absolute Resonance:</strong> 3+ kỹ năng cùng màu nằm <em>liên tiếp nhau</em> sẽ kích hoạt Cộng Hưởng Tuyệt Đối (+3 Clash Power cho toàn chuỗi!).
              </p>
            </div>

            <div className="bg-black/60 p-4 rounded-lg border border-amber-500/30">
              <h3 className="font-display font-bold text-amber-300 text-base mb-1.5">
                4. Stagger Threshold (Ngưỡng Choáng Váng)
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Trên thanh máu (HP) của mọi nhân vật đều có các vạch màu vàng gọi là <strong>Stagger Threshold</strong>.
                Khi sát thương kéo máu tụt qua vạch vàng (hoặc bị đẩy vạch lên nhờ <strong>Tremor Burst</strong>), mục tiêu sẽ bị <strong>STAGGERED!!</strong>: mất toàn bộ lượt hành động và mọi kháng vật lý chuyển thành <strong>FATAL (×2.0 sát thương)</strong>!
              </p>
            </div>
          </div>

          {/* 7 Sin Affinities */}
          <div>
            <h3 className="font-display font-bold text-amber-300 text-base mb-2">
              7 Đại Tội (The Seven Sin Affinities)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_SINS.map((sin) => (
                <div
                  key={sin}
                  className="p-2.5 rounded-lg border flex flex-col items-center text-center"
                  style={{
                    backgroundColor: SIN_INFO[sin].bgHex,
                    borderColor: SIN_INFO[sin].borderHex,
                  }}
                >
                  <img src={SIN_INFO[sin].icon} alt={sin} className="w-7 h-7 mb-1 object-contain" />
                  <span className="text-xs font-bold text-white">{SIN_INFO[sin].name}</span>
                  <span className="text-[10px] text-stone-300">{SIN_INFO[sin].viName.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Effects Encyclopedia */}
          <div>
            <h3 className="font-display font-bold text-amber-300 text-base mb-2">
              Hiệu Ứng Trạng Thái (Status Effects — Potency × Count)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {statusKeys.map((key) => {
                const st = STATUS_INFO[key];
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-black/60 border border-stone-800 flex items-start gap-2.5"
                  >
                    <img src={st.icon} alt={st.name} className="w-7 h-7 shrink-0 object-contain mt-0.5" />
                    <div>
                      <div className="text-xs font-bold" style={{ color: st.color }}>
                        {st.viName}
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug mt-0.5">{st.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manager Executive Supply & Save Controls */}
          <div className="bg-red-950/30 p-4 rounded-lg border border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-bold text-amber-200 text-sm">
                Executive Manager Supply Drop (Hỗ Trợ Tài Nguyên Thử Nghiệm)
              </h4>
              <p className="text-xs text-stone-400">
                Nhận ngay +2,600 Lunacy, +100 Thread, +30 EXP Tickets và +100 Egoshards mỗi Sinner để thoải mái Gacha / Uptie IV!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  soundManager.playSfx('gacha_000');
                  onGrantSupply();
                }}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                CLAIM MANAGER SUPPLY
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset toàn bộ dữ liệu lưu về mặc định?')) {
                    onResetSave();
                  }
                }}
                className="px-3 py-2 rounded bg-stone-900 hover:bg-red-950 border border-red-500/50 text-red-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
