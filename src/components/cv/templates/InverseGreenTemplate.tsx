// Purple Accent (Sophia Brown style)
// Deep purple header block, white body, left column for skills, right for experience
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const PURPLE    = '#3B0944';
const WHITE     = '#ffffff';
const FG_MAIN   = '#1f2937';
const FG_MUTED  = '#4b5563';

const s = StyleSheet.create({
  page:       { backgroundColor: WHITE, fontFamily: 'Helvetica' },
  
  // Header section
  headerArea: { backgroundColor: PURPLE, padding: 30, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center' },
  nameArea:   { flex: 1 },
  nameTxt:    { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleTxt:    { fontSize: 10, color: '#e9d5ff' },
  contactArea:{ width: 150, alignItems: 'flex-end' },
  contactRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },
  contactIcon:{ width: 14, fontSize: 9, color: '#e9d5ff', textAlign: 'right', marginRight: 6 },
  contactTxt: { fontSize: 8, color: WHITE },

  // Columns
  columns:    { flexDirection: 'row', flex: 1, padding: 30, paddingHorizontal: 40 },
  leftCol:    { width: 160, paddingRight: 24, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  rightCol:   { flex: 1, paddingLeft: 24 },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon:  { width: 14, height: 14, borderRadius: 7, backgroundColor: PURPLE, color: WHITE, fontSize: 9, textAlign: 'center', lineHeight: 1.5, marginRight: 6 },
  sectionTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: FG_MAIN, textTransform: 'uppercase' },
  
  // Main blocks
  summaryTxt:   { fontSize: 9.5, color: FG_MUTED, lineHeight: 1.6, marginBottom: 20 },
  jobBlock:     { marginBottom: 16 },
  jobRoleRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole:      { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: FG_MAIN },
  jobDate:      { fontSize: 8.5, color: FG_MUTED },
  jobCo:        { fontSize: 8.5, color: FG_MUTED, marginBottom: 6, fontStyle: 'italic' },
  bdBullet:     { flexDirection: 'row', marginBottom: 4 },
  bdBulletNum:  { fontSize: 9, color: PURPLE, marginRight: 6 },
  bdBulletTxt:  { flex: 1, fontSize: 9, color: FG_MUTED, lineHeight: 1.5 },

  // Left sidebar items
  skillRow:     { marginBottom: 8 },
  skillLbl:     { fontSize: 8.5, color: FG_MAIN, marginBottom: 3 },
  dotsRow:      { flexDirection: 'row', gap: 3 },
  dotFilled:    { width: 6, height: 6, borderRadius: 3, backgroundColor: PURPLE },
  dotEmpty:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: PURPLE },
});

export const InverseGreenTemplate = ({ data }: { data: CVData }) => {
  const skillsWithScores = data.skills.slice(0, 6).map((sk, i) => ({
    name: sk,
    score: Math.min(5, 5 - Math.floor(i / 2)),
  }));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* Header */}
        <View style={s.headerArea}>
          <View style={s.nameArea}>
            <Text style={s.nameTxt}>{data.name}</Text>
            <Text style={s.roleTxt}>{data.headline}</Text>
          </View>
          <View style={s.contactArea}>
            {data.email && <View style={s.contactRow}><Text style={s.contactIcon}>✉</Text><Text style={s.contactTxt}>{data.email}</Text></View>}
            {data.phone && <View style={s.contactRow}><Text style={s.contactIcon}>☎</Text><Text style={s.contactTxt}>{data.phone}</Text></View>}
            {data.location && <View style={s.contactRow}><Text style={s.contactIcon}>⚲</Text><Text style={s.contactTxt}>{data.location}</Text></View>}
            {data.linkedinUrl && <View style={s.contactRow}><Text style={s.contactIcon}>in</Text><Text style={s.contactTxt}>{data.linkedinUrl}</Text></View>}
          </View>
        </View>

        {/* Columns */}
        <View style={s.columns}>
          
          {/* Left Column */}
          <View style={s.leftCol}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionIcon}>★</Text><Text style={s.sectionTitle}>Skills</Text>
            </View>
            {skillsWithScores.map((sk, i) => (
              <View key={i} style={s.skillRow}>
                <Text style={s.skillLbl}>{sk.name}</Text>
                <View style={s.dotsRow}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <View key={j} style={j < sk.score ? s.dotFilled : s.dotEmpty} />
                  ))}
                </View>
              </View>
            ))}

            <View style={[s.sectionTitleRow, { marginTop: 20 }]}>
              <Text style={s.sectionIcon}>🎓</Text><Text style={s.sectionTitle}>Education</Text>
            </View>
            <Text style={{ fontSize: 8.5, color: FG_MUTED, lineHeight: 1.5 }}>{data.education}</Text>
          </View>

          {/* Right Column */}
          <View style={s.rightCol}>
            {data.summary && (
              <>
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>👤</Text><Text style={s.sectionTitle}>Professional Summary</Text>
                </View>
                <Text style={s.summaryTxt}>{data.summary}</Text>
              </>
            )}

            {data.experience.length > 0 && (
              <>
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>💼</Text><Text style={s.sectionTitle}>Work Experience</Text>
                </View>
                {data.experience.map((exp, i) => {
                  const bullets = dutiesToBullets(exp.duties);
                  return (
                    <View key={i} style={s.jobBlock}>
                      <View style={s.jobRoleRow}>
                        <Text style={s.jobRole}>{exp.role}</Text>
                        {exp.period && <Text style={s.jobDate}>{exp.period}</Text>}
                      </View>
                      <Text style={s.jobCo}>{exp.company}</Text>
                      {bullets.map((b, bi) => (
                        <View key={bi} style={s.bdBullet}>
                          <Text style={s.bdBulletNum}>{bi + 1}.</Text>
                          <Text style={s.bdBulletTxt}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </>
            )}

            {data.achievement && (
              <>
                <View style={[s.sectionTitleRow, { marginTop: 4 }]}>
                  <Text style={s.sectionIcon}>🏆</Text><Text style={s.sectionTitle}>Achievement</Text>
                </View>
                <Text style={s.summaryTxt}>{data.achievement}</Text>
              </>
            )}
          </View>

        </View>
      </Page>
    </Document>
  );
};
