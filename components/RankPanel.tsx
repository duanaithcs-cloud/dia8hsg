
import React, { useState, useMemo, useRef } from 'react';
import { Topic, UserProfile } from '../types';

interface RankPanelProps {
  topics: Topic[];
  isDemo: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onImportTopics: (imported: Partial<Topic>[]) => void;
}

type SortKey = 'name' | 'NB' | 'TH' | 'VD' | 'VDC' | 'mastery' | 'rank' | 'day' | 'week' | 'month' | 'three_months';

const RankPanel: React.FC<RankPanelProps> = ({ topics = [], isDemo, userProfile, onClose, onImportTopics }) => {
  const [sortKey, setSortKey] = useState<SortKey>('mastery');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasRealData = useMemo(() => topics.some(t => t.mastery_percent > 0 || t.attempts_count > 0), [topics]);

  const stripBOM = (text: string) => text.replace(/^\ufeff/, '');

  const getMasteryColor = (percent: number) => {
    if (percent === 0) return 'text-gray-600 bg-gray-600/5';
    if (percent <= 30) return 'text-red-500 bg-red-500/10';
    if (percent <= 60) return 'text-orange-500 bg-orange-500/10';
    if (percent <= 85) return 'text-blue-500 bg-blue-500/10';
    return 'text-c4-green bg-c4-green/10';
  };

  const getRankLabel = (percent: number) => {
    if (percent === 0) return { label: 'Chưa học', weight: 0 };
    if (percent <= 30) return { label: 'Cần cố gắng', weight: 1 };
    if (percent <= 50) return { label: 'Trung bình', weight: 2 };
    if (percent <= 75) return { label: 'Khá', weight: 3 };
    if (percent <= 95) return { label: 'Giỏi', weight: 4 };
    return { label: 'Elite', weight: 5 };
  };

  const sortedTopics = useMemo(() => {
    const list = Array.isArray(topics) ? [...topics] : [];
    if (list.length === 0) return [];
    
    list.sort((a, b) => {
      let valA: any, valB: any;
      
      switch (sortKey) {
        case 'name': valA = a.keyword_label; valB = b.keyword_label; break;
        case 'NB': valA = a.competency_scores?.NB ?? 0; valB = b.competency_scores?.NB ?? 0; break;
        case 'TH': valA = a.competency_scores?.TH ?? 0; valB = b.competency_scores?.TH ?? 0; break;
        case 'VD': valA = a.competency_scores?.VD ?? 0; valB = b.competency_scores?.VD ?? 0; break;
        case 'VDC': valA = a.competency_scores?.VDC ?? 0; valB = b.competency_scores?.VDC ?? 0; break;
        case 'mastery': valA = a.mastery_percent ?? 0; valB = b.mastery_percent ?? 0; break;
        case 'rank': valA = getRankLabel(a.mastery_percent ?? 0).weight; valB = getRankLabel(b.mastery_percent ?? 0).weight; break;
        case 'day': valA = a.history_mastery?.day ?? 0; valB = b.history_mastery?.day ?? 0; break;
        case 'week': valA = a.history_mastery?.week ?? 0; valB = b.history_mastery?.week ?? 0; break;
        case 'month': valA = a.history_mastery?.month ?? 0; valB = b.history_mastery?.month ?? 0; break;
        case 'three_months': valA = a.history_mastery?.three_months ?? 0; valB = b.history_mastery?.three_months ?? 0; break;
        default: valA = a.mastery_percent ?? 0; valB = b.mastery_percent ?? 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [topics, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    if (sortedTopics.length === 0) return;
    const headers = ['Học sinh', 'Lớp', 'ID', 'Chuyên đề', 'Mastery (%)', 'NB', 'TH', 'VD', 'VDC', 'Xếp hạng'];
    const rows = sortedTopics.map(t => [
      `"${userProfile.fullName || 'N/A'}"`, `"${userProfile.className || 'N/A'}"`, t.topic_id, `"${t.keyword_label}"`,
      t.mastery_percent, t.competency_scores?.NB ?? 0, t.competency_scores?.TH ?? 0, t.competency_scores?.VD ?? 0, t.competency_scores?.VDC ?? 0,
      getRankLabel(t.mastery_percent).label
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DiaAI_Rankings_${userProfile.fullName || 'Export'}.csv`;
    link.click();
  };

  const SortHeader = ({ label, k, align = 'center' }: { label: string, k: SortKey, align?: 'left' | 'center' | 'right' }) => (
    <th 
      onClick={() => toggleSort(k)} 
      className={`px-2 py-4 text-[9px] font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:text-primary transition-colors select-none ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {sortKey === k && (
          <span className="material-symbols-outlined text-[10px]">
            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="fixed inset-0 z-[4500] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose}></div>
      <div className="relative w-full max-w-[95vw] h-[92vh] bg-background-dark border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in text-white">
        <header className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="size-12 sm:size-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">workspace_premium</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase italic">RANKINGS: NEURAL GEOGRAPHY</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-widest ${isDemo ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-primary/10 text-primary border-primary/20'}`}>
                  {isDemo ? 'DEMO MODE' : `${userProfile.fullName}`}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="size-10 sm:size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 active:scale-95">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead className="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/10">
              <tr>
                <SortHeader label="Chuyên đề" k="name" align="left" />
                <SortHeader label="NB" k="NB" />
                <SortHeader label="TH" k="TH" />
                <SortHeader label="VD" k="VD" />
                <SortHeader label="VDC" k="VDC" />
                <SortHeader label="Thành thạo" k="mastery" />
                <SortHeader label="Xếp hạng" k="rank" />
                <SortHeader label="Ngày" k="day" />
                <SortHeader label="Tuần" k="week" />
                <SortHeader label="Tháng" k="month" />
                <SortHeader label="3 Tháng" k="three_months" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedTopics.map((t) => (
                <tr key={t.topic_id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-3 py-3 align-middle w-1/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-gray-600 tabular-nums w-4 shrink-0">{t.topic_id}</span>
                      <span className="text-[11px] font-bold text-gray-300 group-hover:text-primary transition-colors line-clamp-1 italic">{t.keyword_label}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <span className={`text-[10px] font-grotesk font-black ${getMasteryColor(t.competency_scores?.NB ?? 0).split(' ')[0]}`}>{t.competency_scores?.NB ?? 0}%</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <span className={`text-[10px] font-grotesk font-black ${getMasteryColor(t.competency_scores?.TH ?? 0).split(' ')[0]}`}>{t.competency_scores?.TH ?? 0}%</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <span className={`text-[10px] font-grotesk font-black ${getMasteryColor(t.competency_scores?.VD ?? 0).split(' ')[0]}`}>{t.competency_scores?.VD ?? 0}%</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <span className={`text-[10px] font-grotesk font-black ${getMasteryColor(t.competency_scores?.VDC ?? 0).split(' ')[0]}`}>{t.competency_scores?.VDC ?? 0}%</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getMasteryColor(t.mastery_percent ?? 0)}`}>{t.mastery_percent ?? 0}%</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle">
                    <span className={`text-[8px] font-black uppercase tracking-tighter italic whitespace-nowrap ${getMasteryColor(t.mastery_percent ?? 0).split(' ')[0]}`}>{getRankLabel(t.mastery_percent ?? 0).label}</span>
                  </td>
                  <td className="px-1 py-3 text-center align-middle"><span className="text-[10px] font-grotesk font-bold text-gray-500">{t.history_mastery?.day ?? 0}%</span></td>
                  <td className="px-1 py-3 text-center align-middle"><span className="text-[10px] font-grotesk font-bold text-gray-500">{t.history_mastery?.week ?? 0}%</span></td>
                  <td className="px-1 py-3 text-center align-middle"><span className="text-[10px] font-grotesk font-bold text-gray-500">{t.history_mastery?.month ?? 0}%</span></td>
                  <td className="px-1 py-3 text-center align-middle"><span className="text-[10px] font-grotesk font-bold text-gray-500">{t.history_mastery?.three_months ?? 0}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RankPanel;
