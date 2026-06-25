// T4 – Navy Achievement (Oliver Smith style)
// Dark navy sidebar with star-icon achievements section, white body, blue accent
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const NAVY   = '#1a2e4a';
const BLUE   = '#2563eb';
const WHITE  = '#ffffff';
const MUTED  = '#94a3b8';
const LIGHT  = '#f1f5f9';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 195, backgroundColor: NAVY, flexShrink: 0, padding: 22 },
  body:     { flex: 1, padding: 28 },

  // Sidebar photo
  photoBox: { alignItems: 'center', marginBottom: 16 },
  avatar:   { width: 80, height: 80, borderRadius: 40, objectFit: 'cover', borderWidth: 2, borderColor: BLUE },
  initBox:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2d3f5c', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BLUE },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, marginTop: 14 },
  sbDiv:    { height: 1, backgroundColor: '#2d3f5c', marginBottom: 8 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 14, fontSize: 8, color: BLUE },
  sbText:   { fontSize: 7.5, color: '#cbd5e1', flex: 1, lineHeight: 1.5 },
  sbSkill:  { fontSize: 7.5, color: '#cbd5e1', marginBottom: 3 },
  sbLang:   { fontSize: 7.5, color: '#cbd5e1', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#cbd5e1', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#cbd5e1', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: MUTED, marginBottom: 3, lineHeight: 1.4 },

  // Achievement badges in sidebar
  achBadge: { backgroundColor: '#2d3f5c', borderRadius: 6, padding: 10, marginBottom: 8 },
  achBadgeTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BLUE, marginBottom: 3 },
  achBadgeTxt:   { fontSize: 7.5, color: '#cbd5e1', lineHeight: 1.4 },

  // Body
  bdName:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: NAVY },
  bdRole:   { fontSize: 10, color: BLUE, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 5 },
  bdDiv:    { height: 2, backgroundColor: BLUE, marginBottom: 10, width: 40 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: BLUE, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: NAVY, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  eduBlock: { backgroundColor: LIGHT, padding: 10, borderRadius: 4 },
  eduTxt:   { fontSize: 8.5, color: '#374151' },

  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const InverseGreenTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoBox}>
          {data.passportUrl
            ? <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            : <View style={s.initBox}><Text style={s.initTxt}>{(data.name || 'U').charAt(0)}</Text></View>
          }
        </View>

        <Text style={s.sbSec}>Contact</Text>
        <View style={s.sbDiv} />
        {data.email    && <View style={s.sbRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>}
        {data.phone    && <View style={s.sbRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>}
        {data.location && <View style={s.sbRow}><Text style={s.sbIcon}>⚲</Text><Text style={s.sbText}>{data.location}</Text></View>}
        {data.linkedinUrl && <View style={s.sbRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>}

        {data.skills.length > 0 && (
          <>
            <Text style={s.sbSec}>Skills</Text>
            <View style={s.sbDiv} />
            {data.skills.slice(0, 7).map((sk, i) => (
              <Text key={i} style={s.sbSkill}>▸ {sk}</Text>
            ))}
          </>
        )}

        {/* Key Achievements in sidebar badges */}
        {data.achievement && (
          <>
            <Text style={s.sbSec}>Key Achievements</Text>
            <View style={s.sbDiv} />
            <View style={s.achBadge}>
              <Text style={s.achBadgeTitle}>⭐ Top Performance</Text>
              <Text style={s.achBadgeTxt}>{data.achievement.slice(0, 120)}...</Text>
            </View>
          </>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <>
            <Text style={s.sbSec}>Certifications</Text>
            <View style={s.sbDiv} />
            {data.certifications.map((cert, i) => (
              <Text key={i} style={s.sbCert}>• {cert}</Text>
            ))}
          </>
        )}

        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={s.sbSec}>Languages</Text>
            <View style={s.sbDiv} />
            {data.languages.map((l, i) => (
              <Text key={i} style={s.sbLang}>• {l}</Text>
            ))}
          </>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <>
            <Text style={s.sbSec}>Strengths</Text>
            <View style={s.sbDiv} />
            {data.strengths.map((str, i) => (
              <Text key={i} style={s.sbStr}>◆ {str}</Text>
            ))}
          </>
        )}

        {data.interests && data.interests.length > 0 && (
          <>
            <Text style={s.sbSec}>Interests</Text>
            <View style={s.sbDiv} />
            <Text style={s.sbInt}>{data.interests.join(' • ')}</Text>
          </>
        )}
      </View>

      {/* ── Body ── */}
      <View style={s.body}>
        <Text style={s.bdName}>{data.name}</Text>
        <Text style={s.bdRole}>{data.headline}</Text>
        <View style={s.bdContact}>
          {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.bdCtxt}>⚲ {data.location}</Text>}
        </View>

        {data.summary && (
          <>
            <Text style={s.bdSec}>Summary</Text>
            <View style={s.bdDiv} />
            <Text style={s.bdSummary}>{data.summary}</Text>
          </>
        )}

        {data.experience.length > 0 && (
          <>
            <Text style={s.bdSec}>Experience</Text>
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

        {data.education && (
          <>
            <Text style={s.bdSec}>Education</Text>
            <View style={s.bdDiv} />
            <View style={s.eduBlock}>
              <Text style={s.eduTxt}>{data.education}</Text>
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
