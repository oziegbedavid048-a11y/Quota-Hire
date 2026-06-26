// T14 – Steel Blue Banner (Eke Francis PDF style)
// Single-column, dark steel-blue block section headers, clean white body, professional
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const STEEL  = '#1B4F8A';
const BLUE2  = '#2563eb';
const DARK   = '#111827';
const WHITE  = '#ffffff';
const MUTED  = '#9ca3af';
const BG     = '#f0f4ff';

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontFamily: 'Helvetica', paddingBottom: 32 },

  // Header block
  header:   { backgroundColor: STEEL, padding: 28, paddingBottom: 20 },
  hdName:   { fontSize: 26, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.3 },
  hdRole:   { fontSize: 11, color: '#bfdbfe', marginTop: 4, fontFamily: 'Helvetica-Bold' },
  hdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  hdCtxt:   { fontSize: 8, color: '#bfdbfe' },

  // Photo in header
  avatar:   { position: 'absolute', top: 20, right: 28, width: 75, height: 75, borderRadius: 8, objectFit: 'cover', borderWidth: 2, borderColor: '#bfdbfe' },
  initBox:  { position: 'absolute', top: 20, right: 28, width: 75, height: 75, borderRadius: 8, backgroundColor: BLUE2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#bfdbfe' },
  initTxt:  { fontSize: 26, fontFamily: 'Helvetica-Bold', color: WHITE },

  content:  { paddingHorizontal: 36, paddingTop: 20 },

  // Section headers (filled block style)
  secHeader:{ backgroundColor: STEEL, paddingVertical: 5, paddingHorizontal: 10, marginBottom: 10, marginTop: 16 },
  secTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: WHITE, textTransform: 'uppercase', letterSpacing: 1 },

  // Two-column for skills/details sections
  twoCol:   { flexDirection: 'row', gap: 20 },
  colLeft:  { flex: 1 },
  colRight: { flex: 1 },

  summaryTxt:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: BLUE2, marginBottom: 5 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: STEEL, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  skillRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },
  skillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: STEEL, marginRight: 8 },
  skillTxt: { fontSize: 8.5, color: '#374151' },

  langTxt:  { fontSize: 8.5, color: '#374151', marginBottom: 4 },
  strTxt:   { fontSize: 8.5, color: '#374151', marginBottom: 4 },
  intTxt:   { fontSize: 8.5, color: '#374151', marginBottom: 3 },
  certTxt:  { fontSize: 8, color: '#374151', marginBottom: 4, lineHeight: 1.4 },
  eduTxt:   { fontSize: 9, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: BG, borderLeftWidth: 3, borderLeftColor: STEEL, padding: 12, marginTop: 4 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const SteelBlueBannerTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.hdName}>{data.name}</Text>
        
        <View style={s.hdContact}>
          {data.email    && <Text style={s.hdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.hdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.hdCtxt}>{data.location}</Text>}
          {data.linkedinUrl && <Text style={s.hdCtxt}>in {data.linkedinUrl}</Text>}
        </View>
        
      </View>

      {/* ── Content ── */}
      <View style={s.content}>

        {/* Professional Summary */}
        {data.summary && (
          <>
            <View style={s.secHeader}><Text style={s.secTitle}>Professional Summary</Text></View>
            <Text style={s.summaryTxt}>{data.summary}</Text>
          </>
        )}

        {/* Work Experience */}
        {data.experience.length > 0 && (
          <>
            <View style={s.secHeader}><Text style={s.secTitle}>Work Experience</Text></View>
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

        {/* Key Achievement */}
        {data.achievement && (
          <>
            <View style={s.secHeader}><Text style={s.secTitle}>Key Achievement</Text></View>
            <View style={s.achBlock}>
              <Text style={s.achTxt}>{data.achievement}</Text>
            </View>
          </>
        )}

        {/* Skills & Details in two columns */}
        <View style={s.secHeader}><Text style={s.secTitle}>Skills & Additional Details</Text></View>
        <View style={s.twoCol}>
          <View style={s.colLeft}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: STEEL, marginBottom: 6 }}>Core Skills</Text>
            {data.skills.slice(0, 8).map((sk, i) => (
              <View key={i} style={s.skillRow}>
                <View style={s.skillDot} />
                <Text style={s.skillTxt}>{sk}</Text>
              </View>
            ))}

            {data.certifications && data.certifications.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: STEEL, marginBottom: 6, marginTop: 12 }}>Certifications</Text>
                {data.certifications.map((cert, i) => (
                  <Text key={i} style={s.certTxt}>• {cert}</Text>
                ))}
              </>
            )}
          </View>

          <View style={s.colRight}>
            {data.languages && data.languages.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: STEEL, marginBottom: 6 }}>Languages</Text>
                {data.languages.map((l, i) => (
                  <Text key={i} style={s.langTxt}>• {l}</Text>
                ))}
              </>
            )}

            {data.strengths && data.strengths.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: STEEL, marginBottom: 6, marginTop: 12 }}>Strengths</Text>
                {data.strengths.map((str, i) => (
                  <Text key={i} style={s.strTxt}>• {str}</Text>
                ))}
              </>
            )}

            {data.interests && data.interests.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: STEEL, marginBottom: 6, marginTop: 12 }}>Interests</Text>
                <Text style={s.intTxt}>{data.interests.join(' • ')}</Text>
              </>
            )}
          </View>
        </View>

        {/* Education */}
        {data.education && (
          <>
            <View style={s.secHeader}><Text style={s.secTitle}>Education</Text></View>
            <Text style={s.eduTxt}>{data.education}</Text>
          </>
        )}

        {/* References */}
        <View style={s.secHeader}><Text style={s.secTitle}>References</Text></View>
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>

      </View>
    </Page>
  </Document>
);
