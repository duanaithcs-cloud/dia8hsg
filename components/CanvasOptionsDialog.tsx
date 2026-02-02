
import React from 'react';
import { UIPreferences, AppleTheme } from '../types';

interface CanvasOptionsDialogProps {
  preferences: UIPreferences;
  onUpdate: (key: keyof UIPreferences, value: any) => void;
  onClose: () => void;
}

const ControlSlider = ({ label, value, min, max, step, onChange, icon, displayValue }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, icon: string, displayValue?: string }) => (
  <div className="flex flex-col gap-2 p-2 rounded-2xl hover:bg-white/[0.03] transition-colors group">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] font-black text-primary tabular-nums bg-primary/10 px-2 py-0.5 rounded-md">
        {displayValue || `${Math.round(((value - min) / (max - min)) * 100)}%`}
      </span>
    </div>
    <div className="relative h-6 flex items-center group/slider">
        <input 
          type="range" min={min} max={max} step={step} 
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="apple-slider w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer transition-all focus:bg-white/20"
        />
    </div>
  </div>
);

const CanvasOptionsDialog: React.FC<CanvasOptionsDialogProps> = ({ preferences, onUpdate, onClose }) => {
  const THEMES: { id: AppleTheme, label: string }[] = [
    { id: 'ZALO', label: 'Zalo' },
    { id: 'NEON', label: 'Neon' },
    { id: 'AURORA', label: 'Aurora' },
    { id: 'SUNSET', label: 'Sunset' },
    { id: 'DARK', label: 'Dark' }
  ];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto flex items-start justify-end p-6 md:p-10">
      {/* Smart Dismiss Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose}></div>
      
      {/* Floating Control Window */}
      <div className="relative w-85 bg-[#0b0e11]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)] p-7 animate-apple-entry overflow-hidden flex flex-col max-h-[85vh]">
        {/* Apple Style Header Shine */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

        <header className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
               <span className="material-symbols-outlined text-primary">tune</span>
            </div>
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white">Thị giác AI</h3>
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-0.5">Control Centre v2.2</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-2xl bg-white/5 hover:bg-danger-glow hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/5">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <div className="space-y-8 relative z-10 overflow-y-auto no-scrollbar pb-4 pr-1">
          
          {/* A) QUY MÔ HIỂN THỊ */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2 px-2">
                <span className="text-[8px] font-black uppercase text-gray-600 tracking-[0.4em]">Quy mô & Tiêu điểm</span>
                <div className="h-px flex-1 bg-white/5"></div>
            </div>
            
            <ControlSlider 
              label="Kích thước" icon="zoom_in" value={preferences.bubbleScale} min={0.2} max={2.0} step={0.01} 
              displayValue={`${Math.round(preferences.bubbleScale * 100)}%`}
              onChange={(v) => onUpdate('bubbleScale', v)} 
            />

            <ControlSlider 
              label="Độ rực sáng" icon="flare" value={preferences.glowIntensity} min={0} max={100} step={1} 
              onChange={(v) => onUpdate('glowIntensity', v)} 
            />

            <ControlSlider 
              label="Cỡ chữ nhãn" icon="text_fields" value={preferences.fontSize} min={10} max={18} step={0.5} 
              displayValue={`${preferences.fontSize}px`}
              onChange={(v) => onUpdate('fontSize', v)} 
            />
          </section>

          {/* B) CẤU TRÚC LÕI (Xuyên thấu) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2 px-2">
                <span className="text-[8px] font-black uppercase text-gray-600 tracking-[0.4em]">Cấu trúc hạ tầng</span>
                <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all cursor-pointer group" onClick={() => onUpdate('showTranslucentCore', !preferences.showTranslucentCore)}>
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${preferences.showTranslucentCore ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                       <span className="material-symbols-outlined text-[20px]">blur_on</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">Xuyên thấu lõi</span>
                       <span className="text-[7px] font-bold text-gray-500 uppercase tracking-tighter">Pro Glass Mode</span>
                    </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${preferences.showTranslucentCore ? 'bg-primary shadow-[0_0_15px_rgba(13,51,242,0.4)]' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 size-4 rounded-full bg-white shadow-lg transition-all duration-500 ${preferences.showTranslucentCore ? 'left-7' : 'left-1'}`}></div>
                </div>
            </div>
          </section>

          {/* C) ĐỘNG LỰC HỌC (Physics) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2 px-2">
                <span className="text-[8px] font-black uppercase text-gray-600 tracking-[0.4em]">Động lực học</span>
                <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <ControlSlider 
              label="Tốc độ trôi" icon="bolt" value={preferences.intensity} min={0} max={100} step={1} 
              onChange={(v) => onUpdate('intensity', v)} 
            />

            <ControlSlider 
              label="Nhịp thở" icon="favorite" value={preferences.breathAmp} min={0} max={20} step={1} 
              onChange={(v) => {
                onUpdate('breathAmp', v);
                onUpdate('showBreathing', v > 0);
              }} 
            />

            <ControlSlider 
              label="Lực đẩy giãn" icon="layers" value={preferences.repulsion} min={0} max={100} step={1} 
              onChange={(v) => onUpdate('repulsion', v)} 
            />
          </section>

          {/* D) CHỦ ĐỀ & MÀU SẮC */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2 px-2">
                <span className="text-[8px] font-black uppercase text-gray-600 tracking-[0.4em]">Sắc thái giao diện</span>
                <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="space-y-3">
                <div className="flex bg-black/40 rounded-2xl p-1.5 gap-1 border border-white/5 shadow-inner">
                    {THEMES.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => onUpdate('activeTheme', t.id)}
                            className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${preferences.activeTheme === t.id ? 'bg-primary text-white shadow-[0_5px_15px_rgba(13,51,242,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <ControlSlider 
                  label="Độ bão hòa" icon="format_color_fill" value={preferences.saturation} min={0} max={100} step={1} 
                  onChange={(v) => onUpdate('saturation', v)} 
                />
            </div>
          </section>
        </div>

        <footer className="mt-6 pt-6 flex items-center justify-between border-t border-white/5 shrink-0">
          <button 
              onClick={() => {
                  onUpdate('bubbleScale', 1.0);
                  onUpdate('intensity', 45);
                  onUpdate('showBreathing', true);
                  onUpdate('breathAmp', 5);
                  onUpdate('glowIntensity', 55);
                  onUpdate('activeTheme', 'ZALO');
                  onUpdate('saturation', 65);
                  onUpdate('driftForce', 20);
                  onUpdate('repulsion', 80);
                  onUpdate('fontSize', 13);
                  onUpdate('showTranslucentCore', false);
              }}
              className="px-5 py-3 rounded-2xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-95"
          >
              Khôi phục
          </button>
          <button 
              onClick={onClose}
              className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
              Hoàn tất
          </button>
        </footer>
      </div>

      <style>{`
        @keyframes apple-entry {
          from { transform: scale(0.95) translateY(20px); opacity: 0; filter: blur(15px); }
          to { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        .animate-apple-entry { animation: apple-entry 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .apple-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            border: 2px solid #0d33f2;
            transition: all 0.2s;
        }
        .apple-slider:active::-webkit-slider-thumb {
            transform: scale(1.2);
            box-shadow: 0 0 20px rgba(13,51,242,0.5);
        }

        .apple-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            border: 2px solid #0d33f2;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .w-85 { width: 22rem; }
      `}</style>
    </div>
  );
};

export default CanvasOptionsDialog;
