// T13 – Golden Yellow (Mia Taylor / Jackson Turner Qwikresume style)
// Bold golden-yellow left sidebar with dark text, numbered skill bars out of 10, white right body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const GOLD   = '#C4A000';
const GOLDBG = '#2a2200';
const DARK   = '#111111';
const WHITE  = '#ffffff';
const MUTED  = '#9ca3af';
const BODY   = '#1e293b';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 200, backgroundColor: GOLDBG, flexShrink: 0, padding: 22, paddingTop: 28 },
  body:     { flex: 1, padding: 32 },

  photoBox: { alignItems: 'center', marginBottom: 18 },
  avatar:   { width: 85, height: 85, borderRadius: 10, objectFit: 'cover', borderWidth: 2, borderColor: GOLD },
  initBox:  { width: 85, height: 85, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  initTxt:  { fontSize: 30, fontFamily: 'Helvetica-Bold', color: DARK },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GOLD, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 13, fontSize: 8, color: GOLD },
  sbText:   { fontSize: 7.5, color: '#fef3c7', flex: 1, lineHeight: 1.5 },

  // Numbered skill bars (like Qwikresume)
  skillRow: { marginBottom: 8 },
  skillHead:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  skillName:{ fontSize: 8, color: '#fef3c7' },
  skillNum: { fontSize: 8, color: GOLD, fontFamily: 'Helvetica-Bold' },
  skillBar: { height: 5, backgroundColor: '#3d3100', borderRadius: 3 },
  skillFill:{ height: 5, backgroundColor: GOLD, borderRadius: 3 },

  sbLang:   { fontSize: 7.5, color: '#fef3c7', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#fef3c7', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#fef3c7', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: '#d4a017', marginBottom: 3, lineHeight: 1.4 },
  sbEdu:    { fontSize: 7.5, color: '#fef3c7', lineHeight: 1.5 },

  // Strength pills (like Qwikresume)
  strPill:  { backgroundColor: '#3d3100', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 5, flexDirection: 'row', alignItems: 'center' },
  strTxt:   { fontSize: 7.5, color: GOLD },
  strIcon:  { fontSize: 8, color: GOLD, marginRight: 4 },

  // Language circles
  langRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  langCirc: { alignItems: 'center' },
  langOuter:{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3d3100' },
  langInner:{ fontSize: 7, color: GOLD, fontFamily: 'Helvetica-Bold' },
  langLabel:{ fontSize: 6.5, color: '#fef3c7', marginTop: 3, textAlign: 'center' },

  // Body
  bdName:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 1 },
  bdRole:   { fontSize: 10, color: GOLD, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 2, backgroundColor: '#e5c700', marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: BODY },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: '#b58900', marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletNum:{ fontSize: 8, color: '#b58900', marginRight: 5, fontFamily: 'Helvetica-Bold', width: 12 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#fefce8', borderLeftWidth: 3, borderLeftColor: GOLD, padding: 10, marginTop: 4 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

const SkillBar = ({ name, level }: { name: string; level: number }) => (
  <View style={s.skillRow}>
    <View style={s.skillHead}>
      <Text style={s.skillName}>{name}</Text>
      <Text style={s.skillNum}>{level}</Text>
    </View>
    <View style={s.skillBar}>
      <View style={[s.skillFill, { width: `${(level / 10) * 100}%` }]} />
    </View>
  </View>
);

export const GoldenYellowTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoBox}>
          {data.passportUrl && <Image source={{ uri: data.passportUrl }} style={s.avatar} />}
        </View>

        <Text style={s.sbSec}>Skills</Text>
        {data.skills.slice(0, 6).map((sk, i) => (
          <SkillBar key={i} name={sk} level={Math.min(10, 10 - (i % 3))} />
        ))}

        <Text style={s.sbSec}>Interests</Text>
        {data.interests?.slice(0, 4).map((intr, i) => (
          <View key={i} style={s.sbRow}>
            <Text style={s.sbIcon}>★</Text>
            <Text style={s.sbText}>{intr}</Text>
          </View>
        ))}

        <Text style={s.sbSec}>Strengths</Text>
        {data.strengths?.map((str, i) => (
          <View key={i} style={s.strPill}>
            <Text style={s.strTxt}>{str}</Text>
          </View>
        ))}

        <Text style={s.sbSec}>Languages</Text>
        <View style={s.langRow}>
          {data.languages?.slice(0, 3).map((lang, i) => (
            <View key={i} style={s.langCirc}>
              <View style={s.langOuter}>
                <Text style={s.langInner}>{lang.split(' ')[0].slice(0, 3).toUpperCase()}</Text>
              </View>
              <Text style={s.langLabel}>{lang.split(' ')[0]}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sbSec}>Certifications</Text>
        {data.certifications?.map((cert, i) => (
          <Text key={i} style={s.sbCert}>• {cert}</Text>
        ))}

        <Text style={s.sbSec}>Education</Text>
        <Text style={s.sbEdu}>{data.education}</Text>
      </View>

      {/* ── Body ── */}
      <View style={s.body}>
        <Text style={s.bdName}>{data.name}</Text>
        
        <View style={s.bdContact}>
          {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.bdCtxt}>{data.location}</Text>}
          {data.linkedinUrl && <Text style={s.bdCtxt}>in {data.linkedinUrl}</Text>}
        </View>

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
                      <Text style={s.bulletNum}>{bi + 1}.</Text>
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
            <Text style={s.bdSec}>Achievements</Text>
            <View style={s.bdDiv} />
            <View style={s.achBlock}>
              <Text style={s.achTxt}>{data.achievement}</Text>
            </View>
          </>
        )}

        <Text style={[s.bdSec, { marginTop: 14 }]}>References</Text>
        <View style={s.bdDiv} />
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
      </View>

    </Page>
  </Document>
);
