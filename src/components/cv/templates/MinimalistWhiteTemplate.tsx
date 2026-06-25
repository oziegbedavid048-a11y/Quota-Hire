// T6 – Warm Minimal (Daniela Murray style)
// Full-width, monogram initials in tan circle header, clean single-column with warm tones
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const TAN    = '#b5966f';
const DARK   = '#2d2d2d';
const WHITE  = '#ffffff';
const MUTED  = '#8a7f72';
const WARM   = '#f9f6f2';
const LINE   = '#e0d6c8';

const s = StyleSheet.create({
  page:       { backgroundColor: WHITE, fontFamily: 'Helvetica', paddingHorizontal: 52, paddingTop: 36, paddingBottom: 32 },

  // Header
  header:     { alignItems: 'center', marginBottom: 20 },
  monogram:   { width: 70, height: 70, borderRadius: 35, backgroundColor: TAN, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  monoTxt:    { fontSize: 24, fontFamily: 'Helvetica-Bold', color: WHITE },
  avatarImg:  { width: 70, height: 70, borderRadius: 35, objectFit: 'cover', marginBottom: 10, borderWidth: 2, borderColor: TAN },
  hdName:     { fontSize: 24, fontFamily: 'Helvetica-Oblique', color: DARK, textAlign: 'center' },
  hdLine:     { height: 1, width: 120, backgroundColor: TAN, marginVertical: 6 },
  hdRole:     { fontSize: 10, color: TAN, textAlign: 'center', fontFamily: 'Helvetica-Oblique', letterSpacing: 0.3 },
  hdContact:  { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  hdCtxt:     { fontSize: 8, color: MUTED },

  // Two-column layout
  cols:       { flexDirection: 'row', gap: 32 },
  leftCol:    { width: 155 },
  rightCol:   { flex: 1 },

  secTitle:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TAN, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, marginTop: 14 },
  secLine:    { height: 1, backgroundColor: LINE, marginBottom: 8 },

  skillTxt:   { fontSize: 8, color: '#5c5449', marginBottom: 3 },
  langTxt:    { fontSize: 8, color: '#5c5449', marginBottom: 3 },
  strTxt:     { fontSize: 8, color: '#5c5449', marginBottom: 3 },
  intTxt:     { fontSize: 8, color: '#5c5449', marginBottom: 2 },
  certTxt:    { fontSize: 7.5, color: MUTED, marginBottom: 3, lineHeight: 1.4 },
  eduTxt:     { fontSize: 8, color: '#5c5449', lineHeight: 1.5 },
  contactTxt: { fontSize: 8, color: '#5c5449', marginBottom: 3 },

  summaryTxt: { fontSize: 9, color: '#374151', lineHeight: 1.7, fontFamily: 'Helvetica-Oblique' },

  jobBlock:   { marginBottom: 12 },
  jobHead:    { flexDirection: 'row', justifyContent: 'space-between' },
  jobRole:    { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:    { fontSize: 8, color: MUTED },
  jobCo:      { fontSize: 8.5, color: TAN, marginBottom: 4, fontFamily: 'Helvetica-Oblique' },
  bullet:     { flexDirection: 'row', marginBottom: 3 },
  bulletDot:  { fontSize: 8.5, color: TAN, marginRight: 5 },
  bulletTxt:  { flex: 1, fontSize: 8.5, color: '#4b5563', lineHeight: 1.5 },

  achBlock:   { backgroundColor: WARM, borderWidth: 1, borderColor: LINE, padding: 10, marginTop: 4 },
  achTxt:     { fontSize: 8.5, color: '#4b5563', lineHeight: 1.6 },
  refText:    { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const MinimalistWhiteTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Header ── */}
      <View style={s.header}>
        {data.passportUrl
          ? <Image source={{ uri: data.passportUrl }} style={s.avatarImg} />
          : (
            <View style={s.monogram}>
              <Text style={s.monoTxt}>{(data.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</Text>
            </View>
          )
        }
        <Text style={s.hdName}>{data.name}</Text>
        <View style={s.hdLine} />
        <Text style={s.hdRole}>{data.headline}</Text>
        <View style={s.hdContact}>
          {data.email    && <Text style={s.hdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.hdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.hdCtxt}>⚲ {data.location}</Text>}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={{ height: 1.5, backgroundColor: TAN, marginBottom: 16 }} />

      {/* ── Two Columns ── */}
      <View style={s.cols}>

        {/* Left Column */}
        <View style={s.leftCol}>

          <Text style={s.secTitle}>Contact</Text>
          <View style={s.secLine} />
          {data.email    && <Text style={s.contactTxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.contactTxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.contactTxt}>⚲ {data.location}</Text>}
          {data.linkedinUrl && <Text style={s.contactTxt}>in {data.linkedinUrl}</Text>}

          {data.skills.length > 0 && (
            <>
              <Text style={s.secTitle}>Skills</Text>
              <View style={s.secLine} />
              {data.skills.slice(0, 8).map((sk, i) => (
                <Text key={i} style={s.skillTxt}>• {sk}</Text>
              ))}
            </>
          )}

          {data.education && (
            <>
              <Text style={s.secTitle}>Education</Text>
              <View style={s.secLine} />
              <Text style={s.eduTxt}>{data.education}</Text>
            </>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <>
              <Text style={s.secTitle}>Certifications</Text>
              <View style={s.secLine} />
              {data.certifications.map((cert, i) => (
                <Text key={i} style={s.certTxt}>• {cert}</Text>
              ))}
            </>
          )}

          {data.languages && data.languages.length > 0 && (
            <>
              <Text style={s.secTitle}>Languages</Text>
              <View style={s.secLine} />
              {data.languages.map((l, i) => (
                <Text key={i} style={s.langTxt}>• {l}</Text>
              ))}
            </>
          )}

          {data.strengths && data.strengths.length > 0 && (
            <>
              <Text style={s.secTitle}>Strengths</Text>
              <View style={s.secLine} />
              {data.strengths.map((str, i) => (
                <Text key={i} style={s.strTxt}>◆ {str}</Text>
              ))}
            </>
          )}

          {data.interests && data.interests.length > 0 && (
            <>
              <Text style={s.secTitle}>Interests</Text>
              <View style={s.secLine} />
              <Text style={s.intTxt}>{data.interests.join(' • ')}</Text>
            </>
          )}
        </View>

        {/* Right Column */}
        <View style={s.rightCol}>
          {data.summary && (
            <>
              <Text style={s.secTitle}>Professional Summary</Text>
              <View style={s.secLine} />
              <Text style={s.summaryTxt}>{data.summary}</Text>
            </>
          )}

          {data.experience.length > 0 && (
            <>
              <Text style={s.secTitle}>Work History</Text>
              <View style={s.secLine} />
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
              <Text style={s.secTitle}>Key Achievement</Text>
              <View style={s.secLine} />
              <View style={s.achBlock}>
                <Text style={s.achTxt}>{data.achievement}</Text>
              </View>
            </>
          )}

          <Text style={[s.secTitle, { marginTop: 14 }]}>References</Text>
          <View style={s.secLine} />
          <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
        </View>
      </View>

    </Page>
  </Document>
);
