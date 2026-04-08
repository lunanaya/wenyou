export type ApiMode = 'user_plan' | 'side_quest' | 'main_story';

export interface ApiConfig {
  id: string;
  name: string;
  promptTemplate: string;
  isActive: boolean;
}

export interface StoryOption {
  id: string;
  title: string;
  description: string;
  mode: ApiMode;
}

export interface WorldInfoEntry {
  uid: number;
  key: string[];
  content: string;
  comment?: string;
  isActive: boolean;
}

export interface AppSettings {
  selectedBook: string;
  selectedEntries: number[]; // UIDs of selected entries
  apiConfig: {
    apiKey: string;
    model: string;
  };
  configs: Record<ApiMode, ApiConfig>;
  stApi: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    autoSync: boolean;
  };
}

export const DEFAULT_CONFIGS: Record<ApiMode, ApiConfig> = {
  user_plan: {
    id: 'user_plan',
    name: 'User计划模式',
    isActive: true,
    promptTemplate: `当前回合进入元指令。停止剧情，停止输出其他所有内容，进入【user计划模式】，开始思考**user行动策略**：
**读取<世界信息>和<旧世记忆>，载入<user>现在的身份及所处节点当前状态**
当前目的：{{purpose}}

⚠️**【核心指令：身份驱动的最优解，拒绝无厘头与用力过猛】**
1. **身份自洽**：提供的选项必须是当前user身份在当前场景下的【合理最优路径】。
2. **拒绝为了不同而不同**：不要强行制造不符合逻辑的极端冲突或卖弄智商。选项可以是日常的、社交的、心机的、或者机制操作的，只要能平滑、自然地达成目的即可。
3. **只给选项，不写结局**。

**请根据当前具体情境，发散思维，提供5个符合身份的破局思路（A-E）：**

格式：
计划 X：[一句话说明在这个节点下，user利用什么资源或手段达成目的。]
执行：[给当前立刻能做的一个具体动作。]`,
  },
  side_quest: {
    id: 'side_quest',
    name: '发掘支线',
    isActive: true,
    promptTemplate: `当前回合进入元指令。停止剧情，停止输出其他所有内容，进入【支线探索：世界游玩指南】，开始生成**沙盒互动机制**：
**读取<世界信息>和<旧世记忆>，载入<user>现在的身份及所处节点当前状态**
玩法倾向：{{purpose}}

**核心指令：沉浸式世界探索！提供符合身份的动态日常。**
玩家现在想要一些新鲜的互动选择。请根据user的【当前身份】和【所处环境】，生成5个自然、有趣的支线触发点。不需要每一帧都在对抗，可以是悠闲的寻宝、有趣的社交博弈、或者是符合世界观的小消遣。

⚠️**【生成要求】**：绝对贴合身份！不要给富家千金安排去泥地里挖草药（除非她有这个爱好），也不要给冷酷剑客安排去绣花。日常占比要有，适度适量。

格式：
玩法 X：[事件/玩法名称]
指引：[具体怎么玩。]`,
  },
  main_story: {
    id: 'main_story',
    name: '主线分支',
    isActive: true,
    promptTemplate: `当前回合进入元指令。停止剧情，停止输出其他所有内容，进入【主线内容：剧情转折分歧点】：
**读取<世界信息>和<旧世记忆>，载入<user>现在的身份及所处节点当前状态**
**期望走向**：{{purpose}}

⚠️**【核心指令：顺理成章的转折，符合人物逻辑的推进】**
基于当前的处境、user的身份特性以及各方势力的关系，提供5个能够推动剧情的行动分支。
**不要无厘头！不要用力过猛！** 剧情的推进可以是激烈的对抗，也可以是温和的试探、一场精妙的社交周旋、或是一次暗中的交易。确保每个选项都是当前节点下的“合理路径”。

格式：
分支 X：[简短的行动概括]
操作：[仅描述动作本身，如何利用身份优势或当前局势推进剧情。]`,
  },
};
