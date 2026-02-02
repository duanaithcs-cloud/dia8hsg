
import React, { useState, useEffect } from 'react';

interface ApiKeySettingsDialogProps {
  onClose: () => void;
}

const ApiKeySettingsDialog: React.FC<ApiKeySettingsDialogProps> = ({ onClose }) => {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedGemini = localStorage.getItem('GEMINI_API_KEY') || "";
    const savedOpenai = localStorage.getItem('OPENAI_API_KEY') || "";
    setGeminiKey(savedGemini);
    setOpenaiKey(savedOpenai);
  }, []);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
    localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(13,51,242,0.3)] overflow-hidden animate-pop-in">
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="size-16 bg-primary/20 border border-primary/40 rounded-3xl mx-auto flex items-center justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-4xl">key</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Cấu hình API Key</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Kích hoạt quyền năng AI toàn diện</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gemini API Key</label>
                <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-primary hover:underline">Lấy Key miễn phí</a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Nhập Google Gemini API Key..."
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-medium text-white placeholder:text-gray-700 focus:border-primary focus:ring-0 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">OpenAI API Key (Optional)</label>
              <input 
                type="password" 
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="Nhập OpenAI API Key (nếu có)..."
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-medium text-white placeholder:text-gray-700 focus:border-primary focus:ring-0 transition-all"
              />
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
              <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Tính năng được kích hoạt:
              </h4>
              <ul className="space-y-1">
                {[
                  "Tạo bộ đề thi chuyên sâu 33 chuyên đề",
                  "Phân tích ma trận năng lực HSG (C1-C4)",
                  "Xếp hạng & Đồng bộ dữ liệu học tập",
                  "Insight tra cứu thực tế từ Google Search"
                ].map((item, i) => (
                  <li key={i} className="text-[11px] text-gray-400 flex items-center gap-2 italic">
                    <span className="size-1 rounded-full bg-primary"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={handleSave}
              className={`group relative w-full h-14 flex items-center justify-center font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 ${isSaved ? 'bg-c4-green text-black' : 'bg-primary text-white shadow-[0_10px_30px_rgba(13,51,242,0.4)]'}`}
            >
              {isSaved ? (
                <>
                  <span className="material-symbols-outlined mr-2">check_circle</span>
                  ĐÃ LƯU CẤU HÌNH
                </>
              ) : (
                'LƯU & KÍCH HOẠT'
              )}
            </button>
          </div>
        </div>

        <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Key được lưu an toàn trong trình duyệt của bạn (LocalStorage)</p>
        </div>
      </div>
      <style>{`
        @keyframes pop-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default ApiKeySettingsDialog;
