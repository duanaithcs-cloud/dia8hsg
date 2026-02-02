
import React, { useState, useEffect, useRef } from 'react';
import { Topic } from '../types';

interface FloatingNotesProps {
  topic?: Topic;
  globalNotes?: string;
  onUpdateNotes: (notes: string) => void;
  onClose: () => void;
}

const FloatingNotes: React.FC<FloatingNotesProps> = ({ topic, globalNotes, onUpdateNotes, onClose }) => {
  const [localNotes, setLocalNotes] = useState(topic ? (topic.notes || "") : (globalNotes || ""));
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = useRef(false);
  const lastTopicIdRef = useRef<number | undefined>(topic?.topic_id);

  useEffect(() => {
    if (topic?.topic_id !== lastTopicIdRef.current) {
      setLocalNotes(topic ? (topic.notes || "") : (globalNotes || ""));
      lastTopicIdRef.current = topic?.topic_id;
    }
  }, [topic?.topic_id, globalNotes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);

    if (isComposingRef.current) return;

    setSaveStatus('SAVING');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateNotes(val);
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 1000);
  };

  const handleCompositionStart = () => { isComposingRef.current = true; };
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    const val = (e.target as HTMLTextAreaElement).value;
    setSaveStatus('SAVING');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateNotes(val);
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[150000] pointer-events-none flex items-center justify-end p-4 md:p-8">
      {/* Overlay mờ để tập trung */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[12px] pointer-events-auto" onClick={onClose}></div>
      
      {/* Container chính với Neon Glow */}
      <div className="relative w-full max-w-md h-[85vh] bg-[#0b0e11]/95 backdrop-blur-[60px] border-2 border-c4-green/40 rounded-[56px] shadow-[0_0_100px_rgba(0,255,136,0.2)] p-10 flex flex-col pointer-events-auto animate-crystal-entry overflow-hidden">
        {/* Header Shine */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-c4-green/20 to-transparent pointer-events-none"></div>

        <header className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="size-14 rounded-[24px] bg-c4-green/20 flex items-center justify-center border border-c4-green/40 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
               <span className="material-symbols-outlined text-c4-green text-3xl">edit_note</span>
            </div>
            <div>
              <h3 className="text-[14px] font-black uppercase tracking-[0.25em] text-white italic">Neural Ledger</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[200px]">
                {topic ? topic.keyword_label : 'Global Reflections'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-2xl border text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${saveStatus === 'SAVED' ? 'bg-c4-green/20 border-c4-green text-c4-green' : 'bg-white/5 border-white/10 text-gray-600'}`}>
               <div className={`size-2 rounded-full ${saveStatus === 'SAVING' ? 'bg-primary animate-ping' : 'bg-gray-700'}`}></div>
               {saveStatus === 'SAVING' ? 'MÃ HÓA...' : 'NIÊM PHONG'}
            </div>
            <button onClick={onClose} className="size-11 rounded-[20px] bg-white/5 hover:bg-danger-glow hover:text-white flex items-center justify-center transition-all border border-white/5 active:scale-90">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </header>

        {/* Khu vực nhập chữ */}
        <div className="flex-1 relative group z-10 overflow-hidden mt-4">
          <textarea 
            autoFocus
            value={localNotes}
            onChange={handleNotesChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Hãy ghi lại những lập luận, mẹo hoặc bẫy logic của Giáo sư tại đây..."
            className="w-full h-full bg-white/[0.04] border-2 border-c4-green/10 rounded-[40px] p-10 text-[16px] text-gray-100 font-bold leading-relaxed outline-none focus:border-c4-green/60 focus:bg-white/[0.06] transition-all shadow-inner placeholder:text-gray-800 resize-none select-text no-scrollbar italic"
          />
          {/* Góc trang trí Neon */}
          <div className="absolute top-8 left-8 size-6 border-l-4 border-t-4 border-c4-green/20 rounded-tl-2xl pointer-events-none group-focus-within:border-c4-green transition-all duration-700"></div>
          <div className="absolute bottom-8 right-8 size-6 border-r-4 border-b-4 border-c4-green/20 rounded-br-2xl pointer-events-none group-focus-within:border-c4-green transition-all duration-700"></div>
        </div>

        <footer className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between shrink-0 relative z-10">
          <p className="text-[9px] font-black uppercase text-gray-600 tracking-[0.5em] italic">NEURAL SCRATCHPAD v20.0</p>
          <div className="flex gap-3">
             <div className="size-2.5 rounded-full bg-c4-green shadow-[0_0_10px_rgba(0,255,136,0.6)] animate-pulse"></div>
             <div className="size-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,245,255,0.6)]"></div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes crystal-entry {
          from { transform: scale(0.92) translateX(60px); opacity: 0; filter: blur(30px); }
          to { transform: scale(1) translateX(0); opacity: 1; filter: blur(0); }
        }
        .animate-crystal-entry { animation: crystal-entry 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default FloatingNotes;
