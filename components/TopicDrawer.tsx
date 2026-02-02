
import React, { useState, useEffect, useRef } from 'react';
import { Topic, TagLevel, SearchResult, HistoryEntry, ArenaStats, KnowledgeRecord, KnowledgeAsset, GeoSkill } from '../types';
import { GeminiService } from '../services/geminiService';

interface TopicDrawerProps {
  topic: Topic;
  decodedTopicIds: number[];
  history: HistoryEntry[];
  arenaStore?: Record<number, ArenaStats>;
  onClose: () => void;
  onStartLuyen10: () => void;
  onStartLuyen25: () => void;
  onStartArena: () => void; 
  onStartSkill: (skill: GeoSkill) => void;
  onFetchInsights: (topic: Topic) => Promise<SearchResult>;
  onShowInfographic: () => void; 
  onAddAsset: (asset: KnowledgeAsset) => void;
  onRemoveAsset: (assetId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onToggleNotes?: () => void;
}

const TopicDrawer: React.FC<TopicDrawerProps> = ({ 
  topic, decodedTopicIds = [], history = [], arenaStore = {}, 
  onClose, onStartLuyen10, onStartLuyen25, onStartArena, onStartSkill,
  onFetchInsights, onShowInfographic, onAddAsset, onRemoveAsset, onUpdateNotes, onToggleNotes
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VAULT' | 'NOTES'>('OVERVIEW');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [loreText, setLoreText] = useState<string | null>(null);
  const [isLoreLoading, setIsLoreLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localNotes, setLocalNotes] = useState(topic.notes || "");
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalNotes(topic.notes || "");
  }, [topic.notes, topic.topic_id]);

  useEffect(() => {
    if (topic.mastery_percent >= 70 && !loreText) {
      setIsLoreLoading(true);
      const prompt = `Viết một đoạn "Huyền thoại sáp nhập" ngắn về chuyên đề ${topic.keyword_label}. Thống nhất dùng ngôn ngữ chiến lược: Bản đồ, Biểu đồ, Mối quan hệ, Kiến thức nền.`;
      GeminiService.fetchTopicInsights({ keyword_label: prompt } as any)
        .then(res => setLoreText(res.summary))
        .finally(() => setIsLoreLoading(false));
    }
  }, [topic.mastery_percent, topic.keyword_label]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    setSaveStatus('SAVING');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateNotes(val);
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 1000);
  };

  const isDecoded = decodedTopicIds.includes(topic.topic_id);
  const stars = isDecoded ? (arenaStore[topic.topic_id]?.star_level || 0) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onAddAsset({ id: `file-${Date.now()}`, type: file.type.includes('image') ? 'IMAGE_OCR' : 'DOCUMENT', title: file.name, content: base64, timestamp: new Date().toISOString(), tags: [file.type.split('/')[1].toUpperCase()] });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full h-[95%] bg-background-dark rounded-t-[32px] sm:rounded-t-[40px] border-t border-white/10 flex flex-col overflow-hidden animate-slide-up shadow-[0_-20px_80px_rgba(0,0,0,0.8)]">
        
        <div className="sticky top-0 z-[30] bg-white/[0.03] backdrop-blur-3xl border-b border-white/5 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0">
           <div className="flex flex-col">
              <span className="text-[7px] sm:text-[8px] font-black uppercase text-gray-500 tracking-[0.5em] leading-none mb-1">CHUYÊN ĐỀ CHA: {topic.group_title}</span>
              <div className="flex items-center gap-2">
                 <div className="size-1.5 sm:size-2 rounded-full animate-pulse shadow-[0_0_8px_var(--orb-color)]" style={{ backgroundColor: topic.color, ['--orb-color' as any]: topic.color }}></div>
                 <h2 className="text-xs sm:text-sm font-black italic uppercase tracking-tighter" style={{ color: topic.color }}>{topic.keyword_label}</h2>
              </div>
           </div>
           <button onClick={onClose} className="size-8 sm:size-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5"><span className="material-symbols-outlined text-lg sm:text-xl text-gray-500">close</span></button>
        </div>

        <div className="flex bg-white/[0.01] backdrop-blur-3xl border-b border-white/5 p-2 sm:p-3 shrink-0 z-20 gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('OVERVIEW')} className={`flex-1 min-w-[100px] py-3 sm:py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}>TỔNG QUAN</button>
          <button onClick={() => setActiveTab('VAULT')} className={`flex-1 min-w-[100px] py-3 sm:py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'VAULT' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white'}`}>KHO TRI THỨC</button>
          <button onClick={() => setActiveTab('NOTES')} className={`flex-1 min-w-[100px] py-3 sm:py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'NOTES' ? 'bg-c4-green text-black' : 'text-gray-500 hover:text-white'}`}>GHI CHÚ</button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar z-10">
          {activeTab === 'OVERVIEW' && (
            <div className="px-4 sm:px-6 pb-48 space-y-8 sm:space-y-12 pt-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2">
                 {[
                   { id: GeoSkill.MAP, label: 'BẢN ĐỒ', sub: 'Tọa độ không gian', icon: 'explore', color: '#00ff88' },
                   { id: GeoSkill.LOGIC, label: 'MỐI QUAN HỆ', sub: 'Nhân quả địa lí', icon: 'hub', color: '#00d1ff' },
                   { id: GeoSkill.DATA, label: 'KIẾN THỨC NỀN', sub: 'Dữ liệu thực tế', icon: 'table_chart', color: '#f59e0b' },
                   { id: GeoSkill.CHART, label: 'BIỂU ĐỒ', sub: 'Biến động số liệu', icon: 'legend_toggle', color: '#ff0055' }
                 ].map(skill => (
                   <button key={skill.id} onClick={() => onStartSkill(skill.id)} className="group relative h-24 sm:h-32 rounded-2xl border-2 border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-1 transition-all hover:scale-105" style={{ borderColor: `${skill.color}22` }}>
                     <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform" style={{ color: skill.color }}>{skill.icon}</span>
                     <span className="block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white">{skill.label}</span>
                     <span className="block text-[6px] sm:text-[7px] font-bold text-gray-500 uppercase">{skill.sub}</span>
                   </button>
                 ))}
              </div>
              
              <header className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12 pt-4">
                <div onClick={() => { if (topic.infographic_url) onShowInfographic(); }} className="w-full max-w-[280px] aspect-square rounded-[48px] border-4 relative overflow-hidden group cursor-pointer" style={{ borderColor: topic.color, background: `radial-gradient(circle at center, ${topic.color}22 0%, #05070a 100%)` }}>
                  <span className="material-symbols-outlined text-8xl z-10 text-white opacity-40 group-hover:opacity-100 transition-opacity">auto_awesome_motion</span>
                </div>
                <div className="flex-1 text-center lg:text-left space-y-6 w-full">
                  <h2 className="text-3xl sm:text-6xl font-black italic uppercase text-white tracking-tighter line-clamp-2">{topic.keyword_label}</h2>
                  <div className="bg-white/[0.03] p-6 rounded-[32px] border border-white/5 italic text-gray-300 text-lg leading-relaxed">"{topic.full_text}"</div>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-16">
                <button onClick={onStartLuyen10} className="h-16 sm:h-24 rounded-[2.5rem] border-2 border-primary text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-black transition-all">LUYỆN 10 CÂU</button>
                <button onClick={onStartLuyen25} className="h-16 sm:h-24 rounded-[2.5rem] bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">LUYỆN 25 CÂU</button>
                <button onClick={onStartArena} className="h-16 sm:h-24 rounded-[2.5rem] bg-danger-glow text-white font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all">ARENA CHIẾN ĐẤU</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TopicDrawer;
