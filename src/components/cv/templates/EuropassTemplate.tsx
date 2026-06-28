import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ── Europass brand colours & Theme ────────────────────────────────────────────
const DARK      = '#000000';
const WHITE     = '#ffffff';
const BODY_BG   = '#ffffff';
const ROW_RED   = '#9e3430'; // The dark red used in the language table row

export interface EuropassData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  linkedinUrl?: string;
  website?: string;
  passportImageUrl?: string; 
  gender?: string; // added gender if needed, fallback to not showing
  jobTitle: string;
  summary?: string;
  careerObjective?: string;
  workExperience: {
    dates: string;
    role: string;
    employer: string;
    location: string;
    duties: string;
  }[];
  education: {
    dates: string;
    qualification: string;
    institution: string;
    location: string;
    fieldOfStudy?: string;
  }[];
  motherTongue: string;
  foreignLanguages: {
    language: string;
    listening: string;
    reading: string;
    spokenInteraction: string;
    spokenProduction: string;
    writing: string;
  }[];
  digitalSkills: string;
  communicationCompetencies: string;
  organisationalCompetencies: string;
  jobRelatedCompetencies: string;
  otherCompetencies?: string;
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
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
  },
  
  // ── Header (Photo & Logo) ──
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  photoBox: {
    width: 80,
    height: 100,
    borderRadius: 50, // Try to make it an oval/circle like the PDF
    overflow: 'hidden',
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
  logoContainer: {
    width: 140, // Match visual proportion of the Europass logo
  },
  logoImage: {
    width: '100%',
    objectFit: 'contain',
  },

  // ── Name & Personal Info ──
  nameContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DARK,
    paddingBottom: 8,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  
  infoBlock: {
    marginBottom: 20,
    lineHeight: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: 'row',
    marginRight: 10,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
  infoValue: {
    fontFamily: 'Helvetica',
  },

  // ── Sections ──
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: DARK,
    paddingBottom: 6,
    marginBottom: 12,
    marginTop: 15,
  },

  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: DARK,
    marginBottom: 10,
  },

  // ── Entries (Work/Edu) ──
  entryBlock: {
    marginBottom: 15,
  },
  entryDates: {
    fontSize: 10,
    marginBottom: 6,
  },
  entryTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
  },

  // ── Languages Table ──
  langSub: {
    marginBottom: 8,
  },
  langTable: {
    marginTop: 10,
    marginBottom: 10,
  },
  langHeaderRow1: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  langHeaderRow2: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  langColLabel: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    fontSize: 9,
  },
  langColSub: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
  },
  
  langDataRow: {
    flexDirection: 'row',
    backgroundColor: ROW_RED,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  langNameCell: {
    width: 90,
    paddingLeft: 4,
    justifyContent: 'center',
  },
  langDataCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langDataText: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  langNameText: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
});

function dutiesToBullets(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

export const EuropassTemplate = ({ data }: { data: EuropassData }) => {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const initial = (data.firstName || 'U').charAt(0).toUpperCase();

  return (
    <Document title={`Europass CV – ${fullName}`} author={fullName}>
      <Page size="A4" style={s.page}>

        {/* ── TOP: Photo & Logo ── */}
        <View style={s.topRow}>
          <View style={s.photoBox}>
            {data.passportImageUrl ? (
              <Image src={data.passportImageUrl} style={s.photoImage} />
            ) : (
              <View style={s.photoPlaceholder}><Text style={{ color: '#9ca3af' }}>{initial}</Text></View>
            )}
          </View>
          <View style={s.logoContainer}>
            <Image src="/europass_logo.png" style={s.logoImage} />
          </View>
        </View>

        {/* ── NAME ── */}
        <View style={s.nameContainer}>
          <Text style={s.nameText}>{fullName}</Text>
        </View>

        {/* ── PERSONAL INFO ── */}
        <View style={s.infoBlock}>
          <View style={s.infoRow}>
            {data.dateOfBirth && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Date of birth: </Text>
                <Text style={s.infoValue}>{data.dateOfBirth}</Text>
                {/* Visual separator if not last item, but PDF uses spacing/pipes. We'll use simple spacing with borders or pipes */}
                <Text> | </Text>
              </View>
            )}
            {data.nationality && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Nationality: </Text>
                <Text style={s.infoValue}>{data.nationality}</Text>
                <Text> | </Text>
              </View>
            )}
            {data.phone && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Phone number: </Text>
                <Text style={s.infoValue}>{data.phone}</Text>
              </View>
            )}
          </View>
          
          <View style={s.infoRow}>
            {data.gender && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Gender: </Text>
                <Text style={s.infoValue}>{data.gender}</Text>
                <Text> | </Text>
              </View>
            )}
            {data.address && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Address: </Text>
                <Text style={s.infoValue}>{data.address}</Text>
              </View>
            )}
          </View>

          <View style={s.infoRow}>
            {data.email && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Email address: </Text>
                <Text style={s.infoValue}>{data.email}</Text>
              </View>
            )}
          </View>
          
          <View style={s.infoRow}>
            {data.linkedinUrl && (
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>LinkedIn: </Text>
                <Text style={s.infoValue}>{data.linkedinUrl}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── ABOUT ME / SUMMARY ── */}
        {(data.summary || data.jobTitle) && (
          <View>
            <Text style={s.sectionTitle}>ABOUT ME</Text>
            <Text style={s.bodyText}>{data.summary || data.jobTitle}</Text>
          </View>
        )}

        {/* ── WORK EXPERIENCE ── */}
        {data.workExperience && data.workExperience.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>WORK EXPERIENCE</Text>
            {data.workExperience.map((exp, i) => {
              const bullets = dutiesToBullets(exp.duties);
              return (
                <View key={i} style={s.entryBlock}>
                  <Text style={s.entryDates}>{exp.dates}</Text>
                  <Text style={s.entryTitle}>{exp.role} – {exp.employer}</Text>
                  {bullets.map((b, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b}.</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* ── EDUCATION AND TRAINING ── */}
        {data.education && data.education.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>EDUCATION AND TRAINING</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={s.entryBlock}>
                <Text style={s.entryDates}>{edu.dates}</Text>
                <Text style={s.entryTitle}>{edu.qualification} – {edu.institution}</Text>
                {edu.fieldOfStudy && (
                  <View style={s.bulletRow}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{edu.fieldOfStudy}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── DIGITAL SKILLS ── */}
        {data.digitalSkills && (
          <View>
            <Text style={s.sectionTitle}>DIGITAL SKILLS</Text>
            <Text style={s.bodyText}>
              {/* If user used commas or newlines, we can display as pipe-separated to match PDF style */}
              {data.digitalSkills.replace(/\n/g, ' | ').replace(/,/g, ' | ')}
            </Text>
          </View>
        )}

        {/* ── COMMUNICATION & INTERPERSONAL SKILLS ── */}
        {(data.communicationCompetencies || data.organisationalCompetencies || data.jobRelatedCompetencies) && (
          <View>
            <Text style={s.sectionTitle}>COMMUNICATION AND INTERPERSONAL SKILLS</Text>
            <Text style={s.bodyText}>
              {[data.communicationCompetencies, data.organisationalCompetencies, data.jobRelatedCompetencies]
                .filter(Boolean)
                .join(' | ')
                .replace(/\n/g, ' | ')}
            </Text>
          </View>
        )}

        {/* ── LANGUAGE SKILLS ── */}
        <View>
          <Text style={s.sectionTitle}>LANGUAGE SKILLS</Text>
          <Text style={s.langSub}>Mother Tongue(s): <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.motherTongue.toUpperCase()}</Text></Text>
          <Text style={s.langSub}>Other language(s):</Text>

          {data.foreignLanguages && data.foreignLanguages.length > 0 && (
            <View style={s.langTable}>
              {/* Header rows matching PDF layout */}
              <View style={s.langHeaderRow1}>
                <View style={{ width: 90 }}></View>
                <View style={{ flex: 2 }}><Text style={s.langColLabel}>UNDERSTANDING</Text></View>
                <View style={{ flex: 2 }}><Text style={s.langColLabel}>SPEAKING</Text></View>
                <View style={{ flex: 1 }}><Text style={s.langColLabel}>WRITING</Text></View>
              </View>
              <View style={s.langHeaderRow2}>
                <View style={{ width: 90 }}></View>
                <View style={{ flex: 1 }}><Text style={s.langColSub}>Listening</Text></View>
                <View style={{ flex: 1 }}><Text style={s.langColSub}>Reading</Text></View>
                <View style={{ flex: 1 }}><Text style={s.langColSub}>Spoken production</Text></View>
                <View style={{ flex: 1 }}><Text style={s.langColSub}>Spoken interaction</Text></View>
                <View style={{ flex: 1 }}><Text style={s.langColSub}></Text></View>
              </View>

              {/* Data rows with Red background */}
              {data.foreignLanguages.map((lang, i) => (
                <View key={i} style={s.langDataRow}>
                  <View style={s.langNameCell}><Text style={s.langNameText}>{lang.language}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.listening}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.reading}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.spokenProduction}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.spokenInteraction}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.writing}</Text></View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── CERTIFICATES ── */}
        {data.certifications && (
          <View>
            <Text style={s.sectionTitle}>CERTIFICATES</Text>
            <Text style={s.bodyText}>{data.certifications}</Text>
          </View>
        )}

        {/* ── CAREER OBJECTIVE ── */}
        {(data.careerObjective || data.otherCompetencies) && (
          <View>
            <Text style={s.sectionTitle}>CAREER OBJECTIVE</Text>
            <Text style={s.bodyText}>{data.careerObjective || data.otherCompetencies}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
};
