// T1 – Classic Split (Andre Hintz / Ivan Beer style)
// Dark grey angled header, beige sidebar, white right body
// Sections: Contact, Education, Skills | Summary, Experience, Achievement, References
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const DARK   = '#3a3e47';
const SAND   = '#e6e1da';
const WHITE  = '#ffffff';
const MUTED  = '#6b7280';
const ACCENT = '#4b5563';

const s = StyleSheet.create({
  page:      { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:   { width: 185, backgroundColor: SAND, flexShrink: 0 },
  body:      { flex: 1, paddingTop: 60, paddingLeft: 28, paddingRight: 32, paddingBottom: 30 },

  sbHeader:  { backgroundColor: DARK, padding: 26, paddingBottom: 18, alignItems: 'center' },
  avatar:    { width: 78, height: 78, borderRadius: 39, objectFit: 'cover', marginBottom: 8 },
  sbName:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'center', marginBottom: 2 },
  sbRole:    { fontSize: 8, color: '#d1d5db', textAlign: 'center' },

  sbContent: { padding: 20, paddingTop: 14 },
  sbSec:     { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#c5bfb5', paddingBottom: 3 },
  sbRow:     { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  sbIcon:    { width: 12, fontSize: 8, color: DARK },
  sbText:    { fontSize: 7.5, color: ACCENT, flex: 1, lineHeight: 1.5 },
  sbSkill:   { fontSize: 7.5, color: ACCENT, marginBottom: 3 },
  sbLang:    { fontSize: 7.5, color: ACCENT, marginBottom: 3 },
  sbCert:    { fontSize: 7, color: ACCENT, marginBottom: 3, lineHeight: 1.4 },
  sbStrength:{ fontSize: 7.5, color: ACCENT, marginBottom: 3 },
  sbInterest:{ fontSize: 7.5, color: ACCENT, marginBottom: 3 },

  bdNameWrap:{ position: 'absolute', top: 0, left: 185, right: 0, backgroundColor: DARK, padding: 18, paddingLeft: 28 },
  bdName:    { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 0.3 },
  bdRole:    { fontSize: 9, color: '#d1d5db', marginTop: 3 },

  bdSec:     { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, marginTop: 16, marginBottom: 4 },
  bdDiv:     { height: 1, backgroundColor: '#d1d5db', marginBottom: 10 },
  bdSummary: { fontSize: 9, color: ACCENT, lineHeight: 1.65 },

  jobTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 1 },
  jobMeta:   { fontSize: 8, color: MUTED, marginBottom: 5 },
  bullet:    { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { fontSize: 8.5, color: ACCENT, marginRight: 5, marginTop: 1 },
  bulletTxt: { flex: 1, fontSize: 8.5, color: ACCENT, lineHeight: 1.5 },

  achBlock:  { backgroundColor: '#f9f7f4', borderLeftWidth: 3, borderLeftColor: DARK, padding: 10, marginTop: 4 },
  achText:   { fontSize: 8.5, color: ACCENT, lineHeight: 1.6 },
  refText:   { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const ClassicSplitTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.sbHeader}>
          {data.passportUrl
            ? <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            : <View style={[s.avatar, { backgroundColor: '#6b7280', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 20, color: WHITE, fontFamily: 'Helvetica-Bold' }}>
                  {(data.name || 'U').charAt(0)}
                </Text>
              </View>
          }
          <Text style={s.sbName}>{data.name}</Text>
          <Text style={s.sbRole}>{data.headline}</Text>
        </View>

        <View style={s.sbContent}>
          {/* Contact */}
          <Text style={s.sbSec}>Contact</Text>
          {data.email    && <View style={s.sbRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>}
          {data.phone    && <View style={s.sbRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>}
          {data.location && <View style={s.sbRow}><Text style={s.sbIcon}>⚲</Text><Text style={s.sbText}>{data.location}</Text></View>}
          {data.linkedinUrl && <View style={s.sbRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>}

          {/* Education */}
          {data.education && (
            <>
              <Text style={s.sbSec}>Education</Text>
              <View style={s.sbRow}><Text style={s.sbIcon}>•</Text><Text style={s.sbText}>{data.education}</Text></View>
            </>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <>
              <Text style={s.sbSec}>Skills</Text>
              {data.skills.slice(0, 8).map((sk, i) => (
                <Text key={i} style={s.sbSkill}>• {sk}</Text>
              ))}
            </>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <>
              <Text style={s.sbSec}>Languages</Text>
              {data.languages.map((lang, i) => (
                <Text key={i} style={s.sbLang}>• {lang}</Text>
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

          {/* Strengths */}
          {data.strengths && data.strengths.length > 0 && (
            <>
              <Text style={s.sbSec}>Strengths</Text>
              {data.strengths.map((str, i) => (
                <Text key={i} style={s.sbStrength}>◆ {str}</Text>
              ))}
            </>
          )}

          {/* Interests */}
          {data.interests && data.interests.length > 0 && (
            <>
              <Text style={s.sbSec}>Interests</Text>
              <Text style={s.sbInterest}>{data.interests.join(' • ')}</Text>
            </>
          )}
        </View>
      </View>

      {/* ── Name Banner ── */}
      <View style={s.bdNameWrap}>
        <Text style={s.bdName}>{data.name}</Text>
        <Text style={s.bdRole}>{data.headline}</Text>
      </View>

      {/* ── Right Body ── */}
      <View style={s.body}>

        {data.summary && (
          <>
            <Text style={s.bdSec}>Summary</Text>
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
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={s.jobTitle}>{exp.role}{exp.company ? `, ${exp.company}` : ''}</Text>
                  {exp.period && <Text style={s.jobMeta}>{exp.period}</Text>}
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
              <Text style={s.achText}>{data.achievement}</Text>
            </View>
          </>
        )}

        <Text style={[s.bdSec, { marginTop: 16 }]}>References</Text>
        <View style={s.bdDiv} />
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
      </View>

    </Page>
  </Document>
);
