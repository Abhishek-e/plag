// Heuristic AI-generated-content detector.
//
// Real detectors (Turnitin, GPTZero, Copyleaks, Grammarly's authorship check)
// run proprietary classifiers trained on top of an LLM's own token
// probabilities. We don't have access to those model weights or a paid
// detection API, so this module approximates the same publicly-documented
// signals those tools describe using cheap, local statistics:
//   - burstiness (how much sentence-level "predictability" varies)
//   - vocabulary richness, measured length-independently (MATTR) so long
//     documents aren't penalized just for being long
//   - sentence-length uniformity
//   - density of stock AI transition phrases ("moreover", "delve into", ...)
//   - contraction usage (weak signal: AI writing skews formal, but so does
//     a lot of human formal writing, so this is kept low-weight)
//
// Document-level statistics (burstiness, vocabulary richness, length
// uniformity) are unreliable on short samples — a 3-sentence document
// doesn't carry enough data for a meaningful variance estimate. Those
// signals are damped toward a neutral 0.5 when there isn't enough text to
// trust them, so short inputs lean on the phrase-match signal instead of
// an overconfident statistical read. This is deliberate: without that
// damping, short and/or formal human writing (which naturally has low
// sentence-count burstiness and no contractions) was scoring as "moderate
// AI likelihood" regardless of content — not a useful signal.
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

// Moving-average type-token ratio: average lexical diversity across fixed-
// size windows, instead of one whole-document ratio. Raw whole-document TTR
// falls mechanically as a document gets longer (more words means more
// repeats of common terms), which made vocabulary "richness" mostly a proxy
// for document length rather than for AI-vs-human origin. A sliding window
// removes that confound. Short documents (under one window) fall back to a
// plain ratio since there's nothing to slide over.
function movingAverageTTR(words, windowSize = 50, stride = 10) {
  if (words.length === 0) return 0;
  if (words.length <= windowSize) {
    return new Set(words).size / words.length;
  }
  const ratios = [];
  for (let i = 0; i <= words.length - windowSize; i += stride) {
    const window = words.slice(i, i + windowSize);
    ratios.push(new Set(window).size / windowSize);
  }
  return mean(ratios);
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

  const vocabularyRichness = movingAverageTTR(totalWords);

  const aiPhraseCount = countAIPhrases(fullText);
  const phraseDensity = (aiPhraseCount / totalWords.length) * 100;

  const contractionCount = (fullText.match(CONTRACTION_RE) || []).length;
  const contractionsPerSentence = contractionCount / trimmed.length;

  // Each component is normalized to 0-1, where 1 = "more AI-like".
  const burstinessScore = clamp(1 - burstiness / 0.8, 0, 1);
  const lengthUniformityScore = clamp(1 - lengthVariability / 0.6, 0, 1);
  const vocabRichnessScore = clamp(1 - (vocabularyRichness - 0.45) / 0.35, 0, 1);
  const phraseScore = clamp(phraseDensity / 3, 0, 1);
  const contractionAbsenceScore = clamp(1 - contractionsPerSentence / 0.3, 0, 1);

  // Document-level variance stats need enough sentences to mean anything;
  // below ~15 sentences, blend them toward a neutral 0.5 rather than let a
  // noisy estimate swing the score. Contractions need less data to read
  // (a handful of sentences is enough to notice their total absence).
  const statReliability = clamp(trimmed.length / 15, 0, 1);
  const contractionReliability = clamp(trimmed.length / 8, 0, 1);
  const damp = (score, reliability) => reliability * score + (1 - reliability) * 0.5;

  const burstinessScoreAdj = damp(burstinessScore, statReliability);
  const lengthUniformityScoreAdj = damp(lengthUniformityScore, statReliability);
  const vocabRichnessScoreAdj = damp(vocabRichnessScore, statReliability);
  const contractionAbsenceScoreAdj = damp(contractionAbsenceScore, contractionReliability);

  const aiScoreRaw =
    0.35 * burstinessScoreAdj +
    0.3 * phraseScore +
    0.15 * lengthUniformityScoreAdj +
    0.12 * vocabRichnessScoreAdj +
    0.08 * contractionAbsenceScoreAdj;

  const aiScore = Math.round(clamp(aiScoreRaw, 0, 1) * 100);

  const sentenceAnalysis = trimmed.map((sentence, i) => {
    const lowerSentence = sentence.toLowerCase();
    const hasPhrase = AI_PHRASES.some((p) => lowerSentence.includes(p));

    // How close this sentence's "surprisal" sits to the document's mean,
    // relative to the document's own spread — i.e. how unremarkable it is
    // within this specific document, which is only meaningful once the
    // document has enough sentences for that spread to mean something.
    const deviation =
      perplexityStdDev === 0 ? 0 : Math.abs(perplexities[i] - avgPerplexity) / perplexityStdDev;
    const uniformityScore = clamp(1 - deviation, 0, 1);
    const uniformityScoreAdj = damp(uniformityScore, statReliability);

    const raw =
      0.45 * (hasPhrase ? 1 : 0) +
      0.3 * uniformityScoreAdj +
      0.25 * (aiScore / 100);

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
