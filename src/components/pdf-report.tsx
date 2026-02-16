import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { AnalysisResult, Finding, Severity, Recommendation, GasOptimization } from '@/types/analysis';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB', // Blue-600
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#F9FAFB', // Neutral-50
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Neutral-200
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827', // Neutral-900
  },
  text: {
    fontSize: 10,
    color: '#374151', // Neutral-700
    lineHeight: 1.5,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  
  // Executive Summary & Score
  summaryContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  execSummary: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoreCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'black',
  },
  scoreLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Findings
  findingCard: {
    marginBottom: 15,
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  findingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  findingBadge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 5,
  },
  findingMeta: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  
  // Code blocks
  codeBlock: {
    fontFamily: 'Courier',
    fontSize: 9,
    padding: 8,
    backgroundColor: '#F3F4F6', // Neutral-100
    borderRadius: 4,
    marginTop: 5,
    color: '#1F2937',
  },
  fixedCodeBlock: {
    fontFamily: 'Courier',
    fontSize: 9,
    padding: 8,
    backgroundColor: '#F0FDF4', // Green-50
    borderColor: '#DCFCE7',
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 5,
    color: '#15803D', // Green-700
  },
  
  // Recommendations
  recCard: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 4,
    backgroundColor: '#F9FAFB',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  }
});

// Helper for colors
const getSeverityColors = (severity: string) => {
  switch(severity) {
    case "CRITICAL": return { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' }; // Red
    case "HIGH": return { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' }; // Orange
    case "MEDIUM": return { bg: '#FEFCE8', border: '#EAB308', text: '#A16207' }; // Yellow
    case "LOW": return { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' }; // Blue
    default: return { bg: '#F9FAFB', border: '#6B7280', text: '#374151' }; // Gray
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '#16A34A'; // Green
  if (score >= 75) return '#EAB308'; // Yellow
  if (score >= 60) return '#F97316'; // Orange
  return '#DC2626'; // Red
};

interface PdfReportProps {
  result: AnalysisResult;
}

export const PdfReport: React.FC<PdfReportProps> = ({ result }) => {
  const scoreColor = getScoreColor(result.securityScore);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Contract Security Report</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={styles.headerSubtitle}>Generated by CryptoSecure</Text>
            <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
             <Text style={styles.headerSubtitle}>Contract: {result.analysisMetadata.contractName || "Unknown"}</Text>
             <Text style={styles.headerSubtitle}>Language: {result.analysisMetadata.language || "Unknown"}</Text>
          </View>
        </View>

        {/* Executive Summary & Score */}
        <View style={styles.summaryContainer}>
          <View style={styles.execSummary}>
            <Text style={[styles.label, { color: '#2563EB' }]}>Executive Summary</Text>
            <Text style={styles.text}>{result.executiveSummary}</Text>
          </View>
          
          <View style={[styles.scoreCard, { backgroundColor: scoreColor }]}>
             <Text style={styles.scoreValue}>{result.securityScore}</Text>
             <Text style={styles.scoreLabel}>Security Score</Text>
             <Text style={[styles.scoreValue, { fontSize: 24, marginTop: 10 }]}>{result.grade}</Text>
             <Text style={styles.scoreLabel}>Grade</Text>
          </View>
        </View>

        {/* Findings Summary Grid */}
        <View style={styles.statsGrid}>
           {[
             { label: 'Critical', count: result.findingsSummary.critical, colors: getSeverityColors('CRITICAL') },
             { label: 'High', count: result.findingsSummary.high, colors: getSeverityColors('HIGH') },
             { label: 'Medium', count: result.findingsSummary.medium, colors: getSeverityColors('MEDIUM') },
             { label: 'Low', count: result.findingsSummary.low, colors: getSeverityColors('LOW') },
             { label: 'Info', count: result.findingsSummary.informational, colors: getSeverityColors('INFORMATIONAL') },
           ].map((stat, idx) => (
             <View key={idx} style={[styles.statBox, { backgroundColor: stat.colors.bg, borderColor: stat.colors.border }]}>
               <Text style={[styles.statValue, { color: stat.colors.text }]}>{stat.count}</Text>
               <Text style={[styles.statLabel, { color: stat.colors.text }]}>{stat.label}</Text>
             </View>
           ))}
        </View>

        {/* Detailed Findings */}
        <Text style={[styles.title, { marginTop: 10 }]}>Security Findings</Text>
        
        {result.findings.length === 0 ? (
          <View style={[styles.card, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }]}>
             <Text style={[styles.text, { color: '#166534', textAlign: 'center' }]}>All Clear! No known vulnerabilities detected.</Text>
          </View>
        ) : (
          result.findings.map((finding, idx) => {
            const colors = getSeverityColors(finding.severity);
            return (
              <View key={idx} wrap={false} style={[styles.findingCard, { borderLeftColor: colors.border }]}>
                <View style={styles.findingHeader}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Text style={styles.findingTitle}>{idx + 1}. {finding.title}</Text>
                     <Text style={[styles.findingBadge, { backgroundColor: colors.bg, color: colors.text }]}>{finding.severity}</Text>
                   </View>
                   <Text style={styles.findingMeta}>Line {finding.codeChanges.startLine}</Text>
                </View>
                
                <View style={{ marginBottom: 5 }}>
                  <Text style={styles.label}>Description</Text>
                  <Text style={styles.text}>{finding.description}</Text>
                </View>

                {finding.impact && (
                  <View style={{ marginBottom: 5 }}>
                    <Text style={styles.label}>Impact</Text>
                    <Text style={styles.text}>{finding.impact}</Text>
                  </View>
                )}

                {finding.recommendation && (
                  <View style={{ marginBottom: 5 }}>
                    <Text style={styles.label}>Recommendation</Text>
                    <Text style={styles.text}>{finding.recommendation}</Text>
                  </View>
                )}
                
                {finding.codeChanges?.fixedCode && (
                  <View style={{ marginTop: 5 }}>
                     <Text style={[styles.label, { color: '#16A34A' }]}>SUGGESTED FIX</Text>
                     <Text style={styles.fixedCodeBlock}>{finding.codeChanges.fixedCode}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Strategic Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <View break>
             <Text style={styles.title}>Strategic Recommendations</Text>
             {result.recommendations.map((rec, idx) => {
               const colors = rec.priority === "High" ? getSeverityColors("CRITICAL") : 
                              rec.priority === "Medium" ? getSeverityColors("MEDIUM") : 
                              getSeverityColors("LOW");
               return (
                 <View key={idx} wrap={false} style={[styles.recCard, { borderLeftColor: colors.border, backgroundColor: colors.bg }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[styles.findingTitle, { fontSize: 11 }]}>{rec.title || "Recommendation"}</Text>
                      <Text style={{ fontSize: 8, color: colors.text, fontWeight: 'bold' }}>{rec.priority} Priority</Text>
                    </View>
                    <Text style={styles.text}>{rec.description}</Text>
                    {rec.rationale && (
                      <Text style={[styles.text, { fontSize: 8, fontStyle: 'italic', marginTop: 4, opacity: 0.8 }]}>Rationale: {rec.rationale}</Text>
                    )}
                 </View>
               );
             })}
          </View>
        )}

        {/* Gas Optimizations */}
        {result.gasOptimizations && result.gasOptimizations.length > 0 && (
           <View>
             <Text style={[styles.title, { marginTop: 15 }]}>Gas Optimizations</Text>
             {result.gasOptimizations.map((opt, idx) => (
               <View key={idx} wrap={false} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={[styles.findingTitle, { fontSize: 10 }]}>{opt.location}</Text>
                    <Text style={{ fontSize: 8, color: '#15803D', backgroundColor: '#DCFCE7', padding: 2, borderRadius: 2 }}>{opt.estimatedGasSavings ?? opt.estimatedSavings ?? "N/A"}</Text>
                  </View>
                  <Text style={styles.text}>{opt.description}</Text>
                  {opt.currentApproach && opt.optimizedApproach && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.label, { color: '#DC2626' }]}>CURRENT</Text>
                         <Text style={styles.codeBlock}>{opt.currentApproach}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.label, { color: '#16A34A' }]}>OPTIMIZED</Text>
                         <Text style={styles.fixedCodeBlock}>{opt.optimizedApproach}</Text>
                      </View>
                    </View>
                  )}
               </View>
             ))}
           </View>
        )}

        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

