
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Topic, SearchResult, KnowledgeRecord, GeoSkill, TagLevel } from "../types";

export class GeminiService {
  private static getAIInstance(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static async callWithRetry<T>(
    fn: () => Promise<T>,
    retries = 4,
    delay = 4000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = (JSON.stringify(error) || error?.message || "").toLowerCase();
      if (errorStr.includes("429") || errorStr.includes("quota")) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callWithRetry(fn, retries - 1, delay * 2);
        } else {
          throw new Error("QUOTA_EXHAUSTED");
        }
      }
      throw error;
    }
  }

  static async generateQuiz(topic: Topic, count: 10 | 25, isArena: boolean = false, skill?: GeoSkill): Promise<Question[]> {
    let skillInstruction = "";
    if (skill === GeoSkill.MAP) skillInstruction = `TRỌNG TÂM: Kỹ năng khai thác Bản đồ / Atlas Địa lí Việt Nam 2025.`;
    else if (skill === GeoSkill.LOGIC) skillInstruction = `TRỌNG TÂM: Mối quan hệ nhân quả Địa lí.`;
    else if (skill === GeoSkill.DATA) skillInstruction = `TRỌNG TÂM: Kiến thức nền và tính toán số liệu.`;
    else if (skill === GeoSkill.CHART) skillInstruction = `TRỌNG TÂM: Kỹ năng Biểu đồ (vẽ, nhận xét, nhận dạng).`;

    const systemInstruction = `BẠN LÀ GIÁO SƯ ĐỊA LÍ ĐẦU NGÀNH. NHIỆM VỤ: Soạn đề ${count} câu trắc nghiệm HSG "${topic.keyword_label}". 
    HỆ THỐNG CẤP ĐỘ: NB (Nhận biết), TH (Thông hiểu), VD (Vận dụng), VDC (Vận dụng cao).
    YÊU CẦU ĐẶC BIỆT CHO GIẢI THÍCH (Trường 'explain'): 
    Mỗi câu phải có phần giải thích cấu trúc ĐÚNG 4 PHẦN, ngăn cách bởi dấu gạch đứng '|' như sau:
    [Kiến thức nền tảng gốc 2025] | [Mối quan hệ ngữ cảnh thực tế] | [Bẫy tư duy logic/mô hình sai] | [Công thức nén A+B->C].
    ${skillInstruction}`;

    return this.callWithRetry(async () => {
      const ai = this.getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Soạn 1 đề thi gồm ${count} câu. Giải thích phải có 4 phần cách nhau bởi '|'. Trả về JSON.`,
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    qid: { type: Type.STRING },
                    skill_tag: { type: Type.STRING, enum: [TagLevel.NB, TagLevel.TH, TagLevel.VD, TagLevel.VDC] },
                    type: { type: Type.STRING, enum: ["MCQ", "TF", "FILL"] }, 
                    difficulty: { type: Type.NUMBER },
                    prompt: { type: Type.STRING },
                    choices: { 
                      type: Type.OBJECT, 
                      properties: { A: { type: Type.STRING }, B: { type: Type.STRING }, C: { type: Type.STRING }, D: { type: Type.STRING } } 
                    },
                    answer_key: { type: Type.STRING },
                    explain: { type: Type.STRING }
                  },
                  required: ["qid", "skill_tag", "type", "difficulty", "prompt", "answer_key", "explain"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });
      const data = JSON.parse(response.text || "{\"questions\":[]}");
      return (data.questions || []).map((q: any) => ({
        ...q,
        topic_id: topic.topic_id.toString(),
        qid: q.qid || `Q-${Math.random().toString(36).substr(2, 5)}`,
        answer_key: q.answer_key?.toString().toUpperCase() || "A"
      }));
    });
  }

  static async auditStudentSynapse(record: KnowledgeRecord, studentContext: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getAIInstance();
      const prompt = `BẠN LÀ HỘI ĐỒNG NEURAL LINK INTERSTELLAR. GIẢI MÃ CHUYÊN SÂU HƠN:
      Câu hỏi: ${record.prompt}
      Lựa chọn HS: ${record.userAnswer}
      Đáp án: ${record.correctAnswer}
      Cung cấp thêm 4 tầng tư duy (Kiến thức nền, Mối quan hệ, Biểu đồ/Bản đồ thực tế, Công thức nén).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 4000 } }
      });
      return response.text || "Neural Link Error.";
    });
  }

  static async fetchTopicInsights(topic: Topic): Promise<SearchResult> {
    return this.callWithRetry(async () => {
      const ai = this.getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: `Phân tích chuyên sâu địa lí: "${topic.keyword_label}" Việt Nam 2025. Thống nhất dùng nhãn: Bản đồ, Biểu đồ, Mối quan hệ, Kiến thức nền.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];
      const sources = chunks?.filter(c => c.web).map(c => ({ title: c.web.title, uri: c.web.uri })) || [];
      return { summary: response.text || "", sources: sources.slice(0, 3) };
    });
  }

  static async analyzeGlobalStrategy(topics: Topic[]): Promise<{ summary: string; connections: string[]; roadmap: string[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getAIInstance();
      const contents = `PHÂN TÍCH CHIẾN LƯỢC TOÀN CẦU. SỬ DỤNG NHÃN THỐNG NHẤT: NB, TH, VD, VDC VÀ Bản đồ, Biểu đồ, Mối quan hệ, Kiến thức nền. TRẢ VỀ JSON.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              connections: { type: Type.ARRAY, items: { type: Type.STRING } },
              roadmap: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "connections", "roadmap"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    });
  }
}
