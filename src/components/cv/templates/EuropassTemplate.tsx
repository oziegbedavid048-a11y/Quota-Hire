// EU1 – Official Europass CV Template
// Matches the exact design of Imadi_Faithful_Awuojo_Europass_CV2.pdf
// White background, left column for labels, vertical separator, right column for content
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';

// ── Europass brand colours ────────────────────────────────────────────────────
const EU_BLUE   = '#003399';
const DARK      = '#1a1a2e';
const MUTED     = '#6b7280';
const WHITE     = '#ffffff';
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
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 36,
  },

  // ── Header Layout ──────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  leftColHeader: {
    width: 140, // Match the left column width
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  rightColHeader: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: EU_BLUE, // Vertical separator
    position: 'relative',
    minHeight: 80,
  },
  
  logoContainer: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 100, // Adjust based on logo proportions
  },
  logoImage: {
    width: '100%',
    objectFit: 'contain',
  },

  // Passport photo
  photoBox: {
    width: 55,
    height: 70,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    // Push it slightly down so it aligns nicely with the name
    marginTop: 5,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
  },

  headerName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    marginBottom: 6,
    paddingRight: 100, // Leave space for the logo
  },
  headerContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  contactIcon: {
    color: EU_BLUE,
    marginRight: 4,
  },
  contactText: {
    fontSize: 9,
    color: DARK,
    marginRight: 12,
  },
  linkText: {
    color: EU_BLUE,
    textDecoration: 'none',
  },

  // ── Section Layout ─────────────────────────────────────────────────────────
  section: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  leftCol: {
    width: 140,
    flexShrink: 0,
    paddingRight: 10,
    paddingTop: 2,
    alignItems: 'flex-end',
  },
  rightCol: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 2,
    paddingBottom: 8,
    borderLeftWidth: 1,
    borderLeftColor: EU_BLUE,
  },

  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  sectionDate: {
    fontSize: 8.5,
    color: DARK,
    textAlign: 'right',
  },
  
  // ── Right Column Content ────────────────────────────────────────────────────
  entryTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 2,
  },
  entrySubtitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: DARK,
    marginBottom: 4,
  },
  entryBody: {
    fontSize: 9,
    color: DARK,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletDot: {
    fontSize: 9,
    color: DARK,
    marginRight: 5,
  },
  bulletTxt: {
    flex: 1,
    fontSize: 9,
    color: DARK,
    lineHeight: 1.4,
  },

  labelValueRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  rowLabel: {
    fontSize: 9,
    color: MUTED,
    width: 65,
  },
  rowValue: {
    fontSize: 9,
    color: DARK,
    flex: 1,
  },

  // ── Language table ──────────────────────────────────────────────────────────
  langTable: {
    marginTop: 4,
    marginBottom: 8,
  },
  langHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: EU_BLUE,
    paddingBottom: 2,
    marginBottom: 4,
  },
  langHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: EU_BLUE,
    textAlign: 'center',
    flex: 1,
  },
  langHeaderFirst: {
    fontSize: 8,
    color: EU_BLUE,
    width: 80,
  },
  langRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  langCell: {
    fontSize: 8.5,
    color: DARK,
    textAlign: 'center',
    flex: 1,
  },
  langCellFirst: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    width: 80,
  },
  langNote: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
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

// ── Main Template ─────────────────────────────────────────────────────────────
export const EuropassTemplate = ({ data }: { data: EuropassData }) => {
  const fullName = `${data.firstName} ${data.lastName}`.trim().toUpperCase();
  const initial = (data.firstName || 'U').charAt(0).toUpperCase();

  return (
    <Document title={`Europass CV – ${fullName}`} author={fullName}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER (Personal Info & Logo) ── */}
        <View style={s.headerRow}>
          {/* Left Column: Photo */}
          <View style={s.leftColHeader}>
            <View style={s.photoBox}>
              {data.passportImageUrl ? (
                <Image src={data.passportImageUrl} style={s.photoImage} />
              ) : (
                <View style={s.photoPlaceholder}>
                  <Text style={s.photoInitial}>{initial}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Column: Name, Contacts, Logo */}
          <View style={s.rightColHeader}>
            {/* The Logo */}
            <View style={s.logoContainer}>
               <Image src="/europass_logo.png" style={s.logoImage} />
            </View>

            <Text style={s.headerName}>{fullName}</Text>

            {/* Contact details */}
            <View style={s.headerContactRow}>
              {data.address && (
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  <Text style={s.contactIcon}>📍</Text>
                  <Text style={s.contactText}>{data.address}</Text>
                </View>
              )}
            </View>
            
            <View style={s.headerContactRow}>
              {data.phone && (
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  <Text style={s.contactIcon}>📱</Text>
                  <Text style={s.contactText}>{data.phone}</Text>
                </View>
              )}
              {data.email && (
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  <Text style={s.contactIcon}>✉️</Text>
                  <Text style={s.contactText}>{data.email}</Text>
                </View>
              )}
            </View>

            <View style={s.headerContactRow}>
              {data.linkedinUrl && (
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  <Text style={s.contactIcon}>in</Text>
                  <Text style={s.contactText}>{data.linkedinUrl}</Text>
                </View>
              )}
              {data.website && (
                <View style={{ flexDirection: 'row', marginRight: 12 }}>
                  <Text style={s.contactIcon}>🌐</Text>
                  <Text style={s.contactText}>{data.website}</Text>
                </View>
              )}
            </View>

            <View style={s.headerContactRow}>
              {data.dateOfBirth && (
                <View style={s.labelValueRow}>
                  <Text style={s.rowLabel}>Date of birth</Text>
                  <Text style={s.rowValue}>{data.dateOfBirth}</Text>
                </View>
              )}
            </View>
            <View style={s.headerContactRow}>
              {data.nationality && (
                <View style={s.labelValueRow}>
                  <Text style={s.rowLabel}>Nationality</Text>
                  <Text style={s.rowValue}>{data.nationality}</Text>
                </View>
              )}
            </View>

          </View>
        </View>

        {/* ── JOB APPLIED FOR / SUMMARY ── */}
        {(data.jobTitle || data.summary) && (
          <View style={s.section}>
            <View style={s.leftCol}>
              <Text style={s.sectionTitle}>
                {data.jobTitle ? 'Job applied for' : 'Personal Statement'}
              </Text>
            </View>
            <View style={s.rightCol}>
              {data.jobTitle && <Text style={s.entryTitle}>{data.jobTitle}</Text>}
              {data.summary && <Text style={s.entryBody}>{data.summary}</Text>}
            </View>
          </View>
        )}

        {/* ── WORK EXPERIENCE ── */}
        {data.workExperience && data.workExperience.length > 0 && (
          <View style={s.section}>
            <View style={s.leftCol}>
              <Text style={s.sectionTitle}>Work experience</Text>
            </View>
            <View style={s.rightCol}>
              {data.workExperience.map((exp, i) => {
                const bullets = dutiesToBullets(exp.duties);
                return (
                  <View key={i} style={{ marginBottom: i < data.workExperience.length - 1 ? 12 : 0, flexDirection: 'row' }}>
                    {/* Dates on the left, next to the line but inside rightCol for easier alignment? 
                        Actually, official Europass has dates in the left column. Let's adjust section layout for lists */}
                    <View style={{ width: 100, position: 'absolute', left: -110, alignItems: 'flex-end' }}>
                       <Text style={s.sectionDate}>{exp.dates}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.entryTitle}>{exp.role}</Text>
                      <Text style={s.entrySubtitle}>
                        {exp.employer}{exp.location ? `, ${exp.location}` : ''}
                      </Text>
                      {bullets.map((b, bi) => (
                        <View key={bi} style={s.bullet}>
                          <Text style={s.bulletDot}>-</Text>
                          <Text style={s.bulletTxt}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── EDUCATION AND TRAINING ── */}
        {data.education && data.education.length > 0 && (
          <View style={s.section}>
            <View style={s.leftCol}>
              <Text style={s.sectionTitle}>Education and training</Text>
            </View>
            <View style={s.rightCol}>
              {data.education.map((edu, i) => (
                <View key={i} style={{ marginBottom: i < data.education.length - 1 ? 12 : 0, flexDirection: 'row' }}>
                  <View style={{ width: 100, position: 'absolute', left: -110, alignItems: 'flex-end' }}>
                     <Text style={s.sectionDate}>{edu.dates}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.entryTitle}>{edu.qualification}</Text>
                    <Text style={s.entrySubtitle}>
                      {edu.institution}{edu.location ? `, ${edu.location}` : ''}
                    </Text>
                    {edu.fieldOfStudy && (
                      <View style={s.bullet}>
                        <Text style={s.bulletDot}>-</Text>
                        <Text style={s.bulletTxt}>{edu.fieldOfStudy}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── PERSONAL SKILLS ── */}
        <View style={s.section}>
            <View style={s.leftCol}>
              <Text style={s.sectionTitle}>Personal skills</Text>
            </View>
            <View style={s.rightCol}>
              
              {data.motherTongue && (
                <View style={s.labelValueRow}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Mother tongue(s)</Text>
                  <Text style={[s.rowValue, { fontFamily: 'Helvetica-Bold' }]}>{data.motherTongue}</Text>
                </View>
              )}

              {data.foreignLanguages && data.foreignLanguages.length > 0 && (
                <View style={s.labelValueRow}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Foreign language(s)</Text>
                  <View style={{ flex: 1 }}>
                    <View style={s.langTable}>
                      {/* Table header */}
                      <View style={s.langHeaderRow}>
                        <Text style={s.langHeaderFirst}></Text>
                        <View style={{ flex: 2, textAlign: 'center' }}>
                          <Text style={{ fontSize: 8, color: EU_BLUE, textAlign: 'center', marginBottom: 2 }}>UNDERSTANDING</Text>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={s.langHeaderCell}>Listening</Text>
                            <Text style={s.langHeaderCell}>Reading</Text>
                          </View>
                        </View>
                        <View style={{ flex: 2, textAlign: 'center' }}>
                          <Text style={{ fontSize: 8, color: EU_BLUE, textAlign: 'center', marginBottom: 2 }}>SPEAKING</Text>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={s.langHeaderCell}>Spoken Int.</Text>
                            <Text style={s.langHeaderCell}>Spoken Prod.</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, textAlign: 'center' }}>
                          <Text style={{ fontSize: 8, color: EU_BLUE, textAlign: 'center', marginBottom: 2 }}>WRITING</Text>
                          <Text style={s.langHeaderCell}></Text>
                        </View>
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
                        Levels: A1/A2: Basic user - B1/B2: Independent user - C1/C2 Proficient user
                      </Text>
                      <Text style={s.langNote}>Common European Framework of Reference for Languages</Text>
                    </View>
                  </View>
                </View>
              )}

              {data.communicationCompetencies && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Communication skills</Text>
                  <Text style={s.rowValue}>{data.communicationCompetencies}</Text>
                </View>
              )}

              {data.organisationalCompetencies && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Organisational / managerial skills</Text>
                  <Text style={s.rowValue}>{data.organisationalCompetencies}</Text>
                </View>
              )}

              {data.jobRelatedCompetencies && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Job-related skills</Text>
                  <Text style={s.rowValue}>{data.jobRelatedCompetencies}</Text>
                </View>
              )}

              {data.digitalSkills && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Digital skills</Text>
                  <Text style={s.rowValue}>{data.digitalSkills}</Text>
                </View>
              )}

              {data.otherCompetencies && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Other skills</Text>
                  <Text style={s.rowValue}>{data.otherCompetencies}</Text>
                </View>
              )}

              {data.drivingLicence && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Driving licence</Text>
                  <Text style={s.rowValue}>{data.drivingLicence}</Text>
                </View>
              )}

            </View>
        </View>

        {/* ── ADDITIONAL INFORMATION ── */}
        {(data.certifications || data.publications || data.hobbies) && (
          <View style={s.section}>
            <View style={s.leftCol}>
              <Text style={s.sectionTitle}>Additional information</Text>
            </View>
            <View style={s.rightCol}>
              {data.certifications && (
                <View style={[s.labelValueRow, { marginTop: 2 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Certifications</Text>
                  <Text style={s.rowValue}>{data.certifications}</Text>
                </View>
              )}
              {data.publications && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Publications</Text>
                  <Text style={s.rowValue}>{data.publications}</Text>
                </View>
              )}
              {data.hobbies && (
                <View style={[s.labelValueRow, { marginTop: 8 }]}>
                  <Text style={[s.rowLabel, { width: 100 }]}>Hobbies</Text>
                  <Text style={s.rowValue}>{data.hobbies}</Text>
                </View>
              )}
            </View>
          </View>
        )}

      </Page>
    </Document>
  );
};
