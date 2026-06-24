// Lime Green Accent (William Perez style)
// Light green header block, white body, left column with skill bars
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const GREEN     = '#8ac149';
const GREEN_BG  = '#7db632'; // Slightly darker for banner
const WHITE     = '#ffffff';
const FG_MAIN   = '#1f2937';
const FG_MUTED  = '#4b5563';

const s = StyleSheet.create({
  page:       { backgroundColor: WHITE, fontFamily: 'Helvetica' },
  
  // Header section
  headerArea: { backgroundColor: GREEN_BG, padding: 30, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center' },
  avatarArea: { width: 80, marginRight: 24 },
  avatar:     { width: 70, height: 70, objectFit: 'cover', borderWidth: 2, borderColor: WHITE }, // Square-ish or circle depending on style; let's do circle to be safe
  avatarInit: { width: 70, height: 70, backgroundColor: 'rgba(0,0,0,0.1)', color: WHITE, fontSize: 24, textAlign: 'center', lineHeight: 70 / 12, borderWidth: 2, borderColor: WHITE },
  nameArea:   { flex: 1 },
  nameTxt:    { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 4, textTransform: 'uppercase' }, // Dark text in green header
  roleTxt:    { fontSize: 11, color: '#1f2937' },
  contactArea:{ width: 160, alignItems: 'flex-start' }, // William Perez style has contacts on right but left-aligned text
  contactRow: { flexDirection: 'row', marginBottom: 5, alignItems: 'center' },
  contactIcon:{ width: 14, fontSize: 9, color: '#1f2937', marginRight: 6 },
  contactTxt: { fontSize: 8.5, color: '#111827' },

  // Columns
  columns:    { flexDirection: 'row', flex: 1, padding: 30, paddingHorizontal: 40 },
  leftCol:    { width: 170, paddingRight: 24, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  rightCol:   { flex: 1, paddingLeft: 24 },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon:  { width: 14, height: 14, borderRadius: 7, backgroundColor: FG_MAIN, color: WHITE, fontSize: 9, textAlign: 'center', lineHeight: 1.5, marginRight: 6 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: FG_MAIN, textTransform: 'uppercase' },
  
  // Main blocks
  summaryTxt:   { fontSize: 9.5, color: FG_MUTED, lineHeight: 1.6, marginBottom: 20 },
  jobBlock:     { marginBottom: 16 },
  jobRoleRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole:      { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: FG_MAIN },
  jobDate:      { fontSize: 8.5, color: FG_MUTED },
  jobCo:        { fontSize: 8.5, color: GREEN_BG, marginBottom: 6 },
  bdBullet:     { flexDirection: 'row', marginBottom: 4 },
  bdBulletNum:  { fontSize: 9, color: GREEN_BG, marginRight: 6 },
  bdBulletTxt:  { flex: 1, fontSize: 9, color: FG_MUTED, lineHeight: 1.5 },

  // Left sidebar items
  skillRow:     { marginBottom: 8 },
  skillLbl:     { fontSize: 8.5, color: FG_MAIN, marginBottom: 3 },
  barBg:        { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 },
  barFg:        { height: 4, backgroundColor: '#471413', borderRadius: 2 }, // Dark brown skill bar like William Perez
});

export const CorporateBannerTemplate = ({ data }: { data: CVData }) => {
  const initials = data.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const skillsWithScores = data.skills.slice(0, 6).map((sk, i) => ({
    name: sk,
    score: Math.min(100, 100 - (i * 5)), // Percentages
  }));

  // Circle avatar
  const avatarStyle = { ...s.avatar, borderRadius: 35 };
  const initStyle = { ...s.avatarInit, borderRadius: 35 };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* Header */}
        <View style={s.headerArea}>
          <View style={s.avatarArea}>
            {data.profileImageUrl ? (
              <Image source={{ uri: data.profileImageUrl }} style={avatarStyle} />
            ) : (
              <View style={initStyle}><Text style={{ paddingTop: 20 }}>{initials}</Text></View>
            )}
          </View>
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
                <View style={s.barBg}>
                  <View style={[s.barFg, { width: `${sk.score}%` }]} />
                </View>
              </View>
            ))}

            <View style={[s.sectionTitleRow, { marginTop: 24 }]}>
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
