import { z } from "zod";

export const checkTextSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
});

export const sentenceResultSchema = z.object({
  sentence: z.string(),
  similarity: z.number(),
  sources: z.array(
    z.object({
      url: z.string(),
      similarity: z.number(),
    })
  ),
  isPlagiarized: z.boolean(),
});

export const aiSentenceAnalysisSchema = z.object({
  sentence: z.string(),
  aiLikelihood: z.number(),
  isFlaggedAI: z.boolean(),
});

export const aiAnalysisSchema = z.object({
  aiScore: z.number(),
  burstiness: z.number(),
  avgPerplexity: z.number(),
  vocabularyRichness: z.number(),
  aiPhraseCount: z.number(),
  sentenceAnalysis: z.array(aiSentenceAnalysisSchema),
});

export const checkResultSchema = z.object({
  overallScore: z.number(),
  plagiarismPercentage: z.number(),
  totalSentences: z.number(),
  plagiarizedSentences: z.number(),
  results: z.array(sentenceResultSchema),
  aiAnalysis: aiAnalysisSchema,
});
