import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { CoverLetterData } from './types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // Accent header bar
  headerBar: {
    backgroundColor: '#d96820',
    paddingVertical: 28,
    paddingHorizontal: 48,
    marginBottom: 0,
  },
  headerName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 6,
  },
  contactItem: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
  },
  // Body
  body: {
    paddingHorizontal: 48,
    paddingTop: 30,
  },
  dateLine: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 20,
  },
  salutation: {
    fontSize: 11,
    color: '#1e293b',
    marginBottom: 16,
    fontFamily: 'Helvetica-Bold',
  },
  paragraph: {
    fontSize: 10.5,
    color: '#374151',
    lineHeight: 1.65,
    marginBottom: 14,
  },
  closing: {
    fontSize: 11,
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#d96820',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
});

export const CoverLetterTemplate = ({ data }: { data: CoverLetterData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Accent Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerName}>{data.name}</Text>
        <View style={styles.contactRow}>
          {data.email ? <Text style={styles.contactItem}>{data.email}</Text> : null}
          {data.phone ? <Text style={styles.contactItem}>|  {data.phone}</Text> : null}
          {data.location ? <Text style={styles.contactItem}>|  {data.location}</Text> : null}
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.dateLine}>{data.date}</Text>

        <Text style={styles.salutation}>
          Dear Hiring Manager,
        </Text>

        <View style={styles.divider} />

        <Text style={styles.paragraph}>{data.paragraph1}</Text>
        <Text style={styles.paragraph}>{data.paragraph2}</Text>
        <Text style={styles.paragraph}>{data.paragraph3}</Text>
        <Text style={styles.paragraph}>{data.paragraph4}</Text>

        <View style={styles.divider} />

        <Text style={styles.closing}>Yours sincerely,</Text>
        <Text style={styles.signatureName}>{data.name}</Text>
        {data.email ? (
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{data.email}</Text>
        ) : null}
      </View>
    </Page>
  </Document>
);
