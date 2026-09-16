// Heuristic AI-generated-content detector.
//
// Real detectors (Turnitin, GPTZero, Copyleaks, Grammarly's authorship check)
// run proprietary classifiers trained on top of an LLM's own token
// probabilities. We don't have access to those model weights or a paid
// detection API, so this module approximates the same publicly-documented
// signals those tools describe using cheap, local statistics:
//   - perplexity (how "predictable" the wording is)
//   - burstiness (how much that predictability varies sentence to sentence)
//   - vocabulary richness (type-token ratio)
//   - sentence-length uniformity
//   - density of stock AI transition phrases ("moreover", "delve into", ...)
//   - contraction usage (AI writing skews formal / avoids contractions)
//
// The result is a statistical estimate, not a definitive determination —
// this is surfaced in the UI/report copy, not just here.

import { TIER1_WORDS, TIER2_WORDS } from "./wordFrequency.js";

const AI_PHRASES = [
  "in conclusion", "in summary", "to sum up", "to summarize",
  "it is important to note", "it's important to note", "it is worth noting",
  "it is crucial to", "it is essential to", "furthermore,", "moreover,",
  "additionally,", "nevertheless,", "nonetheless,",
  "in today's world", "in today's society", "in today's digital age",
  "in the digital age", "delve into", "delving into", "dive into",
  "navigate the complexities", "navigate the landscape",
  "in the realm of", "the realm of", "a testament to", "testament to",
  "plays a pivotal role", "plays a crucial role", "plays a significant role",
  "underscores the importance", "underscore the importance",
  "boundless", "tapestry", "multifaceted", "holistic", "paradigm shift",
  "cutting-edge", "in essence", "at its core", "on the other hand",
  "that being said", "with that said", "as previously mentioned",
  "as mentioned earlier", "as a result of", "due to the fact that",
  "it can be argued that", "one could argue that", "a myriad of",
  "myriad of", "a plethora of", "plethora of", "first and foremost",
  "last but not least", "when it comes to", "shed light on",
  "shedding light on", "pave the way", "paves the way",
  "harness the power", "unlock the potential", "unleash the potential",
  "game-changer", "game changer", "revolutionize", "seamlessly",
  "ever-evolving", "ever-changing", "rapidly evolving",
];

const CONTRACTION_RE = /\b\w+'(t|re|ve|ll|d|s|m)\b/gi;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function tokenizeWords(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z']/g, ""))
    .filter(Boolean);
}

function wordSurprisal(word) {
  if (TIER1_WORDS.has(word)) return 1;
  if (TIER2_WORDS.has(word)) return 3;
  return 6;
}

// Proxy for per-sentence perplexity: average surprisal of its words.
function sentencePerplexity(sentence) {
  const words = tokenizeWords(sentence);
  if (words.length === 0) return 0;
  const total = words.reduce((sum, w) => sum + wordSurprisal(w), 0);
  return total / words.length;
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values, avg) {
  if (values.length === 0) return 0;
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

function countAIPhrases(text) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of AI_PHRASES) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      count++;
      idx = lower.indexOf(phrase, idx + phrase.length);
    }
  }
  return count;
}

export function analyzeAIContent(sentences) {
  const trimmed = sentences.map((s) => s.trim()).filter(Boolean);
  const fullText = trimmed.join(". ");
  const totalWords = tokenizeWords(fullText);

  if (trimmed.length === 0 || totalWords.length === 0) {
    return {
      aiScore: 0,
      burstiness: 0,
      avgPerplexity: 0,
      vocabularyRichness: 0,
      aiPhraseCount: 0,
      sentenceAnalysis: [],
    };
  }

  const perplexities = trimmed.map(sentencePerplexity);
  const avgPerplexity = mean(perplexities);
  const perplexityStdDev = stdDev(perplexities, avgPerplexity);
  const burstiness = avgPerplexity === 0 ? 0 : perplexityStdDev / avgPerplexity;

  const sentenceLengths = trimmed.map((s) => tokenizeWords(s).length);
  const meanLength = mean(sentenceLengths);
  const lengthStdDev = stdDev(sentenceLengths, meanLength);
  const lengthVariability = meanLength === 0 ? 0 : lengthStdDev / meanLength;

  const uniqueWords = new Set(totalWords);
  const vocabularyRichness = uniqueWords.size / totalWords.length;

  const aiPhraseCount = countAIPhrases(fullText);
  const phraseDensity = (aiPhraseCount / totalWords.length) * 100;

  const contractionCount = (fullText.match(CONTRACTION_RE) || []).length;
  const contractionsPerSentence = contractionCount / trimmed.length;

  // Each component is normalized to 0-1, where 1 = "more AI-like".
  const burstinessScore = clamp(1 - burstiness / 0.8, 0, 1);
  const perplexityScore = 1 - clamp(Math.abs(avgPerplexity - 3.5) / 3.5, 0, 1);
  const lengthUniformityScore = clamp(1 - lengthVariability / 0.6, 0, 1);
  const vocabRichnessScore = clamp(1 - (vocabularyRichness - 0.4) / 0.4, 0, 1);
  const phraseScore = clamp(phraseDensity / 3, 0, 1);
  const contractionAbsenceScore = clamp(1 - contractionsPerSentence / 0.3, 0, 1);

  const aiScoreRaw =
    0.25 * burstinessScore +
    0.1 * perplexityScore +
    0.15 * lengthUniformityScore +
    0.15 * vocabRichnessScore +
    0.2 * phraseScore +
    0.15 * contractionAbsenceScore;

  const aiScore = Math.round(clamp(aiScoreRaw, 0, 1) * 100);

  const sentenceAnalysis = trimmed.map((sentence, i) => {
    const words = tokenizeWords(sentence);
    const len = words.length;
    const lengthDeviation = meanLength === 0 ? 0 : Math.abs(len - meanLength) / meanLength;
    const lengthScore = clamp(1 - lengthDeviation, 0, 1);

    const lowerSentence = sentence.toLowerCase();
    const hasPhrase = AI_PHRASES.some((p) => lowerSentence.includes(p));

    const sentenceContractions = (sentence.match(CONTRACTION_RE) || []).length;
    const contractionScore = len > 6 && sentenceContractions === 0 ? 1 : 0;

    const raw =
      0.35 * lengthScore +
      0.35 * (hasPhrase ? 1 : 0) +
      0.15 * contractionScore +
      0.15 * (aiScore / 100);

    const aiLikelihood = Math.round(clamp(raw, 0, 1) * 100);

    return {
      sentence,
      aiLikelihood,
      isFlaggedAI: aiLikelihood >= 55,
    };
  });

  return {
    aiScore,
    burstiness: Math.round(burstiness * 100) / 100,
    avgPerplexity: Math.round(avgPerplexity * 100) / 100,
    vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
    aiPhraseCount,
    sentenceAnalysis,
  };
}
