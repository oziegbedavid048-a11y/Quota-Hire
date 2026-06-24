// Classic Split (Andre Hintz style)
// Beige left sidebar, white right body, dark grey angled header top left
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CVData } from '../../../lib/cv/types';
import { dutiesToBullets } from '../../../lib/cv/cvContentBuilder';

const SIDEBAR = '#e6e1da';
const HEADER_BG = '#3a3e47';
const WHITE   = '#ffffff';
const BODY_FG = '#1e293b';

const s = StyleSheet.create({
  page:       { flexDirection: 'row', backgroundColor: WHITE, fontFamily: 'Helvetica' },
  sidebar:    { width: 190, backgroundColor: SIDEBAR, flexShrink: 0 },
  body:       { flex: 1, padding: 36, paddingTop: 60 },

  // Angled header at top of sidebar
  sbHeader:   { backgroundColor: HEADER_BG, padding: 30, paddingBottom: 40, alignItems: 'center' },
  
  // Avatar
  avatarContainer: { marginTop: 40, alignItems: 'center' },
  avatar:     { width: 80, height: 80, borderRadius: 40, objectFit: 'cover' },
  avatarInit: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4a5568', color: WHITE, fontSize: 26, textAlign: 'center', lineHeight: 80 / 12 },

  // Sidebar content
  sbContent:  { padding: 30, paddingTop: 10 },
  sbSection:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#4b5563', marginBottom: 8, marginTop: 18 },
  sbTextRow:  { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  sbIcon:     { width: 14, fontSize: 8 },
  sbText:     { fontSize: 8.5, color: '#4b5563', flex: 1, lineHeight: 1.4 },
  sbSkill:    { fontSize: 8.5, color: '#4b5563', marginBottom: 4 },

  // Main Body Top Name
  bdNameWrapper: { position: 'absolute', top: 30, left: 226, right: 36, backgroundColor: HEADER_BG, padding: 24, paddingLeft: 30 },
  bdName:     { fontSize: 24, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 4 },
  bdRole:     { fontSize: 10, color: WHITE, opacity: 0.9 },

  // Main Body sections
  bdSection:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 6, marginTop: 18 },
  bdDivider:  { height: 1, backgroundColor: '#d1d5db', marginBottom: 12 },
  bdSummary:  { fontSize: 9.5, color: '#4b5563', lineHeight: 1.6 },
  
  // Job
  bdJobTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 2 },
  bdJobMeta:  { fontSize: 8.5, color: '#6b7280', marginBottom: 6, fontStyle: 'italic' },
  bdBullet:   { flexDirection: 'row', marginBottom: 4 },
  bdBulletDot:{ fontSize: 9, color: '#4b5563', marginRight: 5, marginTop: 1 },
  bdBulletTxt:{ flex: 1, fontSize: 9, color: '#4b5563', lineHeight: 1.5 },
});

export const ClassicSplitTemplate = ({ data }: { data: CVData }) => {
  const initials = data.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* ── Left Sidebar ── */}
        <View style={s.sidebar}>
          <View style={s.sbHeader}>
            {data.profileImageUrl ? (
              <Image source={{ uri: data.profileImageUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarInit}><Text style={{ paddingTop: 24 }}>{initials}</Text></View>
            )}
          </View>

          <View style={s.sbContent}>
            <Text style={s.sbSection}>Contact Details</Text>
            {data.email && (
              <View style={s.sbTextRow}><Text style={s.sbIcon}>✉</Text><Text style={s.sbText}>{data.email}</Text></View>
            )}
            {data.phone && (
              <View style={s.sbTextRow}><Text style={s.sbIcon}>☎</Text><Text style={s.sbText}>{data.phone}</Text></View>
            )}
            {data.location && (
              <View style={s.sbTextRow}><Text style={s.sbIcon}>⚲</Text><Text style={s.sbText}>{data.location}</Text></View>
            )}
            {data.linkedinUrl && (
              <View style={s.sbTextRow}><Text style={s.sbIcon}>in</Text><Text style={s.sbText}>{data.linkedinUrl}</Text></View>
            )}

            {data.education && (
              <>
                <Text style={s.sbSection}>Education</Text>
                <View style={s.sbTextRow}><Text style={s.sbIcon}>•</Text><Text style={s.sbText}>{data.education}</Text></View>
              </>
            )}

            {data.skills.length > 0 && (
              <>
                <Text style={s.sbSection}>Skills</Text>
                {data.skills.slice(0, 8).map((sk, i) => (
                  <Text key={i} style={s.sbSkill}>{sk} - Expert</Text>
                ))}
              </>
            )}
          </View>
        </View>

        {/* ── Name Banner (Overlaps right) ── */}
        <View style={s.bdNameWrapper}>
          <Text style={s.bdName}>{data.name}</Text>
          <Text style={s.bdRole}>{data.headline}</Text>
        </View>

        {/* ── Right Body ── */}
        <View style={s.body}>
          {data.summary && (
            <>
              <Text style={s.bdSection}>Summary</Text>
              <View style={s.bdDivider} />
              <Text style={s.bdSummary}>{data.summary}</Text>
            </>
          )}

          {data.experience.length > 0 && (
            <>
              <Text style={s.bdSection}>Work Experience</Text>
              <View style={s.bdDivider} />
              {data.experience.map((exp, i) => {
                const bullets = dutiesToBullets(exp.duties);
                return (
                  <View key={i} style={{ marginBottom: 14 }}>
                    <Text style={s.bdJobTitle}>{exp.role}{exp.company ? `, ${exp.company}` : ''}</Text>
                    {exp.period && <Text style={s.bdJobMeta}>{exp.period}</Text>}
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
              <Text style={s.bdSection}>Key Achievement</Text>
              <View style={s.bdDivider} />
              <Text style={s.bdSummary}>{data.achievement}</Text>
            </>
          )}
        </View>

      </Page>
    </Document>
  );
};
