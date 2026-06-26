// T3 – Crimson Banner (Sarah Martinez style)
// Full-width crimson/maroon summary banner across top, photo top-left, left sidebar, white right body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const CRIMSON = '#8B1A1A';
const DARK    = '#1a1a1a';
const WHITE   = '#ffffff';
const MUTED   = '#6b7280';
const SIDEBAR = '#f8f5f2';

const s = StyleSheet.create({
  page:     { backgroundColor: WHITE, fontFamily: 'Helvetica' },

  // Top header strip: photo + name
  topHeader:{ flexDirection: 'row', padding: 28, paddingBottom: 0, alignItems: 'center' },
  avatar:   { width: 80, height: 80, borderRadius: 6, objectFit: 'cover', marginRight: 18 },
  initBox:  { width: 80, height: 80, borderRadius: 6, backgroundColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },
  nameBlock:{ flex: 1 },
  bdName:   { fontSize: 26, fontFamily: 'Helvetica-Bold', color: DARK, letterSpacing: -0.3 },
  bdRole:   { fontSize: 10, color: CRIMSON, fontFamily: 'Helvetica-Bold', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  // Crimson banner
  banner:   { backgroundColor: CRIMSON, marginTop: 14, paddingVertical: 12, paddingHorizontal: 28 },
  bannerTxt:{ fontSize: 8.5, color: WHITE, lineHeight: 1.65 },

  // Two columns below
  cols:     { flexDirection: 'row', paddingHorizontal: 0, flex: 1 },
  leftCol:  { width: 170, backgroundColor: SIDEBAR, padding: 20 },
  rightCol: { flex: 1, padding: 24, paddingTop: 20 },

  sbSec:    { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, marginTop: 14 },
  sbDiv:    { height: 1, backgroundColor: CRIMSON, marginBottom: 8 },
  sbSkill:  { fontSize: 8, color: '#374151', marginBottom: 4 },
  sbLang:   { fontSize: 8, color: '#374151', marginBottom: 4 },
  sbStr:    { fontSize: 8, color: '#374151', marginBottom: 4 },
  sbInt:    { fontSize: 8, color: '#374151', marginBottom: 3 },
  sbCert:   { fontSize: 7.5, color: '#6b7280', marginBottom: 4, lineHeight: 1.4 },
  sbEdu:    { fontSize: 8, color: '#374151', lineHeight: 1.5 },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, marginTop: 16 },
  bdDiv:    { height: 1.5, backgroundColor: CRIMSON, marginBottom: 10 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between' },
  jobRole:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: CRIMSON, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: CRIMSON, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#fff5f5', borderLeftWidth: 3, borderLeftColor: CRIMSON, padding: 10, marginTop: 4 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const VividSidebarTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Top Header ── */}
      <View style={s.topHeader}>
        
        <View style={s.nameBlock}>
          <Text style={s.bdName}>{data.name}</Text>
          
          <View style={s.bdContact}>
            {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
            {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
            {data.location && <Text style={s.bdCtxt}>{data.location}</Text>}
          </View>
        </View>
      </View>

      {/* ── Crimson Banner ── */}
      {data.summary && (
        <View style={s.banner}>
          <Text style={s.bannerTxt}>{data.summary}</Text>
        </View>
      )}

      {/* ── Two Columns ── */}
      <View style={s.cols}>

        {/* Left Column */}
        <View style={s.leftCol}>

          {data.skills.length > 0 && (
            <>
              <Text style={s.sbSec}>Key Skills</Text>
              <View style={s.sbDiv} />
              {data.skills.slice(0, 8).map((sk, i) => (
                <Text key={i} style={s.sbSkill}>• {sk}</Text>
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
                <Text key={i} style={s.sbStr}>• {str}</Text>
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

          {data.education && (
            <>
              <Text style={s.sbSec}>Education</Text>
              <View style={s.sbDiv} />
              <Text style={s.sbEdu}>{data.education}</Text>
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
        </View>

        {/* Right Column */}
        <View style={s.rightCol}>

          {data.experience.length > 0 && (
            <>
              <Text style={s.bdSec}>Professional Experience</Text>
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

          <Text style={[s.bdSec, { marginTop: 16 }]}>References</Text>
          <View style={s.bdDiv} />
          <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
        </View>
      </View>

    </Page>
  </Document>
);
