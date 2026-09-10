import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text, TextInput } from '@/components/ui/text';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { sanitizeForHtml } from '@/utils/html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const name = data.name || profile?.name || 'Applicant';
  const email = data.email || profile?.email || '';
  const phone = data.phone || profile?.employee_profile?.phone_number || profile?.phone_number || profile?.phone || '';
  const location = data.location || profile?.location || '';
  const linkedin = data.linkedin || data.linkedinUrl || profile?.employee_profile?.linkedin_url || profile?.linkedinUrl || '';
  const headerBg = data.themeColor || '#1B4F8A';
  
  const bulletsForDuties = (duties: string) => {
    return (duties || '').split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  };

  const skillsList = data.skills ? (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : data.skills) : [];
  const certList = data.certifications ? (typeof data.certifications === 'string' ? data.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : data.certifications) : [];
  const langList = data.languages ? (typeof data.languages === 'string' ? data.languages.split(',').map((s: string) => s.trim()).filter(Boolean) : data.languages) : [];
  const strengthList = data.strengths ? (typeof data.strengths === 'string' ? data.strengths.split(',').map((s: string) => s.trim()).filter(Boolean) : data.strengths) : [];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 20px; line-height: 1.5; font-size: 13px; }
        .header { background-color: ${headerBg}; padding: 25px; color: #ffffff; position: relative; border-radius: 8px 8px 0 0; }
        .hd-name { font-size: 24px; font-weight: bold; margin: 0; }
        .hd-role { font-size: 13px; color: #bfdbfe; margin-top: 4px; font-weight: bold; }
        .hd-contact { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; font-size: 11px; color: #bfdbfe; }
        .content { padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .sec-header { background-color: ${headerBg}; padding: 5px 10px; margin-top: 16px; margin-bottom: 10px; border-radius: 4px; }
        .sec-title { font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
        .summary-txt { font-size: 12px; color: #374151; line-height: 1.5; }
        .job-block { margin-bottom: 12px; }
        .job-head { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; color: #111827; }
        .job-co { font-size: 11px; color: #2563eb; margin: 2px 0 4px 0; font-weight: 600; }
        .bullet-list { margin: 4px 0 0 14px; padding: 0; }
        .bullet-item { font-size: 11px; color: #374151; margin-bottom: 3px; }
        .two-col { display: flex; gap: 20px; }
        .col { flex: 1; }
        .col-title { font-size: 11px; font-weight: bold; color: ${headerBg}; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
        .list-item { font-size: 11px; color: #374151; margin-bottom: 3px; }
        .ref-text { font-size: 10px; color: #9ca3af; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hd-name">${name}</div>
        <div class="hd-role">${data.headline || 'Professional'}</div>
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
          ${data.summary || `${data.headline || 'Professional'} with expertise in key domain methodologies. Committed to driving execution, outbound pipelines, and delivering customer success.`}
        </div>

        ${data.workEntries && data.workEntries.length > 0 ? `
          <div class="sec-header"><h3 class="sec-title">Work Experience</h3></div>
          ${data.workEntries.map((exp: any) => `
            <div class="job-block">
              <div class="job-head">
                <span>${exp.role}</span>
                <span style="font-size:10px; color:#6b7280;">${exp.period}</span>
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
              <div class="col-title" style="margin-top: 12px;">Certifications</div>
              ${certList.map((c: string) => `<div class="list-item">• ${c}</div>`).join('')}
            ` : ''}
          </div>
          <div class="col">
            ${langList.length > 0 ? `
              <div class="col-title">Languages</div>
              ${langList.map((l: string) => `<div class="list-item">• ${l}</div>`).join('')}
            ` : ''}

            ${strengthList.length > 0 ? `
              <div class="col-title" style="margin-top: 12px;">Strengths</div>
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
const EUROPASS_LOGO_BASE64 = 'data:image/png;base64,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';

const compileEuropassHTML = (profile: any, data: any) => {
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || profile?.name || 'Applicant';
  const email = data.email || profile?.email || '';
  const phone = data.phone || profile?.employee_profile?.phone_number || profile?.phone_number || profile?.phone || '';
  const address = data.address || profile?.location || '';
  const dob = data.dateOfBirth || '';
  const nationality = data.nationality || '';
  const linkedin = data.linkedinUrl || profile?.employee_profile?.linkedin_url || profile?.linkedinUrl || '';
  const website = data.website || '';
  const photo = data.passportImage || profile?.avatar_url || profile?.avatarUrl || '';
  const initial = (data.firstName || fullName || 'U').charAt(0).toUpperCase();

  const dutiesToBullets = (raw: string): string[] => {
    if (!raw) return [];
    return raw.split(/[\n]+/).map((s: string) => s.trim().replace(/^[-*•]\s*/, '')).filter((s: string) => s.length > 2);
  };

  const toPipeSeparated = (raw: string): string => {
    if (!raw) return '';
    return raw.split(/[,\n]+/).map((str: string) => str.trim()).filter(Boolean).join(' | ');
  };

  const mergeSkills = (...parts: (string | undefined)[]): string => {
    return parts.filter(Boolean).map((p) => toPipeSeparated(p!)).filter(Boolean).join(' | ');
  };

  const communicationLine = mergeSkills(
    data.communicationCompetencies,
    data.organisationalCompetencies,
    data.jobRelatedCompetencies,
    data.otherCompetencies
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: A4; margin: 12mm 16mm; }
        * { box-sizing: border-box; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #000000;
          margin: 0;
          padding: 24px;
          line-height: 1.45;
          font-size: 11px;
          background-color: #ffffff;
        }
        .top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .photo-box {
          width: 86px;
          height: 86px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #e5e7eb;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f1f5f9;
        }
        .photo-initial {
          font-size: 32px;
          font-weight: bold;
          color: #64748b;
          text-transform: uppercase;
        }
        .logo-container {
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
        }
        .logo-img {
          width: 140px;
          height: auto;
          object-fit: contain;
          display: block;
        }
        .name-container {
          border-bottom: 1.5px solid #000000;
          padding-bottom: 5px;
          margin-bottom: 8px;
        }
        .name-text {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
          color: #000000;
          letter-spacing: 0.5px;
        }
        .info-block {
          margin-bottom: 14px;
          font-size: 10px;
          line-height: 1.6;
        }
        .info-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
        }
        .info-item {
          margin-right: 4px;
        }
        .info-label {
          font-weight: bold;
          color: #000000;
        }
        .info-pipe {
          margin: 0 6px;
          color: #000000;
        }
        .sec-title {
          font-size: 11px;
          font-weight: bold;
          color: #000000;
          text-transform: uppercase;
          border-bottom: 1px solid #000000;
          padding-bottom: 3px;
          margin-top: 14px;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .body-text {
          font-size: 10px;
          color: #000000;
          margin-bottom: 8px;
          line-height: 1.45;
        }
        .entry-block {
          margin-bottom: 12px;
        }
        .entry-dates {
          font-size: 10px;
          font-weight: normal;
          margin-bottom: 2px;
          color: #000000;
        }
        .entry-title {
          font-size: 10.5px;
          font-weight: bold;
          text-transform: uppercase;
          color: #000000;
          margin-bottom: 3px;
        }
        .entry-sub {
          font-size: 9.5px;
          color: #333333;
          margin-bottom: 4px;
        }
        .bullet-list {
          margin: 2px 0 0 16px;
          padding: 0;
        }
        .bullet-item {
          font-size: 10px;
          color: #000000;
          margin-bottom: 3px;
          line-height: 1.4;
        }
        .lang-mother-row {
          margin-bottom: 5px;
          font-size: 10px;
        }
        .lang-other-label {
          font-size: 10px;
          margin-bottom: 6px;
        }
        .lang-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          margin-bottom: 8px;
        }
        .lang-th-empty {
          width: 95px;
        }
        .lang-th-main {
          font-weight: bold;
          text-align: center;
          font-size: 9px;
          padding: 3px;
          text-transform: uppercase;
          color: #000000;
        }
        .lang-th-sub {
          text-align: center;
          font-size: 8.5px;
          padding: 3px;
          color: #000000;
          font-weight: normal;
          border-bottom: 1px solid #cccccc;
        }
        .lang-row {
          background-color: #9e3430;
          color: #ffffff;
        }
        .lang-cell {
          text-align: center;
          font-size: 10px;
          padding: 5px 3px;
          font-weight: bold;
          border: 1px solid #ffffff;
          color: #ffffff;
        }
        .lang-name-cell {
          text-align: left;
          padding-left: 8px;
          font-weight: bold;
          color: #ffffff;
          border: 1px solid #ffffff;
        }
        .lang-note {
          font-size: 8px;
          color: #555555;
          margin-top: 4px;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="top-row">
        <div class="photo-box">
          ${photo ? `<img src="${photo}" class="photo-img" alt="Photo" />` : `<div class="photo-placeholder"><span class="photo-initial">${initial}</span></div>`}
        </div>
        <div class="logo-container">
          <img src="${EUROPASS_LOGO_BASE64}" class="logo-img" alt="Europass" />
        </div>
      </div>

      <div class="name-container">
        <h1 class="name-text">${fullName}</h1>
      </div>

      <div class="info-block">
        <div class="info-row">
          ${dob ? `<span class="info-item"><span class="info-label">Date of birth: </span><span>${dob}</span></span>` : ''}
          ${dob && nationality ? `<span class="info-pipe">|</span>` : ''}
          ${nationality ? `<span class="info-item"><span class="info-label">Nationality: </span><span>${nationality}</span></span>` : ''}
          ${(dob || nationality) && phone ? `<span class="info-pipe">|</span>` : ''}
          ${phone ? `<span class="info-item"><span class="info-label">Phone number: </span><span>${phone}</span></span>` : ''}
        </div>
        ${address ? `
          <div class="info-row" style="margin-top: 2px;">
            <span class="info-item"><span class="info-label">Address: </span><span>${address}</span></span>
          </div>
        ` : ''}
        ${email ? `
          <div class="info-row" style="margin-top: 2px;">
            <span class="info-item"><span class="info-label">Email address: </span><span>${email}</span></span>
          </div>
        ` : ''}
        ${linkedin || website ? `
          <div class="info-row" style="margin-top: 2px;">
            ${linkedin ? `<span class="info-item"><span class="info-label">LinkedIn: </span><span>${linkedin}</span></span>` : ''}
            ${linkedin && website ? `<span class="info-pipe">|</span>` : ''}
            ${website ? `<span class="info-item"><span class="info-label">Website: </span><span>${website}</span></span>` : ''}
          </div>
        ` : ''}
      </div>

      ${(data.summary || data.headline) ? `
        <div class="sec-title">ABOUT ME</div>
        <div class="body-text">${data.summary || data.headline}</div>
      ` : ''}

      ${data.workEntries && data.workEntries.filter((e: any) => e.role || e.company || e.employer || e.duties).length > 0 ? `
        <div class="sec-title">WORK EXPERIENCE</div>
        ${data.workEntries.filter((e: any) => e.role || e.company || e.employer || e.duties).map((exp: any) => {
          const bullets = dutiesToBullets(exp.duties);
          const titleLine = [exp.role, exp.company || exp.employer].filter(Boolean).join(' - ');
          return `
            <div class="entry-block">
              ${exp.period || exp.dates ? `<div class="entry-dates">${exp.period || exp.dates}</div>` : ''}
              ${titleLine ? `<div class="entry-title">${titleLine}</div>` : ''}
              ${exp.location ? `<div class="entry-sub">${exp.location}</div>` : ''}
              ${bullets.length > 0 ? `
                <ul class="bullet-list">
                  ${bullets.map((b: string) => `<li class="bullet-item">${b}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `;
        }).join('')}
      ` : ''}

      ${data.eduEntries && data.eduEntries.filter((e: any) => e.qualification || e.institution).length > 0 ? `
        <div class="sec-title">EDUCATION AND TRAINING</div>
        ${data.eduEntries.filter((e: any) => e.qualification || e.institution).map((edu: any) => {
          const titleLine = [edu.qualification, edu.institution].filter(Boolean).join(' - ');
          const subjects = edu.fieldOfStudy ? edu.fieldOfStudy.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean) : [];
          return `
            <div class="entry-block">
              ${edu.dates ? `<div class="entry-dates">${edu.dates}</div>` : ''}
              ${titleLine ? `<div class="entry-title">${titleLine}</div>` : ''}
              ${edu.location ? `<div class="entry-sub">${edu.location}</div>` : ''}
              ${subjects.length > 0 ? `
                <div class="entry-sub" style="margin-top: 3px; font-weight: bold;">Relevant Subjects:</div>
                <ul class="bullet-list">
                  ${subjects.map((sub: string) => `<li class="bullet-item">${sub}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `;
        }).join('')}
      ` : ''}

      ${data.digitalSkills ? `
        <div class="sec-title">DIGITAL SKILLS</div>
        <div class="body-text">${toPipeSeparated(data.digitalSkills)}</div>
      ` : ''}

      ${communicationLine ? `
        <div class="sec-title">COMMUNICATION AND INTERPERSONAL SKILLS</div>
        <div class="body-text">${communicationLine}</div>
      ` : ''}

      <div class="sec-title">LANGUAGE SKILLS</div>
      <div class="lang-mother-row">
        <span>Mother Tongue(s): </span>
        <strong>${(data.motherTongue || 'English').toUpperCase()}</strong>
      </div>

      ${data.foreignLanguages && data.foreignLanguages.filter((l: any) => l.language).length > 0 ? `
        <div class="lang-other-label">Other language(s):</div>
        <table class="lang-table">
          <thead>
            <tr>
              <th class="lang-th-empty"></th>
              <th colspan="2" class="lang-th-main">UNDERSTANDING</th>
              <th colspan="2" class="lang-th-main">SPEAKING</th>
              <th class="lang-th-main">WRITING</th>
            </tr>
            <tr>
              <th class="lang-th-empty"></th>
              <th class="lang-th-sub">Listening</th>
              <th class="lang-th-sub">Reading</th>
              <th class="lang-th-sub">Spoken production</th>
              <th class="lang-th-sub">Spoken interaction</th>
              <th class="lang-th-sub">Writing</th>
            </tr>
          </thead>
          <tbody>
            ${data.foreignLanguages.filter((l: any) => l.language).map((l: any) => `
              <tr class="lang-row">
                <td class="lang-name-cell">${l.language}</td>
                <td class="lang-cell">${l.listening || 'B2'}</td>
                <td class="lang-cell">${l.reading || 'B2'}</td>
                <td class="lang-cell">${l.spokenProduction || 'B2'}</td>
                <td class="lang-cell">${l.spokenInteraction || 'B2'}</td>
                <td class="lang-cell">${l.writing || 'B2'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="lang-note">
          Levels: A1/A2: Basic user - B1/B2: Independent user - C1/C2: Proficient user - Common European Framework of Reference for Languages
        </div>
      ` : ''}

      ${data.certifications ? `
        <div class="sec-title">CERTIFICATES</div>
        <div class="body-text">${data.certifications}</div>
      ` : ''}

      ${data.hobbies ? `
        <div class="sec-title">ADDITIONAL INFORMATION</div>
        <div class="body-text">${data.hobbies}</div>
      ` : ''}

      ${data.drivingLicence ? `
        <div class="sec-title">DRIVING LICENCE</div>
        <div class="body-text">${data.drivingLicence}</div>
      ` : ''}
    </body>
    </html>
  `;
};

const compileVividSidebarHTML = (profile: any, data: any) => {
  const name = data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : '') || profile?.name || 'Applicant';
  const headline = data.headline || data.target_role || profile?.title || 'Professional';
  const email = data.email || profile?.email || '';
  const phone = data.phone || profile?.employee_profile?.phone_number || profile?.phone_number || profile?.phone || '';
  const location = data.location || data.address || profile?.location || '';
  const linkedin = data.linkedin || data.linkedinUrl || profile?.employee_profile?.linkedin_url || profile?.linkedinUrl || '';

  const skillsList = data.skills ? (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : data.skills) : (profile?.skills || []);
  const certList = data.certifications ? (typeof data.certifications === 'string' ? data.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : data.certifications) : [];
  const langList = data.languages ? (typeof data.languages === 'string' ? data.languages.split(',').map((s: string) => s.trim()).filter(Boolean) : data.languages) : [];

  const bulletsForDuties = (duties: string) => {
    return (duties || '').split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 12px; display: flex; min-height: 100vh; }
        .sidebar { width: 34%; background: #4f46e5; color: #ffffff; padding: 25px 15px; box-sizing: border-box; }
        .main { width: 66%; background: #ffffff; padding: 25px 20px; box-sizing: border-box; }
        .sb-name { font-size: 20px; font-weight: bold; color: #ffffff; margin-bottom: 4px; }
        .sb-role { font-size: 12px; color: #c7d2fe; font-weight: bold; margin-bottom: 20px; }
        .sb-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #a5b4fc; border-bottom: 1px solid #6366f1; padding-bottom: 3px; margin-top: 16px; margin-bottom: 8px; letter-spacing: 0.5px; }
        .sb-text { font-size: 10px; color: #e0e7ff; margin-bottom: 5px; word-break: break-word; }
        .main-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 3px; margin-top: 16px; margin-bottom: 10px; letter-spacing: 0.5px; }
        .summary-txt { font-size: 11px; color: #334155; line-height: 1.5; margin-bottom: 12px; }
        .job-block { margin-bottom: 12px; }
        .job-head { font-size: 11px; font-weight: bold; color: #0f172a; display: flex; justify-content: space-between; }
        .job-co { font-size: 10px; color: #4f46e5; font-weight: bold; margin: 2px 0 4px 0; }
        .bullet-list { margin: 4px 0 0 12px; padding: 0; }
        .bullet-item { font-size: 10px; color: #475569; margin-bottom: 2px; }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <div class="sb-name">${name}</div>
        <div class="sb-role">${headline}</div>
        
        <div class="sb-title">Contact Information</div>
        ${email ? `<div class="sb-text">✉ ${email}</div>` : ''}
        ${phone ? `<div class="sb-text">☎ ${phone}</div>` : ''}
        ${location ? `<div class="sb-text">📍 ${location}</div>` : ''}
        ${linkedin ? `<div class="sb-text">in ${linkedin}</div>` : ''}

        ${skillsList.length > 0 ? `
          <div class="sb-title">Core Skills</div>
          ${skillsList.map((s: string) => `<div class="sb-text">• ${s}</div>`).join('')}
        ` : ''}

        ${certList.length > 0 ? `
          <div class="sb-title">Certifications</div>
          ${certList.map((c: string) => `<div class="sb-text">• ${c}</div>`).join('')}
        ` : ''}

        ${langList.length > 0 ? `
          <div class="sb-title">Languages</div>
          ${langList.map((l: string) => `<div class="sb-text">• ${l}</div>`).join('')}
        ` : ''}
      </div>
      <div class="main">
        <div class="main-title">Professional Profile</div>
        <div class="summary-txt">
          ${data.summary || `${headline} with high track record of delivering revenue growth, client satisfaction, and strategy execution.`}
        </div>

        ${data.workEntries && data.workEntries.length > 0 ? `
          <div class="main-title">Work Experience</div>
          ${data.workEntries.map((exp: any) => `
            <div class="job-block">
              <div class="job-head">
                <span>${exp.role}</span>
                <span style="color: #64748b; font-size: 9px; font-weight: normal;">${exp.period}</span>
              </div>
              <div class="job-co">${exp.company}</div>
              <ul class="bullet-list">
                ${bulletsForDuties(exp.duties).map(b => `<li class="bullet-item">${b}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        ` : ''}

        ${data.education ? `
          <div class="main-title">Education</div>
          <div class="summary-txt">${data.education}</div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

const compileMinimalistHTML = (profile: any, data: any) => {
  const name = data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : '') || profile?.name || 'Applicant';
  const headline = data.headline || data.target_role || profile?.title || 'Professional';
  const email = data.email || profile?.email || '';
  const phone = data.phone || profile?.employee_profile?.phone_number || profile?.phone_number || profile?.phone || '';
  const location = data.location || data.address || profile?.location || '';
  const linkedin = data.linkedin || data.linkedinUrl || profile?.employee_profile?.linkedin_url || profile?.linkedinUrl || '';

  const skillsList = data.skills ? (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : data.skills) : (profile?.skills || []);

  const bulletsForDuties = (duties: string) => {
    return (duties || '').split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 0; padding: 30px; font-size: 12px; line-height: 1.5; }
        .hdr { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 18px; }
        .name { font-size: 24px; font-weight: bold; color: #111827; letter-spacing: -0.5px; }
        .role { font-size: 12px; font-weight: bold; color: #10b981; margin-top: 3px; }
        .meta { display: flex; justify-content: center; gap: 12px; font-size: 10px; color: #6b7280; margin-top: 6px; }
        .sec-h { font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase; letter-spacing: 1px; margin-top: 16px; margin-bottom: 6px; }
        .job-b { margin-bottom: 10px; }
        .job-h { display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; }
        .job-c { font-size: 10px; color: #059669; font-weight: 600; margin: 2px 0 3px 0; }
        .bullets { margin: 3px 0 0 12px; padding: 0; }
        .b-item { font-size: 10px; color: #374151; margin-bottom: 2px; }
        .sk-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .sk-chip { background: #ecfdf5; color: #047857; font-size: 9px; font-weight: bold; padding: 3px 7px; border-radius: 4px; border: 1px solid #a7f3d0; }
      </style>
    </head>
    <body>
      <div class="hdr">
        <div class="name">${name}</div>
        <div class="role">${headline}</div>
        <div class="meta">
          ${email ? `<span>✉ ${email}</span>` : ''}
          ${phone ? `<span>☎ ${phone}</span>` : ''}
          ${location ? `<span>📍 ${location}</span>` : ''}
          ${linkedin ? `<span>in ${linkedin}</span>` : ''}
        </div>
      </div>

      <div class="sec-h">Professional Summary</div>
      <div style="font-size: 11px; color: #374151; line-height: 1.5;">
        ${data.summary || `${headline} dedicated to operational excellence, client management, and strategic execution.`}
      </div>

      ${data.workEntries && data.workEntries.length > 0 ? `
        <div class="sec-h">Work History</div>
        ${data.workEntries.map((exp: any) => `
          <div class="job-b">
            <div class="job-h"><span>${exp.role}</span><span style="color: #9ca3af; font-weight: normal; font-size: 9px;">${exp.period}</span></div>
            <div class="job-c">${exp.company}</div>
            <ul class="bullets">
              ${bulletsForDuties(exp.duties).map(b => `<li class="b-item">${b}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      ` : ''}

      ${skillsList.length > 0 ? `
        <div class="sec-h">Core Competencies & Skills</div>
        <div class="sk-row">
          ${skillsList.map((sk: string) => `<span class="sk-chip">${sk}</span>`).join('')}
        </div>
      ` : ''}

      ${data.education ? `
        <div class="sec-h">Education</div>
        <div style="font-size: 11px; color: #374151;">${data.education}</div>
      ` : ''}
    </body>
    </html>
  `;
};

const compileDarkGreenHTML = (profile: any, data: any) => {
  return compileStandardHTML(profile, { ...data, themeColor: '#1A3C2A' });
};

const compileCrimsonHTML = (profile: any, data: any) => {
  return compileStandardHTML(profile, { ...data, themeColor: '#8B1A1A' });
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

const TEMPLATES = [
  { id: 'steelblue',  name: 'Steel Blue Banner', color: '#1B4F8A' },
  { id: 'vivid',      name: 'Vivid Sidebar',     color: '#6366F1' },
  { id: 'minimalist', name: 'Minimalist White',  color: '#10B981' },
  { id: 'darkgreen',  name: 'Dark Green Pro',    color: '#1A3C2A' },
  { id: 'crimson',    name: 'Crimson Banner',    color: '#8B1A1A' },
];

export default function CVWizardModal({ visible, onClose, templateType, onSuccess, prefilledHeadline, job }: CVWizardModalProps) {
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const isEuropass = templateType === 'europass';
  const totalSteps = isEuropass ? (job ? 7 : 6) : (job ? 5 : 4);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(isEuropass ? 'europass' : 'steelblue');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(isEuropass ? 'Europass Classic' : 'Steel Blue Banner');

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
  const [passportImage, setPassportImage] = useState<string | null>(null);
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

  const pickPassportImage = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to select a passport photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPassportImage(imageUri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.error('Error picking passport photo:', e);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const getCompiledHTML = () => {
    const rawData = isEuropass ? {
      firstName, lastName, dateOfBirth, nationality, address, phone, email, linkedinUrl, website, summary,
      workEntries, eduEntries, motherTongue, foreignLanguages, digitalSkills,
      communicationCompetencies, organisationalCompetencies, jobRelatedCompetencies, otherCompetencies, drivingLicence, certifications, hobbies,
      passportImage
    } : {
      headline, education, skills, languages, certifications, strengths, workEntries, summary
    };

    // SECURITY (QH-21): every template below builds HTML by direct string
    // interpolation, and the result is handed to a WebView and to
    // Print.printToFileAsync. Escaping here — at the single point where the
    // data enters the templates — covers all six of them at once, including
    // fields populated from a parsed resume rather than typed by the user.
    // sanitizeForHtml walks nested objects and arrays, so workEntries and
    // eduEntries are covered too.
    const data = sanitizeForHtml(rawData) as any;
    if (rawData.passportImage) {
      data.passportImage = rawData.passportImage;
    }
    const safeProfile = sanitizeForHtml(profile) as any;

    switch (selectedTemplateId) {
      case 'europass':
        return compileEuropassHTML(safeProfile, data);
      case 'vivid':
        return compileVividSidebarHTML(safeProfile, data);
      case 'minimalist':
        return compileMinimalistHTML(safeProfile, data);
      case 'darkgreen':
        return compileDarkGreenHTML(safeProfile, data);
      case 'crimson':
        return compileCrimsonHTML(safeProfile, data);
      case 'steelblue':
      default:
        return compileStandardHTML(safeProfile, data);
    }
  };

  // Load profile data to prefill details
  useEffect(() => {
    if (visible) {
      setStep(1);
      setLoading(true);
      if (isEuropass) {
        setSelectedTemplateId('europass');
        setSelectedTemplateName('Europass Official');
      }
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
          const photoUri = u.avatar_url || u.avatar || ep.avatar_url || ep.passport_photo_url || null;
          if (photoUri) {
            setPassportImage(prev => prev || photoUri);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [visible, prefilledHeadline, isEuropass]);

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
      setIsStepping(true);
      setTimeout(() => {
        setIsStepping(false);
        setStep(step + 1);
      }, 350);
    } else {
      generateAndSaveCV();
    }
  };

  const generateAndSaveCV = async () => {
    setLoading(true);
    try {
      const htmlContent = getCompiledHTML();

      // Generate PDF locally on device with base64: true directly from native engine
      const printResult = await Print.printToFileAsync({
        html: htmlContent,
        base64: true,
      });

      let base64Pdf = printResult.base64 || '';
      if (!base64Pdf && printResult.uri) {
        try {
          base64Pdf = await FileSystem.readAsStringAsync(printResult.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (_readErr) {
          console.warn('[CV Wizard] Base64 conversion fallback warning:', _readErr);
        }
      }

      // Save structure to Django backend
      await apiFetch('/cv/save/', {
        method: 'POST',
        body: JSON.stringify({
          template_id: selectedTemplateId,
          template_name: selectedTemplateName,
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Generation Failed',
        'Something went wrong saving your CV. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: generateAndSaveCV }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <Animated.View
            entering={SlideInDown.springify().damping(24).mass(0.8)}
            exiting={SlideOutDown}
            style={[
              s.sheet,
              {
                backgroundColor: colors.cardBg,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {/* Seamless bottom background fill to cover safe area and prevent any gap */}
            <View style={[s.bottomFill, { backgroundColor: colors.cardBg }]} />

            {/* Grab handle indicator */}
            <View style={s.handleContainer}>
              <View style={s.handle} />
            </View>

            {/* Header */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="zap" size={16} color={Palette.accent600} />
                <Text style={[s.headerTitle, { color: colors.text }]}>
                  {isEuropass ? 'Europass CV Wizard' : 'Standard CV Wizard'}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                style={{ padding: 4 }}
              >
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
              <ScrollView
                style={s.body}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: 20,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
              >
              
              {/* ── STANDARD FLOW STEPS ── */}
              {!isEuropass && (
                <>
                  {step === 1 && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Target Role</Text>

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
                            <Text style={[s.label, { color: colors.textSecondary }]}>Responsibilities / Achievements</Text>
                            <TextInput
                              value={entry.duties}
                              onChangeText={t => updateWorkEntry(index, 'duties', t)}
                              placeholder="Responsibilities / Achievements"
                              placeholderTextColor={colors.textMuted}
                              multiline
                              style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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
                </>
              )}

              {/* ── EUROPE (EUROPASS) FLOW STEPS ── */}
              {isEuropass && (
                <>
                  {step === 1 && (
                    <Animated.View entering={FadeIn} style={s.stepContainer}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Personal Details</Text>
                      
                      {/* Passport Photo Upload UI */}
                      <View style={s.photoUploadContainer}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Passport Photo</Text>
                        <View style={s.photoPickerCenter}>
                          <Pressable
                            onPress={pickPassportImage}
                            style={[
                              s.photoCircle,
                              {
                                borderColor: passportImage ? Palette.accent500 : colors.border,
                                backgroundColor: colors.cardBg,
                              },
                            ]}
                          >
                            {passportImage ? (
                              <Image
                                source={{ uri: passportImage }}
                                style={s.photoImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={s.photoPlaceholder}>
                                <Feather name="camera" size={26} color={Palette.accent600} />
                                <Text style={[s.photoPlaceholderText, { color: Palette.accent600 }]}>Add Photo</Text>
                              </View>
                            )}
                          </Pressable>

                          {passportImage ? (
                            <View style={s.photoActionsRow}>
                              <Pressable onPress={pickPassportImage} style={s.photoActionBtn}>
                                <Feather name="refresh-cw" size={12} color={Palette.accent600} />
                                <Text style={[s.photoActionText, { color: Palette.accent600 }]}>Change</Text>
                              </Pressable>
                              <Text style={{ color: colors.border }}>|</Text>
                              <Pressable onPress={() => setPassportImage(null)} style={s.photoActionBtn}>
                                <Feather name="trash-2" size={12} color={Palette.red500} />
                                <Text style={[s.photoActionText, { color: Palette.red500 }]}>Remove</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <Text style={[s.photoHintText, { color: colors.textMuted }]}>
                              Tap circle to upload a passport photo
                            </Text>
                          )}
                        </View>
                      </View>

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
                          style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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
                            <Text style={[s.label, { color: colors.textSecondary }]}>Responsibilities / Duties / Projects</Text>
                            <TextInput
                              value={entry.duties}
                              onChangeText={t => updateWorkEntry(index, 'duties', t)}
                              placeholder="Responsibilities / Duties / Projects"
                              placeholderTextColor={colors.textMuted}
                              multiline
                              style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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

                      <View style={{ ...s.inputRow, marginTop: 10 }}>
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
                          style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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
                          style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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
                          style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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
                          style={[s.input, { borderColor: colors.border, color: colors.text }, s.textArea]}
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
                </>
              )}

              {/* ── COMMON PREVIEW & TEMPLATE SELECTION STEP (FOR ALL FLOWS) ── */}
              {step === totalSteps && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                  <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 4 }]}>
                    {job ? 'Final Application Review' : 'Preview & Save CV'}
                  </Text>
                  
                  {/* Cover Letter Section for Job Applications */}
                  {job && (
                    <View style={s.inputRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Feather name="file-text" size={15} color={Palette.accent600} />
                        <Text style={[s.label, { color: colors.text, fontSize: 13 }]}>Tailored Letterhead Cover Letter</Text>
                      </View>
                      <Text style={[s.sectionSub, { color: colors.textSecondary, marginBottom: 8 }]}>
                        Generated cover letter for the position at {job.companyName || 'the target organisation'}. Customize it below:
                      </Text>
                      <TextInput
                        value={coverLetter}
                        onChangeText={setCoverLetter}
                        multiline
                        numberOfLines={7}
                        style={[s.textArea, { borderColor: colors.border, color: colors.text, height: 160 }]}
                      />
                    </View>
                  )}

                  {/* Template Switcher Bar (Standard CV only) */}
                  {!isEuropass && (
                    <View style={{ marginTop: 4, marginBottom: 6 }}>
                      <Text style={[s.label, { color: colors.textSecondary, marginBottom: 6 }]}>
                        Change CV Design Template
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {TEMPLATES.map((tmpl) => {
                          const isSelected = selectedTemplateId === tmpl.id;
                          return (
                            <Pressable
                              key={tmpl.id}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedTemplateId(tmpl.id);
                                setSelectedTemplateName(tmpl.name);
                              }}
                              style={[
                                s.templatePill,
                                { borderColor: tmpl.color },
                                isSelected && { backgroundColor: tmpl.color }
                              ]}
                            >
                              <View style={[s.templateDot, { backgroundColor: isSelected ? '#ffffff' : tmpl.color }]} />
                              <Text style={[s.templatePillText, { color: isSelected ? '#ffffff' : tmpl.color }]}>
                                {tmpl.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Tailored CV Preview */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[s.label, { color: colors.textSecondary, marginBottom: 6 }]}>
                      Tailored CV Preview ({isEuropass ? 'Europass Official Format' : selectedTemplateName})
                    </Text>
                    <View style={[s.previewContainer, { borderColor: colors.border, backgroundColor: '#fff', height: 290 }]}>
                      <WebView
                        key={selectedTemplateId}
                        originWhitelist={['*']}
                        source={{ html: getCompiledHTML() }}
                        style={{ flex: 1 }}
                        scalesPageToFit={true}
                        // QH-21: the CV preview is static markup — it needs no
                        // scripting and should not follow links or load remote
                        // content, so the surface is closed down here too.
                        javaScriptEnabled={false}
                        allowFileAccess={false}
                        allowFileAccessFromFileURLs={false}
                        allowUniversalAccessFromFileURLs={false}
                      />
                      {/* Absolute overlay to intercept touches and prevent clicking/scrolling */}
                      <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} />
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Action Buttons */}
              <View style={s.actionRow}>
                {step > 1 && (
                  <Pressable onPress={() => setStep(step - 1)} style={[s.prevBtn, { borderColor: colors.border }]}>
                    <Text style={[s.prevBtnText, { color: colors.text }]}>Back</Text>
                  </Pressable>
                )}
                <Pressable
                  disabled={loading || isStepping}
                  onPress={handleNext}
                  style={({ pressed }) => [
                    s.nextBtn,
                    { backgroundColor: Palette.accent600 },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={s.nextBtnText}>Saving...</Text>
                    </View>
                  ) : isStepping ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={s.nextBtnText}>Next...</Text>
                    </View>
                  ) : (
                    <Text style={s.nextBtnText}>
                      {step === totalSteps ? (job ? 'Save CV & Apply' : 'Save CV to Profile') : 'Continue'}
                    </Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    margin: 0,
    padding: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: SCREEN_H * 0.88,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingTop: 4,
    marginBottom: 0,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 24,
  },
  bottomFill: {
    position: 'absolute',
    bottom: -300,
    left: 0,
    right: 0,
    height: 300,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.neutral300,
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
    width: '100%',
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
  templatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  templateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  templatePillText: {
    fontSize: 11,
    fontWeight: '800',
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
    minHeight: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
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
    minHeight: 40,
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
    minHeight: 44,
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
    minHeight: 44,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  photoUploadContainer: {
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  photoPickerCenter: {
    alignItems: 'center',
    gap: 6,
  },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoPlaceholderText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  photoHintText: {
    fontSize: 11,
  },
});

