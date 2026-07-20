import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';

const { height: SCREEN_H } = Dimensions.get('window');

interface WorkEntry {
  role: string;
  company: string;
  period: string;
  duties: string;
}

interface EduEntry {
  dates: string;
  qualification: string;
  institution: string;
  location: string;
  fieldOfStudy?: string;
}

interface LangEntry {
  language: string;
  listening: string;
  reading: string;
  spokenInteraction: string;
  spokenProduction: string;
  writing: string;
}

interface CVWizardModalProps {
  visible: boolean;
  onClose: () => void;
  templateType: 'standard' | 'europass';
  onSuccess: () => void;
  prefilledHeadline?: string;
  job?: any;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// ─── Standard template HTML compiler ──────────────────────────────────────────
const compileStandardHTML = (profile: any, data: any) => {
  const name = profile?.name || 'Applicant';
  const email = data.email || profile?.email || '';
  const phone = data.phone || profile?.employee_profile?.phone_number || profile?.phone_number || profile?.phone || '';
  const location = profile?.location || '';
  const linkedin = data.linkedinUrl || profile?.employee_profile?.linkedin_url || profile?.linkedinUrl || '';
  
  const bulletsForDuties = (duties: string) => {
    return duties.split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  };

  const skillsList = data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const certList = data.certifications ? data.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const langList = data.languages ? data.languages.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const strengthList = data.strengths ? data.strengths.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; line-height: 1.5; font-size: 13px; }
        .header { background-color: #1B4F8A; padding: 30px; color: #ffffff; position: relative; border-radius: 8px 8px 0 0; }
        .hd-name { font-size: 28px; font-weight: bold; margin: 0; }
        .hd-role { font-size: 14px; color: #bfdbfe; margin-top: 5px; font-weight: bold; }
        .hd-contact { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; font-size: 11px; color: #bfdbfe; }
        .content { padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .sec-header { background-color: #1B4F8A; padding: 6px 12px; margin-top: 20px; margin-bottom: 12px; border-radius: 4px; }
        .sec-title { font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
        .summary-txt { font-size: 12px; color: #374151; line-height: 1.6; }
        .job-block { margin-bottom: 15px; }
        .job-head { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; color: #111827; }
        .job-co { font-size: 12px; color: #2563eb; margin: 3px 0 6px 0; font-weight: 600; }
        .job-date { font-size: 11px; color: #9ca3af; font-weight: normal; }
        .bullet-list { margin: 5px 0 0 15px; padding: 0; }
        .bullet-item { font-size: 12px; color: #374151; margin-bottom: 4px; }
        .two-col { display: flex; gap: 30px; }
        .col { flex: 1; }
        .col-title { font-size: 12px; font-weight: bold; color: #1B4F8A; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        .list-item { font-size: 12px; color: #374151; margin-bottom: 4px; }
        .ach-block { background-color: #f0f4ff; border-left: 4px solid #1B4F8A; padding: 12px; margin-top: 5px; border-radius: 0 4px 4px 0; }
        .ach-txt { font-size: 12px; color: #374151; line-height: 1.5; margin: 0; }
        .ref-text { font-size: 11px; color: #9ca3af; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hd-name">${name}</div>
        <div class="hd-role">${data.headline}</div>
        <div class="hd-contact">
          ${email ? `<span>✉ ${email}</span>` : ''}
          ${phone ? `<span>☎ ${phone}</span>` : ''}
          ${location ? `<span>📍 ${location}</span>` : ''}
          ${linkedin ? `<span>in ${linkedin}</span>` : ''}
        </div>
      </div>
      <div class="content">
        <div class="sec-header"><h3 class="sec-title">Professional Summary</h3></div>
        <div class="summary-txt">
          ${data.summary || `${data.headline} with expertise in key sales methodologies. Committed to driving execution, outbound pipelines, and delivering customer success.`}
        </div>

        ${data.workEntries && data.workEntries.length > 0 ? `
          <div class="sec-header"><h3 class="sec-title">Work Experience</h3></div>
          ${data.workEntries.map((exp: any) => `
            <div class="job-block">
              <div class="job-head">
                <span>${exp.role}</span>
                <span class="job-date">${exp.period}</span>
              </div>
              <div class="job-co">${exp.company}</div>
              <ul class="bullet-list">
                ${bulletsForDuties(exp.duties).map(b => `<li class="bullet-item">${b}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        ` : ''}

        <div class="sec-header"><h3 class="sec-title">Skills & Additional Details</h3></div>
        <div class="two-col">
          <div class="col">
            <div class="col-title">Core Skills</div>
            ${skillsList.map((sk: string) => `<div class="list-item">• ${sk}</div>`).join('')}

            ${certList.length > 0 ? `
              <div class="col-title" style="margin-top: 15px;">Certifications</div>
              ${certList.map((c: string) => `<div class="list-item">• ${c}</div>`).join('')}
            ` : ''}
          </div>
          <div class="col">
            ${langList.length > 0 ? `
              <div class="col-title">Languages</div>
              ${langList.map((l: string) => `<div class="list-item">• ${l}</div>`).join('')}
            ` : ''}

            ${strengthList.length > 0 ? `
              <div class="col-title" style="margin-top: 15px;">Strengths</div>
              ${strengthList.map((s: string) => `<div class="list-item">• ${s}</div>`).join('')}
            ` : ''}
          </div>
        </div>

        ${data.education ? `
          <div class="sec-header"><h3 class="sec-title">Education</h3></div>
          <div class="summary-txt">${data.education}</div>
        ` : ''}

        <div class="sec-header"><h3 class="sec-title">References</h3></div>
        <div class="ref-text">Available upon request</div>
      </div>
    </body>
    </html>
  `;
};

// ─── Europass template HTML compiler ──────────────────────────────────────────
const compileEuropassHTML = (profile: any, data: any) => {
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || profile?.name || 'Applicant';
  const email = data.email || profile?.email || '';
  const phone = data.phone || profile?.employee_profile?.phone_number || profile?.phone_number || profile?.phone || '';
  const address = data.address || profile?.location || '';
  const dob = data.dateOfBirth || '';
  const nationality = data.nationality || '';
  const linkedin = data.linkedinUrl || profile?.employee_profile?.linkedin_url || profile?.linkedinUrl || '';
  const website = data.website || '';
  
  const bulletsForDuties = (duties: string) => {
    return duties.split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; color: #000000; margin: 0; padding: 40px; line-height: 1.5; font-size: 12px; }
        .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
        .photo-box { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; background-color: #e5e7eb; border: 1px solid #d1d5db; }
        .photo-img { width: 100%; height: 100%; object-fit: cover; }
        .logo-box { font-size: 24px; font-weight: bold; color: #003399; font-family: 'Helvetica Neue', Helvetica, sans-serif; }
        .logo-sub { font-size: 10px; color: #666; font-weight: normal; margin-top: 2px; }
        .name-container { border-bottom: 1.5px solid #000000; padding-bottom: 8px; margin-bottom: 15px; }
        .name-text { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; }
        .info-block { margin-bottom: 20px; font-size: 11px; }
        .info-row { display: flex; flex-wrap: wrap; margin-bottom: 4px; }
        .info-item { margin-right: 12px; }
        .info-label { font-weight: bold; }
        .sec-title { font-size: 13px; font-weight: bold; color: #000000; text-transform: uppercase; border-bottom: 1px solid #000000; padding-bottom: 4px; margin-top: 25px; margin-bottom: 12px; }
        .body-text { font-size: 11px; color: #000000; margin-bottom: 12px; }
        .entry-block { margin-bottom: 15px; }
        .entry-dates { font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #4b5563; }
        .entry-title { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
        .bullet-list { margin: 4px 0 0 15px; padding: 0; }
        .bullet-item { font-size: 11px; color: #000000; margin-bottom: 3px; }
        .lang-sub { margin-bottom: 8px; font-size: 11px; }
        .lang-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        .lang-th-main { font-weight: bold; text-align: center; font-size: 10px; padding: 4px; text-transform: uppercase; }
        .lang-th-sub { text-align: center; font-size: 9px; padding: 4px; color: #4b5563; }
        .lang-row { background-color: #9e3430; color: #ffffff; }
        .lang-cell { text-align: center; font-size: 11px; padding: 6px; font-weight: bold; border: 1px solid #ffffff; }
        .lang-name-cell { text-align: left; padding-left: 10px; }
        .competency-block { font-size: 11px; margin-bottom: 10px; }
        .competency-title { font-weight: bold; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="top-row">
        <div class="photo-box">
          ${profile?.avatarUrl ? `<img src="${profile.avatarUrl}" class="photo-img" />` : ''}
        </div>
        <div class="logo-box">
          europass
          <div class="logo-sub">Curriculum Vitae</div>
        </div>
      </div>

      <div class="name-container">
        <h1 class="name-text">${fullName}</h1>
      </div>

      <div class="info-block">
        <div class="info-row">
          ${dob ? `<span class="info-item"><span class="info-label">Date of birth:</span> ${dob}</span>` : ''}
          ${nationality ? `<span class="info-item"><span class="info-label">Nationality:</span> ${nationality}</span>` : ''}
          ${phone ? `<span class="info-item"><span class="info-label">Phone number:</span> ${phone}</span>` : ''}
        </div>
        <div class="info-row" style="margin-top: 4px;">
          ${address ? `<span class="info-item"><span class="info-label">Address:</span> ${address}</span>` : ''}
          ${email ? `<span class="info-item"><span class="info-label">Email:</span> ${email}</span>` : ''}
        </div>
        ${linkedin || website ? `
          <div class="info-row" style="margin-top: 4px;">
            ${linkedin ? `<span class="info-item"><span class="info-label">LinkedIn:</span> ${linkedin}</span>` : ''}
            ${website ? `<span class="info-item"><span class="info-label">Website:</span> ${website}</span>` : ''}
          </div>
        ` : ''}
      </div>

      ${data.summary ? `
        <div class="sec-title">About Me</div>
        <div class="body-text">${data.summary}</div>
      ` : ''}

      ${data.workEntries && data.workEntries.length > 0 ? `
        <div class="sec-title">Work Experience</div>
        ${data.workEntries.map((exp: any) => `
          <div class="entry-block">
            <div class="entry-dates">${exp.period}</div>
            <div class="entry-title">${exp.role} – ${exp.company}</div>
            <ul class="bullet-list">
              ${bulletsForDuties(exp.duties).map(b => `<li class="bullet-item">${b}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      ` : ''}

      ${data.eduEntries && data.eduEntries.length > 0 ? `
        <div class="sec-title">Education and Training</div>
        ${data.eduEntries.map((edu: any) => `
          <div class="entry-block">
            <div class="entry-dates">${edu.dates}</div>
            <div class="entry-title">${edu.qualification} – ${edu.institution}</div>
            ${edu.fieldOfStudy ? `<ul class="bullet-list"><li class="bullet-item">${edu.fieldOfStudy}</li></ul>` : ''}
          </div>
        `).join('')}
      ` : ''}

      ${data.digitalSkills ? `
        <div class="sec-title">Digital Skills</div>
        <div class="body-text">${data.digitalSkills.replace(/\n/g, ' | ').replace(/,/g, ' | ')}</div>
      ` : ''}

      <div class="sec-title">Language Skills</div>
      <div class="lang-sub">Mother Tongue(s): <strong>${(data.motherTongue || 'English').toUpperCase()}</strong></div>
      
      ${data.foreignLanguages && data.foreignLanguages.length > 0 ? `
        <div class="lang-sub">Other language(s):</div>
        <table class="lang-table">
          <thead>
            <tr>
              <th style="width: 100px;"></th>
              <th colspan="2" class="lang-th-main">Understanding</th>
              <th colspan="2" class="lang-th-main">Speaking</th>
              <th class="lang-th-main">Writing</th>
            </tr>
            <tr>
              <th></th>
              <th class="lang-th-sub">Listening</th>
              <th class="lang-th-sub">Reading</th>
              <th class="lang-th-sub">Spoken production</th>
              <th class="lang-th-sub">Spoken interaction</th>
              <th class="lang-th-sub"></th>
            </tr>
          </thead>
          <tbody>
            ${data.foreignLanguages.map((l: any) => `
              <tr class="lang-row">
                <td class="lang-cell lang-name-cell">${l.language}</td>
                <td class="lang-cell">${l.listening}</td>
                <td class="lang-cell">${l.reading}</td>
                <td class="lang-cell">${l.spokenProduction}</td>
                <td class="lang-cell">${l.spokenInteraction}</td>
                <td class="lang-cell">${l.writing}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${data.communicationCompetencies || data.organisationalCompetencies || data.jobRelatedCompetencies || data.otherCompetencies || data.drivingLicence || data.certifications || data.hobbies ? `
        <div class="sec-title">Competencies & Personal Skills</div>
        
        ${data.communicationCompetencies ? `
          <div class="competency-block">
            <div class="competency-title">Communication Competencies</div>
            <div>${data.communicationCompetencies}</div>
          </div>
        ` : ''}
        
        ${data.organisationalCompetencies ? `
          <div class="competency-block">
            <div class="competency-title">Organisational Competencies</div>
            <div>${data.organisationalCompetencies}</div>
          </div>
        ` : ''}

        ${data.jobRelatedCompetencies ? `
          <div class="competency-block">
            <div class="competency-title">Job-Related Competencies</div>
            <div>${data.jobRelatedCompetencies}</div>
          </div>
        ` : ''}

        ${data.otherCompetencies ? `
          <div class="competency-block">
            <div class="competency-title">Other Competencies</div>
            <div>${data.otherCompetencies}</div>
          </div>
        ` : ''}

        ${data.drivingLicence ? `
          <div class="competency-block">
            <div class="competency-title">Driving Licence</div>
            <div>${data.drivingLicence}</div>
          </div>
        ` : ''}

        ${data.certifications ? `
          <div class="competency-block">
            <div class="competency-title">Certifications</div>
            <div>${data.certifications}</div>
          </div>
        ` : ''}

        ${data.hobbies ? `
          <div class="competency-block">
            <div class="competency-title">Hobbies & Interests</div>
            <div>${data.hobbies}</div>
          </div>
        ` : ''}
      ` : ''}
    </body>
    </html>
  `;
};

const buildCoverLetterText = (
  profile: any,
  headline: string,
  skills: string,
  workEntries: WorkEntry[],
  job: any
) => {
  const years = profile?.employee_profile?.experience_years || profile?.experience_years || 0;
  const companyName = job?.companyName || 'your organisation';
  const jobTitle = job?.title || 'the desired position';

  // Get skills
  const skillsList = skills
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : (profile?.skills || []);
  const topSkills = skillsList.slice(0, 3).join(', ');

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const p1 = `I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With my background as a ${headline}, I am confident that my skills and dedication make me an excellent candidate for this role.`;

  const p2 = years > 0
    ? `Over the past ${years} years, I have built deep expertise in this domain${topSkills ? `, specifically in ${topSkills}` : ''}. This experience has equipped me with the ability to deliver measurable results while working collaboratively within dynamic team environments.`
    : `Throughout my career, I have developed strong expertise in my domain${topSkills ? `, particularly in ${topSkills}` : ''}. I thrive in fast-paced environments and am committed to delivering high-quality results that exceed expectations.`;

  // Draw achievement from the first work entry's duties
  const firstWork = workEntries?.[0];
  const dutiesText = firstWork?.duties || '';
  const firstSentence = dutiesText.split(/[.\n]+/)[0]?.trim();
  const achievement = firstSentence && firstSentence.length > 10 ? firstSentence : '';

  const p3 = achievement
    ? `In my previous roles, I have successfully accomplished key milestones: ${achievement} I am confident in bringing this same level of commitment and performance to ${companyName}.`
    : `I am committed to continuous improvement and professional excellence. I believe in building strong relationships and delivering consistent value to every stakeholder I work with, fostering an environment of collaboration and high achievement.`;

  const p4 = `I would welcome the opportunity to discuss how my background aligns with the goals of ${companyName}. Thank you for your time and consideration. I look forward to the possibility of contributing to your team and helping drive outstanding results.`;

  return [p1, p2, p3, p4].join('\n\n');
};

export default function CVWizardModal({ visible, onClose, templateType, onSuccess, prefilledHeadline, job }: CVWizardModalProps) {
  const colors = Colors.light;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const isEuropass = templateType === 'europass';
  const totalSteps = isEuropass ? (job ? 6 : 5) : (job ? 4 : 3);

  // ── Form State ──────────────────────────────────────────────────────────────
  // Common / Standard States
  const [headline, setHeadline] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [certifications, setCertifications] = useState('');
  const [strengths, setStrengths] = useState('');
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([{ role: '', company: '', period: '', duties: '' }]);
  const [coverLetter, setCoverLetter] = useState('');

  // Europe (Europass) States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [summary, setSummary] = useState('');
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([{ dates: '', qualification: '', institution: '', location: '', fieldOfStudy: '' }]);
  const [motherTongue, setMotherTongue] = useState('English');
  const [foreignLanguages, setForeignLanguages] = useState<LangEntry[]>([
    { language: 'French', listening: 'B2', reading: 'B2', spokenInteraction: 'B1', spokenProduction: 'B1', writing: 'B2' }
  ]);
  const [digitalSkills, setDigitalSkills] = useState('');
  const [communicationCompetencies, setCommunicationCompetencies] = useState('');
  const [organisationalCompetencies, setOrganisationalCompetencies] = useState('');
  const [jobRelatedCompetencies, setJobRelatedCompetencies] = useState('');
  const [otherCompetencies, setOtherCompetencies] = useState('');
  const [drivingLicence, setDrivingLicence] = useState('');
  const [hobbies, setHobbies] = useState('');
  const getCompiledHTML = () => {
    if (isEuropass) {
      return compileEuropassHTML(profile, {
        firstName, lastName, dateOfBirth, nationality, address, phone, email, linkedinUrl, website, summary,
        workEntries, eduEntries, motherTongue, foreignLanguages, digitalSkills,
        communicationCompetencies, organisationalCompetencies, jobRelatedCompetencies, otherCompetencies, drivingLicence, certifications, hobbies
      });
    } else {
      return compileStandardHTML(profile, {
        headline, education, skills, languages, certifications, strengths, workEntries
      });
    }
  };

  // Load profile data to prefill details
  useEffect(() => {
    if (visible) {
      setStep(1);
      setLoading(true);
      apiFetch('/auth/me/')
        .then(u => {
          setProfile(u);
          const nameParts = (u.name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setEmail(u.email || '');
          
          // Resolve nested user profile parameters
          const ep = u.employee_profile || {};
          setPhone(ep.phone_number || u.phone_number || '');
          setAddress(u.location || ep.city || '');
          setHeadline(prefilledHeadline || ep.title || u.title || '');
          setEducation(ep.education || u.education || '');
          setSkills(ep.skills ? (Array.isArray(ep.skills) ? ep.skills.join(', ') : ep.skills) : (u.skills ? u.skills.join(', ') : ''));
          setDigitalSkills(ep.skills ? (Array.isArray(ep.skills) ? ep.skills.join(', ') : ep.skills) : (u.skills ? u.skills.join(', ') : ''));
          setLinkedinUrl(ep.linkedin_url || u.linkedinUrl || '');
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [visible, prefilledHeadline]);

  // Automatically generate cover letter when we reach the Cover Letter step
  useEffect(() => {
    if (job && step === totalSteps && !coverLetter) {
      const generated = buildCoverLetterText(
        profile,
        headline || 'Professional',
        skills || digitalSkills || '',
        workEntries,
        job
      );
      setCoverLetter(generated);
    }
  }, [step, totalSteps, job, profile, headline, skills, digitalSkills, workEntries, coverLetter]);

  // AI Suggest for Standard template
  const handleAISuggest = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!headline.trim()) {
      Alert.alert('Error', 'Please enter a Target Headline first.');
      return;
    }
    setWorkEntries([
      {
        role: headline,
        company: 'Acme SaaS Corp',
        period: '2023 - Present',
        duties: 'Led B2B outbound prospecting using MEDDIC qualification framework.\nManaged key enterprise accounts and exceeded quarterly pipeline quotas by 120%.\nCollaborated with product marketing to align campaigns and improve customer acquisition.',
      },
      {
        role: 'Sales Executive',
        company: 'Global Tech Solution',
        period: '2021 - 2023',
        duties: 'Owned full sales cycle from initial contact to close.\nDelivered technical product demos and addressed customer pain points.\nConsistently ranked top 10% among account executives in EMEA regional team.',
      },
    ]);
    setStrengths('MEDDIC, Consultative Selling, Pipeline Management, Value Negotiation');
    setCertifications('Salesforce Certified AE, Sandler Sales Mastery');
    setLanguages('English (Native), Spanish (Conversational)');
    Alert.alert('AI Suggestions Applied!', 'We pre-filled optimized work history and strengths. Feel free to customize them.');
  };

  // Work entries helper
  const addWorkEntry = () => setWorkEntries([...workEntries, { role: '', company: '', period: '', duties: '' }]);
  const removeWorkEntry = (i: number) => setWorkEntries(workEntries.filter((_, idx) => idx !== i));
  const updateWorkEntry = (i: number, field: keyof WorkEntry, val: string) => {
    const next = [...workEntries];
    next[i] = { ...next[i], [field]: val };
    setWorkEntries(next);
  };

  // Education entries helper (Europass)
  const addEduEntry = () => setEduEntries([...eduEntries, { dates: '', qualification: '', institution: '', location: '', fieldOfStudy: '' }]);
  const removeEduEntry = (i: number) => setEduEntries(eduEntries.filter((_, idx) => idx !== i));
  const updateEduEntry = (i: number, field: keyof EduEntry, val: string) => {
    const next = [...eduEntries];
    next[i] = { ...next[i], [field]: val };
    setEduEntries(next);
  };

  // Foreign language helpers (Europass)
  const addLangEntry = () => setForeignLanguages([...foreignLanguages, { language: '', listening: 'B2', reading: 'B2', spokenInteraction: 'B2', spokenProduction: 'B2', writing: 'B2' }]);
  const removeLangEntry = (i: number) => setForeignLanguages(foreignLanguages.filter((_, idx) => idx !== i));
  const updateLangEntry = (i: number, field: keyof LangEntry, val: string) => {
    const next = [...foreignLanguages];
    next[i] = { ...next[i], [field]: val } as LangEntry;
    setForeignLanguages(next);
  };

  // Custom CEFR level button row renderer
  const renderCEFRSelector = (currentVal: string, onSelect: (v: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
      {CEFR_LEVELS.map(level => {
        const active = currentVal === level;
        return (
          <Pressable
            key={level}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(level);
            }}
            style={[
              s.cefrBtn,
              { borderColor: colors.border },
              active && { backgroundColor: Palette.accent600, borderColor: Palette.accent600 }
            ]}
          >
            <Text style={[s.cefrBtnText, { color: colors.text }, active && { color: '#fff' }]}>{level}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isEuropass) {
      if (step === 1 && (!firstName.trim() || !email.trim())) {
        Alert.alert('Error', 'Please enter your First Name and Email.');
        return;
      }
      if (step === 2) {
        const valid = workEntries.filter(e => e.role.trim() && e.company.trim());
        if (valid.length === 0) {
          Alert.alert('Error', 'Please add at least one work experience with Role and Company.');
          return;
        }
      }
      if (step === 3) {
        const valid = eduEntries.filter(e => e.qualification.trim() && e.institution.trim());
        if (valid.length === 0) {
          Alert.alert('Error', 'Please add at least one education entry with Qualification and Institution.');
          return;
        }
      }
      if (step === 4 && !motherTongue.trim()) {
        Alert.alert('Error', 'Please specify your Mother Tongue.');
        return;
      }
    } else {
      if (step === 1 && !headline.trim()) {
        Alert.alert('Error', 'Please enter a target job title.');
        return;
      }
      if (step === 2) {
        const valid = workEntries.filter(e => e.role.trim() && e.company.trim());
        if (valid.length === 0) {
          Alert.alert('Error', 'Please add at least one work experience with Role and Company.');
          return;
        }
      }
      if (step === 3 && (!education.trim() || !skills.trim())) {
        Alert.alert('Error', 'Please fill in your education and core skills.');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      generateAndSaveCV();
    }
  };

  const generateAndSaveCV = async () => {
    setLoading(true);
    try {
      let htmlContent = '';
      if (isEuropass) {
        htmlContent = compileEuropassHTML(profile, {
          firstName, lastName, dateOfBirth, nationality, address, phone, email, linkedinUrl, website, summary,
          workEntries, eduEntries, motherTongue, foreignLanguages, digitalSkills,
          communicationCompetencies, organisationalCompetencies, jobRelatedCompetencies, otherCompetencies, drivingLicence, certifications, hobbies
        });
      } else {
        htmlContent = compileStandardHTML(profile, {
          headline, education, skills, languages, certifications, strengths, workEntries
        });
      }

      // Generate PDF locally on device
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Copy file to document directory to prevent Android permission/read issues
      const tempUri = `${FileSystem.documentDirectory}temp_print_cv.pdf`;
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (e) {}

      await FileSystem.copyAsync({
        from: uri,
        to: tempUri,
      });

      // Read PDF file contents as Base64 string from accessible documentDirectory
      const base64Pdf = await FileSystem.readAsStringAsync(tempUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Clean up the temp file
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (e) {}

      // Save structure to Django backend
      await apiFetch('/cv/save/', {
        method: 'POST',
        body: JSON.stringify({
          template_id: isEuropass ? 'EU1' : 'T14',
          template_name: isEuropass ? 'Europass Template' : 'Steel Blue Banner',
          target_role: isEuropass ? (headline || 'Europe CV') : headline,
          target_company: job?.companyName || '',
          cv_pdf_base64: base64Pdf,
          cover_letter_text: job ? coverLetter : '',
          work_experience_json: workEntries,
          job_id: job?.id || undefined,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('CV Generated Successfully!', 'Your tailored CV has been saved to your profile.');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert('Generation Failed', 'Could not save your CV. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} style={[s.sheet, { backgroundColor: colors.cardBg }]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="zap" size={16} color={Palette.accent600} />
              <Text style={[s.headerTitle, { color: colors.text }]}>
                {isEuropass ? 'Europe CV Wizard' : 'Standard CV Wizard'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Progress Row */}
          <View style={s.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressPill,
                  { backgroundColor: step > i ? Palette.accent500 : Palette.neutral200 },
                ]}
              />
            ))}
          </View>

          {/* Form Content */}
          {loading && step === 1 && !profile ? (
            <View style={s.centerContainer}>
              <ActivityIndicator size="large" color={Palette.accent500} />
            </View>
          ) : (
            <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
              
              {/* ── STANDARD FLOW STEPS ── */}
              {!isEuropass && (
                <>
                  {step === 1 && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                      <View style={s.titleRow}>
                        <Text style={[s.sectionTitle, { color: colors.text }]}>Target Role & AI Helper</Text>
                        <Pressable onPress={handleAISuggest} style={[s.aiBtn, { backgroundColor: Palette.accent50 }]}>
                          <Feather name="zap" size={12} color={Palette.accent700} />
                          <Text style={[s.aiBtnText, { color: Palette.accent700 }]}>AI Suggest</Text>
                        </Pressable>
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Target Headline / Job Title</Text>
                        <TextInput
                          value={headline}
                          onChangeText={setHeadline}
                          placeholder="e.g. Mid-Market Account Executive"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Languages (comma separated)</Text>
                        <TextInput
                          value={languages}
                          onChangeText={setLanguages}
                          placeholder="English (Native), French (Basic)"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Strengths (comma separated)</Text>
                        <TextInput
                          value={strengths}
                          onChangeText={setStrengths}
                          placeholder="MEDDIC, Account Closing, Pipeline Management"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>
                    </Animated.View>
                  )}

                  {step === 2 && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Work Experience</Text>
                      {workEntries.map((entry, index) => (
                        <View key={index} style={[s.entryCard, { borderColor: colors.border }]}>
                          <View style={s.entryCardHeader}>
                            <Text style={[s.entryCardTitle, { color: colors.text }]}>Experience #${index + 1}</Text>
                            {workEntries.length > 1 && (
                              <Pressable onPress={() => removeWorkEntry(index)}>
                                <Feather name="trash-2" size={14} color={Palette.red500} />
                              </Pressable>
                            )}
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.role}
                              onChangeText={t => updateWorkEntry(index, 'role', t)}
                              placeholder="Role / Title"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.company}
                              onChangeText={t => updateWorkEntry(index, 'company', t)}
                              placeholder="Company Name"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.period}
                              onChangeText={t => updateWorkEntry(index, 'period', t)}
                              placeholder="Period (e.g. 2021 - Present)"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.duties}
                              onChangeText={t => updateWorkEntry(index, 'duties', t)}
                              placeholder="Responsibilities / Achievements"
                              placeholderTextColor={colors.textMuted}
                              multiline
                              style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>
                        </View>
                      ))}

                      <Pressable onPress={addWorkEntry} style={[s.addBtn, { borderColor: colors.border }]}>
                        <Feather name="plus" size={14} color={colors.text} />
                        <Text style={[s.addBtnText, { color: colors.text }]}>Add Experience</Text>
                      </Pressable>
                    </Animated.View>
                  )}

                  {step === 3 && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Education & Skills</Text>
                      
                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Education</Text>
                        <TextInput
                          value={education}
                          onChangeText={setEducation}
                          placeholder="University, Degree and Major"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Skills (comma separated)</Text>
                        <TextInput
                          value={skills}
                          onChangeText={setSkills}
                          placeholder="e.g. Salesforce, outbound cold calling, CRM"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Certifications (comma separated)</Text>
                        <TextInput
                          value={certifications}
                          onChangeText={setCertifications}
                          placeholder="e.g. HubSpot Sales, AWS Practitioner"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>
                    </Animated.View>
                  )}

                  {step === 4 && job && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Final Application Review</Text>
                      
                      {/* CV Design Preview */}
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[s.label, { color: colors.textSecondary, marginBottom: 6 }]}>Tailored CV Design Preview</Text>
                        <View style={[s.previewContainer, { borderColor: colors.border, backgroundColor: '#fff' }]}>
                          <WebView
                            originWhitelist={['*']}
                            source={{ html: getCompiledHTML() }}
                            style={{ flex: 1 }}
                            scalesPageToFit={true}
                          />
                          {/* Absolute overlay to intercept touches and prevent clicking/scrolling */}
                          <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} />
                        </View>
                      </View>

                      {/* Cover Letter Section */}
                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Generated Cover Letter</Text>
                        <Text style={[s.sectionSub, { color: colors.textSecondary, marginBottom: 8 }]}>
                          Tailored for the {job.title} position at {job.companyName || 'your organisation'}. Customize it below.
                        </Text>
                        <TextInput
                          value={coverLetter}
                          onChangeText={setCoverLetter}
                          multiline
                          numberOfLines={10}
                          style={[s.textArea, { borderColor: colors.border, color: colors.text, height: 220 }]}
                        />
                      </View>
                    </Animated.View>
                  )}
                </>
              )}

              {/* ── EUROPE (EUROPASS) FLOW STEPS ── */}
              {isEuropass && (
                <>
                  {step === 1 && (
                    <Animated.View entering={FadeIn} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Personal Details</Text>
                      
                      <View style={s.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[s.label, { color: colors.textSecondary }]}>First Name *</Text>
                          <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="John"
                            placeholderTextColor={colors.textMuted}
                            style={[s.input, { borderColor: colors.border, color: colors.text }]}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.label, { color: colors.textSecondary }]}>Last Name</Text>
                          <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Doe"
                            placeholderTextColor={colors.textMuted}
                            style={[s.input, { borderColor: colors.border, color: colors.text }]}
                          />
                        </View>
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Desired Job Title / Position</Text>
                        <TextInput
                          value={headline}
                          onChangeText={setHeadline}
                          placeholder="e.g. Senior Software Engineer"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[s.label, { color: colors.textSecondary }]}>Date of Birth</Text>
                          <TextInput
                            value={dateOfBirth}
                            onChangeText={setDateOfBirth}
                            placeholder="e.g. 12/05/1990"
                            placeholderTextColor={colors.textMuted}
                            style={[s.input, { borderColor: colors.border, color: colors.text }]}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.label, { color: colors.textSecondary }]}>Nationality</Text>
                          <TextInput
                            value={nationality}
                            onChangeText={setNationality}
                            placeholder="e.g. Nigerian"
                            placeholderTextColor={colors.textMuted}
                            style={[s.input, { borderColor: colors.border, color: colors.text }]}
                          />
                        </View>
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Email Address *</Text>
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder="email@domain.com"
                          keyboardType="email-address"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Phone Number</Text>
                        <TextInput
                          value={phone}
                          onChangeText={setPhone}
                          placeholder="+44 7700 900077"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Address</Text>
                        <TextInput
                          value={address}
                          onChangeText={setAddress}
                          placeholder="e.g. London, United Kingdom"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Professional Summary / About Me</Text>
                        <TextInput
                          value={summary}
                          onChangeText={setSummary}
                          placeholder="Write a brief professional intro..."
                          placeholderTextColor={colors.textMuted}
                          multiline
                          style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>
                    </Animated.View>
                  )}

                  {step === 2 && (
                    <Animated.View entering={FadeIn} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Work Experience</Text>
                      {workEntries.map((entry, index) => (
                        <View key={index} style={[s.entryCard, { borderColor: colors.border }]}>
                          <View style={s.entryCardHeader}>
                            <Text style={[s.entryCardTitle, { color: colors.text }]}>Experience #${index + 1}</Text>
                            {workEntries.length > 1 && (
                              <Pressable onPress={() => removeWorkEntry(index)}>
                                <Feather name="trash-2" size={14} color={Palette.red500} />
                              </Pressable>
                            )}
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.role}
                              onChangeText={t => updateWorkEntry(index, 'role', t)}
                              placeholder="Role / Title"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.company}
                              onChangeText={t => updateWorkEntry(index, 'company', t)}
                              placeholder="Employer / Company Name"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.period}
                              onChangeText={t => updateWorkEntry(index, 'period', t)}
                              placeholder="Period (e.g. 05/2021 - Present)"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.duties}
                              onChangeText={t => updateWorkEntry(index, 'duties', t)}
                              placeholder="Responsibilities / Duties / Projects"
                              placeholderTextColor={colors.textMuted}
                              multiline
                              style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>
                        </View>
                      ))}

                      <Pressable onPress={addWorkEntry} style={[s.addBtn, { borderColor: colors.border }]}>
                        <Feather name="plus" size={14} color={colors.text} />
                        <Text style={[s.addBtnText, { color: colors.text }]}>Add Experience</Text>
                      </Pressable>
                    </Animated.View>
                  )}

                  {step === 3 && (
                    <Animated.View entering={FadeIn} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Education & Training</Text>
                      {eduEntries.map((entry, index) => (
                        <View key={index} style={[s.entryCard, { borderColor: colors.border }]}>
                          <View style={s.entryCardHeader}>
                            <Text style={[s.entryCardTitle, { color: colors.text }]}>Education #${index + 1}</Text>
                            {eduEntries.length > 1 && (
                              <Pressable onPress={() => removeEduEntry(index)}>
                                <Feather name="trash-2" size={14} color={Palette.red500} />
                              </Pressable>
                            )}
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.dates}
                              onChangeText={t => updateEduEntry(index, 'dates', t)}
                              placeholder="Dates (e.g. 2015 - 2019)"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.qualification}
                              onChangeText={t => updateEduEntry(index, 'qualification', t)}
                              placeholder="Qualification / Degree"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.institution}
                              onChangeText={t => updateEduEntry(index, 'institution', t)}
                              placeholder="Institution / School Name"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>

                          <View style={s.inputRow}>
                            <TextInput
                              value={entry.fieldOfStudy || ''}
                              onChangeText={t => updateEduEntry(index, 'fieldOfStudy', t)}
                              placeholder="Field of Study / Grade / Description"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { borderColor: colors.border, color: colors.text }]}
                            />
                          </View>
                        </View>
                      ))}

                      <Pressable onPress={addEduEntry} style={[s.addBtn, { borderColor: colors.border }]}>
                        <Feather name="plus" size={14} color={colors.text} />
                        <Text style={[s.addBtnText, { color: colors.text }]}>Add Education</Text>
                      </Pressable>
                    </Animated.View>
                  )}

                  {step === 4 && (
                    <Animated.View entering={FadeIn} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Languages & Digital Skills</Text>
                      
                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Mother Tongue *</Text>
                        <TextInput
                          value={motherTongue}
                          onChangeText={setMotherTongue}
                          placeholder="e.g. English"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <Text style={[s.label, { color: colors.textSecondary, marginTop: 10 }]}>Other Languages & CEFR Levels</Text>
                      
                      {foreignLanguages.map((entry, index) => (
                        <View key={index} style={[s.entryCard, { borderColor: colors.border, gap: 10 }]}>
                          <View style={s.entryCardHeader}>
                            <TextInput
                              value={entry.language}
                              onChangeText={t => updateLangEntry(index, 'language', t)}
                              placeholder="Language Name"
                              placeholderTextColor={colors.textMuted}
                              style={[s.input, { flex: 1, height: 36, marginRight: 8, borderColor: colors.border, color: colors.text }]}
                            />
                            <Pressable onPress={() => removeLangEntry(index)}>
                              <Feather name="trash-2" size={14} color={Palette.red500} />
                            </Pressable>
                          </View>

                          <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }}>Listening</Text>
                            {renderCEFRSelector(entry.listening, v => updateLangEntry(index, 'listening', v))}
                          </View>

                          <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }}>Reading</Text>
                            {renderCEFRSelector(entry.reading, v => updateLangEntry(index, 'reading', v))}
                          </View>

                          <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }}>Spoken Interaction</Text>
                            {renderCEFRSelector(entry.spokenInteraction, v => updateLangEntry(index, 'spokenInteraction', v))}
                          </View>

                          <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }}>Spoken Production</Text>
                            {renderCEFRSelector(entry.spokenProduction, v => updateLangEntry(index, 'spokenProduction', v))}
                          </View>

                          <View style={{ gap: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }}>Writing</Text>
                            {renderCEFRSelector(entry.writing, v => updateLangEntry(index, 'writing', v))}
                          </View>
                        </View>
                      ))}

                      <Pressable onPress={addLangEntry} style={[s.addBtn, { borderColor: colors.border }]}>
                        <Feather name="plus" size={14} color={colors.text} />
                        <Text style={[s.addBtnText, { color: colors.text }]}>Add Language</Text>
                      </Pressable>

                      <View style={[s.inputRow, { marginTop: 10 }]}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Digital Skills (comma separated)</Text>
                        <TextInput
                          value={digitalSkills}
                          onChangeText={setDigitalSkills}
                          placeholder="e.g. TypeScript, React, Python, Office"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>
                    </Animated.View>
                  )}

                  {step === 5 && (
                    <Animated.View entering={FadeIn} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Competencies & Additional Details</Text>
                      
                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Communication Skills</Text>
                        <TextInput
                          value={communicationCompetencies}
                          onChangeText={setCommunicationCompetencies}
                          placeholder="Explain communication achievements..."
                          placeholderTextColor={colors.textMuted}
                          multiline
                          style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Organisational Skills</Text>
                        <TextInput
                          value={organisationalCompetencies}
                          onChangeText={setOrganisationalCompetencies}
                          placeholder="Explain leadership, agile, sprints management..."
                          placeholderTextColor={colors.textMuted}
                          multiline
                          style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Job-Related Skills</Text>
                        <TextInput
                          value={jobRelatedCompetencies}
                          onChangeText={setJobRelatedCompetencies}
                          placeholder="Other domain skills..."
                          placeholderTextColor={colors.textMuted}
                          multiline
                          style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Other Competencies</Text>
                        <TextInput
                          value={otherCompetencies}
                          onChangeText={setOtherCompetencies}
                          placeholder="Any other specific competencies or skills..."
                          placeholderTextColor={colors.textMuted}
                          multiline
                          style={[s.textArea, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Other Skills / Hobbies</Text>
                        <TextInput
                          value={hobbies}
                          onChangeText={setHobbies}
                          placeholder="hobbies, sports, creative projects..."
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Certifications (comma separated)</Text>
                        <TextInput
                          value={certifications}
                          onChangeText={setCertifications}
                          placeholder="e.g. PRINCE2, ITIL Foundation, Safe Agile"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>

                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Driving Licence</Text>
                        <TextInput
                          value={drivingLicence}
                          onChangeText={setDrivingLicence}
                          placeholder="e.g. Category B"
                          placeholderTextColor={colors.textMuted}
                          style={[s.input, { borderColor: colors.border, color: colors.text }]}
                        />
                      </View>
                    </Animated.View>
                  )}

                  {step === 6 && job && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Final Application Review</Text>
                      
                      {/* CV Design Preview */}
                      <View style={{ marginBottom: 12 }}>
                        <Text style={[s.label, { color: colors.textSecondary, marginBottom: 6 }]}>Tailored CV Design Preview</Text>
                        <View style={[s.previewContainer, { borderColor: colors.border, backgroundColor: '#fff' }]}>
                          <WebView
                            originWhitelist={['*']}
                            source={{ html: getCompiledHTML() }}
                            style={{ flex: 1 }}
                            scalesPageToFit={true}
                          />
                          {/* Absolute overlay to intercept touches and prevent clicking/scrolling */}
                          <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} />
                        </View>
                      </View>

                      {/* Cover Letter Section */}
                      <View style={s.inputRow}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Generated Cover Letter</Text>
                        <Text style={[s.sectionSub, { color: colors.textSecondary, marginBottom: 8 }]}>
                          Tailored for the {job.title} position at {job.companyName || 'your organisation'}. Customize it below.
                        </Text>
                        <TextInput
                          value={coverLetter}
                          onChangeText={setCoverLetter}
                          multiline
                          numberOfLines={10}
                          style={[s.textArea, { borderColor: colors.border, color: colors.text, height: 220 }]}
                        />
                      </View>
                    </Animated.View>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <View style={s.actionRow}>
                {step > 1 && (
                  <Pressable onPress={() => setStep(step - 1)} style={[s.prevBtn, { borderColor: colors.border }]}>
                    <Text style={[s.prevBtnText, { color: colors.text }]}>Back</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={loading}
                  onPress={handleNext}
                  style={({ pressed }) => [
                    s.nextBtn,
                    { backgroundColor: Palette.accent600 },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.nextBtnText}>{step === totalSteps ? 'Generate & Save' : 'Continue'}</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.cardLg,
    borderTopRightRadius: BorderRadius.cardLg,
    height: SCREEN_H * 0.85,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
  },
  progressRow: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    gap: 2,
  },
  progressPill: {
    flex: 1,
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
  },
  stepContainer: {
    gap: 16,
  },
  previewContainer: {
    height: 260,
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  sectionSub: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: 8,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputRow: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    padding: 14,
    gap: 12,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryCardTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  cefrBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  cefrBtnText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  prevBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  nextBtn: {
    flex: 2,
    height: 44,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});

