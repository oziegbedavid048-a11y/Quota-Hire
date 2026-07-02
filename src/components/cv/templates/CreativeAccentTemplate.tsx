// T8 – Gold Sidebar (Harper Lewis / William Perez style)
// Dark golden-olive sidebar with skill level bars (out of 10), white clean right body
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const GOLD   = '#8B7B30';
const GOLD2  = '#c4a92a';
const DARK   = '#1a1a1a';
const WHITE  = '#ffffff';
const MUTED  = '#9ca3af';
const SIDE   = '#2a2200';

const s = StyleSheet.create({
  page:     { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:  { width: 195, backgroundColor: SIDE, flexShrink: 0, padding: 22, paddingTop: 30 },
  body:     { flex: 1, padding: 32 },

  photoBox: { alignItems: 'center', marginBottom: 18 },
  avatar:   { width: 82, height: 82, borderRadius: 8, objectFit: 'cover', borderWidth: 2, borderColor: GOLD2 },
  initBox:  { width: 82, height: 82, borderRadius: 8, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD2 },
  initTxt:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: WHITE },

  sbSec:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GOLD2, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  sbRow:    { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  sbIcon:   { width: 13, fontSize: 8, color: GOLD2 },
  sbText:   { fontSize: 7.5, color: '#d4c87a', flex: 1, lineHeight: 1.5 },

  // Skill with numbered bar
  skillRow: { marginBottom: 8 },
  skillName:{ fontSize: 8, color: '#d4c87a', marginBottom: 3 },
  skillBar: { height: 4, backgroundColor: '#3d3300', borderRadius: 2 },
  skillFill:{ height: 4, backgroundColor: GOLD2, borderRadius: 2 },
  skillNum: { fontSize: 7, color: GOLD2, textAlign: 'right', marginTop: 1 },

  sbLang:   { fontSize: 7.5, color: '#d4c87a', marginBottom: 3 },
  sbStr:    { fontSize: 7.5, color: '#d4c87a', marginBottom: 3 },
  sbInt:    { fontSize: 7.5, color: '#d4c87a', marginBottom: 2 },
  sbCert:   { fontSize: 7, color: MUTED, marginBottom: 3, lineHeight: 1.4 },
  sbEdu:    { fontSize: 7.5, color: '#d4c87a', lineHeight: 1.5 },

  // Body
  bdName:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 1 },
  bdRole:   { fontSize: 10, color: GOLD, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  bdContact:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  bdCtxt:   { fontSize: 7.5, color: MUTED },

  bdSec:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 5 },
  bdDiv:    { height: 1, backgroundColor: '#e5d76e', marginBottom: 10 },
  bdSummary:{ fontSize: 9, color: '#374151', lineHeight: 1.7 },

  jobBlock: { marginBottom: 14 },
  jobHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jobRole:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate:  { fontSize: 8, color: MUTED },
  jobCo:    { fontSize: 8.5, color: GOLD, marginBottom: 4 },
  bullet:   { flexDirection: 'row', marginBottom: 3 },
  bulletDot:{ fontSize: 8.5, color: GOLD, marginRight: 5, marginTop: 1 },
  bulletTxt:{ flex: 1, fontSize: 8.5, color: '#374151', lineHeight: 1.5 },

  achBlock: { backgroundColor: '#fffde0', borderLeftWidth: 3, borderLeftColor: GOLD, padding: 10 },
  achTxt:   { fontSize: 8.5, color: '#374151', lineHeight: 1.6 },
  refText:  { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' },
});

const SkillBar = ({ name, level }: { name: string; level: number }) => (
  <View style={s.skillRow}>
    <Text style={s.skillName}>{name}</Text>
    <View style={s.skillBar}>
      <View style={[s.skillFill, { width: `${(level / 10) * 100}%` }]} />
    </View>
    <Text style={s.skillNum}>{level}</Text>
  </View>
);

export const CreativeAccentTemplate = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>

      {/* ── Sidebar ── */}
      <View style={s.sidebar}>
        <View style={s.photoBox}>
          {data.passportUrl && <Image source={{ uri: data.passportUrl }} style={s.avatar} />}
        </View>

        <Text style={s.sbSec}>Skills</Text>
        {data.skills.slice(0, 6).map((sk, i) => (
          <SkillBar key={i} name={sk} level={Math.min(10, 10 - (i % 3))} />
        ))}

        <Text style={s.sbSec}>Interests</Text>
        {data.interests?.slice(0, 4).map((intr, i) => (
          <View key={i} style={s.sbRow}>
            <Text style={s.sbIcon}>★</Text>
            <Text style={s.sbText}>{intr}</Text>
          </View>
        ))}

        <Text style={s.sbSec}>Strengths</Text>
        {data.strengths?.map((str, i) => (
          <View key={i} style={s.sbRow}>
            <Text style={s.sbIcon}>◆</Text>
            <Text style={s.sbText}>{str}</Text>
          </View>
        ))}

        <Text style={s.sbSec}>Languages</Text>
        {data.languages?.map((l, i) => (
          <Text key={i} style={s.sbLang}>• {l}</Text>
        ))}

        <Text style={s.sbSec}>Achievements</Text>
        <Text style={[s.sbCert, { color: '#d4c87a' }]}>{data.achievement?.slice(0, 130)}</Text>

        <Text style={s.sbSec}>Certifications</Text>
        {data.certifications?.map((cert, i) => (
          <Text key={i} style={s.sbCert}>• {cert}</Text>
        ))}

        <Text style={s.sbSec}>Education</Text>
        <Text style={s.sbEdu}>{data.education}</Text>
      </View>

      {/* ── Body ── */}
      <View style={s.body}>
        <Text style={s.bdName}>{data.name}</Text>
        <Text style={s.bdRole}>{data.headline}</Text>
        <View style={s.bdContact}>
          {data.email    && <Text style={s.bdCtxt}>✉ {data.email}</Text>}
          {data.phone    && <Text style={s.bdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.bdCtxt}>⚲ {data.location}</Text>}
          {data.linkedinUrl && <Text style={s.bdCtxt}>in {data.linkedinUrl}</Text>}
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
                      <Text style={s.bulletDot}>1.</Text>
                      <Text style={s.bulletTxt}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}

        <Text style={[s.bdSec, { marginTop: 14 }]}>References</Text>
        <View style={s.bdDiv} />
        <Text style={s.refText}>{data.references || 'Available upon request'}</Text>
      </View>

    </Page>
  </Document>
);
