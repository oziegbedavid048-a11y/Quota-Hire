// T9 – Indigo Sidebar (Mia Taylor / Sophia Brown Qwikresume style)
// Bold purple/indigo left sidebar, circle language indicators, white right body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const INDIGO = '#4338ca';
const INDIGO2= '#6366f1';
const DARK   = '#1e1b4b';
const WHITE  = '#ffffff';
const MUTED  = '#94a3b8';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 195, backgroundColor: INDIGO, flexShrink: 0, padding: 22, paddingTop: 28 },
  body:     { flex: 1, padding: 30 },

  photoBox: { alignItems: 'center', marginBottom: 16 },
  avatar:   { width: 84, height: 84, borderRadius: 42, objectFit: 'cover', borderWidth: 3, borderColor: WHITE },
  initBox:  { width: 84, height: 84, borderRadius: 42, backgroundColor: INDIGO2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },
  sbName:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'center', marginTop: 8 },
  sbRole:   { fontSize: 8, color: '#c7d2fe', textAlign: 'center', marginTop: 3 },

  divider:  { height: 1, backgroundColor: INDIGO2, marginVertical: 10 },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, marginTop: 12 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 14, fontSize: 8, color: '#c7d2fe' },
  sbText:   { fontSize: 7.5, color: '#e0e7ff', flex: 1, lineHeight: 1.5 },
  sbSkill:  { fontSize: 7.5, color: '#e0e7ff', marginBottom: 4 },
  sbSkillBar:{ height: 4, backgroundColor: INDIGO2, borderRadius: 2, marginBottom: 6 },
  sbSkillFill:{ height: 4, backgroundColor: '#a5b4fc', borderRadius: 2 },
  sbStr:    { fontSize: 7.5, color: '#e0e7ff', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#e0e7ff', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: '#a5b4fc', marginBottom: 3, lineHeight: 1.4 },

  // Language circles
  langRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  langCirc: { alignItems: 'center' },
  langOuter:{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#a5b4fc', alignItems: 'center', justifyContent: 'center' },
  langInner:{ fontSize: 7, color: WHITE, fontFamily: 'Helvetica-Bold' },
  langLabel:{ fontSize: 6.5, color: '#c7d2fe', marginTop: 3, textAlign: 'center' },

  // Strength pills
  strPill:  { backgroundColor: INDIGO2, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 5, marginRight: 4 },
  strTxt:   { fontSize: 7.5, color: WHITE },

  // Body
  bdName:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: DARK },
  bdRole:   { fontSize: 10, color: INDIGO, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 2, backgroundColor: INDIGO, marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: INDIGO, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: INDIGO, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#eef2ff', borderLeftWidth: 3, borderLeftColor: INDIGO, padding: 10 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const ElegantSerifTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoBox}>
          
          <Text style={s.sbName}>{data.name}</Text>
          
        </View>

        <View style={s.divider} />

        <Text style={s.sbSec}>Contact</Text>
        {data.email    && <View style={s.sbRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>}
        {data.phone    && <View style={s.sbRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>}
        {data.location && <View style={s.sbRow}><Text style={s.sbIcon}></Text><Text style={s.sbText}>{data.location}</Text></View>}
        {data.linkedinUrl && <View style={s.sbRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>}

        <Text style={s.sbSec}>Skills</Text>
        {data.skills.slice(0, 6).map((sk, i) => (
          <View key={i}>
            <Text style={s.sbSkill}>{sk}</Text>
            <View style={s.sbSkillBar}>
              <View style={[s.sbSkillFill, { width: `${Math.min(95, 95 - (i * 8))}%` }]} />
            </View>
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

        <Text style={s.sbSec}>Strengths</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {data.strengths?.map((str, i) => (
            <View key={i} style={s.strPill}>
              <Text style={s.strTxt}>{str}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sbSec}>Interests</Text>
        <Text style={s.sbInt}>{data.interests?.join(' • ')}</Text>

        <Text style={s.sbSec}>Certifications</Text>
        {data.certifications?.map((cert, i) => (
          <Text key={i} style={s.sbCert}>• {cert}</Text>
        ))}
      </View>

      {/* ── Body ── */}
      <View style={s.body}>
        <Text style={s.bdName}>{data.name}</Text>
        
        <View style={s.bdContact}>
          {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.bdCtxt}>{data.location}</Text>}
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

        {data.education && (
          <>
            <Text style={s.bdSec}>Education</Text>
            <View style={s.bdDiv} />
            <Text style={{ fontSize: 9, color: '#374151' }}>{data.education}</Text>
          </>
        )}

        <Text style={[s.bdSec, { marginTop: 14 }]}>References</Text>
        <View style={s.bdDiv} />
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
      </View>

    </Page>
  </Document>
);
