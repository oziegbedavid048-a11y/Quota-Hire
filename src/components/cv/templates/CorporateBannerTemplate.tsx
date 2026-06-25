// T5 – Sky Blue Sidebar (Jacob Klein style)
// White left sidebar with skill dot-bars, teal/sky blue headers, clean right body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const TEAL   = '#2196b8';
const DARK   = '#1e3a4c';
const WHITE  = '#ffffff';
const MUTED  = '#78909c';
const SIDE   = '#f0f9fc';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 185, backgroundColor: SIDE, flexShrink: 0, padding: 22 },
  body:     { flex: 1, padding: 30, paddingTop: 28 },

  sbPhotoBox:{ alignItems: 'center', marginBottom: 14 },
  avatar:   { width: 78, height: 78, borderRadius: 39, objectFit: 'cover', borderWidth: 3, borderColor: TEAL },
  initBox:  { width: 78, height: 78, borderRadius: 39, backgroundColor: '#b2dfed', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: TEAL },
  initTxt:  { fontSize: 26, fontFamily: 'Helvetica-Bold', color: DARK },
  sbName:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textAlign: 'center', marginTop: 8 },
  sbRole:   { fontSize: 8, color: TEAL, textAlign: 'center', marginTop: 2 },
  sbContact:{ fontSize: 7.5, color: MUTED, textAlign: 'center', marginTop: 4 },

  sbSec:    { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 6 },
  sbUnderline:{ height: 1.5, backgroundColor: TEAL, marginBottom: 8 },

  // Skill with dot bars
  skillRow: { marginBottom: 7 },
  skillName:{ fontSize: 8, color: '#374151', marginBottom: 3 },
  dotBar:   { flexDirection: 'row', gap: 3 },
  dotFill:  { width: 9, height: 9, borderRadius: 5, backgroundColor: TEAL },
  dotEmpty: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#c8e8f2' },

  sbText:   { fontSize: 7.5, color: '#374151', marginBottom: 3, lineHeight: 1.5 },
  sbLang:   { fontSize: 7.5, color: '#374151', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#374151', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#374151', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: MUTED, marginBottom: 3, lineHeight: 1.4 },

  // Body
  bdName:   { fontSize: 26, fontFamily: 'Helvetica-Bold', color: DARK },
  bdRole:   { fontSize: 10, color: TEAL, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e0f3fa' },
  bdCtxt:   { fontSize: 8, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 2, backgroundColor: TEAL, marginBottom: 10, width: 35 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 12 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: TEAL, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: TEAL, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#e0f3fa', borderLeftWidth: 3, borderLeftColor: TEAL, padding: 10 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

const SkillDots = ({ level = 7 }: { level?: number }) => (
  <View style={s.dotBar}>
    {Array.from({ length: 10 }).map((_, i) => (
      <View key={i} style={i < level ? s.dotFill : s.dotEmpty} />
    ))}
  </View>
);

export const CorporateBannerTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.sbPhotoBox}>
          {data.passportUrl
            ? <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            : <View style={s.initBox}><Text style={s.initTxt}>{(data.name || 'U').charAt(0)}</Text></View>
          }
          <Text style={s.sbName}>{data.name}</Text>
          <Text style={s.sbRole}>{data.headline}</Text>
          {data.location && <Text style={s.sbContact}>⚲ {data.location}</Text>}
        </View>

        <Text style={s.sbSec}>Profile</Text>
        <View style={s.sbUnderline} />
        {data.email  && <Text style={s.sbText}>✉ {data.email}</Text>}
        {data.phone  && <Text style={s.sbText}>☎ {data.phone}</Text>}
        {data.linkedinUrl && <Text style={s.sbText}>in {data.linkedinUrl}</Text>}

        <Text style={s.sbSec}>Skills</Text>
        <View style={s.sbUnderline} />
        {data.skills.slice(0, 6).map((sk, i) => (
          <View key={i} style={s.skillRow}>
            <Text style={s.skillName}>{sk}</Text>
            <SkillDots level={8 - (i % 3)} />
          </View>
        ))}

        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={s.sbSec}>Languages</Text>
            <View style={s.sbUnderline} />
            {data.languages.map((l, i) => (
              <Text key={i} style={s.sbLang}>• {l}</Text>
            ))}
          </>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <>
            <Text style={s.sbSec}>Strengths</Text>
            <View style={s.sbUnderline} />
            {data.strengths.map((str, i) => (
              <Text key={i} style={s.sbStr}>◆ {str}</Text>
            ))}
          </>
        )}

        {data.interests && data.interests.length > 0 && (
          <>
            <Text style={s.sbSec}>Interests</Text>
            <View style={s.sbUnderline} />
            <Text style={s.sbInt}>{data.interests.join(' • ')}</Text>
          </>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <>
            <Text style={s.sbSec}>Certifications</Text>
            <View style={s.sbUnderline} />
            {data.certifications.map((cert, i) => (
              <Text key={i} style={s.sbCert}>• {cert}</Text>
            ))}
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
            <Text style={s.bdSec}>Profile</Text>
            <View style={s.bdDiv} />
            <Text style={s.bdSummary}>{data.summary}</Text>
          </>
        )}

        {data.experience.length > 0 && (
          <>
            <Text style={s.bdSec}>Employment History</Text>
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
