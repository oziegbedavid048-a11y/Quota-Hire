import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const s = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', padding: 40 },
  header: { marginBottom: 30, borderLeftWidth: 8, borderLeftColor: '#000000', paddingLeft: 16 },
  nameTxt: { fontSize: 36, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', lineHeight: 1 },
  roleTxt: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#666666', marginTop: 8, textTransform: 'uppercase', letterSpacing: 2 },
  
  contactBar: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
  contactTxt: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginRight: 16, padding: 4, backgroundColor: '#f0f0f0' },
  
  sectionTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 12, marginTop: 24, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: '#000000' },
  summaryTxt: { fontSize: 10, lineHeight: 1.6, color: '#333333' },
  
  jobBlock: { marginBottom: 18 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  jobRole: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  jobDate: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#666666' },
  jobCo: { fontSize: 10, color: '#666666', marginBottom: 6 },
  
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontSize: 10, marginRight: 8, fontFamily: 'Helvetica-Bold' },
  bulletTxt: { fontSize: 9.5, flex: 1, lineHeight: 1.5, color: '#333333' },
  
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillTxt: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginRight: 12, marginBottom: 8, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: '#cccccc' }
});

export const BoldTypographyTemplate = ({ data }: { data: CVData }) => {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.nameTxt}>{data.name}</Text>
          <Text style={s.roleTxt}>{data.headline}</Text>
        </View>

        <View style={s.contactBar}>
          {data.email && <Text style={s.contactTxt}>{data.email}</Text>}
          {data.phone && <Text style={s.contactTxt}>{data.phone}</Text>}
          {data.location && <Text style={s.contactTxt}>{data.location}</Text>}
          {data.linkedinUrl && <Text style={s.contactTxt}>{data.linkedinUrl}</Text>}
        </View>

        {data.summary && (
          <View>
            <Text style={s.sectionTitle}>Profile</Text>
            <Text style={s.summaryTxt}>{data.summary}</Text>
          </View>
        )}

        <View>
          <Text style={s.sectionTitle}>Experience</Text>
          {data.experience.map((exp, i) => (
            <View key={i} style={s.jobBlock}>
              <View style={s.jobHeader}>
                <Text style={s.jobRole}>{exp.role}</Text>
                <Text style={s.jobDate}>{exp.period}</Text>
              </View>
              <Text style={s.jobCo}>{exp.company}</Text>
              {dutiesToBullets(exp.duties).map((b, bi) => (
                <View key={bi} style={s.bulletRow}>
                  <Text style={s.bulletDot}>→</Text>
                  <Text style={s.bulletTxt}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View>
          <Text style={s.sectionTitle}>Expertise</Text>
          <View style={s.skillsContainer}>
            {data.skills.map((sk, i) => (
              <Text key={i} style={s.skillTxt}>{sk}</Text>
            ))}
          </View>
        </View>

        {data.education && (
          <View>
            <Text style={s.sectionTitle}>Education</Text>
            <Text style={s.summaryTxt}>{data.education}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
