import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const NEON_BLUE = '#0ea5e9';
const DARK_BG = '#0f172a';
const WHITE = '#ffffff';
const TEXT_DARK = '#334155';
const TEXT_LIGHT = '#cbd5e1';

const s = StyleSheet.create({
  page: { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar: { width: 220, backgroundColor: DARK_BG, padding: 30, color: WHITE },
  body: { flex: 1, padding: 40 },
  
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20, borderWidth: 2, borderColor: NEON_BLUE },
  nameTxt: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 },
  roleTxt: { fontSize: 11, color: NEON_BLUE, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 },
  
  sbSection: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 10, marginTop: 20, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 4 },
  sbText: { fontSize: 9, color: TEXT_LIGHT, marginBottom: 6 },
  
  skillBarContainer: { marginBottom: 8 },
  skillTxt: { fontSize: 8.5, color: TEXT_LIGHT, marginBottom: 2 },
  skillBarBg: { height: 4, backgroundColor: '#334155', borderRadius: 2 },
  skillBarFg: { height: 4, backgroundColor: NEON_BLUE, borderRadius: 2 },
  
  bdSection: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: DARK_BG, textTransform: 'uppercase', marginBottom: 12, borderBottomWidth: 2, borderBottomColor: NEON_BLUE, paddingBottom: 4 },
  summaryTxt: { fontSize: 9.5, color: TEXT_DARK, lineHeight: 1.6, marginBottom: 24 },
  
  jobBlock: { marginBottom: 16 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: DARK_BG },
  jobDate: { fontSize: 9, color: NEON_BLUE, fontFamily: 'Helvetica-Bold' },
  jobCo: { fontSize: 9.5, color: TEXT_DARK, marginBottom: 6 },
  
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontSize: 10, color: NEON_BLUE, marginRight: 6 },
  bulletTxt: { fontSize: 9, flex: 1, color: TEXT_DARK, lineHeight: 1.5 },
});

export const ModernTechTemplate = ({ data }: { data: CVData }) => {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.sidebar}>
          {data.passportUrl && (
            <Image source={{ uri: data.passportUrl }} style={s.avatar} />
          )}
          <Text style={s.nameTxt}>{data.name}</Text>
          <Text style={s.roleTxt}>{data.headline}</Text>
          
          <Text style={s.sbSection}>Contact</Text>
          {data.email && <Text style={s.sbText}>{data.email}</Text>}
          {data.phone && <Text style={s.sbText}>{data.phone}</Text>}
          {data.location && <Text style={s.sbText}>{data.location}</Text>}
          {data.linkedinUrl && <Text style={s.sbText}>{data.linkedinUrl}</Text>}

          <Text style={s.sbSection}>Core Skills</Text>
          {data.skills.slice(0, 8).map((sk, i) => (
            <View key={i} style={s.skillBarContainer}>
              <Text style={s.skillTxt}>{sk}</Text>
              <View style={s.skillBarBg}>
                <View style={[s.skillBarFg, { width: `${Math.max(40, 100 - i * 5)}%` }]} />
              </View>
            </View>
          ))}
          
          {data.education && (
            <>
              <Text style={s.sbSection}>Education</Text>
              <Text style={s.sbText}>{data.education}</Text>
            </>
          )}
        </View>

        <View style={s.body}>
          {data.summary && (
            <View>
              <Text style={s.bdSection}>About Me</Text>
              <Text style={s.summaryTxt}>{data.summary}</Text>
            </View>
          )}

          <View>
            <Text style={s.bdSection}>Work Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={s.jobBlock}>
                <View style={s.jobHeader}>
                  <Text style={s.jobRole}>{exp.role}</Text>
                  <Text style={s.jobDate}>{exp.period}</Text>
                </View>
                <Text style={s.jobCo}>{exp.company}</Text>
                {dutiesToBullets(exp.duties).map((b, bi) => (
                  <View key={bi} style={s.bulletRow}>
                    <Text style={s.bulletDot}>▸</Text>
                    <Text style={s.bulletTxt}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};
