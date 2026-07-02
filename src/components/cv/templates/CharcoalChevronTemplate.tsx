// T15 – Charcoal Chevron (Joseph Ogwiji / ADEWUYI Samuel style)
// Full-width dark charcoal top header + name, beige/cream left sidebar, white body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const CHARCOAL = '#3a3e47';
const CREAM    = '#f5f0e8';
const ACCENT   = '#c8a96e';
const DARK     = '#1e1e1e';
const WHITE    = '#ffffff';
const MUTED    = '#9ca3af';

const s = StyleSheet.create({
  page:      { backgroundColor: WHITE, fontFamily: 'Helvetica' },

  // Full-width top header
  topBanner: { backgroundColor: CHARCOAL, padding: 24, paddingBottom: 18, flexDirection: 'row', alignItems: 'center' },
  hdLeft:    { flex: 1 },
  hdName:    { fontSize: 26, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.3 },
  hdRole:    { fontSize: 10, color: '#d1d5db', marginTop: 5 },
  hdContact: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  hdCtxt:    { fontSize: 7.5, color: '#d1d5db' },
  avatar:    { width: 72, height: 72, borderRadius: 36, objectFit: 'cover', borderWidth: 2, borderColor: ACCENT, marginLeft: 20 },
  initBox:   { width: 72, height: 72, borderRadius: 36, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginLeft: 20 },
  initTxt:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: WHITE },

  // Columns below header
  cols:      { flexDirection: 'row', flex: 1 },
  sidebar:   { width: 185, backgroundColor: CREAM, padding: 20, paddingTop: 18 },
  body:      { flex: 1, padding: 28, paddingTop: 20 },

  sbSec:     { fontSize: 9, fontFamily: 'Helvetica-Bold', color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 5 },
  sbUnder:   { height: 1.5, backgroundColor: ACCENT, marginBottom: 8 },
  sbText:    { fontSize: 8, color: '#5c5449', marginBottom: 3, lineHeight: 1.5 },
  sbSkill:   { fontSize: 8, color: '#5c5449', marginBottom: 4 },
  sbLang:    { fontSize: 8, color: '#5c5449', marginBottom: 3 },
  sbStr:     { fontSize: 8, color: '#5c5449', marginBottom: 3 },
  sbInt:     { fontSize: 8, color: '#5c5449', marginBottom: 2 },
  sbCert:    { fontSize: 7.5, color: '#8a7f72', marginBottom: 3, lineHeight: 1.4 },
  sbEdu:     { fontSize: 8, color: '#5c5449', lineHeight: 1.5 },

  // Skill filled circles
  skillRow:  { marginBottom: 8 },
  skillHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  skillName: { fontSize: 8, color: '#5c5449' },
  dotRow:    { flexDirection: 'row', gap: 3 },
  dotFull:   { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  dotEmpty:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d6c9b0' },

  // Body
  bdSec:     { fontSize: 10, fontFamily: 'Helvetica-Bold', color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 4 },
  bdDiv:     { height: 1.5, backgroundColor: ACCENT, marginBottom: 10 },
  bdSummary: { fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock:  { marginBottom: 14 },
  jobHead:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:   { fontSize: 8, color: MUTED },
  jobCo:     { fontSize: 8.5, color: '#8B6F47', marginBottom: 4 },
  bullet:    { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { fontSize: 8.5, color: ACCENT, marginRight: 5 },
  bulletTxt: { flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock:  { backgroundColor: '#fef9f0', borderLeftWidth: 3, borderLeftColor: ACCENT, padding: 10, marginTop: 4 },
  achTxt:    { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:   { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

const SkillDots = ({ level = 7 }: { level?: number }) => (
  <View style={s.dotRow}>
    {Array.from({ length: 10 }).map((_, i) => (
      <View key={i} style={i < level ? s.dotFull : s.dotEmpty} />
    ))}
  </View>
);

export const CharcoalChevronTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Top Banner ── */}
      <View style={s.topBanner}>
        <View style={s.hdLeft}>
          <Text style={s.hdName}>{data.name}</Text>
          <Text style={s.hdRole}>{data.headline}</Text>
          <View style={s.hdContact}>
            {data.email    && <Text style={s.hdCtxt}>✉ {data.email}</Text>}
            {data.phone    && <Text style={s.hdCtxt}>☎ {data.phone}</Text>}
            {data.location && <Text style={s.hdCtxt}>⚲ {data.location}</Text>}
            {data.linkedinUrl && <Text style={s.hdCtxt}>in {data.linkedinUrl}</Text>}
          </View>
        </View>
        {data.passportUrl && <Image source={{ uri: data.passportUrl }} style={s.avatar} />}
      </View>

      {/* ── Columns ── */}
      <View style={s.cols}>

        {/* Sidebar */}
        <View style={s.sidebar}>
          {data.skills.length > 0 && (
            <>
              <Text style={s.sbSec}>Skills</Text>
              <View style={s.sbUnder} />
              {data.skills.slice(0, 6).map((sk, i) => (
                <View key={i} style={s.skillRow}>
                  <Text style={s.skillName}>{sk}</Text>
                  <SkillDots level={Math.min(10, 10 - i)} />
                </View>
              ))}
            </>
          )}

          {data.education && (
            <>
              <Text style={s.sbSec}>Education</Text>
              <View style={s.sbUnder} />
              <Text style={s.sbEdu}>{data.education}</Text>
            </>
          )}

          {data.languages && data.languages.length > 0 && (
            <>
              <Text style={s.sbSec}>Languages</Text>
              <View style={s.sbUnder} />
              {data.languages.map((l, i) => <Text key={i} style={s.sbLang}>• {l}</Text>)}
            </>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <>
              <Text style={s.sbSec}>Certifications</Text>
              <View style={s.sbUnder} />
              {data.certifications.map((cert, i) => <Text key={i} style={s.sbCert}>• {cert}</Text>)}
            </>
          )}

          {data.strengths && data.strengths.length > 0 && (
            <>
              <Text style={s.sbSec}>Strengths</Text>
              <View style={s.sbUnder} />
              {data.strengths.map((str, i) => <Text key={i} style={s.sbStr}>◆ {str}</Text>)}
            </>
          )}

          {data.interests && data.interests.length > 0 && (
            <>
              <Text style={s.sbSec}>Interests</Text>
              <View style={s.sbUnder} />
              <Text style={s.sbInt}>{data.interests.join(' • ')}</Text>
            </>
          )}
        </View>

        {/* Body */}
        <View style={s.body}>
          {data.summary && (
            <>
              <Text style={s.bdSec}>Professional Summary</Text>
              <View style={s.bdDiv} />
              <Text style={s.bdSummary}>{data.summary}</Text>
            </>
          )}

          {data.experience.length > 0 && (
            <>
              <Text style={s.bdSec}>Work Experience</Text>
              <View style={s.bdDiv} />
              {data.experience.map((exp, i) => {
                const bullets = dutiesToBullets(exp.duties);
                return (
                  <View key={i} style={s.jobBlock}>
                    <View style={s.jobHead}>
                      <Text style={s.jobRole}>{exp.role}</Text>
                      <Text style={s.jobDate}>{exp.period}</Text>
                    </View>
                    {exp.company && <Text style={s.jobCo}>{exp.company}</Text>}
                    {bullets.map((b, bi) => (
                      <View key={bi} style={s.bullet}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletTxt}>{b}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          {data.achievement && (
            <>
              <Text style={s.bdSec}>Key Achievement</Text>
              <View style={s.bdDiv} />
              <View style={s.achBlock}>
                <Text style={s.achTxt}>{data.achievement}</Text>
              </View>
            </>
          )}

          <Text style={[s.bdSec, { marginTop: 16 }]}>References</Text>
          <View style={s.bdDiv} />
          <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
        </View>

      </View>
    </Page>
  </Document>
);
