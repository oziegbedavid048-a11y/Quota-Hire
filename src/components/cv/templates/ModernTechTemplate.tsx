// T7 – Dark Green Pro (Emma Johnson style)
// Dark olive-green sidebar with icon-labelled sections, strengths, languages, white body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const GREEN  = '#1a3c2a';
const LGREEN = '#2e6b47';
const ACCENT = '#4ade80';
const WHITE  = '#ffffff';
const MUTED  = '#94a3b8';
const BODY   = '#1e293b';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 195, backgroundColor: GREEN, flexShrink: 0, padding: 22 },
  body:     { flex: 1, padding: 30 },

  photoBox: { alignItems: 'center', marginBottom: 18 },
  avatar:   { width: 82, height: 82, borderRadius: 41, objectFit: 'cover', borderWidth: 2, borderColor: ACCENT },
  initBox:  { width: 82, height: 82, borderRadius: 41, backgroundColor: LGREEN, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: ACCENT },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },
  sbName:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'center', marginTop: 8 },
  sbRole:   { fontSize: 8, color: ACCENT, textAlign: 'center', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },

  divider:  { height: 1, backgroundColor: LGREEN, marginVertical: 10 },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, marginTop: 12 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 14, fontSize: 8, color: ACCENT },
  sbText:   { fontSize: 7.5, color: '#a7f3d0', flex: 1, lineHeight: 1.5 },
  sbSkill:  { fontSize: 7.5, color: '#a7f3d0', marginBottom: 3 },
  sbLang:   { fontSize: 7.5, color: '#a7f3d0', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#a7f3d0', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#a7f3d0', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: '#6ee7b7', marginBottom: 3, lineHeight: 1.4 },

  // Achievement badge in sidebar
  achBadge: { backgroundColor: LGREEN, borderRadius: 6, padding: 10, marginBottom: 8 },
  achLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ACCENT, marginBottom: 3 },
  achTxtSb: { fontSize: 7.5, color: '#a7f3d0', lineHeight: 1.4 },

  // Body
  bdName:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: GREEN },
  bdRole:   { fontSize: 10, color: LGREEN, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 2, backgroundColor: GREEN, marginBottom: 10, width: 36 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: BODY },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: LGREEN, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: GREEN, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  eduBlock: { backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: LGREEN, padding: 10 },
  eduTxt:   { fontSize: 8.5, color: '#374151' },

  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const ModernTechTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoBox}>
          {data.passportUrl && <Image source={{ uri: data.passportUrl }} style={s.avatar} />}
          <Text style={s.sbName}>{data.name}</Text>
          
        </View>

        <View style={s.divider} />

        <Text style={s.sbSec}>Contact</Text>
        {data.email    && <View style={s.sbRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>}
        {data.phone    && <View style={s.sbRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>}
        {data.location && <View style={s.sbRow}><Text style={s.sbIcon}></Text><Text style={s.sbText}>{data.location}</Text></View>}
        {data.linkedinUrl && <View style={s.sbRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>}

        <View style={s.divider} />

        {data.skills.length > 0 && (
          <>
            <Text style={s.sbSec}>Skills</Text>
            {data.skills.slice(0, 7).map((sk, i) => (
              <Text key={i} style={s.sbSkill}>▸ {sk}</Text>
            ))}
          </>
        )}

        {data.achievement && (
          <>
            <Text style={s.sbSec}>Achievement</Text>
            <View style={s.achBadge}>
              <Text style={s.achLabel}>★ Top Achievement</Text>
              <Text style={s.achTxtSb}>{data.achievement.slice(0, 110)}...</Text>
            </View>
          </>
        )}

        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={s.sbSec}>Languages</Text>
            {data.languages.map((l, i) => (
              <Text key={i} style={s.sbLang}>• {l}</Text>
            ))}
          </>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <>
            <Text style={s.sbSec}>Strengths</Text>
            {data.strengths.map((str, i) => (
              <Text key={i} style={s.sbStr}>• {str}</Text>
            ))}
          </>
        )}

        {data.interests && data.interests.length > 0 && (
          <>
            <Text style={s.sbSec}>Interests</Text>
            <Text style={s.sbInt}>{data.interests.join(' • ')}</Text>
          </>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <>
            <Text style={s.sbSec}>Certifications</Text>
            {data.certifications.map((cert, i) => (
              <Text key={i} style={s.sbCert}>• {cert}</Text>
            ))}
          </>
        )}
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
