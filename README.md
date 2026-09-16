>[!IMPORTANT]
> The site is currently facing functional issues. If it is not working, it will be fixed soon.  
> In the meantime, if you need a [Turnitin report PDF](https://www.turnitin.com/) for anything, you can reach out to me at **[NOT NOW]**.  
> I will share the report PDF whenever I get free and see your request. Please wait patiently.  
> ⭐ Don’t forget to star the repo and support the work!

# **Turnitin Free Plagiarism Checker**

A lightweight, user-friendly plagiarism checker for those who may not have access to Turnitin. Designed to help users quickly identify potential plagiarism, this project is entirely free and open-source. It aims to assist students, educators, and professionals in ensuring content integrity.

> **Note**: While the tool is functional, it is still a simple project, and bugs or issues may be present. I created this to simplify the plagiarism detection process for everyone, so your feedback and suggestions are highly welcome. Feel free to join me in improving the tool.

### **Current Features (v4.1):**

- ✅ **Advanced Plagiarism Detection** - Multi-layer similarity analysis using web search & NLP
- ✅ **AI Content Detection** - Heuristic AI-writing likelihood score, inspired by the techniques Turnitin/GPTZero-style tools publicly describe (perplexity, burstiness, vocabulary richness, stock AI phrasing)
- ✅ **Visual Analytics** - Interactive Chart.js doughnut chart showing the originality breakdown
- ✅ **PDF Report Generation** - Download a report with a cover summary, full-text pages with plagiarism/AI highlights, and a matched-sources page
- ✅ **In-App Highlighted Preview** - See plagiarism/AI-flagged sentences highlighted before downloading
- ✅ **Modern UI** - Clean, flat design without gradients
- ✅ **Responsive Design** - Works perfectly on all devices

### **What's New in v4.1:**

- 🤖 **AI Content Detection** - New "AI Content Likelihood" score and per-sentence flags
- 📄 **Highlighted PDF Pages** - The downloaded report now reproduces your full submission with plagiarized/AI-suspected text highlighted, paginated like a Turnitin originality report
- 📊 **Updated Chart** - The doughnut chart now breaks content into Original / Plagiarized / AI-Suspected

### **What's New in v4.0:**

- 🎨 **Redesigned UI** - Modern flat design with better color combinations
- 📊 **Visual Analytics** - Doughnut charts showing plagiarism distribution
- 📄 **PDF Reports** - One-click download of detailed analysis reports


### **Why Use Plagiarism Checker?**

It is a **free** alternative for plagiarism detection, ideal if you don’t have access to Turnitin or other paid tools. Quickly upload your content, check for potential matches, and generate a PDF report of the results. Whether you're a student ensuring originality or an educator verifying content integrity, it provides an easy-to-use platform.


### **How It Works:**

1. **Paste Your Text**: Enter at least 100 characters into the text box.
2. **Check for Plagiarism**: Click the **"Check Plagiarism"** button to start analyzing your content.
3. **Review Results**: Plagiarism matches and AI-suspected sentences are highlighted based on their score.
4. **Generate a PDF Report**: Download a report with the highlighted submission included as its own pages.

### **How AI Content Detection Works:**

We don't have access to a proprietary detector model or a paid detection API, so the "AI Content Likelihood"
score is a transparent, local heuristic rather than a black-box classifier. It combines several signals that
Turnitin, GPTZero, and similar tools have publicly described using:

- **Perplexity** - how predictable the word choices are, approximated from word-frequency tiers
- **Burstiness** - how much that predictability varies sentence to sentence (human writing tends to be "burstier")
- **Vocabulary richness** - type-token ratio across the submission
- **Sentence-length uniformity** - AI writing tends toward more consistent sentence lengths
- **Stock AI phrasing** - density of common AI transition phrases (e.g. "furthermore," "delve into," "in conclusion")
- **Contraction usage** - AI writing skews formal and tends to avoid contractions

These signals are combined into a 0-100 score and a per-sentence flag. It's a statistical estimate meant to
support human judgment, not a definitive determination — treat it the same way you'd treat any AI detector.

### **Contributing & Feedback:**

I would love for you to contribute to this project! Here’s how you can help:

- **Fork the Repository**: Make a personal copy to work on.
- **Open Issues**: Report bugs or suggest new features.
- **Submit Pull Requests**: Help improve the project with your code contributions.

### **Contribution Guidelines**: 

For detailed instructions on how to contribute, please see [CONTRIBUTING.md](./CONTRIBUTING.md).

### **Credits & Acknowledgments:**

- **Turnitin**: The inspiration behind this project.
- **Chart.js**: For integrating beautiful charts.
- **jsPDF**: For seamless PDF report generation.

### **Join the Project**

If you’re interested in contributing to this project, your ideas, suggestions, and coding skills are more than welcome. Let’s build a better plagiarism detection tool together!

---

> **Caution**: This is a personal project created to make plagiarism checking easy and accessible. It is not a replacement for professional tools like Turnitin but a free option for those in need. Please note that it may have bugs or limitations, but I’m constantly working to improve it.
