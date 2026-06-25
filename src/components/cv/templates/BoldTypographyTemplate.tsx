// T10 – Executive Panel (Mason Wilson style)
// Full-width left body, right panel with skill progress bars, dark maroon accent
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const MAROON = '#7B2035';
const DARK   = '#1a1a1a';
const WHITE  = '#ffffff';
const MUTED  = '#9ca3af';
const PANEL  = '#f9f4f5';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  body:     { flex: 1, padding: 32 },
  panel:    { width: 175, backgroundColor: PANEL, flexShrink: 0, padding: 20, paddingTop: 26 },

  // Body header
  bdName:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.5 },
  bdRole:   { fontSize: 10, color: MAROON, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },
  bdDivTop: { height: 2, backgroundColor: MAROON, marginVertical: 12 },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 1, backgroundColor: '#e5c0c8', marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: MAROON, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: MAROON, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#fdf2f4', borderLeftWidth: 3, borderLeftColor: MAROON, padding: 10, marginTop: 4 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },

  // Right Panel
  pnPhoto:  { alignItems: 'center', marginBottom: 14 },
  avatar:   { width: 75, height: 75, borderRadius: 8, objectFit: 'cover', borderWidth: 2, borderColor: MAROON },
  initBox:  { width: 75, height: 75, borderRadius: 8, backgroundColor: MAROON, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: MAROON },
  initTxt:  { fontSize: 26, fontFamily: 'Helvetica-Bold', color: WHITE },

  pnSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: MAROON, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 7, marginTop: 12 },
  pnDiv:    { height: 1, backgroundColor: '#e5c0c8', marginBottom: 8 },

  // Skill progress bars
  skillRow: { marginBottom: 8 },
  skillName:{ fontSize: 8, color: '#374151', marginBottom: 3 },
  skillBar: { height: 5, backgroundColor: '#e5c0c8', borderRadius: 3 },
  skillFill:{ height: 5, backgroundColor: MAROON, borderRadius: 3 },

  pnText:   { fontSize: 7.5, color: '#374151', marginBottom: 3 },
  pnLang:   { fontSize: 7.5, color: '#374151', marginBottom: 3 },
  pnStr:    { fontSize: 7.5, color: '#374151', marginBottom: 3 },
  pnInt:    { fontSize: 7.5, color: '#374151', marginBottom: 2 },
  pnCert:   { fontSize: 7, color: MUTED, marginBottom: 3, lineHeight: 1.4 },
  pnEdu:    { fontSize: 7.5, color: '#374151', lineHeight: 1.5 },
});

const SkillBar = ({ name, pct }: { name: string; pct: number }) => (
  <View style={s.skillRow}>
    <Text style={s.skillName}>{name}</Text>
    <View style={s.skillBar}>
      <View style={[s.skillFill, { width: `${pct}%` }]} />
    </View>
  </View>
);

export const BoldTypographyTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Body (Left) ── */}
      <View style={s.body}>
        <Text style={s.bdName}>{data.name}</Text>
        <Text style={s.bdRole}>{data.headline}</Text>
        <View style={s.bdContact}>
          {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.bdCtxt}>⚲ {data.location}</Text>}
          {data.linkedinUrl && <Text style={s.bdCtxt}>in {data.linkedinUrl}</Text>}
        </View>
        <View style={s.bdDivTop} />

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

      {/* ── Right Panel ── */}
      <View style={s.panel}>
        <View style={s.pnPhoto}>
          {data.passportUrl
            ? <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            : <View style={s.initBox}><Text style={s.initTxt}>{(data.name || 'U').charAt(0)}</Text></View>
          }
        </View>

        <Text style={s.pnSec}>Contact</Text>
        <View style={s.pnDiv} />
        {data.email    && <Text style={s.pnText}>✉ {data.email}</Text>}
        {data.phone    && <Text style={s.pnText}>☎ {data.phone}</Text>}
        {data.location && <Text style={s.pnText}>⚲ {data.location}</Text>}
        {data.linkedinUrl && <Text style={s.pnText}>in {data.linkedinUrl}</Text>}

        <Text style={s.pnSec}>Skills</Text>
        <View style={s.pnDiv} />
        {data.skills.slice(0, 6).map((sk, i) => (
          <SkillBar key={i} name={sk} pct={Math.min(95, 95 - i * 8)} />
        ))}

        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={s.pnSec}>Languages</Text>
            <View style={s.pnDiv} />
            {data.languages.map((l, i) => (
              <Text key={i} style={s.pnLang}>• {l}</Text>
            ))}
          </>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <>
            <Text style={s.pnSec}>Strengths</Text>
            <View style={s.pnDiv} />
            {data.strengths.map((str, i) => (
              <Text key={i} style={s.pnStr}>◆ {str}</Text>
            ))}
          </>
        )}

        {data.interests && data.interests.length > 0 && (
          <>
            <Text style={s.pnSec}>Interests</Text>
            <View style={s.pnDiv} />
            <Text style={s.pnInt}>{data.interests.join(' • ')}</Text>
          </>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <>
            <Text style={s.pnSec}>Certifications</Text>
            <View style={s.pnDiv} />
            {data.certifications.map((cert, i) => (
              <Text key={i} style={s.pnCert}>• {cert}</Text>
            ))}
          </>
        )}
      </View>

    </Page>
  </Document>
);
