export type DimensionKey = "ANX" | "CARE" | "AVD" | "AMB" | "CTRL" | "SEC";

export type AssessmentQuestion = {
  id: number;
  text: string;
  dimension: DimensionKey;
  reverse?: boolean;
};

export type RelationshipRole = {
  key: string;
  name: string;
  subtitle: string;
  summary: string;
  painPoints: string[];
  resonance: string[];
  advice: string[];
};

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  ANX: "依恋焦虑",
  CARE: "过度照料/讨好",
  AVD: "亲密回避",
  AMB: "靠近-逃离摆荡",
  CTRL: "控制性防御",
  SEC: "安全连接与修复",
};

export const QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: "当对方回复变慢时，我会明显不安。", dimension: "ANX" },
  { id: 2, text: "我常需要被确认“这段关系是稳定的”。", dimension: "ANX" },
  { id: 3, text: "我会反复揣测对方一句话背后的真实含义。", dimension: "ANX" },
  { id: 4, text: "我害怕自己在关系里不够重要。", dimension: "ANX" },
  { id: 5, text: "即使关系总体不错，我也常担心被抛下。", dimension: "ANX" },
  { id: 6, text: "即使短暂失联，我通常也能保持稳定感。", dimension: "ANX", reverse: true },

  { id: 7, text: "我习惯先照顾对方情绪，再考虑自己的感受。", dimension: "CARE" },
  { id: 8, text: "为了维持关系和谐，我经常压下真实需求。", dimension: "CARE" },
  { id: 9, text: "当我拒绝对方时，会有明显的内疚感。", dimension: "CARE" },
  { id: 10, text: "我容易把“被需要”当作“被爱”。", dimension: "CARE" },
  { id: 11, text: "当对方状态不好时，我会不自觉承担“修复关系”的责任。", dimension: "CARE" },
  { id: 12, text: "我能在不内疚的情况下，清楚表达“我现在做不到”。", dimension: "CARE", reverse: true },

  { id: 13, text: "关系太亲密时，我会本能地想拉开距离。", dimension: "AVD" },
  { id: 14, text: "我不太习惯向伴侣表达脆弱或依赖。", dimension: "AVD" },
  { id: 15, text: "比起谈感受，我更倾向处理“事情本身”。", dimension: "AVD" },
  { id: 16, text: "当对方需要情感支持时，我有时会感到压力或想回避。", dimension: "AVD" },
  { id: 17, text: "我更信任“自己扛”而不是“关系承接”。", dimension: "AVD" },
  { id: 18, text: "对我来说，向伴侣求助并不意味着我很弱。", dimension: "AVD", reverse: true },

  { id: 19, text: "我会在“很想靠近”和“想撤退”之间反复。", dimension: "AMB" },
  { id: 20, text: "关系稳定时，我反而会莫名焦虑或挑问题。", dimension: "AMB" },
  { id: 21, text: "冲突后我既想被安抚，又会抗拒对方靠近。", dimension: "AMB" },
  { id: 22, text: "我会用“冷淡/消失”测试对方是否在乎我。", dimension: "AMB" },
  { id: 23, text: "当我感到被忽视时，反应常比事件本身更强烈。", dimension: "AMB" },
  { id: 24, text: "我的亲密需求和边界通常比较稳定，不太极端摇摆。", dimension: "AMB", reverse: true },

  { id: 25, text: "我倾向把关系中的规则、节奏、预期定义得很清楚。", dimension: "CTRL" },
  { id: 26, text: "当关系不在预期轨道上，我会明显烦躁。", dimension: "CTRL" },
  { id: 27, text: "我会通过追问细节来确认对方是否可靠。", dimension: "CTRL" },
  { id: 28, text: "与其“慢慢磨合”，我更希望“按规则运行”。", dimension: "CTRL" },
  { id: 29, text: "在冲突中，我更在意“谁对谁错”而非彼此感受。", dimension: "CTRL" },
  { id: 30, text: "即使出现不确定性，我也能允许关系自然发展一段时间。", dimension: "CTRL", reverse: true },

  { id: 31, text: "我可以直接表达需求，而不通过试探或拉扯。", dimension: "SEC" },
  { id: 32, text: "冲突后，我能和对方一起修复，而不是长期冷战。", dimension: "SEC" },
  { id: 33, text: "我既能亲近，也能尊重彼此边界。", dimension: "SEC" },
  { id: 34, text: "我能把“对事不对人”落实到沟通中。", dimension: "SEC" },
  { id: 35, text: "我可以在情绪上来时先调节，再讨论问题。", dimension: "SEC" },
  { id: 36, text: "一旦发生矛盾，我很难再相信这段关系会变好。", dimension: "SEC", reverse: true },
];

export const ROLE_PROFILES: Record<string, RelationshipRole> = {
  ANX: {
    key: "ANX",
    name: "追爱确认者",
    subtitle: "高敏感连接型",
    summary: "你很重视关系，也更容易感知关系中的微妙变化。当不确定感出现时，你会快速进入“确认关系是否安全”的模式。",
    painPoints: ["情绪波动大，容易内耗", "把短期波动误判为关系危机", "在等待与猜测中消耗精力"],
    resonance: ["我不是想控制你，我只是怕失去。", "你一冷淡，我就会慌。"],
    advice: ["把“求确认”转成具体需求（如联系频率）", "先调节情绪再沟通，减少冲动表达", "建立关系外的稳定支点：朋友、目标、爱好"],
  },
  CARE: {
    key: "CARE",
    name: "情绪照料者",
    subtitle: "高共情付出型",
    summary: "你擅长共情与照顾，是关系中的稳定器。但你可能把“持续付出”当作维持关系的唯一方式。",
    painPoints: ["长期迁就导致隐性委屈", "边界弱，容易被过度消耗", "表达需求时伴随内疚"],
    resonance: ["我总是那个懂事的人。", "我怕说了真实想法关系就变坏。"],
    advice: ["把“照顾别人”与“忽略自己”分开", "从小边界开始练习：时间/回复/金钱", "用“我需要”替代“我都可以”"],
  },
  AVD: {
    key: "AVD",
    name: "独立防御者",
    subtitle: "边界优先型",
    summary: "你对独立和秩序有较高需求，倾向先处理问题再处理情绪。亲密过高时会触发你的防御系统。",
    painPoints: ["需要连接但又担心被侵入", "情感表达不足导致被误读", "冲突时容易沉默或撤离"],
    resonance: ["我不是不在乎，只是不擅长表达。", "你越逼近，我越有压力。"],
    advice: ["从表达事实过渡到表达感受", "设置低强度但稳定的连接仪式", "冲突时可暂停，但不要失联"],
  },
  AMB: {
    key: "AMB",
    name: "冷热拉扯者",
    subtitle: "靠近-逃离摆荡型",
    summary: "你对亲密有强烈渴望，但也对受伤高度警觉，容易出现“想靠近—又后退”的循环。",
    painPoints: ["关系稳定性差，双方都疲惫", "容易出现测试、对抗、误伤", "冲突后修复难度高"],
    resonance: ["我很想被爱，但又不太相信爱会稳定。", "我靠近时怕受伤，离开时又舍不得。"],
    advice: ["优先识别触发点：被忽视、被否定、被控制", "冲突表达使用“我感到…我需要…”", "必要时借助专业咨询做模式修通"],
  },
  CTRL: {
    key: "CTRL",
    name: "秩序主导者",
    subtitle: "控制性防御策略型",
    summary: "你擅长建立规则和节奏，以降低关系中的不确定性。这不是“坏”，而是一种自我保护方式。",
    painPoints: ["关系容易过度“项目化”", "高压时更在意控制而非连接", "对差异和模糊容忍度偏低"],
    resonance: ["我只是想把事情弄清楚。", "失控感会让我很焦虑。"],
    advice: ["识别“控制”背后的担心与恐惧", "在规则之外增加情绪对话空间", "练习协商而非单向规定"],
  },
  SEC: {
    key: "SEC",
    name: "安全共建者",
    subtitle: "稳定修复型",
    summary: "你在亲密和边界之间保持了较好平衡，具备较强沟通和修复能力，是关系长期稳定的重要保护因子。",
    painPoints: ["在高冲突关系里容易被过度消耗", "可能被误解为“太理性”", "需要警惕长期单向付出"],
    resonance: ["我们不是不冲突，而是能一起修复。", "我愿意靠近，也尊重彼此空间。"],
    advice: ["继续保持稳定沟通仪式", "为关系设置底线与止损机制", "定期回顾双方需求与边界"],
  },
};

export type AssessmentScore = Record<DimensionKey, number>;

export const scoreAssessment = (answers: Record<number, number>) => {
  const score: AssessmentScore = {
    ANX: 0,
    CARE: 0,
    AVD: 0,
    AMB: 0,
    CTRL: 0,
    SEC: 0,
  };

  for (const q of QUESTIONS) {
    const raw = answers[q.id] ?? 0;
    const val = q.reverse ? 6 - raw : raw;
    score[q.dimension] += val;
  }

  const sorted = (Object.entries(score) as [DimensionKey, number][]).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];
  const dualType = sorted[0][1] - sorted[1][1] <= 1 ? [primary, secondary] : [primary];

  return { score, sorted, primary, dualType };
};
