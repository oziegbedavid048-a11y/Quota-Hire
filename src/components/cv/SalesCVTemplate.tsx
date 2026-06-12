import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#171717' },
  title: { fontSize: 14, color: '#d96820', marginBottom: 10 },
  contactRow: { flexDirection: 'row', gap: 10, fontSize: 10, color: '#525252', marginBottom: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#171717', borderBottomWidth: 1, borderBottomColor: '#e5e5e5', paddingBottom: 4, marginBottom: 8 },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletPoint: { width: 10, fontSize: 10, color: '#171717' },
  bulletText: { flex: 1, fontSize: 10, color: '#404040', lineHeight: 1.4 },
  normalText: { fontSize: 10, color: '#404040', lineHeight: 1.4 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skillBadge: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 10, color: '#404040' }
});

export interface CVProps {
  name: string;
  email: string;
  targetRole: string;
  industry: string;
  quotaHistory: string;
  biggestWin: string;
  skills: string;
  education: string;
}

export const SalesCVTemplate = ({ data }: { data: CVProps }) => {
  const quotaBullets = data.quotaHistory ? data.quotaHistory.split('\n').filter(Boolean) : [];
  const winBullets = data.biggestWin ? data.biggestWin.split('\n').filter(Boolean) : [];
  const skillList = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.title}>{data.targetRole}</Text>
          <View style={styles.contactRow}>
            <Text>{data.email}</Text>
            <Text>|</Text>
            <Text>{data.industry}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quota History & Performance</Text>
          {quotaBullets.map((bullet, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biggest Win</Text>
          {winBullets.map((bullet, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Skills</Text>
          <Text style={styles.normalText}>{skillList.join(' • ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          <Text style={styles.normalText}>{data.education}</Text>
        </View>
      </Page>
    </Document>
  );
};
