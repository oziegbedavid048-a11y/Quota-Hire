import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from '../../../../lib/cv/types';
import { dutiesToBullets } from '../../../../lib/cv/cvContentBuilder';

interface Theme {
  primary: string;
  headerAlign: 'center' | 'left';
  showDividers: boolean;
  fontFamily: string;
}

export const PlainTemplateBase = ({ data, theme }: { data: CVData; theme: Theme }) => {
  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: theme.fontFamily, padding: 35 },
    name: { 
      fontSize: 24, 
      fontFamily: theme.fontFamily === 'Helvetica' ? 'Helvetica-Bold' : 'Times-Bold', 
      color: theme.primary, 
      textAlign: theme.headerAlign,
      marginBottom: 4,
      textTransform: 'uppercase'
    },
    contact: { 
      fontSize: 9, 
      color: '#333333', 
      textAlign: theme.headerAlign,
      marginBottom: 16
    },
    section: { marginBottom: 12 },
    secTitle: { 
      fontSize: 12, 
      fontFamily: theme.fontFamily === 'Helvetica' ? 'Helvetica-Bold' : 'Times-Bold', 
      color: theme.primary, 
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: 4
    },
    secTitleLeft: { 
      fontSize: 12, 
      fontFamily: theme.fontFamily === 'Helvetica' ? 'Helvetica-Bold' : 'Times-Bold', 
      color: theme.primary, 
      textTransform: 'uppercase',
      textAlign: 'left',
      marginBottom: 4
    },
    divider: {
      height: 1,
      backgroundColor: theme.primary,
      marginBottom: 8
    },
    summary: { fontSize: 10, lineHeight: 1.5, color: '#111111' },
    jobRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    jobTitle: { fontSize: 10, fontFamily: theme.fontFamily === 'Helvetica' ? 'Helvetica-Bold' : 'Times-Bold' },
    jobDate: { fontSize: 10, fontFamily: theme.fontFamily === 'Helvetica' ? 'Helvetica-Bold' : 'Times-Bold' },
    jobCompany: { fontSize: 10, fontFamily: theme.fontFamily === 'Helvetica' ? 'Helvetica-Bold' : 'Times-Bold', marginBottom: 4 },
    bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 8 },
    bulletDot: { fontSize: 10, marginRight: 6 },
    bulletTxt: { flex: 1, fontSize: 10, lineHeight: 1.5, color: '#111111' },
    skillItem: { fontSize: 10, marginBottom: 4 },
    eduText: { fontSize: 10, lineHeight: 1.5, color: '#111111' }
  });

  const TitleStyle = theme.headerAlign === 'center' ? s.secTitle : s.secTitleLeft;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.name}>{data.name}</Text>
          <Text style={s.contact}>
            {[data.location, data.email, data.phone].filter(Boolean).join(' | ')}
          </Text>
        </View>

        {theme.showDividers && <View style={s.divider} />}

        {data.summary && (
          <View style={s.section}>
            <Text style={TitleStyle}>Professional Summary</Text>
            {theme.showDividers && <View style={s.divider} />}
            <Text style={s.summary}>{data.summary}</Text>
          </View>
        )}

        {data.experience.length > 0 && (
          <View style={s.section}>
            <Text style={TitleStyle}>Professional Experience</Text>
            {theme.showDividers && <View style={s.divider} />}
            {data.experience.map((exp, i) => {
              const bullets = dutiesToBullets(exp.duties);
              return (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={s.jobRow}>
                    <Text style={s.jobCompany}>{exp.role}</Text>
                    <Text style={s.jobDate}>{exp.period}</Text>
                  </View>
                  <Text style={s.jobTitle}>{exp.company}</Text>
                  {bullets.map((b, bi) => (
                    <View key={bi} style={s.bullet}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletTxt}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {data.education && (
          <View style={s.section}>
            <Text style={TitleStyle}>Education & Qualifications</Text>
            {theme.showDividers && <View style={s.divider} />}
            <Text style={s.eduText}>{data.education}</Text>
          </View>
        )}

        {data.skills.length > 0 && (
          <View style={s.section}>
            <Text style={TitleStyle}>Core Professional Skills</Text>
            {theme.showDividers && <View style={s.divider} />}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {data.skills.map((sk, i) => (
                <View key={i} style={{ width: '50%', marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletTxt}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <View style={s.section}>
            <Text style={TitleStyle}>Certifications</Text>
            {theme.showDividers && <View style={s.divider} />}
            {data.certifications.map((cert, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletTxt}>{cert}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
