// T11 – Burgundy Side (Jackson Turner style)
// Dark burgundy/maroon sidebar, white right body with numbered experience points
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const BURG   = '#6B1F2E';
const BURG2  = '#9b2d42';
const DARK   = '#1a1a1a';
const WHITE  = '#ffffff';
const MUTED  = '#94a3b8';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 190, backgroundColor: BURG, flexShrink: 0, padding: 22, paddingTop: 28 },
  body:     { flex: 1, padding: 32 },

  photoBox: { alignItems: 'center', marginBottom: 18 },
  avatar:   { width: 82, height: 82, borderRadius: 41, objectFit: 'cover', borderWidth: 3, borderColor: BURG2 },
  initBox:  { width: 82, height: 82, borderRadius: 41, backgroundColor: BURG2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f9a8b4' },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },
  sbName:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'center', marginTop: 8 },
  sbRole:   { fontSize: 8, color: '#f9a8b4', textAlign: 'center', marginTop: 3, textTransform: 'uppercase' },

  divider:  { height: 1, backgroundColor: BURG2, marginVertical: 10 },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#f9a8b4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, marginTop: 12 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 14, fontSize: 8, color: '#f9a8b4' },
  sbText:   { fontSize: 7.5, color: '#fce7f3', flex: 1, lineHeight: 1.5 },
  sbSkill:  { fontSize: 7.5, color: '#fce7f3', marginBottom: 3 },
  sbLang:   { fontSize: 7.5, color: '#fce7f3', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#fce7f3', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#fce7f3', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: '#f9a8b4', marginBottom: 3, lineHeight: 1.4 },

  // Body
  bdName:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: BURG },
  bdRole:   { fontSize: 10, color: BURG, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#fce7f3', paddingBottom: 8 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BURG, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 1.5, backgroundColor: BURG, marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: BURG, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletNum:{ fontSize: 8, color: BURG, marginRight: 5, fontFamily: 'Helvetica-Bold', width: 14 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#fff5f7', borderLeftWidth: 3, borderLeftColor: BURG, padding: 10, marginTop: 4 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

export const BurgundySideTemplate = ({ data }: { data: CVData }) => (
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
        {data.skills.slice(0, 8).map((sk, i) => (
          <Text key={i} style={s.sbSkill}>▸ {sk}</Text>
        ))}

        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={s.sbSec}>Languages</Text>
            {data.languages.map((l, i) => <Text key={i} style={s.sbLang}>• {l}</Text>)}
          </>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <>
            <Text style={s.sbSec}>Strengths</Text>
            {data.strengths.map((str, i) => <Text key={i} style={s.sbStr}>• {str}</Text>)}
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
            {data.certifications.map((cert, i) => <Text key={i} style={s.sbCert}>• {cert}</Text>)}
          </>
        )}

        {data.education && (
          <>
            <Text style={s.sbSec}>Education</Text>
            <Text style={s.sbText}>{data.education}</Text>
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
                      <Text style={s.bulletNum}>{bi + 1}.</Text>
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

        <Text style={[s.bdSec, { marginTop: 14 }]}>References</Text>
        <View style={s.bdDiv} />
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
      </View>

    </Page>
  </Document>
);
