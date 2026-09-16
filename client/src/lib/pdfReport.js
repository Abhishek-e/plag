import { jsPDF } from "jspdf";

const COLORS = {
  heading: [30, 41, 59],
  muted: [100, 116, 139],
  body: [15, 23, 42],
  link: [37, 99, 235],
  rule: [226, 232, 240],
  plagiarized: [254, 202, 202],
  aiSuspected: [233, 213, 255],
  both: [254, 215, 170],
};

function newDoc() {
  return new jsPDF({ unit: "mm", format: "a4" });
}

function drawCoverPage(doc, result, chartImage) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFontSize(20);
  doc.setTextColor(...COLORS.heading);
  doc.setFont(undefined, "bold");
  doc.text("Plagiarism & AI Content Report", margin, 25);

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 32);
  doc.text("Turnitin Free Plagiarism Checker — free & open-source", margin, 37);

  doc.setDrawColor(...COLORS.rule);
  doc.line(margin, 41, pageWidth - margin, 41);

  let y = 54;
  doc.setFontSize(12);
  const aiFlaggedCount = result.aiAnalysis.sentenceAnalysis.filter(s => s.isFlaggedAI).length;
  const stats = [
    ["Overall Plagiarism", `${result.plagiarismPercentage}%`],
    ["Similarity Score", `${result.overallScore}%`],
    ["AI Content Likelihood", `${result.aiAnalysis.aiScore}%`],
    ["Sentences Analyzed", `${result.aiAnalysis.sentenceAnalysis.length}`],
    ["Plagiarized Sentences", `${result.plagiarizedSentences}`],
    ["AI-Suspected Sentences", `${aiFlaggedCount}`],
  ];
  stats.forEach(([label, value]) => {
    doc.setFont(undefined, "normal");
    doc.setTextColor(...COLORS.body);
    doc.text(label, margin, y);
    doc.setFont(undefined, "bold");
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += 8;
  });

  if (chartImage) {
    const size = 68;
    doc.addImage(chartImage, "PNG", pageWidth / 2 - size / 2, y + 4, size, size);
    y += size + 14;
  } else {
    y += 10;
  }

  doc.setDrawColor(...COLORS.rule);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.heading);
  doc.text("Methodology", margin, y);
  y += 6;

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  const methodology =
    "Plagiarism matches are found by searching the web for each sentence and scoring textual " +
    "similarity against fetched page content. AI-content likelihood is estimated with linguistic " +
    "heuristics inspired by publicly documented detection techniques — perplexity and burstiness " +
    "analysis, vocabulary richness, sentence-length uniformity, stock AI phrasing, and contraction " +
    "usage. Neither score is a definitive determination; both are statistical estimates intended to " +
    "support, not replace, human review.";
  const methodLines = doc.splitTextToSize(methodology, pageWidth - margin * 2);
  doc.text(methodLines, margin, y);
}

function drawLegend(doc, x, y) {
  const items = [
    { color: COLORS.plagiarized, label: "Plagiarized" },
    { color: COLORS.aiSuspected, label: "AI-Suspected" },
    { color: COLORS.both, label: "Both" },
  ];
  doc.setFontSize(9);
  let lx = x;
  items.forEach(item => {
    doc.setFillColor(...item.color);
    doc.rect(lx, y - 3, 4, 4, "F");
    doc.setTextColor(...COLORS.muted);
    doc.text(item.label, lx + 6, y);
    lx += doc.getTextWidth(item.label) + 16;
  });
}

function drawHighlightedTextPages(doc, result) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 5.5;

  doc.addPage();
  let y = margin;
  doc.setFont(undefined, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.heading);
  doc.text("Highlighted Submission", margin, y);
  y += 8;

  drawLegend(doc, margin, y);
  y += 10;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10.5);
  let x = margin;

  const newLine = () => {
    x = margin;
    y += lineHeight;
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  result.aiAnalysis.sentenceAnalysis.forEach((sentenceItem, i) => {
    const plagResult = result.results[i];
    const isPlagiarized = !!plagResult?.isPlagiarized;
    const isAI = !!sentenceItem.isFlaggedAI;

    let bg = null;
    if (isPlagiarized && isAI) bg = COLORS.both;
    else if (isPlagiarized) bg = COLORS.plagiarized;
    else if (isAI) bg = COLORS.aiSuspected;

    const words = `${sentenceItem.sentence}.`.split(/\s+/).filter(Boolean);
    words.forEach(word => {
      const wordWithSpace = `${word} `;
      const wWidth = doc.getTextWidth(wordWithSpace);
      if (x + wWidth > margin + maxWidth) {
        newLine();
      }
      if (bg) {
        doc.setFillColor(...bg);
        doc.rect(x, y - 4, wWidth, lineHeight, "F");
      }
      doc.setTextColor(...COLORS.body);
      doc.text(word, x, y);
      x += wWidth;
    });
    x += doc.getTextWidth("  ");
  });
}

function drawSourcesPage(doc, result) {
  const flagged = result.results.filter(r => r.sources && r.sources.length > 0);
  if (flagged.length === 0) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;

  doc.addPage();
  let y = margin;
  doc.setFont(undefined, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.heading);
  doc.text("Matched Sources", margin, y);
  y += 10;

  flagged.forEach(r => {
    if (y > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
    }
    doc.setFont(undefined, "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.body);
    const sentenceLines = doc.splitTextToSize(`"${r.sentence}"`, maxWidth);
    doc.text(sentenceLines, margin, y);
    y += sentenceLines.length * 5 + 2;

    doc.setFont(undefined, "normal");
    r.sources.forEach(src => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor(...COLORS.link);
      const srcLine = `- ${src.url}  (${src.similarity}% match)`;
      const srcLines = doc.splitTextToSize(srcLine, maxWidth - 4);
      doc.text(srcLines, margin + 4, y);
      y += srcLines.length * 5;
    });
    y += 4;
  });
}

export function buildReportDoc(result, chartImage) {
  const doc = newDoc();
  drawCoverPage(doc, result, chartImage);
  drawHighlightedTextPages(doc, result);
  drawSourcesPage(doc, result);
  return doc;
}

export function generateHighlightedPDF(result, chartImage) {
  const doc = buildReportDoc(result, chartImage);
  doc.save(`plagiarism-ai-report-${Date.now()}.pdf`);
}
