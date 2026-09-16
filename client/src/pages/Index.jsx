import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSearch, AlertCircle, FileDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkTextSchema } from "../../../shared/schema";
import { generateHighlightedPDF } from "@/lib/pdfReport";
import Chart from "chart.js/auto";

const Index = () => {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const {
    toast
  } = useToast();
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const handleCheck = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to check",
        variant: "destructive"
      });
      return;
    }

    // Validate using Zod schema
    const validation = checkTextSchema.safeParse({ text });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Validation failed";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setResult(null);
    try {
      const response = await fetch('/api/plagiarism-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text
        })
      });
      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }
      const data = await response.json();
      setResult(data);
      toast({
        title: "Check Complete",
        description: `Plagiarism score: ${data.plagiarismPercentage}% · AI content likelihood: ${data.aiAnalysis?.aiScore ?? 0}%`
      });
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      toast({
        title: "Error",
        description: "Failed to check plagiarism. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getScoreColor = score => {
    if (score < 20) return "text-green-600 dark:text-green-400";
    if (score < 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAILabel = score => {
    if (score < 30) return "Low";
    if (score < 60) return "Moderate";
    return "High";
  };

  // Merge plagiarism results (limited to the first 20 web-checked
  // sentences) with the AI analysis (covers the full submission) into one
  // per-sentence list for highlighting.
  const mergedSentences = result
    ? result.aiAnalysis.sentenceAnalysis.map((aiItem, i) => {
        const plagItem = result.results[i];
        return {
          sentence: aiItem.sentence,
          isPlagiarized: !!plagItem?.isPlagiarized,
          isFlaggedAI: aiItem.isFlaggedAI,
        };
      })
    : [];

  const highlightClass = item => {
    if (item.isPlagiarized && item.isFlaggedAI) return "bg-orange-200 dark:bg-orange-900/50";
    if (item.isPlagiarized) return "bg-red-200 dark:bg-red-900/50";
    if (item.isFlaggedAI) return "bg-purple-200 dark:bg-purple-900/50";
    return "";
  };

  useEffect(() => {
    if (!result || !chartCanvasRef.current) return;

    let plagiarized = 0;
    let aiSuspected = 0;
    let original = 0;
    mergedSentences.forEach(item => {
      if (item.isPlagiarized) plagiarized++;
      else if (item.isFlaggedAI) aiSuspected++;
      else original++;
    });

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    chartInstanceRef.current = new Chart(chartCanvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Original", "Plagiarized", "AI-Suspected"],
        datasets: [{
          data: [original, plagiarized, aiSuspected],
          backgroundColor: ["#16a34a", "#dc2626", "#9333ea"],
          borderWidth: 0,
        }],
      },
      options: {
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } },
        },
        maintainAspectRatio: true,
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleDownloadPDF = () => {
    if (!result) return;
    const chartImage = chartInstanceRef.current?.toBase64Image();
    generateHighlightedPDF(result, chartImage);
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <FileSearch className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Academic Plagiarism Checker
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Free plagiarism and AI-content detection using web similarity analysis and linguistic heuristics
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-2" data-testid="card-input">
            <CardHeader>
              <CardTitle>Enter Your Text</CardTitle>
              <CardDescription>
                Paste your text below to check for plagiarism against internet sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea data-testid="input-text" placeholder="Paste your text here (minimum 100 characters)..." value={text} onChange={e => setText(e.target.value)} className="min-h-[200px] text-base" />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground" data-testid="text-character-count">
                  {text.length} characters
                </p>
                <Button data-testid="button-check-plagiarism" onClick={handleCheck} disabled={isChecking || text.length < 100} size="lg">
                  {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isChecking ? "Checking..." : "Check Plagiarism"}
                </Button>
              </div>

              {isChecking && <Alert data-testid="alert-checking">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This may take 30-60 seconds as we search the web and compare your text...
                  </AlertDescription>
                </Alert>}
            </CardContent>
          </Card>

          {result && <div className="mt-8 space-y-6">
              <Card className="shadow-xl border-2" data-testid="card-report">
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Plagiarism &amp; AI Content Report</CardTitle>
                  </div>
                  <Button variant="outline" onClick={handleDownloadPDF} data-testid="button-download-pdf">
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF Report
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-secondary rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">Overall Plagiarism</p>
                      <p className={`text-5xl font-bold ${getScoreColor(result.plagiarismPercentage)}`} data-testid="text-plagiarism-percentage">
                        {result.plagiarismPercentage}%
                      </p>
                    </div>
                    <div className="text-center p-6 bg-secondary rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">Similarity Score</p>
                      <p className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`} data-testid="text-overall-score">
                        {result.overallScore}%
                      </p>
                    </div>
                    <div className="text-center p-6 bg-secondary rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">AI Content Likelihood</p>
                      <p className={`text-5xl font-bold ${getScoreColor(result.aiAnalysis.aiScore)}`} data-testid="text-ai-score">
                        {result.aiAnalysis.aiScore}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{getAILabel(result.aiAnalysis.aiScore)} likelihood</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sentences Analyzed</span>
                      <span className="font-semibold" data-testid="text-total-sentences">{mergedSentences.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Plagiarized Sentences</span>
                      <span className="font-semibold text-red-600 dark:text-red-400" data-testid="text-plagiarized-sentences">{result.plagiarizedSentences}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI-Suspected Sentences</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400" data-testid="text-ai-flagged-sentences">
                        {mergedSentences.filter(item => item.isFlaggedAI).length}
                      </span>
                    </div>
                    <Progress value={result.plagiarizedSentences / result.totalSentences * 100} className="h-2" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[260px]">
                        <canvas ref={chartCanvasRef} data-testid="chart-content-breakdown" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI likelihood is estimated with linguistic heuristics inspired by publicly documented
                      detection techniques — perplexity and burstiness analysis, vocabulary richness,
                      sentence-length uniformity, stock AI phrasing, and contraction usage. It is a
                      statistical estimate, not a definitive determination, and should be used alongside
                      human judgment.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2" data-testid="card-highlighted-text">
                <CardHeader>
                  <CardTitle>Highlighted Submission</CardTitle>
                  <CardDescription>
                    Full text with plagiarism and AI-content flags — also included as PDF pages in the downloaded report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/50 inline-block" /> Plagiarized</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-200 dark:bg-purple-900/50 inline-block" /> AI-Suspected</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900/50 inline-block" /> Both</span>
                  </div>
                  <div className="leading-relaxed text-sm p-4 bg-secondary/50 rounded-md" data-testid="text-highlighted-submission">
                    {mergedSentences.map((item, index) => <span key={index} className={highlightClass(item)}>
                        {item.sentence}.{" "}
                      </span>)}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2" data-testid="card-details">
                <CardHeader>
                  <CardTitle>Detailed Results</CardTitle>
                  <CardDescription>Sentence-by-sentence analysis with sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.results.map((item, index) => <div key={index} data-testid={`result-sentence-${index}`} className={`p-4 rounded-md border-2 ${item.isPlagiarized ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"}`}>
                        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                          <p className="text-sm font-medium flex-1" data-testid={`text-sentence-${index}`}>{item.sentence}</p>
                          <div className="flex items-center gap-2">
                            <span data-testid={`badge-similarity-${index}`} className={`px-3 py-1 rounded-full text-sm font-bold ${item.isPlagiarized ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
                              {item.similarity}%
                            </span>
                            {result.aiAnalysis.sentenceAnalysis[index]?.isFlaggedAI && <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-600 text-white" data-testid={`badge-ai-${index}`}>
                                AI {result.aiAnalysis.sentenceAnalysis[index].aiLikelihood}%
                              </span>}
                          </div>
                        </div>
                        {item.sources.length > 0 && <div className="mt-2 pt-2 border-t border-current/20">
                            <p className="text-xs font-semibold mb-1">Potential Sources:</p>
                            <div className="space-y-1">
                              {item.sources.map((source, idx) => <div key={idx} className="flex items-start gap-2">
                                  <a href={source.url} target="_blank" rel="noopener noreferrer" data-testid={`link-source-${index}-${idx}`} className={`flex-1 text-xs hover:underline truncate ${source.similarity >= 50 ? "text-red-600 dark:text-red-400 font-semibold" : "text-orange-600 dark:text-orange-400"}`}>
                                    {source.url}
                                  </a>
                                  <span className={`text-xs font-bold ${source.similarity >= 50 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`} data-testid={`text-source-similarity-${index}-${idx}`}>
                                    {source.similarity}%
                                  </span>
                                </div>)}
                            </div>
                          </div>}
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>}
        </div>
      </div>
    </div>;
};
export default Index;
