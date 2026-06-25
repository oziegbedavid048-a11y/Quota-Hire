// Maroon Ribbon (Sarah Martinez style)
// White body, red/maroon ribbon for headline, photo top left, left column thin
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const RIBBON_BG = '#0ea5e9'; // Bright light blue
const WHITE     = '#ffffff';
const FG_MAIN   = '#1f2937';
const FG_MUTED  = '#6b7280';

const s = StyleSheet.create({
  page:       { backgroundColor: WHITE, fontFamily: 'Helvetica' },
  
  // Header section
  headerArea: { flexDirection: 'row', paddingTop: 30, paddingLeft: 40, paddingRight: 40, alignItems: 'center', zIndex: 10 },
  avatarArea: { width: 90 },
  avatar:     { width: 80, height: 80, borderRadius: 40, objectFit: 'cover' },
  nameArea:   { flex: 1, paddingLeft: 20 },
  nameTxt:    { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#111827', letterSpacing: -0.5 },

  // Ribbon
  ribbon:     { backgroundColor: RIBBON_BG, paddingVertical: 18, paddingHorizontal: 40, marginTop: 10, marginBottom: 24 },
  ribbonTxt:  { fontSize: 9.5, color: WHITE, lineHeight: 1.5 },
  
  // Two column layout below
  columns:    { flexDirection: 'row', paddingHorizontal: 40, flex: 1 },
  leftCol:    { width: 140, paddingRight: 20 },
  rightCol:   { flex: 1 },

  // Sidebar elements
  sbTitle:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: FG_MAIN, textTransform: 'uppercase', marginBottom: 10, marginTop: 16 },
  sbItemRow:  { flexDirection: 'row', marginBottom: 6, alignItems: 'center' },
  sbIcon:     { width: 14, fontSize: 9 },
  sbItemTxt:  { fontSize: 8.5, color: '#374151' },
  sbBulletRow:{ flexDirection: 'row', marginBottom: 4 },
  sbBulletDot:{ fontSize: 9, color: RIBBON_BG, marginRight: 5 },
  sbBulletTxt:{ fontSize: 8.5, color: '#374151', flex: 1 },

  // Right column elements
  bdTitle:    { fontSize: 11, fontFamily: 'Helvetica-Bold', color: FG_MAIN, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  bdDivider:  { height: 1.5, backgroundColor: RIBBON_BG, marginBottom: 12 },
  
  // Jobs
  jobBlock:   { marginBottom: 16 },
  jobRoleCo:  { flexDirection: 'row', marginBottom: 2 },
  jobRole:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: FG_MAIN },
  jobCo:      { fontSize: 10, color: FG_MUTED },
  jobDate:    { fontSize: 8.5, color: '#9ca3af', marginBottom: 5 },
  bdBullet:   { flexDirection: 'row', marginBottom: 4 },
  bdBulletDot:{ fontSize: 8.5, color: FG_MAIN, marginRight: 6, marginTop: 1 },
  bdBulletTxt:{ flex: 1, fontSize: 9, color: '#374151', lineHeight: 1.5 },
});

export const ExecutiveBlueTemplate = ({ data }: { data: CVData }) => {

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* Header */}
        <View style={s.headerArea}>
          {data.passportUrl && (
            <View style={s.avatarArea}>
              <Image source={{ uri: data.passportUrl }} style={s.avatar} />
            </View>
          )}
          <View style={s.nameArea}>
            <Text style={s.nameTxt}>{data.name}</Text>
          </View>
        </View>

        {/* Ribbon Summary */}
        <View style={s.ribbon}>
          <Text style={s.ribbonTxt}>{data.headline} {data.summary && `- ${data.summary}`}</Text>
        </View>

        {/* Columns */}
        <View style={s.columns}>
          
          {/* Left Column (Contact, Skills) */}
          <View style={s.leftCol}>
            <Text style={s.sbTitle}>Contact</Text>
            {data.phone && (
              <View style={s.sbItemRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbItemTxt}>{data.phone}</Text></View>
            )}
            {data.email && (
              <View style={s.sbItemRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbItemTxt}>{data.email}</Text></View>
            )}
            {data.linkedinUrl && (
              <View style={s.sbItemRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbItemTxt}>{data.linkedinUrl}</Text></View>
            )}
            {data.location && (
              <View style={s.sbItemRow}><Text style={s.sbIcon}>⚲</Text><Text style={s.sbItemTxt}>{data.location}</Text></View>
            )}

            {data.skills.length > 0 && (
              <>
                <Text style={s.sbTitle}>Key Skills</Text>
                {data.skills.slice(0, 8).map((sk, i) => (
                  <View key={i} style={s.sbBulletRow}>
                    <Text style={s.sbBulletDot}>•</Text>
                    <Text style={s.sbBulletTxt}>{sk}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Right Column (Experience, Education) */}
          <View style={s.rightCol}>
            {data.experience.length > 0 && (
              <>
                <Text style={s.bdTitle}>Professional Experience</Text>
                <View style={s.bdDivider} />
                {data.experience.map((exp, i) => {
                  const bullets = dutiesToBullets(exp.duties);
                  return (
                    <View key={i} style={s.jobBlock}>
                      <View style={s.jobRoleCo}>
                        <Text style={s.jobRole}>{exp.role}</Text>
                        {exp.company && <Text style={s.jobCo}> | {exp.company}</Text>}
                      </View>
                      {exp.period && <Text style={s.jobDate}>{exp.period}</Text>}
                      {bullets.map((b, bi) => (
                        <View key={bi} style={s.bdBullet}>
                          <Text style={s.bdBulletDot}>•</Text>
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
                <Text style={[s.bdTitle, { marginTop: 10 }]}>Key Achievement</Text>
                <View style={s.bdDivider} />
                <Text style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.6 }}>{data.achievement}</Text>
              </>
            )}

            {data.education && (
              <>
                <Text style={[s.bdTitle, { marginTop: 24 }]}>Education</Text>
                <Text style={{ fontSize: 9.5, color: '#374151' }}>{data.education}</Text>
              </>
            )}
          </View>
        </View>

      </Page>
    </Document>
  );
};
