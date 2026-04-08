export interface PromptDefinition {
  id: string;
  title: string;
  category: 'Research' | 'Drafting' | 'Refinement' | 'Formatting' | 'Quality Check';
  description: string;
  inputs: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number';
    placeholder?: string;
    options?: string[];
    defaultValue?: string | number;
  }[];
  systemInstruction: string;
  promptTemplate: (vals: Record<string, any>) => string;
}

export const PROMPTS: PromptDefinition[] = [
  {
    id: 'paper-search',
    title: 'Paper Search',
    category: 'Research',
    description: 'Find real peer-reviewed papers (2018–2025) on your topic.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text', placeholder: 'e.g., Quantum Computing in Cryptography' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Find 6 real peer-reviewed papers (2018–2025) on the provided topic. For each: Title, Authors, Year, Journal, Key finding (1 sentence), DOI. Sort by relevance. Use only real published papers.',
    promptTemplate: (v) => `Find 6 real peer-reviewed papers (2018–2025) on: ${v.topic}. For each: Title, Authors, Year, Journal, Key finding (1 sentence), DOI. Sort by relevance. Use only real published papers.`
  },
  {
    id: 'gap-analysis',
    title: 'Research Gap Analysis',
    category: 'Research',
    description: 'Identify unaddressed research gaps based on a list of papers.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' },
      { id: 'papers', label: 'Paper List', type: 'textarea', placeholder: 'Paste your list of papers here...' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Find 4 research gaps not yet addressed based on the provided topic and paper list. For each gap: state the problem, why it matters, how new research could fill it. Max 80 words each.',
    promptTemplate: (v) => `Based on these papers on "${v.topic}":\n${v.papers}\n\nFind 4 research gaps not yet addressed. For each gap: state the problem, why it matters, how new research could fill it. Max 80 words each.`
  },
  {
    id: 'paper-outline',
    title: 'Full Paper Outline',
    category: 'Drafting',
    description: 'Create a comprehensive PhD research paper outline.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' },
      { id: 'wordCount', label: 'Target Word Count', type: 'number', defaultValue: 8000 }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Create a PhD research paper outline for the provided topic. Include all standard sections. For each: 3–5 sub-sections, purpose note, word count target, citation density [High/Medium/Low].',
    promptTemplate: (v) => `Create a PhD research paper outline for: ${v.topic}.\nTarget: ${v.wordCount} words.\nInclude all standard sections. For each: 3–5 sub-sections, purpose note, word count target, citation density [High/Medium/Low].`
  },
  {
    id: 'introduction',
    title: 'Introduction Section',
    category: 'Drafting',
    description: 'Write a formal 400-word introduction.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Write a formal 400-word Introduction for a research paper on the provided topic. Structure: Hook → Background → Problem statement → Research gap → Objectives → Paper structure. Vary sentence lengths. Use scholarly hedging. Flowing prose, no bullets.',
    promptTemplate: (v) => `Write a formal 400-word Introduction for a research paper on: ${v.topic}.\nStructure: Hook → Background → Problem statement → Research gap → Objectives → Paper structure.\nVary sentence lengths. Use scholarly hedging. Flowing prose, no bullets.`
  },
  {
    id: 'lit-review',
    title: 'Literature Review',
    category: 'Drafting',
    description: 'Write a thematic literature review.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Write a 600-word thematic Literature Review for the provided topic. Cite as (Author, Year). Show agreements and tensions between scholars. Do not list papers one by one — synthesize by theme. Academic prose only. No bullet points.',
    promptTemplate: (v) => `Write a 600-word thematic Literature Review for: ${v.topic}.\nCite as (Author, Year). Show agreements and tensions between scholars.\nDo not list papers one by one — synthesize by theme. Academic prose only. No bullet points.`
  },
  {
    id: 'methodology',
    title: 'Methodology Section',
    category: 'Drafting',
    description: 'Write a detailed methodology section.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' },
      { id: 'approach', label: 'Approach', type: 'select', options: ['qualitative', 'quantitative', 'mixed'], defaultValue: 'qualitative' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Write a 500-word Methodology for the provided topic. Cover: research paradigm, design, data collection, analysis method, ethics, limitations. Justify every choice. Formal academic tone. No lists.',
    promptTemplate: (v) => `Write a 500-word Methodology for: ${v.topic}.\nApproach: ${v.approach}.\nCover: research paradigm, design, data collection, analysis method, ethics, limitations.\nJustify every choice. Formal academic tone. No lists.`
  },
  {
    id: 'abstract',
    title: 'Abstract',
    category: 'Drafting',
    description: 'Write a structured academic abstract.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' },
      { id: 'method', label: 'Method Used', type: 'text' },
      { id: 'findings', label: 'Key Findings', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Write a structured Abstract for the provided topic. Sections: Background (1 sentence) → Objective → Method → Results → Conclusion. Max 250 words. Add 5 keywords at end. No first person. Dense and precise.',
    promptTemplate: (v) => `Write a structured Abstract for: ${v.topic}.\nMethod: ${v.method}. Findings: ${v.findings}.\nSections: Background (1 sentence) → Objective → Method → Results → Conclusion.\nMax 250 words. Add 5 keywords at end. No first person. Dense and precise.`
  },
  {
    id: 'discussion',
    title: 'Discussion Section',
    category: 'Drafting',
    description: 'Interpret findings and compare to literature.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' },
      { id: 'findings', label: 'Summarized Results', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Write a 500-word Discussion for the provided topic. Interpret findings, compare to existing literature, explain unexpected results, state theoretical and practical implications. Acknowledge limitations.',
    promptTemplate: (v) => `Write a 500-word Discussion for: ${v.topic}.\nFindings: ${v.findings}.\nInterpret findings, compare to existing literature, explain unexpected results, state theoretical and practical implications. Acknowledge limitations.`
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    category: 'Drafting',
    description: 'Summarize contributions and implications.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' },
      { id: 'contributions', label: 'Main Contributions', type: 'textarea', placeholder: 'List 2-3 contributions...' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Write a 300-word Conclusion for the provided topic. Structure: Restate problem briefly → Summarize findings → Contributions → Implications → Future research → Strong closing sentence. No new information. No citations.',
    promptTemplate: (v) => `Write a 300-word Conclusion for: ${v.topic}.\nMain contributions: ${v.contributions}.\nStructure: Restate problem briefly → Summarize findings → Contributions → Implications → Future research → Strong closing sentence.\nNo new information. No citations.`
  },
  {
    id: 'naturalize',
    title: 'Naturalize Prose',
    category: 'Refinement',
    description: 'Rewrite text to sound like a seasoned professor.',
    inputs: [
      { id: 'text', label: 'Text to Rewrite', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Rewrite the provided text to sound like a seasoned professor wrote it. Rules: vary sentence lengths (8–38 words), use scholarly hedging ("suggests", "appears to"), remove repetitive structures, ensure natural paragraph flow, use nuanced qualifiers. Output only the rewritten text.',
    promptTemplate: (v) => `Rewrite this text to sound like a seasoned professor wrote it.\nRules: vary sentence lengths (8–38 words), use scholarly hedging ("suggests", "appears to"), remove repetitive structures, ensure natural paragraph flow, use nuanced qualifiers.\nOutput only the rewritten text:\n\n${v.text}`
  },
  {
    id: 'quality-check',
    title: 'Writing Quality Check',
    category: 'Refinement',
    description: 'Analyze text for unnatural writing patterns.',
    inputs: [
      { id: 'text', label: 'Text to Analyze', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Analyze the provided academic text for unnatural writing patterns. Find: robotic transitions, vague qualifiers, repetitive sentence structure, missing nuance. For each issue: quote the problem → explain it → rewrite naturally. Rate overall naturalness 1–10.',
    promptTemplate: (v) => `Analyze this academic text for unnatural writing patterns.\nFind: robotic transitions, vague qualifiers, repetitive sentence structure, missing nuance.\nFor each issue: quote the problem → explain it → rewrite naturally.\nRate overall naturalness 1–10. Text: ${v.text}`
  },
  {
    id: 'apa-refs',
    title: 'APA 7th References',
    category: 'Formatting',
    description: 'Generate 15 APA 7th edition references.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Generate 15 APA 7th edition references for a paper on the provided topic. Mix: 60% journals, 25% books, 15% conference papers. Years 2015–2024. Use realistic journal names and DOIs. Numbered list, alphabetical order.',
    promptTemplate: (v) => `Generate 15 APA 7th edition references for a paper on: ${v.topic}.\nMix: 60% journals, 25% books, 15% conference papers. Years 2015–2024.\nUse realistic journal names and DOIs. Numbered list, alphabetical order.`
  },
  {
    id: 'format-refs',
    title: 'Format Existing References',
    category: 'Formatting',
    description: 'Format messy references into a specific style.',
    inputs: [
      { id: 'style', label: 'Citation Style', type: 'select', options: ['APA 7th', 'MLA 9th', 'Chicago', 'Harvard', 'Vancouver'], defaultValue: 'APA 7th' },
      { id: 'refs', label: 'Messy References', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Format the provided references in the requested style. Apply all style rules strictly. Output only the formatted numbered list, alphabetical order.',
    promptTemplate: (v) => `Format these references in ${v.style} style.\nApply all style rules strictly. Output only the formatted numbered list, alphabetical order.\n\n${v.refs}`
  },
  {
    id: 'title-gen',
    title: 'Title Generator',
    category: 'Drafting',
    description: 'Generate 8 academic paper titles.',
    inputs: [
      { id: 'topic', label: 'Research Topic', type: 'text' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Generate 8 academic paper titles for the provided topic. Include: 2 question-format, 2 colon-structured, 2 descriptive, 2 creative-academic. Mark which is strongest and explain why in one sentence.',
    promptTemplate: (v) => `Generate 8 academic paper titles for: ${v.topic}.\nInclude: 2 question-format, 2 colon-structured, 2 descriptive, 2 creative-academic.\nMark which is strongest and explain why in one sentence.`
  },
  {
    id: 'keyword-extractor',
    title: 'Keyword Extractor',
    category: 'Research',
    description: 'Extract 10 ranked keywords for indexing.',
    inputs: [
      { id: 'abstract', label: 'Abstract', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Extract 10 ranked keywords for database indexing from the provided abstract. Format: Keyword | Category (Concept/Method/Domain/Variable) | Importance (1–5). Add 5 MeSH or controlled vocabulary terms at the end.',
    promptTemplate: (v) => `Extract 10 ranked keywords for database indexing from this abstract.\nFormat: Keyword | Category (Concept/Method/Domain/Variable) | Importance (1–5).\nAdd 5 MeSH or controlled vocabulary terms at the end.\n\nAbstract: ${v.abstract}`
  },
  {
    id: 'paraphrase',
    title: 'Paraphrase for Originality',
    category: 'Refinement',
    description: 'Paraphrase text while keeping facts and citations.',
    inputs: [
      { id: 'text', label: 'Text to Paraphrase', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Paraphrase the provided text for academic use. Keep all facts and citations. Change: sentence structure, word order, phrasing. Tone: formal academic. Output only the paraphrased version.',
    promptTemplate: (v) => `Paraphrase this text for academic use. Keep all facts and citations.\nChange: sentence structure, word order, phrasing.\ Tone: formal academic. Output only the paraphrased version.\n\nText: ${v.text}`
  },
  {
    id: 'section-expander',
    title: 'Section Expander',
    category: 'Refinement',
    description: 'Expand a section with deeper analysis.',
    inputs: [
      { id: 'sectionName', label: 'Section Name', type: 'text' },
      { id: 'targetWords', label: 'Target Word Count', type: 'number', defaultValue: 500 },
      { id: 'text', label: 'Current Text', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Expand the provided section to the target word count. Add: evidence, deeper analysis, nuanced arguments, transitions. Keep same academic tone. No new sub-headings. Flowing prose only.',
    promptTemplate: (v) => `Expand this ${v.sectionName} section to approximately ${v.targetWords} words.\nAdd: evidence, deeper analysis, nuanced arguments, transitions.\nKeep same academic tone. No new sub-headings. Flowing prose only.\n\nCurrent text: ${v.text}`
  },
  {
    id: 'citation-integrator',
    title: 'Citation Integrator',
    category: 'Refinement',
    description: 'Integrate citations naturally into a paragraph.',
    inputs: [
      { id: 'citations', label: 'Citations to Use', type: 'textarea', placeholder: 'Author, Year; Author, Year...' },
      { id: 'paragraph', label: 'Paragraph', type: 'textarea' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Rewrite the provided paragraph integrating the provided citations naturally in APA 7th style. Only cite where evidence genuinely supports the claim. Keep the academic voice.',
    promptTemplate: (v) => `Rewrite this paragraph integrating these citations naturally in [APA 7th] style.\nOnly cite where evidence genuinely supports the claim. Keep the academic voice.\nCitations to use: ${v.citations}\nParagraph: ${v.paragraph}`
  },
  {
    id: 'ai-score-checker',
    title: 'AI Score Checker',
    category: 'Quality Check',
    description: 'Detect AI-generated content and humanize it if necessary.',
    inputs: [
      { id: 'text', label: 'Text to Analyze', type: 'textarea', placeholder: 'Paste your text here...' }
    ],
    systemInstruction: 'You are a senior academic writing consultant. Rewrite the provided text to sound more human while maintaining all facts and citations. Rules: mix sentence lengths (8-35 words), remove robotic transitions (Furthermore, Moreover, Additionally), add natural hedging (suggests, appears to, indicates).',
    promptTemplate: (v) => `Rewrite this text with these rules:
- Mix sentence lengths 8 to 35 words
- Remove robotic transitions: Furthermore, Moreover, Additionally
- Add natural hedging: suggests, appears to, indicates
- Keep all facts and citations unchanged

Text: ${v.text}`
  }
];
