
import React, { useState } from 'react';
import { StudyGoal } from '../types';

interface IdentityDialogProps {
  onConfirm: (fullName: string, className: string, goal: StudyGoal, teacherWalletId: string) => void;
  onCancel: () => void;
}

const IdentityDialog: React.FC<IdentityDialogProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [walletId, setWalletId] = useState("GV-8A1-OE58");
  const [goal, setGoal] = useState<StudyGoal>(StudyGoal.FIRST_PRIZE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && cls.trim() && walletId.trim()) {
      onConfirm(name.trim().toUpperCase(), cls.trim().toUpperCase(), goal, walletId.trim().toUpperCase());
    } else {
      alert("Vui lòng hoàn tất thông tin định danh.");
    }
  };

  const goals = [
    { id: StudyGoal.CHAMPION, label: 'TRẠNG NGUYÊN', sub: 'Vô địch', icon: 'workspace_premium', color: '#FFD700' },
    { id: StudyGoal.FIRST_PRIZE, label: 'BẢNG NHÃN', sub: 'Giải Nhất', icon: 'military_tech', color: '#C0C0C0' },
    { id: StudyGoal.SECOND_PRIZE, label: 'THÁM HOA', sub: 'Giải Nhì', icon: 'reward_badge', color: '#CD7F32' },
    { id: StudyGoal.THIRD_PRIZE, label: 'KHUYẾN KHÍCH', sub: 'Giải Ba', icon: 'editor_choice', color: '#4FC3F7' },
  ];

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-fade-in" onClick={onCancel}></div>
      
      <div className="relative w-full max-w-lg bg-background-dark border border-white/20 rounded-[32px] sm:rounded-[48px] shadow-[0_0_100px_rgba(13,51,242,0.35)] overflow-y-auto max-h-[90vh] no-scrollbar animate-pop-in pointer-events-auto">
        <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <div className="size-16 sm:size-20 bg-primary/20 border border-primary/40 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(13,51,242,0.5)] shrink-0">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary animate-pulse">account_balance_wallet</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white italic">Cấu hình GEO-LINK</h2>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 leading-none">Liên kết Hub Giáo viên</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-3">Họ tên học viên</label>
                <input 
                  autoFocus
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="NGUYỄN VĂN A"
                  className="w-full h-12 sm:h-14 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 text-sm font-bold text-white focus:border-primary transition-all uppercase outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-3">Lớp học</label>
                <input 
                  type="text" 
                  value={cls}
                  onChange={(e) => setCls(e.target.value)}
                  placeholder="8A1"
                  className="w-full h-12 sm:h-14 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 text-sm font-bold text-white focus:border-primary transition-all uppercase outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-3">MÃ VÍ GV (P2P HUB ID)</label>
              <input 
                type="text" 
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                placeholder="GV-..."
                className="w-full h-12 sm:h-14 bg-primary/5 border border-primary/20 rounded-xl sm:rounded-2xl px-5 text-sm font-black text-primary focus:border-primary transition-all uppercase outline-none text-center shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-3">Mục tiêu danh hiệu</label>
              <div className="grid grid-cols-2 gap-3">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] border-2 flex flex-col items-center justify-center gap-1 transition-all ${goal === g.id ? 'border-primary bg-primary/20 scale-[1.02]' : 'border-white/5 bg-white/5 text-gray-500'}`}
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl" style={{ color: goal === g.id ? g.color : '#444' }}>{g.icon}</span>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-center" style={{ color: goal === g.id ? '#fff' : '#444' }}>{g.label}</span>
                    <span className="text-[7px] font-bold text-gray-600 uppercase hidden sm:inline">{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={!name || !cls || !walletId}
              className="w-full h-14 sm:h-16 bg-primary text-black font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] rounded-2xl sm:rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 mt-4 border-b-4 border-black/30 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">link</span> KẾT NỐI & BẮT ĐẦU
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes popIn { from { transform: scale(0.9) translateY(20px); opacity: 0; filter: blur(10px); } to { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); } }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default IdentityDialog;
