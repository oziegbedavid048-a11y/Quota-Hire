// Gold Minimalist (Daniela Murray style)
// Beige/Gold header block, white body, 2 columns.
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const GOLD      = '#C1A67B';
const WHITE     = '#ffffff';
const FG_MAIN   = '#1f2937';
const FG_MUTED  = '#4b5563';

const s = StyleSheet.create({
  page:       { backgroundColor: WHITE, fontFamily: 'Helvetica', padding: 36, paddingTop: 30 },
  
  // Header section
  headerArea: { backgroundColor: GOLD, paddingVertical: 24, paddingHorizontal: 30, alignItems: 'center', marginBottom: 24 },
  avatarArea: { marginBottom: 14 },
  avatar:     { width: 60, height: 60, borderRadius: 30, objectFit: 'cover' },
  nameTxt:    { fontSize: 24, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4, letterSpacing: 0.5 },
  roleTxt:    { fontSize: 10, color: WHITE },

  // Columns
  columns:    { flexDirection: 'row', flex: 1 },
  leftCol:    { flex: 1, paddingRight: 24 },
  rightCol:   { width: 170, paddingLeft: 20, borderLeftWidth: 1, borderLeftColor: '#e5e7eb' },

  // Sections
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: FG_MAIN, textTransform: 'uppercase', marginBottom: 8 },
  divider:      { height: 1, backgroundColor: '#e5e7eb', marginBottom: 12 },
  
  // Main blocks
  summaryTxt:   { fontSize: 9.5, color: FG_MUTED, lineHeight: 1.6, marginBottom: 20 },
  jobBlock:     { marginBottom: 16 },
  jobRole:      { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: FG_MAIN, marginBottom: 2 },
  jobCoMeta:    { fontSize: 8.5, color: FG_MUTED, marginBottom: 6 },
  bdBullet:     { flexDirection: 'row', marginBottom: 4 },
  bdBulletDot:  { fontSize: 10, color: FG_MUTED, marginRight: 6, marginTop: 1 },
  bdBulletTxt:  { flex: 1, fontSize: 9, color: FG_MUTED, lineHeight: 1.5 },

  // Right sidebar items
  contactRow:   { flexDirection: 'row', marginBottom: 6, alignItems: 'center' },
  contactIcon:  { width: 16, fontSize: 10, color: FG_MAIN },
  contactTxt:   { fontSize: 8.5, color: FG_MUTED, flex: 1 },
  
  skillDotRow:  { flexDirection: 'row', marginBottom: 5 },
  skillDot:     { fontSize: 14, color: FG_MAIN, marginRight: 5, marginTop: -3 },
  skillTxt:     { fontSize: 8.5, color: FG_MUTED, flex: 1 },
});

export const VividSidebarTemplate = ({ data }: { data: CVData }) => {

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
          <Text style={s.nameTxt}>{data.name}</Text>
        </View>

        {/* Columns */}
        <View style={s.columns}>
          
          {/* Left Column (Summary, Experience) */}
          <View style={s.leftCol}>
            {data.summary && (
              <>
                <Text style={s.sectionTitle}>Professional Summary</Text>
                <Text style={s.summaryTxt}>{data.summary}</Text>
              </>
            )}

            {data.experience.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Work History</Text>
                <View style={s.divider} />
                {data.experience.map((exp, i) => {
                  const bullets = dutiesToBullets(exp.duties);
                  return (
                    <View key={i} style={s.jobBlock}>
                      <Text style={s.jobRole}>{exp.role}</Text>
                      <Text style={s.jobCoMeta}>{exp.company}{exp.period ? ` \u2014 ${exp.period}` : ''}</Text>
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
                <Text style={s.sectionTitle}>Key Achievement</Text>
                <View style={s.divider} />
                <Text style={s.summaryTxt}>{data.achievement}</Text>
              </>
            )}
          </View>

          {/* Right Column (Contact, Skills, Education) */}
          <View style={s.rightCol}>
            <View style={{ marginBottom: 24 }}>
              {data.email && (
                <View style={s.contactRow}><Text style={s.contactIcon}>✉</Text><Text style={s.contactTxt}>{data.email}</Text></View>
              )}
              {data.phone && (
                <View style={s.contactRow}><Text style={s.contactIcon}>☎</Text><Text style={s.contactTxt}>{data.phone}</Text></View>
              )}
              {data.location && (
                <View style={s.contactRow}><Text style={s.contactIcon}>⚲</Text><Text style={s.contactTxt}>{data.location}</Text></View>
              )}
              {data.linkedinUrl && (
                <View style={s.contactRow}><Text style={s.contactIcon}>in</Text><Text style={s.contactTxt}>{data.linkedinUrl}</Text></View>
              )}
            </View>

            {data.skills.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Skills</Text>
                <View style={s.divider} />
                {data.skills.slice(0, 10).map((sk, i) => (
                  <View key={i} style={s.skillDotRow}>
                    <Text style={s.skillDot}>•</Text>
                    <Text style={s.skillTxt}>{sk}</Text>
                  </View>
                ))}
                <View style={{ marginBottom: 16 }} />
              </>
            )}

            {data.education && (
              <>
                <Text style={s.sectionTitle}>Education</Text>
                <View style={s.divider} />
                <Text style={[s.summaryTxt, { marginBottom: 0 }]}>{data.education}</Text>
              </>
            )}
          </View>
        </View>

      </Page>
    </Document>
  );
};
