import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const ACCENT = '#f43f5e'; // Rose/Pink
const DARK = '#1e293b';
const WHITE = '#ffffff';
const GRAY = '#64748b';

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: 'Helvetica' },
  header: { backgroundColor: DARK, padding: 40, flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, paddingRight: 20 },
  nameTxt: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 8, letterSpacing: 1 },
  roleTxt: { fontSize: 13, color: ACCENT, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  
  avatarContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: ACCENT },
  avatar: { width: 100, height: 100, objectFit: 'cover' },
  
  contactBar: { backgroundColor: ACCENT, paddingVertical: 12, paddingHorizontal: 40, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  contactTxt: { color: WHITE, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  
  body: { padding: 40, flexDirection: 'row' },
  leftCol: { width: '35%', paddingRight: 20 },
  rightCol: { width: '65%', borderLeftWidth: 1, borderLeftColor: '#e2e8f0', paddingLeft: 30 },
  
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', marginBottom: 12, marginTop: 10 },
  sectionTitleRight: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: ACCENT, textTransform: 'uppercase', marginBottom: 16 },
  
  summaryTxt: { fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 24 },
  
  skillPill: { backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginBottom: 6, marginRight: 6 },
  skillTxt: { fontSize: 8.5, color: DARK },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  
  jobBlock: { marginBottom: 20 },
  jobRole: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 },
  jobCo: { fontSize: 10, color: ACCENT, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  jobDate: { fontSize: 9, color: GRAY, marginBottom: 8 },
  
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontSize: 10, color: ACCENT, marginRight: 6 },
  bulletTxt: { fontSize: 9.5, flex: 1, color: GRAY, lineHeight: 1.5 },
});

export const CreativeAccentTemplate = ({ data }: { data: CVData }) => {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerText}>
            <Text style={s.nameTxt}>{data.name}</Text>
            <Text style={s.roleTxt}>{data.headline}</Text>
          </View>
          {data.passportUrl && (
            <View style={s.avatarContainer}>
              <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            </View>
          )}
        </View>

        <View style={s.contactBar}>
          {data.email && <Text style={s.contactTxt}>{data.email}</Text>}
          {data.phone && <Text style={s.contactTxt}>{data.phone}</Text>}
          {data.location && <Text style={s.contactTxt}>{data.location}</Text>}
        </View>

        <View style={s.body}>
          <View style={s.leftCol}>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.skillsContainer}>
              {data.skills.map((sk, i) => (
                <View key={i} style={s.skillPill}><Text style={s.skillTxt}>{sk}</Text></View>
              ))}
            </View>

            {data.education && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 24 }]}>Education</Text>
                <Text style={{ fontSize: 9.5, color: GRAY, lineHeight: 1.5 }}>{data.education}</Text>
              </>
            )}
          </View>

          <View style={s.rightCol}>
            {data.summary && (
              <View>
                <Text style={s.sectionTitleRight}>Profile</Text>
                <Text style={s.summaryTxt}>{data.summary}</Text>
              </View>
            )}

            <View>
              <Text style={s.sectionTitleRight}>Experience</Text>
              {data.experience.map((exp, i) => (
                <View key={i} style={s.jobBlock}>
                  <Text style={s.jobRole}>{exp.role}</Text>
                  <Text style={s.jobCo}>{exp.company}</Text>
                  <Text style={s.jobDate}>{exp.period}</Text>
                  {dutiesToBullets(exp.duties).map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletTxt}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
