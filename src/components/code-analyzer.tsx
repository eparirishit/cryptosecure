"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Bug, 
  ShieldAlert, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  AlertOctagon,
  Wand2,
  Pencil,
  Upload,
  FileCode,
  X,
  FileText,
  ArrowRight,
  Shield,
  Award,
  FileCheck,
  Download
} from "lucide-react";
import { AnalysisResult, Finding, HackerModeResult } from "@/types/analysis";
import { CodeDiffViewer } from "@/components/code-diff-viewer";
import { HackerModeResults } from "@/components/hacker-mode-results";
import { pdf } from "@react-pdf/renderer";
import { PdfReport } from "@/components/pdf-report";
import { HackerPdfReport } from "@/components/hacker-pdf-report";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { detectLanguage } from "@/lib/analyzer/prompts";

// Helper to map severity to display name
const getSeverityDisplayName = (severity: string): string => {
  const map: Record<string, string> = {
    "CRITICAL": "Critical",
    "HIGH": "High",
    "MEDIUM": "Medium",
    "LOW": "Low",
    "INFORMATIONAL": "Informational"
  };
  return map[severity] || severity;
};

// Internal Component for Severity Section (Accordion)
const SeveritySection = ({ 
  severity, 
  count, 
  findings, 
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
  originalCode
}: { 
  severity: string, 
  count: number, 
  findings: Finding[],
  icon: any,
  colorClass: string,
  bgClass: string,
  borderClass: string,
  originalCode: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Don't render empty sections
  if (count === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-full flex items-center justify-between p-4 ${bgClass} hover:brightness-95 transition-all`}
       >
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            <span className="font-semibold text-lg">{getSeverityDisplayName(severity)} Severity</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold bg-black/5 dark:bg-white/10 border border-black/5`}>
              {count}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4 opacity-50"/> : <ChevronDown className="h-4 w-4 opacity-50"/>}
          </div>
       </button>
       
       {isOpen && (
         <div className="p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t">
            {findings.map((finding) => (
              <div key={finding.id} className={`bg-white dark:bg-neutral-900 p-4 rounded-lg border-l-4 shadow-sm ${borderClass}`}>
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-base">{finding.title}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {finding.id}
                        </span>
                        {finding.category && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {finding.category}
                          </span>
                        )}
                      </div>
                      {finding.status && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          finding.status === "Fixed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          finding.status === "Mitigated" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}>
                          {finding.status}
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-4">
                        <span className="text-xs font-mono opacity-60 block bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            {finding.codeChanges.function || "global"}:{finding.codeChanges.startLine}
                            {finding.codeChanges.endLine !== finding.codeChanges.startLine ? `-${finding.codeChanges.endLine}` : ""}
                        </span>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                     <div>
                         <h5 className={`text-xs font-bold uppercase mb-1 ${colorClass} opacity-80`}>Description</h5>
                         <p className="text-sm opacity-90">{finding.description}</p>
                     </div>

                     {finding.impact && (
                         <div>
                             <h5 className={`text-xs font-bold uppercase mb-1 ${colorClass} opacity-80`}>Impact</h5>
                             <p className="text-sm opacity-90">{finding.impact}</p>
                         </div>
                     )}

                     {finding.exploitScenario && (
                         <div className="border-l-2 border-blue-400 pl-3 py-1 my-2">
                             <h5 className="text-xs font-bold uppercase mb-1 text-blue-600">Exploit Scenario</h5>
                             <p className="text-sm opacity-90 text-neutral-600 dark:text-neutral-400">{finding.exploitScenario}</p>
                         </div>
                     )}
                     
                     {finding.codeChanges.vulnerableCode && (
                        <div>
                            <h5 className="text-xs font-bold uppercase mb-1 text-red-600 opacity-80">Affected Code</h5>
                            <div className="bg-neutral-100 dark:bg-neutral-950 p-3 rounded border border-red-100 dark:border-red-900/30">
                                {finding.codeChanges.function && (
                                    <div className="text-xs font-mono text-neutral-500 mb-1">function {finding.codeChanges.function}() &#123;</div>
                                )}
                                <code className="text-sm font-mono block whitespace-pre-wrap text-red-700 dark:text-red-400">
                                    {finding.codeChanges.vulnerableCode}
                                </code>
                                {finding.codeChanges.function && (
                                    <div className="text-xs font-mono text-neutral-500 mt-1">&#125;</div>
                                )}
                            </div>
                        </div>
                     )}

                     {finding.codeChanges && finding.codeChanges.fixedCode && (
                        <div>
                            <h5 className="text-xs font-bold uppercase mb-1 text-green-600 opacity-80">Fixed Code</h5>
                            <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded border border-green-100 dark:border-green-900/30">
                                <code className="text-sm font-mono block whitespace-pre-wrap text-green-700 dark:text-green-400">
                                    {finding.codeChanges.fixedCode}
                                </code>
                            </div>
                            {finding.codeChanges.changeDescription && (
                                <div className="text-xs text-neutral-600 dark:text-neutral-400 italic mt-2">
                                    {finding.codeChanges.changeDescription}
                                </div>
                            )}
                        </div>
                     )}

                     {(finding.references && finding.references.length > 0) && (
                        <div>
                            <h5 className="text-xs font-bold uppercase mb-1 text-neutral-600 opacity-80">References</h5>
                            <ul className="text-xs space-y-1">
                                {finding.references.map((ref, idx) => (
                                    <li key={idx} className="text-blue-600 dark:text-blue-400">
                                        <a href={ref} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {ref}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                     )}

                     {finding.cwe && (
                        <div className="text-xs text-neutral-500">
                            <span className="font-semibold">CWE:</span> {finding.cwe}
                        </div>
                     )}
                 </div>
              </div>
            ))}
         </div>
       )}
    </div>
  )
}

// File size limit: 1MB (1024 * 1024 bytes)
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ['.tact', '.fc', '.func'];
const ALLOWED_LANGUAGES = ['tact', 'fc', 'func'] as const;
type LanguageType = typeof ALLOWED_LANGUAGES[number];

// Validate file type
const isValidFileType = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return ALLOWED_FILE_TYPES.includes(extension);
};

// Validate file size
const isValidFileSize = (fileSize: number): boolean => {
  return fileSize <= MAX_FILE_SIZE;
};

// Validate language type
const isValidLanguage = (language: string | LanguageType | ""): boolean => {
  if (!language || language === "") return false;
  return ALLOWED_LANGUAGES.includes(language.toLowerCase() as LanguageType);
};

// Auto-detect language using the detectLanguage helper and map to LanguageType
const autoDetectLanguage = (code: string): { language: LanguageType | null; error: string | null } => {
  if (!code.trim()) {
    return { language: null, error: null };
  }

  const detected = detectLanguage(code);
  
  // Map detected language to our LanguageType
  const languageMap: Record<string, LanguageType> = {
    'FunC': 'func',
    'Tact': 'tact',
  };
  
  const mappedLanguage = languageMap[detected];
  
  if (mappedLanguage) {
    return { language: mappedLanguage, error: null };
  }
  
  // If detected is 'Unknown' or not supported, return error
  if (detected === 'Unknown') {
    return { 
      language: null, 
      error: 'Unable to auto-detect language. Please manually select a language type (Tact, FC, or Func).' 
    };
  }
  
  // For any other case, return error
  return { 
    language: null, 
    error: `Detected language "${detected}" is not supported. Supported languages are: Tact, FC, or Func. Please select one manually.` 
  };
};

// Detect code language from content
const detectCodeLanguage = (code: string): string | null => {
  const codeLower = code.toLowerCase().trim();
  
  // Check for Solidity patterns
  if (codeLower.includes('pragma solidity') || 
      codeLower.includes('contract ') || 
      codeLower.includes('library ') ||
      codeLower.includes('interface ') ||
      codeLower.includes('using ') ||
      codeLower.includes('modifier ') ||
      codeLower.includes('event ') ||
      codeLower.includes('enum ')) {
    return 'solidity';
  }
  
  // Check for Tact patterns
  if (codeLower.includes('import "@stdlib/') ||
      codeLower.includes('import std::') ||
      codeLower.includes('message ') ||
      codeLower.includes('init()') ||
      codeLower.includes('get()') ||
      codeLower.includes('receive()')) {
    return 'tact';
  }
  
  // Check for FunC patterns
  if (codeLower.includes('() recv_internal') ||
      codeLower.includes('() recv_external') ||
      codeLower.includes('() recv') ||
      codeLower.includes('() get_method_name') ||
      codeLower.includes('() get_balance') ||
      codeLower.includes('() throw_unless') ||
      codeLower.includes('() throw_if') ||
      codeLower.includes('() throw') ||
      codeLower.includes('() slice') ||
      codeLower.includes('() load_') ||
      codeLower.includes('() store_')) {
    return 'func';
  }
  
  // Check for FC patterns (Fift Continuation)
  if (codeLower.includes('{') && codeLower.includes('}') && 
      (codeLower.includes('dup') || codeLower.includes('swap') || codeLower.includes('rot'))) {
    return 'fc';
  }
  
  return null;
};

// Validate code matches selected language
const validateCodeLanguage = (code: string, selectedLanguage: string): { valid: boolean; message?: string } => {
  if (!code.trim() || !selectedLanguage) {
    return { valid: true }; // No validation needed if empty
  }
  
  const detectedLanguage = detectCodeLanguage(code);
  
  if (!detectedLanguage) {
    return { valid: true }; // Can't detect, allow it
  }
  
  // Map detected language to our language types
  const languageMap: Record<string, LanguageType> = {
    'solidity': 'func', // Solidity is not in our allowed list, but we'll treat it as invalid
    'tact': 'tact',
    'func': 'func',
    'fc': 'fc'
  };
  
  const mappedLanguage = languageMap[detectedLanguage];
  
  // If detected language doesn't match selected language
  if (mappedLanguage && mappedLanguage !== selectedLanguage.toLowerCase()) {
    if (detectedLanguage === 'solidity') {
      return { 
        valid: false, 
        message: `Detected Solidity code, but selected language is ${selectedLanguage.toUpperCase()}. Please select the correct language or paste ${selectedLanguage.toUpperCase()} code.` 
      };
    }
    return { 
      valid: false, 
      message: `Code appears to be ${detectedLanguage.toUpperCase()}, but selected language is ${selectedLanguage.toUpperCase()}. Please select the correct language.` 
    };
  }
  
  return { valid: true };
};

export function CodeAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Progress steps
  const progressSteps = [
    { 
      title: "Parsing contract code", 
      description: "Reading and validating syntax",
      duration: 1500 
    },
    { 
      title: "Analyzing contract logic", 
      description: "Identifying functions and patterns",
      duration: 2000 
    },
    { 
      title: "Scanning for vulnerabilities", 
      description: "Checking security patterns",
      duration: 2500 
    },
    { 
      title: "Generating security report", 
      description: "Compiling findings",
      duration: 1500 
    },
  ];

  const [showDiff, setShowDiff] = useState(false);
  const [isEditingFix, setIsEditingFix] = useState(false);
  const [modifiedFix, setModifiedFix] = useState("");
  const [diffViewMode, setDiffViewMode] = useState<"unified" | "side-by-side">("unified");

  // Refs for sync scrolling
  const diffViewerRef = useRef<{ scrollTo: (top: number) => void }>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const isScrollingRef = useRef<boolean>(false);

  // Upload/Snippet State
  const [activeTab, setActiveTab] = useState<"upload" | "snippet">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string>("");
  const [snippetCode, setSnippetCode] = useState<string>("");
  const [snippetLanguage, setSnippetLanguage] = useState<LanguageType | "">("");
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null);
  const [isHacking, setIsHacking] = useState(false);
  const [hackerResult, setHackerResult] = useState<HackerModeResult | null>(null);
  const [hackerStep, setHackerStep] = useState(0);
  const [isGeneratingHackerPdf, setIsGeneratingHackerPdf] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressCancelledRef = useRef(false);

  // Clear validation errors when code is cleared
  useEffect(() => {
    if (!snippetCode.trim()) {
      setCodeValidationError(null);
      if (activeTab === "snippet") {
        setError(null);
      }
    }
  }, [snippetCode, activeTab]);

  // Get the current code based on active tab
  const getCurrentCode = () => {
    return activeTab === "upload" ? uploadedFileContent : snippetCode;
  };

  // Check if scan button should be enabled
  const canScan = () => {
    if (activeTab === "upload") {
      return uploadedFile !== null && uploadedFileContent.trim() !== "";
    } else {
      // For snippet tab: need both code and valid language, and no validation errors
      const hasCode = snippetCode.trim() !== "";
      const hasValidLanguage = snippetLanguage !== "" && isValidLanguage(snippetLanguage);
      const hasNoValidationError = !codeValidationError;
      return hasCode && hasValidLanguage && hasNoValidationError;
    }
  };

  // Handle tab switch - clear the other tab's data
  const handleTabSwitch = (tab: "upload" | "snippet") => {
    if (tab === "upload") {
      // Switching to upload - clear snippet data
      setSnippetCode("");
      setSnippetLanguage("");
      setCodeValidationError(null);
    } else {
      // Switching to snippet - clear upload data
      setUploadedFile(null);
      setUploadedFileContent("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setActiveTab(tab);
    setResult(null);
    setError(null);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!isValidFileType(file.name)) {
      setError(`Invalid file type. Please upload ${ALLOWED_FILE_TYPES.join(', ')} files only.`);
      return;
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      setError(`File size exceeds the limit of ${maxSizeMB}MB. Please upload a smaller file.`);
      return;
    }

    setError(null);
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFileContent(content);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDiffScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      if (editorRef.current) {
          editorRef.current.scrollTop = e.currentTarget.scrollTop;
      }
      setTimeout(() => { isScrollingRef.current = false; }, 10);
  };

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      if (diffViewerRef.current) {
          diffViewerRef.current.scrollTo(e.currentTarget.scrollTop);
      }
      setTimeout(() => { isScrollingRef.current = false; }, 10);
  };

  const handleAnalyze = async () => {
    const currentCode = getCurrentCode();
    if (!currentCode.trim() || !canScan()) {
      if (activeTab === "snippet" && !snippetLanguage) {
        setError("Please select a language type before analyzing.");
      }
      return;
    }
    
    // Validate snippet language if in snippet tab
    if (activeTab === "snippet") {
      if (!snippetLanguage || !isValidLanguage(snippetLanguage)) {
        setError("Please select a valid language type (Tact, FC, or Func).");
        return;
      }
      
      // Validate code matches selected language
      const validation = validateCodeLanguage(currentCode, snippetLanguage);
      if (!validation.valid) {
        setError(validation.message || "Code language doesn't match selected language. Please select the correct language.");
        return;
      }
    }
    
    setIsAnalyzing(true);
    setResult(null);
    setHackerResult(null); // Clear previous hacker results to ensure fresh state
    setError(null);
    setShowDiff(false);
    setIsEditingFix(false);
    setCurrentStep(0);

    try {
      progressCancelledRef.current = false;
      
      // Start progress simulation
      const progressPromise = (async () => {
        for (let i = 0; i < progressSteps.length; i++) {
          if (progressCancelledRef.current) break;
          setCurrentStep(i);
          await new Promise(resolve => setTimeout(resolve, progressSteps[i].duration));
        }
        if (!progressCancelledRef.current) {
          setCurrentStep(progressSteps.length - 1);
        }
      })();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: currentCode,
          filename: activeTab === "upload" ? uploadedFile?.name : undefined,
          contractName: activeTab === "snippet" ? "contract" : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Analysis failed");
      }

      // Cancel progress and show results after minimum delay
      progressCancelledRef.current = true;
      setCurrentStep(progressSteps.length - 1);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
      setCurrentStep(0);
      progressCancelledRef.current = false;
    }
  };

  // Normalize code for comparison
  const normalizeCode = (code: string): string => {
    return code
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');
  };

  // Find the position of vulnerable code in the original code
  const findCodePosition = (originalCode: string, vulnerableCode: string): { startIdx: number; endIdx: number } | null => {
    const normalizedOriginal = normalizeCode(originalCode);
    const normalizedVulnerable = normalizeCode(vulnerableCode);
    
    // Try to find exact match first
    const exactMatch = normalizedOriginal.indexOf(normalizedVulnerable);
    if (exactMatch !== -1) {
      // Calculate line indices
      const beforeMatch = normalizedOriginal.substring(0, exactMatch);
      const startLine = beforeMatch.split('\n').length - 1;
      const endLine = startLine + normalizedVulnerable.split('\n').length - 1;
      
      return {
        startIdx: startLine,
        endIdx: endLine
      };
    }
    
    // Try to find by matching lines (more flexible)
    const originalLines = normalizedOriginal.split('\n');
    const vulnerableLines = normalizedVulnerable.split('\n').filter(line => line.trim().length > 0);
    
    if (vulnerableLines.length === 0) return null;
    
    // Find the first matching line
    for (let i = 0; i < originalLines.length; i++) {
      const originalLine = originalLines[i].trim();
      const firstVulnerableLine = vulnerableLines[0].trim();
      
      if (originalLine.includes(firstVulnerableLine) || firstVulnerableLine.includes(originalLine)) {
        // Check if subsequent lines match
        let matchCount = 0;
        for (let j = 0; j < vulnerableLines.length && (i + j) < originalLines.length; j++) {
          const origLine = originalLines[i + j].trim();
          const vulnLine = vulnerableLines[j].trim();
          
          if (origLine.includes(vulnLine) || vulnLine.includes(origLine) || origLine === vulnLine) {
            matchCount++;
          } else {
            break;
          }
        }
        
        // If we matched at least 80% of the vulnerable lines, consider it a match
        if (matchCount >= Math.ceil(vulnerableLines.length * 0.8)) {
          return {
            startIdx: i,
            endIdx: i + matchCount - 1
          };
        }
      }
    }
    
    return null;
  };

  // Apply all code changes from findings to generate complete modified code
  const applyAllFixes = (originalCode: string, findings: Finding[]): string => {
    const codeLines = originalCode.split('\n');
    const findingsWithChanges = findings
      .filter(f => f.codeChanges && f.codeChanges.vulnerableCode)
      .map(finding => {
        if (!finding.codeChanges) return null;
        
        // Use code from codeChanges (complete code fields are now at root level)
        const vulnerableCodeToMatch = finding.codeChanges.vulnerableCode;
        const fixedCodeToUse = finding.codeChanges.fixedCode;
        
        if (!vulnerableCodeToMatch || !fixedCodeToUse) {
          console.warn(`Finding ${finding.id}: Missing required code fields. Skipping.`);
          return null;
        }
        
        // Try to find the code position by content matching
        const position = findCodePosition(originalCode, vulnerableCodeToMatch);
        
        // Fallback to line numbers if content matching fails
        let startIdx: number;
        let endIdx: number;
        
        if (position) {
          startIdx = position.startIdx;
          endIdx = position.endIdx;
        } else if (finding.codeChanges.startLine && finding.codeChanges.endLine) {
          // Use line numbers as fallback, but validate they're within bounds
          startIdx = Math.max(0, finding.codeChanges.startLine - 1);
          endIdx = Math.min(codeLines.length - 1, finding.codeChanges.endLine - 1);
          
          // Validate that the code at these lines roughly matches
          const codeAtLines = codeLines.slice(startIdx, endIdx + 1).join('\n');
          const normalizedCodeAtLines = normalizeCode(codeAtLines);
          const normalizedVulnerable = normalizeCode(vulnerableCodeToMatch);
          
          // If the code doesn't match at all, skip this finding
          if (!normalizedCodeAtLines.includes(normalizedVulnerable) && 
              !normalizedVulnerable.includes(normalizedCodeAtLines)) {
            console.warn(`Finding ${finding.id}: Code at lines ${startIdx + 1}-${endIdx + 1} doesn't match vulnerable code. Skipping.`);
            return null;
          }
        } else {
          console.warn(`Finding ${finding.id}: No valid position found. Skipping.`);
          return null;
        }
        
        return {
          finding,
          startIdx,
          endIdx,
          fixedCode: fixedCodeToUse
        };
      })
      .filter((item): item is { finding: Finding; startIdx: number; endIdx: number; fixedCode: string } => item !== null)
      .sort((a, b) => {
        // Sort by start index descending to avoid offset issues when applying changes
        return b.startIdx - a.startIdx;
      });

    let modifiedLines = [...codeLines];

    for (const { startIdx, endIdx, fixedCode } of findingsWithChanges) {
      // Split fixed code into lines
      const fixedLines = fixedCode.split('\n');
      
      // Replace the lines (endIdx is inclusive, so we need endIdx - startIdx + 1)
      const linesToRemove = endIdx - startIdx + 1;
      modifiedLines.splice(startIdx, linesToRemove, ...fixedLines);
    }

    return modifiedLines.join('\n');
  };

  const handleReviewClick = () => {
      if (!result) {
          return;
      }
      
      const originalCode = getCurrentCode();
      
      // Prefer root-level complete code fields if available (more accurate)
      let completeModifiedCode: string;
      
      if (result.proposedCodeComplete) {
          // Use the complete fixed code from root level (most accurate)
          completeModifiedCode = result.proposedCodeComplete;
      } else if (result.findings.some(f => f.codeChanges)) {
          // Fallback to applying fixes from individual findings
          completeModifiedCode = applyAllFixes(originalCode, result.findings);
      } else {
          // No fixes available
          return;
      }
      
      setModifiedFix(completeModifiedCode);
      setShowDiff(true);
      setIsEditingFix(false);
  };

  const handleAcceptFix = () => {
      if (activeTab === "upload") {
          setActiveTab("snippet");
      }
      
      // Auto-detect and set language using detectLanguage helper
      const { language: detectedLang, error: detectionError } = autoDetectLanguage(modifiedFix);
      
      if (detectedLang) {
          // Auto-select the detected language
          setSnippetLanguage(detectedLang);
          setCodeValidationError(null);
          setError(null);
      } else if (detectionError) {
          // Show validation error if language is not supported
          setCodeValidationError(detectionError);
          setError(detectionError);
      }
      
      setSnippetCode(modifiedFix);
      setShowDiff(false);
      setIsEditingFix(false);
      setResult(null); 
  };

  const hackerProgressSteps = [
    { title: "Enumerating attack surfaces...", duration: 1500 },
    { title: "Generating exploit strategies...", duration: 2000 },
    { title: "Validating attack feasibility...", duration: 1500 },
    { title: "Preparing defensive recommendations...", duration: 1000 }
  ];

  const handleHackerMode = async () => {
    const currentCode = getCurrentCode();
    if (!currentCode.trim()) {
      return;
    }

    // Capture vulnerability data before clearing state
    const capturedFindings = result?.findings || [];
    const capturedVulnerabilityScore = result?.securityScore ?? null;

    setIsHacking(true);
    setHackerResult(null);
    setResult(null); // Clear previous standard results to ensure fresh state
    setHackerStep(0);
    setShowDiff(false);
    setIsEditingFix(false);

    try {
      const language = activeTab === "snippet" && snippetLanguage
        ? snippetLanguage
        : uploadedFile?.name.split('.').pop()?.toLowerCase() || "func";

      // Progress simulation
      const progressPromise = (async () => {
        for (let i = 0; i < hackerProgressSteps.length; i++) {
          setHackerStep(i);
          await new Promise(resolve => setTimeout(resolve, hackerProgressSteps[i].duration));
        }
        setHackerStep(hackerProgressSteps.length - 1);
      })();

      const response = await fetch("/api/hack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language: language,
          originalVulnerabilities: capturedFindings,
          vulnerabilityScore: capturedVulnerabilityScore
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || "Hacker Mode analysis failed";
        // Provide more helpful error message for missing API key
        if (errorMsg.includes("AI service not configured") || errorMsg.includes("OPENAI_API_KEY")) {
          throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env.local file. See .env.example for reference.");
        }
        throw new Error(errorMsg);
      }

      // Wait for progress to complete
      await progressPromise;
      await new Promise(resolve => setTimeout(resolve, 500));

      setHackerResult(data);
    } catch (err: any) {
      setError(err.message || "Hacker Mode analysis failed");
    } finally {
      setIsHacking(false);
      setHackerStep(0);
    }
  };

  const handleDownloadReport = async () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    
    try {
      const blob = await pdf(<PdfReport result={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setError("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleHackerDownloadReport = async () => {
    if (!hackerResult) return;
    setIsGeneratingHackerPdf(true);
    
    try {
      const blob = await pdf(<HackerPdfReport result={hackerResult} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hacker-mode-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate Hacker PDF:", err);
      setError("Failed to generate Hacker Mode report. Please try again.");
    } finally {
        setIsGeneratingHackerPdf(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Smart Contract Auditor</CardTitle>
          <CardDescription>
            Upload your contract files or paste code below for an instant security check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Editor Section - Replaced with Upload/Snippet UI */}
          {!showDiff ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 border-b border-neutral-200">
                <button
                  onClick={() => handleTabSwitch("upload")}
                  className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === "upload"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
                <button
                  onClick={() => handleTabSwitch("snippet")}
                  className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === "snippet"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <FileCode className="h-4 w-4" />
                  Snippet
                </button>
              </div>

              {/* Scan in Progress */}
              {isAnalyzing ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-neutral-50 h-[300px] flex items-center justify-center">
                  <div className="w-full max-w-xl space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-1">Scan in progress...</h3>
                      <p className="text-sm text-neutral-600">Analyzing your smart contract for security vulnerabilities</p>
                    </div>
                    
                    <div className="space-y-0">
                      {progressSteps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        const isPending = index > currentStep;
                        const isLast = index === progressSteps.length - 1;
                        
                        return (
                          <div key={index} className="flex items-start gap-3">
                            {/* Progress Indicator */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              {isCompleted ? (
                                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                              ) : isActive ? (
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                                  <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-neutral-300 bg-white"></div>
                              )}
                              {!isLast && (
                                <div className={`w-0.5 h-6 mt-1.5 ${
                                  isCompleted ? "bg-green-600" : "bg-neutral-200"
                                }`}></div>
                              )}
                            </div>
                            
                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-tight ${
                                isActive ? "text-blue-700" : 
                                isCompleted ? "text-green-700" : 
                                "text-neutral-400"
                              }`}>
                                {step.title}
                              </p>
                              {step.description && isActive && (
                                <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{step.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload Tab */}
                  {activeTab === "upload" && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-8 transition-colors h-[300px] flex items-center justify-center ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-blue-300 bg-neutral-50"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".tact,.fc,.func"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      
                      {uploadedFile ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <div className="w-full max-w-md bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="flex items-start gap-3 px-4 py-3">
                              <div className="p-1.5 bg-blue-100 rounded flex-shrink-0">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-neutral-900 truncate text-sm">{uploadedFile.name}</p>
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded whitespace-nowrap">
                                    Contract
                                  </span>
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                </div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  {(uploadedFile.size / 1024).toFixed(2)} KB
                                </p>
                                <p className="text-xs text-green-700 font-medium">
                                  Valid {uploadedFile.name.split('.').pop()?.toUpperCase()} file
                                </p>
                              </div>
                              <button
                                onClick={handleRemoveFile}
                                className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                                title="Remove file"
                              >
                                <X className="h-4 w-4 text-neutral-500" />
                              </button>
                            </div>
                            <div className="h-1 bg-green-200">
                              <div className="h-full bg-green-600 w-full"></div>
                            </div>
                          </div>
                          <p className="text-sm text-neutral-600 mt-3">
                            File loaded successfully. Click "Analyze Security" to start the analysis.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 w-full">
                          <div className="flex justify-center">
                            <div className="p-4 bg-blue-100 rounded-full">
                              <Upload className="h-8 w-8 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-neutral-900 mb-2">Drop files here</p>
                            <p className="text-sm text-neutral-600 mb-4">
                              Attach contract files (.tact, .fc, .func) up to 1MB
                            </p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="text-blue-600 hover:text-blue-700 underline font-medium text-sm cursor-pointer transition-colors"
                            >
                              Click to upload
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error: Upload tab errors */}
                  {error && activeTab === "upload" && !isAnalyzing && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Snippet Tab */}
                  {activeTab === "snippet" && !isAnalyzing && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-neutral-700">Language:</label>
                        <div className="flex gap-2">
                          {ALLOWED_LANGUAGES.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => {
                                if (snippetLanguage !== lang) {
                                  setSnippetCode("");
                                  setCodeValidationError(null);
                                  setError(null);
                                }
                                setSnippetLanguage(lang);
                              }}
                              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                snippetLanguage === lang
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                              }`}
                            >
                              {lang.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      
          <Textarea
            placeholder="// Paste your smart contract code here..."
                        className="h-[300px] font-mono text-sm resize-none overflow-y-auto focus-visible:border-blue-500 focus-visible:ring-blue-500/20 focus-visible:ring-[2px]"
                        value={snippetCode}
                        onChange={(e) => {
                          const newCode = e.target.value;
                          setSnippetCode(newCode);
                          const code = newCode.trim();
                          
                          if (code) {
                            // Auto-detect language when code is provided
                            const { language: detectedLang, error: detectionError } = autoDetectLanguage(code);
                            
                            if (detectedLang) {
                              // Auto-select the detected language
                              setSnippetLanguage(detectedLang);
                              // Use detected language for validation
                              const validation = validateCodeLanguage(code, detectedLang);
                              if (!validation.valid) {
                                const errorMsg = validation.message || "Code language doesn't match detected language.";
                                setCodeValidationError(errorMsg);
                                setError(errorMsg);
                              } else {
                                setCodeValidationError(null);
                                setError(null);
                              }
                            } else if (detectionError) {
                              // Show validation error if language is not supported
                              setCodeValidationError(detectionError);
                              setError(detectionError);
                            } else {
                              // No detection result, validate against manually selected language if any
                              if (snippetLanguage && isValidLanguage(snippetLanguage)) {
                                const validation = validateCodeLanguage(code, snippetLanguage);
                                if (!validation.valid) {
                                  const errorMsg = validation.message || "Code language doesn't match selected language.";
                                  setCodeValidationError(errorMsg);
                                  setError(errorMsg);
                                } else {
                                  setCodeValidationError(null);
                                  setError(null);
                                }
                              } else {
                                setCodeValidationError(null);
                                setError(null);
                              }
                            }
                          } else {
                            // Code is empty, clear errors
                            setCodeValidationError(null);
                            setError(null);
                          }
                        }}
                      />
                      
                      {snippetCode.trim() && (!snippetLanguage || !isValidLanguage(snippetLanguage)) && !error && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-700 font-medium">
                            Please select a language type (Tact, FC, or Func) to proceed with analysis.
                          </p>
                        </div>
                      )}
                      
                      {error && activeTab === "snippet" && !isAnalyzing && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
             <div className="animate-in fade-in slide-in-from-bottom-4">
                 {isEditingFix ? (
                     <div className="space-y-4">
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                             <Info className="h-4 w-4" />
                             You are editing the proposed fix. The diff view on the left updates in real-time as you type.
                         </div>
                         
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
                            <div className="space-y-2 overflow-hidden h-full flex flex-col">
                                <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Live Diff Preview</span>
                                <div className="flex-1 overflow-hidden">
                                    <CodeDiffViewer 
                                        ref={diffViewerRef}
                                        originalCode={getCurrentCode()} 
                                        patchedCode={modifiedFix} 
                                        onScroll={handleDiffScroll}
                                        viewMode={diffViewMode}
                                        onViewModeChange={setDiffViewMode}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 h-full flex flex-col">
                                <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">Proposed Code (Editable)</span>
                                <div className="rounded-md border bg-neutral-950 font-mono text-sm overflow-hidden shadow-2xl h-full flex flex-col">
                                    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
                                        <span className="text-xs font-bold text-neutral-400 tracking-wider">EDITOR</span>
                                        <div className="text-xs text-neutral-500">Editable</div>
                                    </div>
                                    <textarea
                                        ref={editorRef}
                                        className="flex-1 w-full bg-transparent text-neutral-300 p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                                        value={modifiedFix}
                                        onChange={(e) => setModifiedFix(e.target.value)}
                                        onScroll={handleEditorScroll}
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                         </div>

                         <div className="flex justify-end gap-3 pt-4">
                             <Button variant="outline" onClick={() => setIsEditingFix(false)}>
                                 Cancel Edit
                             </Button>
                             <Button onClick={() => setIsEditingFix(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                 Preview Final Diff
                             </Button>
                         </div>
                     </div>
                 ) : (
                     <>
                        <CodeDiffViewer 
                            originalCode={getCurrentCode()} 
                            patchedCode={modifiedFix}
                            viewMode={diffViewMode}
                            onViewModeChange={setDiffViewMode}
                        />
                        <div className="flex justify-between items-center mt-4">
                            <Button variant="outline" onClick={() => setIsEditingFix(true)} className="border-neutral-300">
                                <Pencil className="mr-2 h-4 w-4" /> Edit Proposed Code
                            </Button>
                            <div className="flex gap-3">
                                <Button onClick={() => setShowDiff(false)} className="bg-red-500 hover:bg-red-600 text-white">
                                    Deny / Cancel
                                </Button>
                                <Button onClick={handleAcceptFix} className="bg-green-600 hover:bg-green-700 text-white">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Accept Fixes
                                </Button>
                            </div>
                        </div>
                     </>
                 )}
             </div>
          )}
          
          {!showDiff && (
            <div className="flex justify-end gap-3 flex-wrap">
                {result && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadReport}
                    disabled={isGeneratingPdf}
                    size="lg"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Report
                  </Button>
                )}
                {hackerResult && (
                  <Button
                    variant="outline"
                    onClick={handleHackerDownloadReport}
                    disabled={isGeneratingHackerPdf}
                    size="lg"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {isGeneratingHackerPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Report
                  </Button>
                )}
                {result && result.findings.some(f => f.codeChanges) && (
                    <Button 
                        variant="outline"
                        onClick={handleReviewClick}
                        size="lg"
                        className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Review Code Fixes
                    </Button>
                )}
            <SimpleTooltip content={
              <div className="space-y-2">
                <p className="font-semibold border-b border-white/20 pb-1 mb-1 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-purple-400" />
                  Premium Audit
                </p>
                <p>Simulate advanced adversarial attacks and uncover deep logic flaws.</p>
                <div>
                  <span className="text-purple-300 font-medium">When to use:</span><br/>
                  For comprehensive security assurance before release.
                </div>
                <div>
                  <span className="text-purple-300 font-medium">Best suited for:</span><br/>
                  Complex contracts and high-value targets.
                </div>
              </div>
            }>
            <Button 
              onClick={handleHackerMode}
              disabled={isAnalyzing || isHacking || !canScan()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              {isHacking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Exploits...
                </>
              ) : (
                <>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Activate Hacker Mode
                </>
              )}
            </Button>
            </SimpleTooltip>
            <SimpleTooltip content={
              <div className="space-y-2">
                <p className="font-semibold border-b border-white/20 pb-1 mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Standard Audit
                </p>
                <p>Detect known vulnerabilities and pattern violations.</p>
                <div>
                  <span className="text-blue-300 font-medium">When to use:</span><br/>
                  For instant feedback during the coding process.
                </div>
                <div>
                  <span className="text-blue-300 font-medium">Best suited for:</span><br/>
                  Catching standard bugs and ensuring best practices.
                </div>
              </div>
            }>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || isHacking || !canScan()}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Logic...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Analyze Security
                </>
              )}
            </Button>
            </SimpleTooltip>
          </div>
          )}

          {error && !activeTab && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
              <ShieldAlert className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {result && !showDiff && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
              
              {/* 1. Executive Summary, Score & Grade - Redesigned */}
              <div className="relative">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-blue-900/20 rounded-2xl -z-10"></div>
                
                <div className="grid gap-6 lg:grid-cols-12 p-6">
                  {/* Executive Summary - Takes more space */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">Executive Summary</h3>
                    </div>
                    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl p-5 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line text-sm">
                        {result.executiveSummary}
                      </p>
                    </div>
                  </div>

                  {/* Score & Grade Cards - Side by side */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                    {/* Security Score Card */}
                    <div className={`relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all hover:scale-105 ${
                      result.securityScore >= 90 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white" :
                      result.securityScore >= 75 
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white" :
                      result.securityScore >= 60 
                        ? "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white" :
                      result.securityScore >= 40 
                        ? "bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white" :
                      "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white"
                    }`}>
                      {/* Decorative pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                      
                      <div className="relative p-6 flex flex-col items-center justify-center h-full">
                        <div className="mb-2 p-2 rounded-full bg-white/20 backdrop-blur-sm">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div className="text-6xl font-black tracking-tight mb-1 drop-shadow-lg">
                          {result.securityScore}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-widest opacity-90">
                          Security Score
                        </div>
                        <div className="mt-3 text-xs opacity-75">
                          out of 100
                        </div>
                      </div>
                    </div>

                    {/* Grade Card */}
                    <div className={`relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all hover:scale-105 ${
                      result.grade === "A" 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white" :
                      result.grade === "B" 
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white" :
                      result.grade === "C" 
                        ? "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white" :
                      result.grade === "D" 
                        ? "bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white" :
                      "bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white"
                    }`}>
                      {/* Decorative pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                      
                      <div className="relative p-6 flex flex-col items-center justify-center h-full">
                        <div className="mb-2 p-2 rounded-full bg-white/20 backdrop-blur-sm">
                          <Award className="h-6 w-6" />
                        </div>
                        <div className="text-6xl font-black tracking-tight mb-1 drop-shadow-lg">
                          {result.grade}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-widest opacity-90">
                          Grade
                        </div>
                        <div className="mt-3 text-xs opacity-75">
                          {result.grade === "A" ? "Excellent" :
                           result.grade === "B" ? "Good" :
                           result.grade === "C" ? "Moderate" :
                           result.grade === "D" ? "Poor" : "Critical"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Stats Grid (Top Overview) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-3xl">{result.findingsSummary.critical}</span>
                  <span className="text-xs text-red-600/80 dark:text-red-400/80 uppercase font-bold tracking-wider mt-1">Critical</span>
                </div>
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-3xl">{result.findingsSummary.high}</span>
                  <span className="text-xs text-orange-600/80 dark:text-orange-400/80 uppercase font-bold tracking-wider mt-1">High</span>
                </div>
                <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-3xl">{result.findingsSummary.medium}</span>
                  <span className="text-xs text-yellow-600/80 dark:text-yellow-400/80 uppercase font-bold tracking-wider mt-1">Medium</span>
                </div>
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-3xl">{result.findingsSummary.low}</span>
                  <span className="text-xs text-blue-600/80 dark:text-blue-400/80 uppercase font-bold tracking-wider mt-1">Low</span>
                </div>
                <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-neutral-600 dark:text-neutral-400 font-bold text-3xl">{result.findingsSummary.informational}</span>
                  <span className="text-xs text-neutral-600/80 dark:text-neutral-400/80 uppercase font-bold tracking-wider mt-1">Info</span>
                </div>
              </div>

              {/* Hacker Mode Section - Moved to be more prominent */}
              {!isHacking && !hackerResult && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400" /> Hacker Mode (Premium Audit)
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Activate our AI-powered adversarial analysis to discover novel attack vectors that static analysis might miss. 
                      </p>
                    </div>
                    <Button
                      onClick={handleHackerMode}
                      disabled={isAnalyzing}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" /> Activate Hacker Mode
                    </Button>
                  </div>
                </div>
              )}

              {/* 3. Detailed Findings (Accordions) */}
              <div>
                 <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                   <Bug className="h-5 w-5" />
                   Security Findings
                 </h3>

                 {result.findings.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-xl bg-green-50/50">
                        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                        <h4 className="font-bold text-green-800 text-lg">All Clear!</h4>
                        <p className="text-green-700">No known vulnerabilities detected in your code.</p>
                    </div>
                 ) : (
                   <>
                     <SeveritySection 
                       severity="CRITICAL" 
                       count={result.findingsSummary.critical} 
                       findings={result.findings.filter(f => f.severity === "CRITICAL")}
                       icon={AlertOctagon}
                       colorClass="text-red-600"
                       bgClass="bg-red-50/50 dark:bg-red-900/20"
                       borderClass="border-l-red-500"
                       originalCode={getCurrentCode()}
                     />
                     <SeveritySection 
                       severity="HIGH" 
                       count={result.findingsSummary.high} 
                       findings={result.findings.filter(f => f.severity === "HIGH")}
                       icon={ShieldAlert}
                       colorClass="text-orange-600"
                       bgClass="bg-orange-50/50 dark:bg-orange-900/20"
                       borderClass="border-l-orange-500"
                       originalCode={getCurrentCode()}
                     />
                     <SeveritySection 
                       severity="MEDIUM" 
                       count={result.findingsSummary.medium} 
                       findings={result.findings.filter(f => f.severity === "MEDIUM")}
                       icon={AlertTriangle}
                       colorClass="text-yellow-600"
                       bgClass="bg-yellow-50/50 dark:bg-yellow-900/20"
                       borderClass="border-l-yellow-500"
                       originalCode={getCurrentCode()}
                     />
                     <SeveritySection 
                       severity="LOW" 
                       count={result.findingsSummary.low} 
                       findings={result.findings.filter(f => f.severity === "LOW")}
                       icon={Info}
                       colorClass="text-blue-600"
                       bgClass="bg-blue-50/50 dark:bg-blue-900/20"
                       borderClass="border-l-blue-500"
                       originalCode={getCurrentCode()}
                     />
                     <SeveritySection 
                       severity="INFORMATIONAL" 
                       count={result.findingsSummary.informational} 
                       findings={result.findings.filter(f => f.severity === "INFORMATIONAL")}
                       icon={Info}
                       colorClass="text-neutral-600"
                       bgClass="bg-neutral-50/50 dark:bg-neutral-900/20"
                       borderClass="border-l-neutral-500"
                       originalCode={getCurrentCode()}
                     />
                   </>
                 )}
              </div>

{/* 4. Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Recommendations
                  </h3>
                  <div className="space-y-3">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                        rec.priority === "High" ? "bg-red-50/50 dark:bg-red-900/20 border-red-500" :
                        rec.priority === "Medium" ? "bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-500" :
                        "bg-blue-50/50 dark:bg-blue-900/20 border-blue-500"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-base">{rec.title || "Recommendation"}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            rec.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            rec.priority === "Medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>
                            {rec.priority} Priority
                          </span>
                        </div>
                        <p className="text-sm opacity-90 mb-2">{rec.description}</p>
                        {rec.rationale && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">{rec.rationale}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Gas Optimizations */}
              {result.gasOptimizations && result.gasOptimizations.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Gas Optimizations
                  </h3>
                  <div className="space-y-3">
                    {result.gasOptimizations.map((opt, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-base">{opt.location}</h4>
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {opt.estimatedGasSavings ?? opt.estimatedSavings ?? "N/A"}
                          </span>
                        </div>
                        <p className="text-sm opacity-90">{opt.description}</p>
                        {opt.currentApproach && opt.optimizedApproach && (
                          <div className="space-y-2 mt-2">
                            <div>
                              <div className="text-xs font-bold uppercase mb-1 text-red-600 opacity-80">Current Approach</div>
                              <code className="text-sm font-mono block whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-950 p-2 rounded">
                                {opt.currentApproach}
                              </code>
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase mb-1 text-green-600 opacity-80">Optimized Approach</div>
                              <code className="text-sm font-mono block whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-950 p-2 rounded">
                                {opt.optimizedApproach}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Code Quality Observations */}
              {result.codeQualityObservations && result.codeQualityObservations.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Code Quality Observations
                  </h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {result.codeQualityObservations.map((obs, idx) => {
                      const description = typeof obs === 'string' ? obs : obs.description;
                      return (
                        <li key={idx} className="text-sm text-neutral-600 dark:text-neutral-400">
                          {description}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 7. Positive Findings */}
              {result.positiveFindings && result.positiveFindings.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Positive Findings
                  </h3>
                  <div className="p-4 rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-900/20">
                    <ul className="space-y-2 list-disc list-inside">
                      {result.positiveFindings.map((finding, idx) => {
                        const description = typeof finding === 'string' ? finding : finding.description;
                        const aspect = typeof finding === 'string' ? undefined : finding.aspect;
                        return (
                          <li key={idx} className="text-sm text-green-700 dark:text-green-400">
                            {aspect && <span className="font-semibold">{aspect}: </span>}
                            {description}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {/* 8. Next Steps */}
              {result.nextSteps && (
                <div>
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Next Steps
                  </h3>
                  <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-900/20">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{result.nextSteps}</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Hacker Mode Section - Removed from bottom */}

          {/* Hacker Mode Progress */}
          {isHacking && (
            <div className="mt-8 border-2 border-dashed border-blue-300 rounded-lg p-8 bg-neutral-50 h-[300px] flex items-center justify-center">
              <div className="w-full max-w-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">Hacker Mode Analysis...</h3>
                  <p className="text-sm text-neutral-600">AI agent is attempting to exploit your contract</p>
                </div>
                <div className="space-y-1">
                  {hackerProgressSteps.map((step, index) => {
                    const isActive = index === hackerStep;
                    const isCompleted = index < hackerStep;
                    const isPending = index > hackerStep;
                    const isLast = index === hackerProgressSteps.length - 1;

                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                              <Loader2 className="h-3 w-3 text-white animate-spin" />
                  </div>
                ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-300 bg-white shadow-sm"></div>
                          )}
                          {!isLast && (
                            <div className={`w-0.5 h-6 mt-1 ${
                              isCompleted ? "bg-green-600" : "bg-neutral-200"
                            }`}></div>
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`text-sm font-medium leading-tight ${
                            isActive ? "text-blue-700" :
                            isCompleted ? "text-green-700" :
                            "text-neutral-400"
                          }`}>
                            {step.title}
                          </p>
                      </div>
                      </div>
                    );
                  })}
                    </div>
              </div>
            </div>
          )}

          {/* Hacker Mode Results */}
          {hackerResult && !isHacking && (
            <div className="mt-8">
              <HackerModeResults result={hackerResult} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
