import { GoogleGenAI, Type } from "@google/genai";
import { ApiConfig, StoryOption, WorldInfoEntry } from "../types";

export async function generateOptions(
  context: string,
  config: ApiConfig,
  apiConfig: { apiKey: string; model: string },
  worldInfo: WorldInfoEntry[],
  purpose?: string
): Promise<StoryOption[]> {
  const apiKey = apiConfig.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key is required. Please set it in the settings or environment.");
  }

  const ai: any = new GoogleGenAI({ apiKey });
  
  const worldInfoSection = worldInfo && worldInfo.length > 0 
    ? `世界书相关条目：\n${worldInfo.map(m => `[${m.key.join(', ')}]: ${m.content}`).join('\n---\n')}\n\n` 
    : '';

  const finalPurpose = purpose?.trim() || "完全随机。请结合当前局势，自行给user派发一个高优级的短期目标。";
  const processedTemplate = config.promptTemplate
    .replace("{{purpose}}", finalPurpose)
    .replace("{{context}}", context);

  const prompt = `
${worldInfoSection}
当前故事上下文：
${context}

任务指令：
${processedTemplate}

输出要求：
必须输出一个 JSON 数组，包含五个对象。每个对象必须包含：
- "title": 选项的简短标题（例如：计划 A / 玩法 1 / 分支 A）
- "description": 选项的详细剧情描述（包含原模板要求的“执行”或“指引”或“操作”内容，100-200字）

严格遵守 JSON 格式。
`.trim();

  try {
    const model = ai.getGenerativeModel({ model: apiConfig.model || "gemini-3-flash-preview" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed.map((item: any, index: number) => ({
      id: `${config.id}-${index}-${Date.now()}`,
      title: item.title,
      description: item.description,
      mode: config.id as any,
    }));
  } catch (error) {
    console.error(`Error generating options for ${config.name}:`, error);
    return [];
  }
}

export async function filterRelevantMemories(
  context: string,
  worldInfo: WorldInfoEntry[],
  apiKey?: string
): Promise<WorldInfoEntry[]> {
  // User manually selects entries now, so we just return them.
  return worldInfo;
}

