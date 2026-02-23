import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { HackerModeResult, ExploitAttempt } from '@/types/analysis';

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
    color: '#7C3AED', // Purple-600 for Hacker Mode
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
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151', // Neutral-700
    marginTop: 10,
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
  
  // Finding Card
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
  statusBadge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 5,
    borderWidth: 1,
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
  exploitCodeBlock: {
    fontFamily: 'Courier',
    fontSize: 9,
    padding: 8,
    backgroundColor: '#000000', // Black
    borderRadius: 4,
    marginTop: 5,
    color: '#4ADE80', // Green-400
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
    case "Critical": return { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' }; // Red
    case "High": return { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' }; // Orange
    case "Medium": return { bg: '#FEFCE8', border: '#EAB308', text: '#A16207' }; // Yellow
    case "Low": return { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' }; // Blue
    default: return { bg: '#F9FAFB', border: '#6B7280', text: '#374151' }; // Gray
  }
};

const getStatusColors = (status: string) => {
    switch(status) {
        case "plausible": return { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' }; // Red
        case "theoretical": return { bg: '#FEF9C3', border: '#FEF08A', text: '#854D0E' }; // Yellow
        case "not-applicable": return { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563' }; // Gray
        default: return { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563' };
    }
};

const getRiskLevelColor = (level: string) => {
  switch(level) {
      case "Critical": return '#DC2626'; // Red
      case "High": return '#EA580C'; // Orange
      case "Medium": return '#CA8A04'; // Yellow
      case "Low": return '#16A34A'; // Green
      default: return '#16A34A';
  }
};

interface HackerPdfReportProps {
  result: HackerModeResult;
}

export const HackerPdfReport: React.FC<HackerPdfReportProps> = ({ result }) => {
  const riskColor = getRiskLevelColor(result.riskLevel);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hacker Mode Security Report</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={styles.headerSubtitle}>Generated by CryptoSecure Premium</Text>
            <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</Text>
          </View>
        </View>

        {/* Executive Summary & Score */}
        <View style={styles.summaryContainer}>
          <View style={styles.execSummary}>
            <Text style={[styles.label, { color: '#7C3AED' }]}>Analysis Summary</Text>
            <Text style={styles.text}>{result.summary}</Text>
          </View>
          
          <View style={[styles.scoreCard, { backgroundColor: riskColor }]}>
             <Text style={styles.scoreValue}>{result.hackerResilienceScore}</Text>
             <Text style={styles.scoreLabel}>Resilience Score</Text>
             <Text style={[styles.scoreValue, { fontSize: 20, marginTop: 10 }]}>{result.riskLevel}</Text>
             <Text style={styles.scoreLabel}>Risk Level</Text>
          </View>
        </View>

        {/* Attack Surface Map */}
        {result.attackSurface.length > 0 && (
            <View>
                <Text style={styles.title}>Attack Surface Map</Text>
                {result.attackSurface.map((surface, idx) => (
                    <View key={idx} wrap={false} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#3B82F6' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={[styles.findingTitle, { fontSize: 11 }]}>{surface.entryPoint}</Text>
                            {surface.lineNumber && (
                                <Text style={{ fontSize: 8, color: '#6B7280', fontFamily: 'Courier' }}>Line {surface.lineNumber}</Text>
                            )}
                        </View>
                        
                        <View style={{ marginBottom: 5 }}>
                            <Text style={styles.label}>Risk Factors</Text>
                            {surface.riskFactors.map((factor, i) => (
                                <Text key={i} style={styles.text}>• {factor}</Text>
                            ))}
                        </View>
                        
                        {surface.notes && (
                            <View>
                                <Text style={styles.label}>Notes</Text>
                                <Text style={styles.text}>{surface.notes}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        )}

        {/* Exploits */}
        <Text style={[styles.title, { marginTop: 10 }]}>Exploit Findings</Text>
        
        {result.exploits.length === 0 ? (
          <View style={[styles.card, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }]}>
             <Text style={[styles.text, { color: '#166534', textAlign: 'center' }]}>No exploits found. The contract appears resilient against known attack vectors.</Text>
          </View>
        ) : (
          result.exploits.map((exploit, idx) => {
            const colors = getSeverityColors(exploit.severity);
            const statusColors = getStatusColors(exploit.status);
            const recommendation = result.recommendations.find(r => r.exploitId === exploit.id);
            
            return (
              <View key={idx} wrap={false} style={[styles.findingCard, { borderLeftColor: colors.border }]}>
                <View style={styles.findingHeader}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                     <Text style={styles.findingTitle}>{idx + 1}. {exploit.title}</Text>
                     <Text style={[styles.findingBadge, { backgroundColor: colors.bg, color: colors.text }]}>{exploit.severity}</Text>
                   </View>
                   <Text style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border, color: statusColors.text }]}>
                       {exploit.status.toUpperCase()}
                   </Text>
                </View>
                
                <View style={{ flexDirection: 'row', marginBottom: 8, gap: 10 }}>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Type: {exploit.type}</Text>
                    <Text style={{ fontSize: 8, color: '#6B7280' }}>Likelihood: {exploit.likelihood}</Text>
                </View>

                <View style={{ marginBottom: 5 }}>
                  <Text style={styles.label}>Prerequisites</Text>
                  <Text style={styles.text}>{exploit.prerequisites}</Text>
                </View>

                <View style={{ marginBottom: 5 }}>
                  <Text style={styles.label}>Expected Impact</Text>
                  <Text style={styles.text}>{exploit.expectedImpact}</Text>
                </View>
                
                {exploit.exploitCode && (
                  <View style={{ marginTop: 5, marginBottom: 5 }}>
                     <Text style={[styles.label, { color: '#EF4444' }]}>EXPLOIT CODE (EDUCATIONAL ONLY)</Text>
                     <Text style={styles.exploitCodeBlock}>{exploit.exploitCode}</Text>
                  </View>
                )}
                
                {recommendation && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: '#F0FDF4', borderRadius: 4, borderWidth: 1, borderColor: '#DCFCE7' }}>
                         <Text style={[styles.label, { color: '#15803D' }]}>DEFENSE RECOMMENDATION</Text>
                         <Text style={[styles.text, { color: '#14532D' }]}>{recommendation.mitigation}</Text>
                         {recommendation.codeExample && (
                             <Text style={[styles.codeBlock, { backgroundColor: '#FFFFFF', borderColor: '#BBF7D0', borderWidth: 1 }]}>
                                 {recommendation.codeExample}
                             </Text>
                         )}
                    </View>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

