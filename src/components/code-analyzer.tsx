"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ShieldAlert,
  Info,
  Wand2,
  Pencil,
  Upload,
  FileCode,
  X,
  FileText,
  Shield,
  Download,
  CheckCircle,
} from "lucide-react";
import { AnalysisResult, Finding, HackerModeResult } from "@/types/analysis";
import { CodeDiffViewer } from "@/components/code-diff-viewer";
import { HackerModeResults } from "@/components/hacker-mode-results";
import { pdf } from "@react-pdf/renderer";
import { PdfReport } from "@/components/pdf-report";
import { HackerPdfReport } from "@/components/hacker-pdf-report";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { ProgressStepper } from "@/components/progress-stepper";
import { AnalysisResults } from "@/components/analysis-results";
import {
  ALLOWED_LANGUAGES,
  ANALYSIS_PROGRESS_STEPS,
  HACKER_PROGRESS_STEPS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  type LanguageType,
} from "@/lib/constants";
import {
  autoDetectLanguage,
  isValidFileType,
  isValidFileSize,
  isValidLanguage,
} from "@/lib/utils/language";
import { normalizeCode, applyAllFixes } from "@/lib/utils/code";

export function CodeAnalyzer() {
  // ── Core state ────────────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Diff / fix review state ───────────────────────────────────────────────
  const [showDiff, setShowDiff] = useState(false);
  const [isEditingFix, setIsEditingFix] = useState(false);
  const [modifiedFix, setModifiedFix] = useState("");
  const [diffViewMode, setDiffViewMode] = useState<"unified" | "side-by-side">(
    "unified"
  );

  // ── Upload / snippet state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"upload" | "snippet">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string>("");
  const [snippetCode, setSnippetCode] = useState<string>("");
  const [snippetLanguage, setSnippetLanguage] = useState<LanguageType | "">("");
  const [codeValidationError, setCodeValidationError] = useState<string | null>(
    null
  );

  // ── Hacker mode state ─────────────────────────────────────────────────────
  const [isHacking, setIsHacking] = useState(false);
  const [hackerResult, setHackerResult] = useState<HackerModeResult | null>(
    null
  );
  const [hackerStep, setHackerStep] = useState(0);

  // ── PDF state ────────────────────────────────────────────────────────────
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingHackerPdf, setIsGeneratingHackerPdf] = useState(false);

  // ── Re-analysis context ───────────────────────────────────────────────────
  const [previousFindings, setPreviousFindings] = useState<Finding[]>([]);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressCancelledRef = useRef(false);
  const diffViewerRef = useRef<{ scrollTo: (top: number) => void }>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const isScrollingRef = useRef<boolean>(false);

  // ── Clear validation errors when snippet is cleared ───────────────────────
  useEffect(() => {
    if (!snippetCode.trim()) {
      setCodeValidationError(null);
      if (activeTab === "snippet") setError(null);
    }
  }, [snippetCode, activeTab]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCurrentCode = () =>
    activeTab === "upload" ? uploadedFileContent : snippetCode;

  const canScan = () => {
    if (activeTab === "upload") {
      return uploadedFile !== null && uploadedFileContent.trim() !== "";
    }
    return (
      snippetCode.trim() !== "" &&
      snippetLanguage !== "" &&
      isValidLanguage(snippetLanguage) &&
      !codeValidationError
    );
  };

  // ── Tab switching ─────────────────────────────────────────────────────────
  const handleTabSwitch = (tab: "upload" | "snippet") => {
    if (tab === "upload") {
      setSnippetCode("");
      setSnippetLanguage("");
      setCodeValidationError(null);
    } else {
      setUploadedFile(null);
      setUploadedFileContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setActiveTab(tab);
    setResult(null);
    setError(null);
    setPreviousFindings([]);
  };

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    if (!isValidFileType(file.name)) {
      setError(
        `Invalid file type. Please upload ${ALLOWED_FILE_TYPES.join(", ")} files only.`
      );
      return;
    }
    if (!isValidFileSize(file.size)) {
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      setError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      return;
    }
    setError(null);
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) =>
      setUploadedFileContent(e.target?.result as string);
    reader.onerror = () => setError("Failed to read file. Please try again.");
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
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Synchronized scrolling between diff viewer and editor ─────────────────
  const handleDiffScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    if (editorRef.current)
      editorRef.current.scrollTop = e.currentTarget.scrollTop;
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 10);
  };

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    if (diffViewerRef.current)
      diffViewerRef.current.scrollTo(e.currentTarget.scrollTop);
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 10);
  };

  // ── Analysis ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const currentCode = getCurrentCode();
    if (!currentCode.trim() || !canScan()) {
      if (activeTab === "snippet" && !snippetLanguage)
        setError("Please select a language type before analyzing.");
      return;
    }
    if (activeTab === "snippet" && !isValidLanguage(snippetLanguage)) {
      setError("Please select a valid language type (Tact, FC, or Func).");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setHackerResult(null);
    setError(null);
    setShowDiff(false);
    setIsEditingFix(false);
    setCurrentStep(0);

    try {
      progressCancelledRef.current = false;

      const progressPromise = (async () => {
        for (let i = 0; i < ANALYSIS_PROGRESS_STEPS.length; i++) {
          if (progressCancelledRef.current) break;
          setCurrentStep(i);
          await new Promise((resolve) =>
            setTimeout(resolve, ANALYSIS_PROGRESS_STEPS[i].duration)
          );
        }
        if (!progressCancelledRef.current)
          setCurrentStep(ANALYSIS_PROGRESS_STEPS.length - 1);
      })();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          filename:
            activeTab === "upload" ? uploadedFile?.name : undefined,
          contractName:
            activeTab === "snippet" ? "contract" : undefined,
          previousFindings:
            previousFindings.length > 0 ? previousFindings : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.details || data.error || "Analysis failed");

      progressCancelledRef.current = true;
      setCurrentStep(ANALYSIS_PROGRESS_STEPS.length - 1);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // satisfy the Promise from progressPromise
      void progressPromise;

      setResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsAnalyzing(false);
      setCurrentStep(0);
      progressCancelledRef.current = false;
    }
  };

  // ── Fix review ────────────────────────────────────────────────────────────
  const handleReviewClick = () => {
    if (!result) return;
    const originalCode = getCurrentCode();

    let completeModifiedCode: string;
    if (result.completeCodeComparison?.hasChanges && result.completeCodeComparison.corrected) {
      completeModifiedCode = result.completeCodeComparison.corrected;
    } else if (result.proposedCodeComplete) {
      completeModifiedCode = result.proposedCodeComplete;
    } else if (result.findings.some((f) => f.codeChanges)) {
      completeModifiedCode = applyAllFixes(originalCode, result.findings);
    } else {
      return;
    }

    if (normalizeCode(originalCode) === normalizeCode(completeModifiedCode)) {
      setError(
        "The generated fixes could not be applied to the code. Please review the findings manually."
      );
      return;
    }

    setModifiedFix(completeModifiedCode);
    setShowDiff(true);
    setIsEditingFix(false);
  };

  const handleAcceptFix = () => {
    if (activeTab === "upload") setActiveTab("snippet");

    const { language: detectedLang, error: detectionError } =
      autoDetectLanguage(modifiedFix);

    if (detectedLang) {
      setSnippetLanguage(detectedLang);
      setCodeValidationError(null);
      setError(null);
    } else if (detectionError) {
      setCodeValidationError(detectionError);
      setError(detectionError);
    }

    if (result?.findings) {
      const criticalAndHigh = result.findings.filter(
        (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
      );
      setPreviousFindings((prev) => [...prev, ...criticalAndHigh]);
    }

    setSnippetCode(modifiedFix);
    setShowDiff(false);
    setIsEditingFix(false);
    setResult(null);
  };

  // ── Hacker mode ───────────────────────────────────────────────────────────
  const handleHackerMode = async () => {
    const currentCode = getCurrentCode();
    if (!currentCode.trim()) return;

    const capturedFindings = result?.findings ?? [];
    const capturedVulnerabilityScore = result?.securityScore ?? null;
    const previousResult = result;

    setIsHacking(true);
    setHackerResult(null);
    setResult(null);
    setHackerStep(0);
    setShowDiff(false);
    setIsEditingFix(false);

    try {
      const language =
        activeTab === "snippet" && snippetLanguage
          ? snippetLanguage
          : uploadedFile?.name.split(".").pop()?.toLowerCase() ?? "func";

      progressCancelledRef.current = false;

      const progressPromise = (async () => {
        for (let i = 0; i < HACKER_PROGRESS_STEPS.length; i++) {
          if (progressCancelledRef.current) break;
          setHackerStep(i);
          await new Promise((resolve) =>
            setTimeout(resolve, HACKER_PROGRESS_STEPS[i].duration)
          );
        }
        if (!progressCancelledRef.current)
          setHackerStep(HACKER_PROGRESS_STEPS.length - 1);
      })();

      const response = await fetch("/api/hack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language,
          originalVulnerabilities: capturedFindings,
          vulnerabilityScore: capturedVulnerabilityScore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          data.details || data.error || "Hacker Mode analysis failed";
        if (
          errorMsg.includes("AI service not configured") ||
          errorMsg.includes("OPENAI_API_KEY")
        ) {
          throw new Error(
            "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env.local file."
          );
        }
        throw new Error(errorMsg);
      }

      progressCancelledRef.current = true;
      setHackerStep(HACKER_PROGRESS_STEPS.length - 1);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // satisfy the Promise from progressPromise
      void progressPromise;

      setHackerResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Hacker Mode analysis failed"
      );
      setResult(previousResult);
    } finally {
      setIsHacking(false);
      setHackerStep(0);
      progressCancelledRef.current = false;
    }
  };

  // ── PDF downloads ─────────────────────────────────────────────────────────
  const handleDownloadReport = async () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(<PdfReport result={result} />).toBlob();
      triggerDownload(
        blob,
        `security-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch {
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
      triggerDownload(
        blob,
        `hacker-mode-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch {
      setError("Failed to generate Hacker Mode report. Please try again.");
    } finally {
      setIsGeneratingHackerPdf(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Smart Contract Auditor</CardTitle>
          <CardDescription>
            Upload your contract files or paste code below for an instant
            security check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showDiff ? (
            <>
              {/* Tab bar */}
              <div className="flex gap-1 border-b border-neutral-200">
                <TabButton
                  active={activeTab === "upload"}
                  onClick={() => handleTabSwitch("upload")}
                  icon={<Upload className="h-4 w-4" />}
                  label="Upload"
                />
                <TabButton
                  active={activeTab === "snippet"}
                  onClick={() => handleTabSwitch("snippet")}
                  icon={<FileCode className="h-4 w-4" />}
                  label="Snippet"
                />
              </div>

              {/* Code input area */}
              {isAnalyzing ? (
                <ProgressStepper
                  steps={ANALYSIS_PROGRESS_STEPS}
                  currentStep={currentStep}
                  title="Scan in progress..."
                  subtitle="Analyzing your smart contract for security vulnerabilities"
                />
              ) : (
                <>
                  {activeTab === "upload" && (
                    <UploadArea
                      isDragging={isDragging}
                      uploadedFile={uploadedFile}
                      fileInputRef={fileInputRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onFileInputChange={handleFileInputChange}
                      onRemoveFile={handleRemoveFile}
                    />
                  )}

                  {error && activeTab === "upload" && !isAnalyzing && (
                    <InlineError message={error} />
                  )}

                  {activeTab === "snippet" && (
                    <SnippetEditor
                      snippetCode={snippetCode}
                      snippetLanguage={snippetLanguage}
                      error={error}
                      isAnalyzing={isAnalyzing}
                      onLanguageChange={(lang) => {
                        if (snippetLanguage !== lang) {
                          setSnippetCode("");
                          setCodeValidationError(null);
                          setError(null);
                        }
                        setSnippetLanguage(lang);
                      }}
                      onCodeChange={(newCode) => {
                        setSnippetCode(newCode);
                        if (newCode.trim()) {
                          const {
                            language: detected,
                            error: detectionError,
                          } = autoDetectLanguage(newCode);
                          if (detected) {
                            setSnippetLanguage(detected);
                            setCodeValidationError(null);
                            setError(null);
                          } else if (detectionError) {
                            setCodeValidationError(detectionError);
                            setError(detectionError);
                          } else {
                            setCodeValidationError(null);
                            setError(null);
                          }
                        } else {
                          setCodeValidationError(null);
                          setError(null);
                        }
                      }}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <DiffPanel
              isEditingFix={isEditingFix}
              modifiedFix={modifiedFix}
              diffViewMode={diffViewMode}
              currentCode={getCurrentCode()}
              diffViewerRef={diffViewerRef}
              editorRef={editorRef}
              onDiffScroll={handleDiffScroll}
              onEditorScroll={handleEditorScroll}
              onViewModeChange={setDiffViewMode}
              onModifiedFixChange={setModifiedFix}
              onCancelEdit={() => setIsEditingFix(false)}
              onStartEdit={() => setIsEditingFix(true)}
              onDeny={() => setShowDiff(false)}
              onAccept={handleAcceptFix}
            />
          )}

          {/* Action buttons */}
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
              {result && result.findings.some((f) => f.codeChanges) && (
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
              <SimpleTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-semibold border-b border-white/20 pb-1 mb-1 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-purple-400" />
                      Premium Audit
                    </p>
                    <p>
                      Simulate advanced adversarial attacks and uncover deep
                      logic flaws.
                    </p>
                    <div>
                      <span className="text-purple-300 font-medium">
                        When to use:
                      </span>
                      <br />
                      For comprehensive security assurance before release.
                    </div>
                    <div>
                      <span className="text-purple-300 font-medium">
                        Best suited for:
                      </span>
                      <br />
                      Complex contracts and high-value targets.
                    </div>
                  </div>
                }
              >
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
              <SimpleTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-semibold border-b border-white/20 pb-1 mb-1 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      Standard Audit
                    </p>
                    <p>Detect known vulnerabilities and pattern violations.</p>
                    <div>
                      <span className="text-blue-300 font-medium">
                        When to use:
                      </span>
                      <br />
                      For instant feedback during the coding process.
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">
                        Best suited for:
                      </span>
                      <br />
                      Catching standard bugs and ensuring best practices.
                    </div>
                  </div>
                }
              >
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

          {/* General error banner */}
          {error && (showDiff || (!isAnalyzing && !isHacking)) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
              <ShieldAlert className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Analysis results */}
          {result && !showDiff && (
            <AnalysisResults
              result={result}
              currentCode={getCurrentCode()}
              isHacking={isHacking}
              hackerResult={!!hackerResult}
              onActivateHackerMode={handleHackerMode}
            />
          )}

          {/* Hacker mode progress */}
          {isHacking && (
            <div className="mt-8">
              <ProgressStepper
                steps={HACKER_PROGRESS_STEPS}
                currentStep={hackerStep}
                title="Hacker Mode Analysis..."
                subtitle="AI agent is attempting to exploit your contract"
              />
            </div>
          )}

          {/* Hacker mode results */}
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

// ── Pure helper ───────────────────────────────────────────────────────────────
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Internal UI sub-components ────────────────────────────────────────────────

function InlineError({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
        active
          ? "border-blue-600 text-blue-600 bg-blue-50"
          : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Upload area ───────────────────────────────────────────────────────────────

interface UploadAreaProps {
  isDragging: boolean;
  uploadedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

function UploadArea({
  isDragging,
  uploadedFile,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onRemoveFile,
}: UploadAreaProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 transition-colors h-[300px] flex items-center justify-center ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-blue-300 bg-neutral-50"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".tact,.fc,.func"
        onChange={onFileInputChange}
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
                  <p className="font-semibold text-neutral-900 truncate text-sm">
                    {uploadedFile.name}
                  </p>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded whitespace-nowrap">
                    Contract
                  </span>
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                </div>
                <p className="text-xs text-neutral-500 mb-1">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-green-700 font-medium">
                  Valid {uploadedFile.name.split(".").pop()?.toUpperCase()} file
                </p>
              </div>
              <button
                onClick={onRemoveFile}
                className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>
            <div className="h-1 bg-green-200">
              <div className="h-full bg-green-600 w-full" />
            </div>
          </div>
          <p className="text-sm text-neutral-600 mt-3">
            File loaded successfully. Click &ldquo;Analyze Security&rdquo; to start.
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
            <p className="text-lg font-medium text-neutral-900 mb-2">
              Drop files here
            </p>
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
  );
}

// ── Snippet editor ────────────────────────────────────────────────────────────

interface SnippetEditorProps {
  snippetCode: string;
  snippetLanguage: LanguageType | "";
  error: string | null;
  isAnalyzing: boolean;
  onLanguageChange: (lang: LanguageType) => void;
  onCodeChange: (code: string) => void;
}

function SnippetEditor({
  snippetCode,
  snippetLanguage,
  error,
  isAnalyzing,
  onLanguageChange,
  onCodeChange,
}: SnippetEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-700">
          Language:
        </label>
        <div className="flex gap-2">
          {ALLOWED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
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
        onChange={(e) => onCodeChange(e.target.value)}
      />

      {snippetCode.trim() &&
        (!snippetLanguage || !isValidLanguage(snippetLanguage)) &&
        !error && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 font-medium">
              Please select a language type (Tact, FC, or Func) to proceed.
            </p>
          </div>
        )}

      {error && !isAnalyzing && (
        <InlineError message={error} />
      )}
    </div>
  );
}

// ── Diff panel ────────────────────────────────────────────────────────────────

interface DiffPanelProps {
  isEditingFix: boolean;
  modifiedFix: string;
  diffViewMode: "unified" | "side-by-side";
  currentCode: string;
  diffViewerRef: React.RefObject<{ scrollTo: (top: number) => void } | null>;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  onDiffScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onEditorScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  onViewModeChange: (mode: "unified" | "side-by-side") => void;
  onModifiedFixChange: (code: string) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDeny: () => void;
  onAccept: () => void;
}

function DiffPanel({
  isEditingFix,
  modifiedFix,
  diffViewMode,
  currentCode,
  diffViewerRef,
  editorRef,
  onDiffScroll,
  onEditorScroll,
  onViewModeChange,
  onModifiedFixChange,
  onCancelEdit,
  onStartEdit,
  onDeny,
  onAccept,
}: DiffPanelProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      {isEditingFix ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Info className="h-4 w-4" />
            You are editing the proposed fix. The diff view updates in real-time
            as you type.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
            <div className="space-y-2 overflow-hidden h-full flex flex-col">
              <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">
                Live Diff Preview
              </span>
              <div className="flex-1 overflow-hidden">
                <CodeDiffViewer
                  ref={diffViewerRef}
                  originalCode={currentCode}
                  patchedCode={modifiedFix}
                  onScroll={onDiffScroll}
                  viewMode={diffViewMode}
                  onViewModeChange={onViewModeChange}
                />
              </div>
            </div>
            <div className="space-y-2 h-full flex flex-col">
              <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">
                Proposed Code (Editable)
              </span>
              <div className="rounded-md border bg-neutral-950 font-mono text-sm overflow-hidden shadow-2xl h-full flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-400 tracking-wider">
                    EDITOR
                  </span>
                  <div className="text-xs text-neutral-500">Editable</div>
                </div>
                <textarea
                  ref={editorRef}
                  className="flex-1 w-full bg-transparent text-neutral-300 p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  value={modifiedFix}
                  onChange={(e) => onModifiedFixChange(e.target.value)}
                  onScroll={onEditorScroll}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancelEdit}>
              Cancel Edit
            </Button>
            <Button
              onClick={onCancelEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Preview Final Diff
            </Button>
          </div>
        </div>
      ) : (
        <>
          <CodeDiffViewer
            originalCode={currentCode}
            patchedCode={modifiedFix}
            viewMode={diffViewMode}
            onViewModeChange={onViewModeChange}
          />
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={onStartEdit}
              className="border-neutral-300"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Proposed Code
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={onDeny}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Deny / Cancel
              </Button>
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Accept Fixes
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
