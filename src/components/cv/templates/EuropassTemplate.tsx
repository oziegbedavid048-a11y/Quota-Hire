import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { EUROPASS_LOGO_BASE64 } from '../../../constants/europass-logo';

const BLACK   = '#000000';
const WHITE   = '#ffffff';
const ROW_RED = '#9e3938';

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
  gender?: string;
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

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, fontFamily: 'Helvetica', fontSize: 10, paddingTop: 36, paddingBottom: 40, paddingHorizontal: 50, color: BLACK },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  topRowNoPhoto: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 10 },
  photoBox: { width: 88, height: 118, borderRadius: 44, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%', objectFit: 'cover' },
  logoContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  logoImage: { width: 155, height: 42.5, objectFit: 'contain' },
  nameRow: { borderBottomWidth: 1, borderBottomColor: BLACK, paddingBottom: 6, marginBottom: 8 },
  nameText: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BLACK },
  infoBlock: { marginBottom: 14 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 3, alignItems: 'center' },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: BLACK },
  infoValue: { fontFamily: 'Helvetica', fontSize: 10, color: BLACK },
  infoPipe: { fontFamily: 'Helvetica', fontSize: 10, color: BLACK, marginHorizontal: 5 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: BLACK, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: BLACK, paddingBottom: 4, marginBottom: 8, marginTop: 14 },
  bodyText: { fontSize: 10, lineHeight: 1.5, color: BLACK, marginBottom: 8 },
  entryBlock: { marginBottom: 12 },
  entryDates: { fontSize: 10, fontFamily: 'Helvetica', color: BLACK, marginBottom: 3 },
  entryTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: BLACK, marginBottom: 5 },
  entrySubLabel: { fontSize: 10, fontFamily: 'Helvetica', color: BLACK, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', marginBottom: 3, paddingLeft: 8 },
  bulletDot: { width: 12, fontSize: 10, color: BLACK },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.4, color: BLACK },
  langMotherRow: { flexDirection: 'row', marginBottom: 5 },
  langOtherLabel: { fontSize: 10, fontFamily: 'Helvetica', color: BLACK, marginBottom: 8 },
  langTable: { marginTop: 6, marginBottom: 10 },
  langHeaderRow1: { flexDirection: 'row', marginBottom: 2 },
  langHeaderRow2: { flexDirection: 'row', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#cccccc', paddingBottom: 4 },
  langEmptyCell: { width: 95 },
  langGroupHeader: { flex: 2, textAlign: 'center', fontSize: 9, fontFamily: 'Helvetica-Bold', color: BLACK, textTransform: 'uppercase' },
  langGroupHeaderSingle: { flex: 1, textAlign: 'center', fontSize: 9, fontFamily: 'Helvetica-Bold', color: BLACK, textTransform: 'uppercase' },
  langSubHeader: { flex: 1, textAlign: 'center', fontSize: 8.5, fontFamily: 'Helvetica', color: BLACK },
  langDataRow: { flexDirection: 'row', backgroundColor: ROW_RED, paddingVertical: 5, paddingHorizontal: 2, alignItems: 'center', marginBottom: 3 },
  langNameCell: { width: 95, paddingLeft: 6 },
  langDataCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  langNameText: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 10 },
  langDataText: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 10 },
  langCEFRNote: { fontSize: 8, color: '#555555', marginTop: 4, marginBottom: 6 },
});

function dutiesToBullets(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[\n]+/).map((str: string) => str.trim().replace(/^[-*]\s*/, '')).filter((str: string) => str.length > 2);
}

function toPipeSeparated(raw: string): string {
  if (!raw) return '';
  return raw.split(/[,\n]+/).map((str: string) => str.trim()).filter(Boolean).join(' | ');
}

function mergeSkills(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).map((p) => toPipeSeparated(p!)).filter(Boolean).join(' | ');
}

export const EuropassTemplate = ({ data }: { data: EuropassData }) => {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const communicationLine = mergeSkills(data.communicationCompetencies, data.organisationalCompetencies, data.jobRelatedCompetencies, data.otherCompetencies);

  return (
    <Document title={`Europass CV - ${fullName}`} author={fullName}>
      <Page size="A4" style={s.page}>
        <View style={data.passportImageUrl ? s.topRow : s.topRowNoPhoto}>
          {data.passportImageUrl ? (
            <View style={s.photoBox}>
              <Image src={data.passportImageUrl} style={s.photoImage} />
            </View>
          ) : null}
          <View style={s.logoContainer}>
            <Image src={EUROPASS_LOGO_BASE64} style={s.logoImage} />
          </View>
        </View>

        <View style={s.nameRow}><Text style={s.nameText}>{fullName}</Text></View>

        <View style={s.infoBlock}>
          <View style={s.infoRow}>
            {data.dateOfBirth ? (<View style={s.infoItem}><Text style={s.infoLabel}>Date of birth: </Text><Text style={s.infoValue}>{data.dateOfBirth}</Text></View>) : null}
            {data.dateOfBirth && data.nationality ? <Text style={s.infoPipe}>|</Text> : null}
            {data.nationality ? (<View style={s.infoItem}><Text style={s.infoLabel}>Nationality: </Text><Text style={s.infoValue}>{data.nationality}</Text></View>) : null}
            {data.nationality && data.phone ? <Text style={s.infoPipe}>|</Text> : null}
            {data.phone ? (<View style={s.infoItem}><Text style={s.infoLabel}>Phone number: </Text><Text style={s.infoValue}>{data.phone}</Text></View>) : null}
          </View>
          <View style={s.infoRow}>
            {data.gender ? (<View style={s.infoItem}><Text style={s.infoLabel}>Gender: </Text><Text style={s.infoValue}>{data.gender}</Text></View>) : null}
            {data.gender && data.address ? <Text style={s.infoPipe}>|</Text> : null}
            {data.address ? (<View style={s.infoItem}><Text style={s.infoLabel}>Address: </Text><Text style={s.infoValue}>{data.address}</Text></View>) : null}
          </View>
          {data.email ? (<View style={s.infoRow}><View style={s.infoItem}><Text style={s.infoLabel}>Email address: </Text><Text style={s.infoValue}>{data.email}</Text></View></View>) : null}
          {data.linkedinUrl ? (<View style={s.infoRow}><View style={s.infoItem}><Text style={s.infoLabel}>LinkedIn: </Text><Text style={s.infoValue}>{data.linkedinUrl}</Text></View></View>) : null}
        </View>

        {(data.summary || data.jobTitle) ? (<View><Text style={s.sectionTitle}>ABOUT ME</Text><Text style={s.bodyText}>{data.summary || data.jobTitle}</Text></View>) : null}

        {data.workExperience && data.workExperience.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>WORK EXPERIENCE</Text>
            {data.workExperience.filter((e) => e.role || e.employer || e.duties).map((exp, i) => {
              const bullets = dutiesToBullets(exp.duties);
              const titleLine = [exp.role, exp.employer].filter(Boolean).join(' – ').toUpperCase();
              return (
                <View key={i} style={s.entryBlock}>
                  {exp.dates ? <Text style={s.entryDates}>{exp.dates}</Text> : null}
                  {titleLine ? <Text style={s.entryTitle}>{titleLine}</Text> : null}
                  {exp.location ? <Text style={s.entrySubLabel}>{exp.location}</Text> : null}
                  {bullets.map((b, bi) => (<View key={bi} style={s.bulletRow}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{b}</Text></View>))}
                </View>
              );
            })}
          </View>
        ) : null}

        {data.education && data.education.length > 0 ? (
          <View>
            <Text style={s.sectionTitle}>EDUCATION AND TRAINING</Text>
            {data.education.filter((e) => e.qualification || e.institution).map((edu, i) => {
              const titleLine = [edu.qualification, edu.institution].filter(Boolean).join(' – ').toUpperCase();
              const subjects = edu.fieldOfStudy ? edu.fieldOfStudy.split(/[,\n]+/).map((str: string) => str.trim()).filter(Boolean) : [];
              return (
                <View key={i} style={s.entryBlock}>
                  {edu.dates ? <Text style={s.entryDates}>{edu.dates}</Text> : null}
                  {titleLine ? <Text style={s.entryTitle}>{titleLine}</Text> : null}
                  {edu.location ? <Text style={s.entrySubLabel}>{edu.location}</Text> : null}
                  {subjects.length > 0 ? (<View><Text style={s.entrySubLabel}>Relevant Subjects:</Text>{subjects.map((sub, si) => (<View key={si} style={s.bulletRow}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{sub}</Text></View>))}</View>) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {data.digitalSkills ? (<View><Text style={s.sectionTitle}>DIGITAL SKILLS</Text><Text style={s.bodyText}>{toPipeSeparated(data.digitalSkills)}</Text></View>) : null}

        {communicationLine ? (<View><Text style={s.sectionTitle}>COMMUNICATION AND INTERPERSONAL SKILLS</Text><Text style={s.bodyText}>{communicationLine}</Text></View>) : null}

        <View>
          <Text style={s.sectionTitle}>LANGUAGE SKILLS</Text>
          <View style={s.langMotherRow}>
            <Text style={{ fontFamily: 'Helvetica', fontSize: 10 }}>{'Mother Tongue(s): '}</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>{(data.motherTongue || '').toUpperCase()}</Text>
          </View>
          <Text style={s.langOtherLabel}>Other language(s):</Text>
          {data.foreignLanguages && data.foreignLanguages.length > 0 ? (
            <View style={s.langTable}>
              <View style={s.langHeaderRow1}>
                <View style={s.langEmptyCell} />
                <Text style={s.langGroupHeader}>UNDERSTANDING</Text>
                <Text style={s.langGroupHeader}>SPEAKING</Text>
                <Text style={s.langGroupHeaderSingle}>WRITING</Text>
              </View>
              <View style={s.langHeaderRow2}>
                <View style={s.langEmptyCell} />
                <Text style={s.langSubHeader}>Listening</Text>
                <Text style={s.langSubHeader}>Reading</Text>
                <Text style={s.langSubHeader}>Spoken production</Text>
                <Text style={s.langSubHeader}>Spoken interaction</Text>
                <Text style={s.langSubHeader}>Writing</Text>
              </View>
              {data.foreignLanguages.filter((l) => l.language).map((lang, i) => (
                <View key={i} style={s.langDataRow}>
                  <View style={s.langNameCell}><Text style={s.langNameText}>{lang.language}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.listening}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.reading}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.spokenProduction}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.spokenInteraction}</Text></View>
                  <View style={s.langDataCell}><Text style={s.langDataText}>{lang.writing}</Text></View>
                </View>
              ))}
              <Text style={s.langCEFRNote}>Levels: A1/A2: Basic user - B1/B2: Independent user - C1/C2: Proficient user - Common European Framework of Reference for Languages</Text>
            </View>
          ) : null}
        </View>

        {data.certifications ? (<View><Text style={s.sectionTitle}>CERTIFICATES</Text><Text style={s.bodyText}>{data.certifications}</Text></View>) : null}
        {data.hobbies ? (<View><Text style={s.sectionTitle}>ADDITIONAL INFORMATION</Text><Text style={s.bodyText}>{data.hobbies}</Text></View>) : null}
        {data.drivingLicence ? (<View><Text style={s.sectionTitle}>DRIVING LICENCE</Text><Text style={s.bodyText}>{data.drivingLicence}</Text></View>) : null}

      </Page>
    </Document>
  );
};