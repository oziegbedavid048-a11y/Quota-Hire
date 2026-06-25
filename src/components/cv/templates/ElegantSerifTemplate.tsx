import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const s = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Times-Roman', padding: 50 },
  header: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#000000', paddingBottom: 20, marginBottom: 20 },
  nameTxt: { fontSize: 26, fontFamily: 'Times-Bold', textTransform: 'uppercase', marginBottom: 4 },
  roleTxt: { fontSize: 13, fontStyle: 'italic', color: '#444444', marginBottom: 10 },
  
  contactRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  contactTxt: { fontSize: 10, marginHorizontal: 8, color: '#000000' },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Times-Bold', textTransform: 'uppercase', borderBottomWidth: 0.5, borderBottomColor: '#999999', paddingBottom: 4, marginBottom: 10 },
  
  summaryTxt: { fontSize: 10.5, lineHeight: 1.5, color: '#333333' },
  
  jobBlock: { marginBottom: 14 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole: { fontSize: 11, fontFamily: 'Times-Bold' },
  jobDate: { fontSize: 10, color: '#555555' },
  jobCo: { fontSize: 10.5, fontStyle: 'italic', marginBottom: 6 },
  
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontSize: 10, marginRight: 8 },
  bulletTxt: { fontSize: 10.5, flex: 1, lineHeight: 1.4, color: '#222222' },
  
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillTxt: { fontSize: 10.5, marginRight: 12, marginBottom: 4, color: '#333333' }
});

export const ElegantSerifTemplate = ({ data }: { data: CVData }) => {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.nameTxt}>{data.name}</Text>
          <Text style={s.roleTxt}>{data.headline}</Text>
          <View style={s.contactRow}>
            {data.email && <Text style={s.contactTxt}>{data.email}</Text>}
            {data.phone && <Text style={s.contactTxt}>|    {data.phone}</Text>}
            {data.location && <Text style={s.contactTxt}>|    {data.location}</Text>}
            {data.linkedinUrl && <Text style={s.contactTxt}>|    {data.linkedinUrl}</Text>}
          </View>
        </View>

        {data.summary && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Professional Summary</Text>
            <Text style={s.summaryTxt}>{data.summary}</Text>
          </View>
        )}

        <View style={s.section}>
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
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletTxt}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Core Competencies</Text>
          <View style={s.skillsContainer}>
            {data.skills.map((sk, i) => (
              <Text key={i} style={s.skillTxt}>• {sk}</Text>
            ))}
          </View>
        </View>

        {data.education && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Education</Text>
            <Text style={s.summaryTxt}>{data.education}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
