// T12 – Forest Green Photo (Charlene Wells style)
// Dark forest green sidebar with photo bottom area, star skill ratings, white body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const FOREST = '#2D5016';
const GREEN2 = '#4a7a28';
const LIME   = '#a3d977';
const DARK   = '#1a1a1a';
const WHITE  = '#ffffff';
const MUTED  = '#9ca3af';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 195, backgroundColor: FOREST, flexShrink: 0, padding: 0 },
  body:     { flex: 1, padding: 32 },

  // Top photo area in sidebar
  photoSection:{ backgroundColor: GREEN2, alignItems: 'center', padding: 22, paddingTop: 28, paddingBottom: 22 },
  avatar:   { width: 80, height: 80, borderRadius: 40, objectFit: 'cover', borderWidth: 3, borderColor: LIME },
  initBox:  { width: 80, height: 80, borderRadius: 40, backgroundColor: FOREST, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: LIME },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },
  sbName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: WHITE, textAlign: 'center', marginTop: 10, lineHeight: 1.3 },
  sbRole:   { fontSize: 8, color: LIME, textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  sbContent:{ padding: 20, paddingTop: 16 },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: LIME, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, marginTop: 12 },
  sbDiv:    { height: 1, backgroundColor: GREEN2, marginBottom: 8 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 14, fontSize: 8, color: LIME },
  sbText:   { fontSize: 7.5, color: '#bbf7d0', flex: 1, lineHeight: 1.5 },

  // Star rating skills
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  skillName:{ fontSize: 7.5, color: '#bbf7d0', flex: 1 },
  starRow:  { flexDirection: 'row' },
  starFill: { fontSize: 8, color: LIME },
  starEmpty:{ fontSize: 8, color: GREEN2 },

  sbLang:   { fontSize: 7.5, color: '#bbf7d0', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#bbf7d0', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#bbf7d0', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: '#86efac', marginBottom: 3, lineHeight: 1.4 },

  // Body
  bdName:   { fontSize: 24, fontFamily: 'Helvetica-Bold', color: FOREST },
  bdRole:   { fontSize: 10, color: GREEN2, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#dcfce7', paddingBottom: 8 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: FOREST, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 4 },
  bdDiv:    { height: 1.5, backgroundColor: FOREST, marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: GREEN2, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: FOREST, marginRight: 5 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: FOREST, padding: 10, marginTop: 4 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

const StarRating = ({ level = 4 }: { level?: number }) => (
  <View style={s.starRow}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Text key={i} style={i < level ? s.starFill : s.starEmpty}>★</Text>
    ))}
  </View>
);

export const ForestGreenPhotoTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoSection}>
          {data.passportUrl && <Image source={{ uri: data.passportUrl }} style={s.avatar} />}
          <Text style={s.sbName}>{data.name}</Text>
          
        </View>

        <View style={s.sbContent}>
          <Text style={s.sbSec}>Contact</Text>
          <View style={s.sbDiv} />
          {data.email    && <View style={s.sbRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>}
          {data.phone    && <View style={s.sbRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>}
          {data.location && <View style={s.sbRow}><Text style={s.sbIcon}></Text><Text style={s.sbText}>{data.location}</Text></View>}
          {data.linkedinUrl && <View style={s.sbRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>}

          <Text style={s.sbSec}>Skills</Text>
          <View style={s.sbDiv} />
          {data.skills.slice(0, 6).map((sk, i) => (
            <View key={i} style={s.skillRow}>
              <Text style={s.skillName}>{sk}</Text>
              <StarRating level={5 - (i % 2)} />
            </View>
          ))}

          {data.languages && data.languages.length > 0 && (
            <>
              <Text style={s.sbSec}>Languages</Text>
              <View style={s.sbDiv} />
              {data.languages.map((l, i) => <Text key={i} style={s.sbLang}>• {l}</Text>)}
            </>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <>
              <Text style={s.sbSec}>Certifications</Text>
              <View style={s.sbDiv} />
              {data.certifications.map((cert, i) => <Text key={i} style={s.sbCert}>• {cert}</Text>)}
            </>
          )}

          {data.education && (
            <>
              <Text style={s.sbSec}>Education</Text>
              <View style={s.sbDiv} />
              <Text style={s.sbText}>{data.education}</Text>
            </>
          )}

          {data.strengths && data.strengths.length > 0 && (
            <>
              <Text style={s.sbSec}>Strengths</Text>
              <View style={s.sbDiv} />
              {data.strengths.map((str, i) => <Text key={i} style={s.sbStr}>• {str}</Text>)}
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

        {data.achievement && (
          <>
            <Text style={s.bdSec}>Key Achievements</Text>
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
