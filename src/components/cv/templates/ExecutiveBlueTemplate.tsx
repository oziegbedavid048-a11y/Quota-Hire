// T2 – Executive Pro (Justin Marsh style)
// Wide dark charcoal left sidebar with photo, bold name, white right body
// Full sections: Contact, Skills, Languages, Interests | Summary, Experience, Education, Achievements, Certifications
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const DARK   = '#2c3140';
const WHITE  = '#ffffff';
const ACCENT = '#60a5fa';
const MUTED  = '#94a3b8';
const BODY   = '#1e293b';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 200, backgroundColor: DARK, flexShrink: 0, padding: 24 },
  body:     { flex: 1, padding: 32 },

  // Photo & name in sidebar top
  photoBox: { alignItems: 'center', marginBottom: 20 },
  avatar:   { width: 90, height: 90, borderRadius: 45, objectFit: 'cover', borderWidth: 3, borderColor: ACCENT },
  initBox:  { width: 90, height: 90, borderRadius: 45, backgroundColor: '#3b4252', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: ACCENT },
  initTxt:  { fontSize: 32, fontFamily: 'Helvetica-Bold', color: WHITE },
  sbName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'center', marginTop: 10, lineHeight: 1.3 },
  sbRole:   { fontSize: 8.5, color: ACCENT, textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  divider:  { height: 1, backgroundColor: '#3b4252', marginVertical: 12 },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 14, fontSize: 8, color: ACCENT },
  sbText:   { fontSize: 7.5, color: '#cbd5e1', flex: 1, lineHeight: 1.5 },
  sbSkill:  { fontSize: 7.5, color: '#cbd5e1', marginBottom: 4 },
  sbLang:   { fontSize: 7.5, color: '#cbd5e1', marginBottom: 4 },
  sbStr:    { fontSize: 7.5, color: '#cbd5e1', marginBottom: 4 },
  sbInt:    { fontSize: 7.5, color: '#cbd5e1', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: '#94a3b8', marginBottom: 3, lineHeight: 1.4 },

  // Body
  bdNameRow:{ marginBottom: 4 },
  bdName:   { fontSize: 26, fontFamily: 'Helvetica-Bold', color: DARK },
  bdRole:   { fontSize: 11, color: ACCENT, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  bdCtxt:   { fontSize: 8, color: '#64748b' },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 5 },
  bdDiv:    { height: 1.5, backgroundColor: ACCENT, marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: BODY },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: '#2563eb', marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: DARK, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  eduBlock: { marginBottom: 8 },
  eduDeg:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: BODY },
  eduInst:  { fontSize: 8.5, color: '#2563eb' },
  eduDesc:  { fontSize: 8, color: '#6b7280', marginTop: 2 },

  achBullet:{ flexDirection: 'row', marginBottom: 5 },
  achIcon:  { fontSize: 9, color: ACCENT, marginRight: 6 },
  achTxt:   { flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const ExecutiveBlueTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoBox}>
          {data.passportUrl
            ? <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            : <View style={s.initBox}><Text style={s.initTxt}>{(data.name || 'U').charAt(0)}</Text></View>
          }
          <Text style={s.sbName}>{data.name}</Text>
          <Text style={s.sbRole}>{data.headline}</Text>
        </View>

        <View style={s.divider} />

        {/* Contact */}
        <Text style={s.sbSec}>Contact</Text>
        {data.email    && <View style={s.sbRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>}
        {data.phone    && <View style={s.sbRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>}
        {data.location && <View style={s.sbRow}><Text style={s.sbIcon}>⚲</Text><Text style={s.sbText}>{data.location}</Text></View>}
        {data.linkedinUrl && <View style={s.sbRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>}

        <View style={s.divider} />

        {/* Skills */}
        {data.skills.length > 0 && (
          <>
            <Text style={s.sbSec}>Core Skills</Text>
            {data.skills.slice(0, 8).map((sk, i) => (
              <Text key={i} style={s.sbSkill}>▸ {sk}</Text>
            ))}
          </>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={s.sbSec}>Languages</Text>
            {data.languages.map((l, i) => (
              <Text key={i} style={s.sbLang}>• {l}</Text>
            ))}
          </>
        )}

        {/* Strengths */}
        {data.strengths && data.strengths.length > 0 && (
          <>
            <Text style={s.sbSec}>Strengths</Text>
            {data.strengths.map((str, i) => (
              <Text key={i} style={s.sbStr}>◆ {str}</Text>
            ))}
          </>
        )}

        {/* Interests */}
        {data.interests && data.interests.length > 0 && (
          <>
            <Text style={s.sbSec}>Interests</Text>
            {data.interests.slice(0, 4).map((intr, i) => (
              <Text key={i} style={s.sbInt}>★ {intr}</Text>
            ))}
          </>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <>
            <Text style={s.sbSec}>Certifications</Text>
            {data.certifications.map((cert, i) => (
              <Text key={i} style={s.sbCert}>• {cert}</Text>
            ))}
          </>
        )}
      </View>

      {/* ── Right Body ── */}
      <View style={s.body}>
        {/* Name */}
        <View style={s.bdNameRow}>
          <Text style={s.bdName}>{data.name}</Text>
          <Text style={s.bdRole}>{data.headline}</Text>
        </View>
        <View style={s.bdContact}>
          {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.bdCtxt}>⚲ {data.location}</Text>}
        </View>

        {/* Summary */}
        {data.summary && (
          <>
            <Text style={s.bdSec}>Summary</Text>
            <View style={s.bdDiv} />
            <Text style={s.bdSummary}>{data.summary}</Text>
          </>
        )}

        {/* Experience */}
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

        {/* Achievement */}
        {data.achievement && (
          <>
            <Text style={s.bdSec}>Key Achievement</Text>
            <View style={s.bdDiv} />
            <View style={s.achBullet}>
              <Text style={s.achIcon}>★</Text>
              <Text style={s.achTxt}>{data.achievement}</Text>
            </View>
          </>
        )}

        {/* Education */}
        {data.education && (
          <>
            <Text style={s.bdSec}>Education</Text>
            <View style={s.bdDiv} />
            <View style={s.eduBlock}>
              <Text style={s.eduDeg}>{data.education}</Text>
            </View>
          </>
        )}

        {/* References */}
        <Text style={[s.bdSec, { marginTop: 12 }]}>References</Text>
        <View style={s.bdDiv} />
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
      </View>

    </Page>
  </Document>
);
