import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from '../../../../lib/cv/types';
import { dutiesToBullets } from '../../../../lib/cv/cvContentBuilder';

const SLATE = '#1E293B';
const TEAL = '#0D9488';
const DARK = '#0F172A';
const WHITE = '#ffffff';
const MUTED = '#64748B';
const BG = '#F8FAFC';
const BORDER = '#E2E8F0';

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: 'Helvetica', paddingBottom: 32 },

  // Header block - modern dark slate with side padding and strong typography
  header: { backgroundColor: SLATE, paddingVertical: 32, paddingHorizontal: 40 },
  hdName: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1 },
  hdRole: { fontSize: 13, color: TEAL, marginTop: 6, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  hdContact: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  hdCtxt: { fontSize: 9, color: '#CBD5E1' },

  content: { paddingHorizontal: 40, paddingTop: 24 },

  // Section headers - minimalist with a thick teal left-border
  secHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 12, 
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 4
  },
  secTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 1.5 },
  secAccent: { width: 4, height: 14, backgroundColor: TEAL, marginRight: 8 },

  // Two-column layout for the body
  twoCol: { flexDirection: 'row', gap: 28 },
  colMain: { flex: 2.2 },
  colSide: { flex: 1 },

  summaryTxt: { fontSize: 9.5, color: '#334155', lineHeight: 1.6, marginBottom: 10 },

  jobBlock: { marginBottom: 16 },
  jobHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  jobRole: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK },
  jobDate: { fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique', marginTop: 1 },
  jobCo: { fontSize: 9, color: TEAL, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontSize: 9, color: TEAL, marginRight: 6, marginTop: 0.5 },
  bulletTxt: { flex: 1, fontSize: 9, color: '#334155', lineHeight: 1.5 },

  sideBlock: { backgroundColor: BG, padding: 14, borderRadius: 6, marginBottom: 16 },
  sideTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: SLATE, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  
  skillPill: { backgroundColor: WHITE, borderLeftWidth: 2, borderLeftColor: TEAL, paddingVertical: 4, paddingHorizontal: 6, marginBottom: 6, borderRadius: 2 },
  skillTxt: { fontSize: 8.5, color: '#334155', fontFamily: 'Helvetica-Bold' },

  itemTxt: { fontSize: 8.5, color: '#475569', marginBottom: 5, lineHeight: 1.4 },
  itemDot: { flexDirection: 'row', marginBottom: 5 },
  dotSymbol: { fontSize: 8.5, color: TEAL, marginRight: 5 },
  dotTxt: { flex: 1, fontSize: 8.5, color: '#475569', lineHeight: 1.4 },

  achBlock: { borderLeftWidth: 2, borderLeftColor: TEAL, paddingLeft: 12, marginTop: 4, marginBottom: 16 },
  achTxt: { fontSize: 9, color: '#334155', lineHeight: 1.6, fontFamily: 'Helvetica-Oblique' },

  eduBlock: { marginBottom: 10 },
  eduTxt: { fontSize: 9, color: '#334155', lineHeight: 1.5 },
});

export const PlainTemplate4 = ({ data }: { data: CVData }) => (
  <Document>
    <Page size="A4" style={s.page}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.hdName}>{data.name}</Text>
        {data.targetRole && <Text style={s.hdRole}>{data.targetRole}</Text>}
        
        <View style={s.hdContact}>
          {data.email && <Text style={s.hdCtxt}>✉ {data.email}</Text>}
          {data.phone && <Text style={s.hdCtxt}>☎ {data.phone}</Text>}
          {data.location && <Text style={s.hdCtxt}>⚲ {data.location}</Text>}
          {data.linkedinUrl && <Text style={s.hdCtxt}>in {data.linkedinUrl}</Text>}
        </View>
      </View>

      {/* ── Content ── */}
      <View style={s.content}>
        
        {data.summary && (
          <View>
            <Text style={s.summaryTxt}>{data.summary}</Text>
          </View>
        )}

        <View style={s.twoCol}>
          {/* Main Column */}
          <View style={s.colMain}>
            
            {/* Work Experience */}
            {data.experience.length > 0 && (
              <>
                <View style={s.secHeader}>
                  <View style={s.secAccent} />
                  <Text style={s.secTitle}>Experience</Text>
                </View>
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
                          <Text style={s.bulletDot}>▪</Text>
                          <Text style={s.bulletTxt}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </>
            )}

            {/* Key Achievement */}
            {data.achievement && (
              <>
                <View style={s.secHeader}>
                  <View style={s.secAccent} />
                  <Text style={s.secTitle}>Key Achievement</Text>
                </View>
                <View style={s.achBlock}>
                  <Text style={s.achTxt}>"{data.achievement}"</Text>
                </View>
              </>
            )}

            {/* Education */}
            {data.education && (
              <>
                <View style={s.secHeader}>
                  <View style={s.secAccent} />
                  <Text style={s.secTitle}>Education</Text>
                </View>
                <View style={s.eduBlock}>
                  <Text style={s.eduTxt}>{data.education}</Text>
                </View>
              </>
            )}

          </View>

          {/* Side Column */}
          <View style={s.colSide}>
            
            {/* Skills */}
            <View style={s.sideBlock}>
              <Text style={s.sideTitle}>Core Skills</Text>
              {data.skills.map((sk, i) => (
                <View key={i} style={s.skillPill}>
                  <Text style={s.skillTxt}>{sk}</Text>
                </View>
              ))}
            </View>

            {/* Languages */}
            {data.languages && data.languages.length > 0 && (
              <View style={s.sideBlock}>
                <Text style={s.sideTitle}>Languages</Text>
                {data.languages.map((l, i) => (
                  <View key={i} style={s.itemDot}>
                    <Text style={s.dotSymbol}>›</Text>
                    <Text style={s.dotTxt}>{l}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <View style={s.sideBlock}>
                <Text style={s.sideTitle}>Certifications</Text>
                {data.certifications.map((cert, i) => (
                  <View key={i} style={s.itemDot}>
                    <Text style={s.dotSymbol}>›</Text>
                    <Text style={s.dotTxt}>{cert}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Strengths */}
            {data.strengths && data.strengths.length > 0 && (
              <View style={s.sideBlock}>
                <Text style={s.sideTitle}>Strengths</Text>
                {data.strengths.map((str, i) => (
                  <View key={i} style={s.itemDot}>
                    <Text style={s.dotSymbol}>›</Text>
                    <Text style={s.dotTxt}>{str}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* References */}
            <View style={{ marginTop: 10 }}>
              <View style={s.secHeader}>
                <View style={s.secAccent} />
                <Text style={s.secTitle}>References</Text>
              </View>
              <Text style={{ fontSize: 8.5, color: MUTED, fontFamily: 'Helvetica-Oblique' }}>
                {data.references || 'Available upon request'}
              </Text>
            </View>

          </View>
        </View>

      </View>
    </Page>
  </Document>
);
