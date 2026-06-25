import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const s = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', padding: 40 },
  header: { borderBottomWidth: 1, borderBottomColor: '#000000', paddingBottom: 16, marginBottom: 20 },
  nameTxt: { fontSize: 26, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  roleTxt: { fontSize: 12, marginTop: 4, color: '#333333' },
  contactRow: { flexDirection: 'row', marginTop: 8 },
  contactTxt: { fontSize: 9, marginRight: 16, color: '#555555' },
  
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  summaryTxt: { fontSize: 9.5, lineHeight: 1.5, color: '#333333' },
  
  jobBlock: { marginBottom: 12 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  jobDate: { fontSize: 9, color: '#555555' },
  jobCo: { fontSize: 9, fontStyle: 'italic', color: '#555555', marginBottom: 4 },
  
  bulletRow: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { fontSize: 10, marginRight: 6 },
  bulletTxt: { fontSize: 9, flex: 1, lineHeight: 1.5, color: '#333333' },
  
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  skillPill: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 3, border: '1pt solid #dddddd', marginRight: 6, marginBottom: 6, borderRadius: 2 }
});

export const MinimalistWhiteTemplate = ({ data }: { data: CVData }) => {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.nameTxt}>{data.name}</Text>
          <Text style={s.roleTxt}>{data.headline}</Text>
          <View style={s.contactRow}>
            {data.email && <Text style={s.contactTxt}>{data.email}</Text>}
            {data.phone && <Text style={s.contactTxt}>{data.phone}</Text>}
            {data.location && <Text style={s.contactTxt}>{data.location}</Text>}
          </View>
        </View>

        {data.summary && (
          <View>
            <Text style={s.sectionTitle}>Summary</Text>
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
                  <Text style={s.bulletDot}>-</Text>
                  <Text style={s.bulletTxt}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View>
          <Text style={s.sectionTitle}>Skills</Text>
          <View style={s.skillsContainer}>
            {data.skills.map((sk, i) => (
              <Text key={i} style={s.skillPill}>{sk}</Text>
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
