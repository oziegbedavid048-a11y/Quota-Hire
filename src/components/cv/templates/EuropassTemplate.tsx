// EU1 – Official Europass CV Template
// Matches the exact design of Imadi_Faithful_Awuojo_Europass_CV2.pdf
// EU blue (#003399), two-column sections, passport photo blended in header
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ── Europass brand colours ────────────────────────────────────────────────────
const EU_BLUE   = '#003399';
const EU_LIGHT  = '#e8f0fe';
const EU_ACCENT = '#1a4db3';
const DARK      = '#1a1a2e';
const MUTED     = '#6b7280';
const WHITE     = '#ffffff';
const RULE_CLR  = '#d1d9f0';
const BODY_BG   = '#ffffff';

export interface EuropassData {
  // Personal
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  linkedinUrl?: string;
  website?: string;
  passportImageUrl?: string; // base64 data URL
  // Professional
  jobTitle: string;
  summary?: string;
  // Work Experience
  workExperience: {
    dates: string;
    role: string;
    employer: string;
    location: string;
    duties: string;
  }[];
  // Education
  education: {
    dates: string;
    qualification: string;
    institution: string;
    location: string;
    fieldOfStudy?: string;
  }[];
  // Languages
  motherTongue: string;
  foreignLanguages: {
    language: string;
    listening: string;
    reading: string;
    spokenInteraction: string;
    spokenProduction: string;
    writing: string;
  }[];
  // Skills
  digitalSkills: string;
  communicationCompetencies: string;
  organisationalCompetencies: string;
  jobRelatedCompetencies: string;
  otherCompetencies?: string;
  // Additional
  drivingLicence?: string;
  certifications?: string;
  publications?: string;
  hobbies?: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: BODY_BG,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingBottom: 28,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: EU_BLUE,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 110,
    position: 'relative',
  },
  headerLeft: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
  headerCVTitle: {
    fontSize: 9,
    color: '#a8c3ff',
    marginTop: 3,
    letterSpacing: 2,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  headerJobTitle: {
    fontSize: 11,
    color: '#c8d9ff',
    marginTop: 5,
    fontFamily: 'Helvetica-Bold',
  },

  // Europass logo area (top right of header)
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 100,
  },
  europassText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    letterSpacing: 1,
  },
  europassSubText: {
    fontSize: 7,
    color: '#a8c3ff',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  euroStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  euroStar: {
    fontSize: 8,
    color: '#ffd700',
  },

  // Passport photo
  photoBox: {
    width: 72,
    height: 88,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginLeft: 16,
    marginRight: 4,
  },
  photoImage: {
    width: 72,
    height: 88,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: 72,
    height: 88,
    backgroundColor: EU_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 28,
    paddingTop: 14,
  },

  // Section header — EU blue bar with white text + left gold accent
  sectionHeader: {
    backgroundColor: EU_BLUE,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffd700',
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Horizontal rule
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: RULE_CLR,
    marginVertical: 6,
  },

  // ── Personal info row ───────────────────────────────────────────────────────
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '48%',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    width: 72,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 8.5,
    color: DARK,
    flex: 1,
    lineHeight: 1.4,
  },

  // ── Experience / Education entry ───────────────────────────────────────────
  entryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  entryDateCol: {
    width: 100,
    paddingRight: 10,
    flexShrink: 0,
  },
  entryDate: {
    fontSize: 8.5,
    color: EU_BLUE,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
  },
  entryBody: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: RULE_CLR,
    paddingLeft: 10,
  },
  entryTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 1,
  },
  entrySubtitle: {
    fontSize: 8.5,
    color: EU_ACCENT,
    marginBottom: 4,
  },
  entryLocation: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  bulletDot: {
    fontSize: 8.5,
    color: EU_BLUE,
    marginRight: 5,
    marginTop: 0.5,
  },
  bulletTxt: {
    flex: 1,
    fontSize: 8.5,
    color: '#374151',
    lineHeight: 1.5,
  },

  // ── Language table ──────────────────────────────────────────────────────────
  langTable: {
    marginBottom: 8,
  },
  langHeaderRow: {
    flexDirection: 'row',
    backgroundColor: EU_LIGHT,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  langHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    textAlign: 'center',
    flex: 1,
  },
  langHeaderFirst: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    width: 80,
  },
  langRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: RULE_CLR,
  },
  langCell: {
    fontSize: 8,
    color: DARK,
    textAlign: 'center',
    flex: 1,
  },
  langCellFirst: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    width: 80,
  },
  langNote: {
    fontSize: 7,
    color: MUTED,
    marginTop: 3,
    fontFamily: 'Helvetica-Oblique',
  },
  motherTongueTxt: {
    fontSize: 8.5,
    color: DARK,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },

  // ── Two-column layout for skills sections ──────────────────────────────────
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  col: {
    flex: 1,
  },
  competencyBlock: {
    marginBottom: 8,
  },
  competencyLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    marginBottom: 3,
  },
  competencyText: {
    fontSize: 8.5,
    color: '#374151',
    lineHeight: 1.5,
  },

  // ── Additional info ─────────────────────────────────────────────────────────
  additionalRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  addLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    width: 110,
    flexShrink: 0,
  },
  addValue: {
    fontSize: 8.5,
    color: DARK,
    flex: 1,
    lineHeight: 1.4,
  },

  // Summary
  summaryText: {
    fontSize: 8.5,
    color: '#374151',
    lineHeight: 1.7,
    marginBottom: 4,
  },
});

// ── Helper: convert raw duties text to bullet array ──────────────────────────
function dutiesToBullets(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 4)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));
}

// ── 12 EU stars in a circle (simplified row) ─────────────────────────────────
const EuroStars = () => (
  <View style={s.euroStars}>
    {['★', '★', '★', '★', '★', '★', '★', '★', '★', '★', '★', '★'].map((star, i) => (
      <Text key={i} style={s.euroStar}>{star}</Text>
    ))}
  </View>
);

// ── Main Template ─────────────────────────────────────────────────────────────
export const EuropassTemplate = ({ data }: { data: EuropassData }) => {
  const fullName = `${data.firstName} ${data.lastName}`;
  const initial = (data.firstName || 'U').charAt(0).toUpperCase();

  return (
    <Document title={`Europass CV – ${fullName}`} author={fullName}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          {/* Photo */}
          <View style={s.photoBox}>
            {data.passportImageUrl ? (
              <Image src={data.passportImageUrl} style={s.photoImage} />
            ) : (
              <View style={s.photoPlaceholder}>
                <Text style={s.photoInitial}>{initial}</Text>
              </View>
            )}
          </View>

          {/* Name + title */}
          <View style={s.headerLeft}>
            <Text style={s.headerName}>{fullName}</Text>
            <Text style={s.headerCVTitle}>Curriculum Vitae</Text>
            {data.jobTitle && (
              <Text style={s.headerJobTitle}>{data.jobTitle}</Text>
            )}
          </View>

          {/* Europass branding top-right */}
          <View style={s.headerRight}>
            <EuroStars />
            <Text style={s.europassText}>Europass</Text>
            <Text style={s.europassSubText}>CURRICULUM VITAE</Text>
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={s.body}>

          {/* PERSONAL INFORMATION */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Personal Information</Text>
          </View>

          <View style={s.infoGrid}>
            {data.address && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Address</Text>
                <Text style={s.infoValue}>{data.address}</Text>
              </View>
            )}
            {data.phone && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Telephone</Text>
                <Text style={s.infoValue}>{data.phone}</Text>
              </View>
            )}
            {data.email && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoValue}>{data.email}</Text>
              </View>
            )}
            {data.linkedinUrl && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>LinkedIn</Text>
                <Text style={s.infoValue}>{data.linkedinUrl}</Text>
              </View>
            )}
            {data.website && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Website</Text>
                <Text style={s.infoValue}>{data.website}</Text>
              </View>
            )}
            {data.dateOfBirth && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Date of Birth</Text>
                <Text style={s.infoValue}>{data.dateOfBirth}</Text>
              </View>
            )}
            {data.nationality && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Nationality</Text>
                <Text style={s.infoValue}>{data.nationality}</Text>
              </View>
            )}
          </View>

          {/* PROFILE SUMMARY (optional) */}
          {data.summary && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Personal Statement</Text>
              </View>
              <Text style={s.summaryText}>{data.summary}</Text>
            </>
          )}

          {/* WORK EXPERIENCE */}
          {data.workExperience && data.workExperience.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Work Experience</Text>
              </View>
              {data.workExperience.map((exp, i) => {
                const bullets = dutiesToBullets(exp.duties);
                return (
                  <View key={i} style={s.entryRow}>
                    <View style={s.entryDateCol}>
                      <Text style={s.entryDate}>{exp.dates}</Text>
                    </View>
                    <View style={s.entryBody}>
                      <Text style={s.entryTitle}>{exp.role}</Text>
                      {exp.employer && <Text style={s.entrySubtitle}>{exp.employer}</Text>}
                      {exp.location && <Text style={s.entryLocation}>{exp.location}</Text>}
                      {bullets.map((b, bi) => (
                        <View key={bi} style={s.bullet}>
                          <Text style={s.bulletDot}>▪</Text>
                          <Text style={s.bulletTxt}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* EDUCATION AND TRAINING */}
          {data.education && data.education.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Education and Training</Text>
              </View>
              {data.education.map((edu, i) => (
                <View key={i} style={s.entryRow}>
                  <View style={s.entryDateCol}>
                    <Text style={s.entryDate}>{edu.dates}</Text>
                  </View>
                  <View style={s.entryBody}>
                    <Text style={s.entryTitle}>{edu.qualification}</Text>
                    {edu.fieldOfStudy && <Text style={s.entrySubtitle}>{edu.fieldOfStudy}</Text>}
                    <Text style={s.entrySubtitle}>{edu.institution}</Text>
                    {edu.location && <Text style={s.entryLocation}>{edu.location}</Text>}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* LANGUAGE SKILLS */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Language Skills</Text>
          </View>

          {data.motherTongue && (
            <View style={{ marginBottom: 6 }}>
              <Text style={s.motherTongueTxt}>Mother tongue: {data.motherTongue}</Text>
            </View>
          )}

          {data.foreignLanguages && data.foreignLanguages.length > 0 && (
            <View style={s.langTable}>
              {/* Table header */}
              <View style={s.langHeaderRow}>
                <Text style={s.langHeaderFirst}>Language</Text>
                <Text style={s.langHeaderCell}>Listening</Text>
                <Text style={s.langHeaderCell}>Reading</Text>
                <Text style={s.langHeaderCell}>Spoken Int.</Text>
                <Text style={s.langHeaderCell}>Spoken Prod.</Text>
                <Text style={s.langHeaderCell}>Writing</Text>
              </View>
              {/* Rows */}
              {data.foreignLanguages.map((lang, i) => (
                <View key={i} style={s.langRow}>
                  <Text style={s.langCellFirst}>{lang.language}</Text>
                  <Text style={s.langCell}>{lang.listening}</Text>
                  <Text style={s.langCell}>{lang.reading}</Text>
                  <Text style={s.langCell}>{lang.spokenInteraction}</Text>
                  <Text style={s.langCell}>{lang.spokenProduction}</Text>
                  <Text style={s.langCell}>{lang.writing}</Text>
                </View>
              ))}
              <Text style={s.langNote}>
                Levels: A1/A2 – Basic | B1/B2 – Independent | C1/C2 – Proficient (CEFR framework)
              </Text>
            </View>
          )}

          {/* DIGITAL SKILLS */}
          {data.digitalSkills && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Digital Skills</Text>
              </View>
              <Text style={s.competencyText}>{data.digitalSkills}</Text>
            </>
          )}

          {/* PERSONAL COMPETENCIES */}
          {(data.communicationCompetencies || data.organisationalCompetencies || data.jobRelatedCompetencies || data.otherCompetencies) && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Personal Competencies</Text>
              </View>

              {data.communicationCompetencies && (
                <View style={s.competencyBlock}>
                  <Text style={s.competencyLabel}>Communication competencies</Text>
                  <Text style={s.competencyText}>{data.communicationCompetencies}</Text>
                </View>
              )}
              {data.organisationalCompetencies && (
                <View style={s.competencyBlock}>
                  <Text style={s.competencyLabel}>Organisational / managerial competencies</Text>
                  <Text style={s.competencyText}>{data.organisationalCompetencies}</Text>
                </View>
              )}
              {data.jobRelatedCompetencies && (
                <View style={s.competencyBlock}>
                  <Text style={s.competencyLabel}>Job-related competencies</Text>
                  <Text style={s.competencyText}>{data.jobRelatedCompetencies}</Text>
                </View>
              )}
              {data.otherCompetencies && (
                <View style={s.competencyBlock}>
                  <Text style={s.competencyLabel}>Other competencies</Text>
                  <Text style={s.competencyText}>{data.otherCompetencies}</Text>
                </View>
              )}
            </>
          )}

          {/* ADDITIONAL INFORMATION */}
          {(data.drivingLicence || data.certifications || data.publications || data.hobbies) && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Additional Information</Text>
              </View>

              {data.drivingLicence && (
                <View style={s.additionalRow}>
                  <Text style={s.addLabel}>Driving licence</Text>
                  <Text style={s.addValue}>{data.drivingLicence}</Text>
                </View>
              )}
              {data.certifications && (
                <View style={s.additionalRow}>
                  <Text style={s.addLabel}>Certifications</Text>
                  <Text style={s.addValue}>{data.certifications}</Text>
                </View>
              )}
              {data.publications && (
                <View style={s.additionalRow}>
                  <Text style={s.addLabel}>Publications</Text>
                  <Text style={s.addValue}>{data.publications}</Text>
                </View>
              )}
              {data.hobbies && (
                <View style={s.additionalRow}>
                  <Text style={s.addLabel}>Hobbies & Interests</Text>
                  <Text style={s.addValue}>{data.hobbies}</Text>
                </View>
              )}
            </>
          )}

        </View>
      </Page>
    </Document>
  );
};
