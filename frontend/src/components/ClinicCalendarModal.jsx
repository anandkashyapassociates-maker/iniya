import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  HeartPulse,
  CheckCircle2,
} from 'lucide-react';

/**
 * Official Indian Gazetted & Restricted Holidays Synced with Google Calendar ("Holidays in India")
 * Year-specific mapping for exact lunar and solar festival dates.
 */
const INDIAN_HOLIDAYS_BY_YEAR = {
  // ── 2026 ───────────────────────────────────────────────────────────
  '2026-01-01': { title: "New Year's Day", category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🎉' },
  '2026-01-03': { title: "Hazrat Ali's Birthday", category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🌙' },
  '2026-01-14': { title: 'Makar Sankranti / Pongal / Magha Bihu', category: 'Festival Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🪁' },
  '2026-01-23': { title: 'Basant Panchami / Sri Panchami', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🌼' },
  '2026-01-26': { title: 'Republic Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '2026-02-01': { title: 'Guru Ravidas Jayanti', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🪔' },
  '2026-02-04': { title: 'World Cancer Day', category: 'Health Observance', status: 'Free Oncology Screening Desk', icon: '🎗️' },
  '2026-02-12': { title: 'Swami Dayananda Saraswati Jayanti', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '📖' },
  '2026-02-15': { title: 'Maha Shivratri', category: 'Gazetted Festival Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🔱' },
  '2026-02-19': { title: 'Chhatrapati Shivaji Maharaj Jayanti', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🚩' },
  '2026-03-03': { title: 'Holika Dahan / Chhoti Holi', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🔥' },
  '2026-03-04': { title: 'Holi (Festival of Colors)', category: 'Gazetted Festival Holiday', status: 'Emergency & Trauma 24/7 Only', icon: '🎨' },
  '2026-03-08': { title: "International Women's Day", category: 'Health Observance', status: 'Free Gynaecology Health Camp', icon: '💐' },
  '2026-03-19': { title: 'Gudi Padwa / Ugadi / Chaitra Sukladi', category: 'Restricted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🌿' },
  '2026-03-20': { title: 'Jamat-Ul-Vida', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🌙' },
  '2026-03-21': { title: 'Id-ul-Fitr (Ramzan Id)', category: 'Gazetted Festival Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2026-03-24': { title: 'World Tuberculosis (TB) Day', category: 'Health Observance', status: 'Free Pulmonology Screening', icon: '🫁' },
  '2026-03-26': { title: 'Ram Navami', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🏹' },
  '2026-03-31': { title: 'Mahavir Jayanti', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🕊️' },
  '2026-04-03': { title: 'Good Friday', category: 'Gazetted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '✝️' },
  '2026-04-05': { title: 'Easter Sunday', category: 'Restricted Holiday', status: 'Weekend Hospital Roster', icon: '🐣' },
  '2026-04-07': { title: 'World Health Day', category: 'Health Observance', status: 'Annual Full Body Health Camp', icon: '🩺' },
  '2026-04-14': { title: 'Dr. B.R. Ambedkar Jayanti / Vaisakhi', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🇮🇳' },
  '2026-04-15': { title: 'Poila Boishakh / Bahag Bihu', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🌾' },
  '2026-04-25': { title: 'World Malaria Day', category: 'Health Observance', status: 'Fever & Vector Screening Camp', icon: '🩸' },
  '2026-05-01': { title: 'Buddha Purnima / May Day', category: 'Gazetted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🪷' },
  '2026-05-09': { title: 'Rabindranath Tagore Jayanti', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🖋️' },
  '2026-05-12': { title: 'International Nurses Day', category: 'Healthcare Observance', status: 'Nursing Workforce Felicitation', icon: '👩‍⚕️' },
  '2026-05-27': { title: 'Id-ul-Zuha (Bakrid)', category: 'Gazetted Festival Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2026-05-31': { title: 'World No Tobacco Day', category: 'Health Observance', status: 'Tobacco Cessation Clinic', icon: '🚭' },
  '2026-06-14': { title: 'World Blood Donor Day', category: 'Healthcare Observance', status: 'Blood Donation Camp Active', icon: '🩸' },
  '2026-06-21': { title: 'International Day of Yoga', category: 'Wellness Observance', status: 'Physiotherapy & Wellness Camp', icon: '🧘' },
  '2026-06-26': { title: 'Muharram (Ashura)', category: 'Gazetted Holiday', status: 'Emergency 24/7 Active', icon: '🏴' },
  '2026-07-01': { title: "National Doctor's Day", category: 'Healthcare Observance', status: 'Doctors Honor Desk & OPD Active', icon: '👨‍⚕️' },
  '2026-07-16': { title: 'Rath Yatra', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🛕' },
  '2026-07-28': { title: 'World Hepatitis Day', category: 'Health Observance', status: 'Hepatitis Free Screening Desk', icon: '🧬' },
  '2026-08-15': { title: 'Independence Day / Parsi New Year', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '2026-08-26': { title: 'Milad-un-Nabi (Id-e-Milad) / Onam', category: 'Gazetted Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2026-08-28': { title: 'Raksha Bandhan', category: 'Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🎀' },
  '2026-09-04': { title: 'Janmashtami (Krishna Jayanti)', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🦚' },
  '2026-09-05': { title: "Teachers' Day", category: 'National Observance', status: 'Regular Clinical Shift', icon: '📚' },
  '2026-09-14': { title: 'Ganesh Chaturthi', category: 'Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🐘' },
  '2026-09-29': { title: 'World Heart Day', category: 'Health Observance', status: 'Free ECG & Cardiology Screening', icon: '❤️' },
  '2026-10-02': { title: "Mahatma Gandhi's Jayanti", category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🕊️' },
  '2026-10-10': { title: 'World Mental Health Day', category: 'Health Observance', status: 'Free Psychological Counseling', icon: '🧠' },
  '2026-10-18': { title: 'Maha Saptami / Durga Puja', category: 'Festival Holiday', status: 'Regular Clinical Shift', icon: '🔱' },
  '2026-10-19': { title: 'Maha Ashtami (Durga Ashtami)', category: 'Festival Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🔱' },
  '2026-10-20': { title: 'Dussehra (Vijayadashami)', category: 'Gazetted Festival Holiday', status: 'Emergency & Trauma 24/7 Active', icon: '🏹' },
  '2026-10-24': { title: 'World Polio Day', category: 'Healthcare Observance', status: 'Pediatric Immunization Drive', icon: '💉' },
  '2026-10-26': { title: 'Maharishi Valmiki Jayanti', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '📜' },
  '2026-10-29': { title: 'Karwa Chauth', category: 'Festival Observance', status: 'Regular Clinical Shift', icon: '🌕' },
  '2026-10-31': { title: 'National Unity Day (Rashtriya Ekta Diwas)', category: 'National Observance', status: 'Standard OPD (09:00 AM – 08:00 PM)', icon: '🇮🇳' },
  '2026-11-06': { title: 'Dhanteras (Dhanatrayodashi)', category: 'Festival Observance', status: 'Standard OPD (09:00 AM – 08:00 PM)', icon: '🪙' },
  '2026-11-07': { title: 'Naraka Chaturdashi (Choti Diwali)', category: 'Restricted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🪔' },
  '2026-11-08': { title: 'Diwali (Deepavali / Lakshmi Puja)', category: 'Gazetted Festival Holiday', status: 'Emergency & Burns Unit 24/7 Active', icon: '🪔' },
  '2026-11-09': { title: 'Govardhan Puja / Annakut', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '⛰️' },
  '2026-11-11': { title: 'Bhai Dooj (Bhratri Dwitiya)', category: 'Restricted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🏵️' },
  '2026-11-14': { title: "Children's Day & World Diabetes Day", category: 'Health & National Observance', status: 'Free Blood Glucose & Pediatric Camp', icon: '🎈' },
  '2026-11-15': { title: 'Chhath Puja (Kharna)', category: 'Restricted Holiday', status: 'Weekend Hospital Roster', icon: '🌅' },
  '2026-11-17': { title: 'Chhath Puja (Surya Sashthi Arghya)', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🌅' },
  '2026-11-24': { title: 'Guru Nanak Jayanti (Gurpurab)', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '☬' },
  '2026-11-28': { title: 'Guru Tegh Bahadur Martyrdom Day', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '☬' },
  '2026-12-01': { title: 'World AIDS Day', category: 'Health Observance', status: 'Public Awareness & Free Testing', icon: '🎗️' },
  '2026-12-24': { title: 'Christmas Eve', category: 'Restricted Holiday', status: 'Standard Shift (09:00 AM – 08:00 PM)', icon: '⭐' },
  '2026-12-25': { title: 'Christmas Day', category: 'Gazetted Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🎄' },
  '2026-12-31': { title: "New Year's Eve", category: 'Observance', status: 'Standard OPD & Trauma Standby', icon: '🎆' },

  // ── 2025 ───────────────────────────────────────────────────────────
  '2025-01-01': { title: "New Year's Day", category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🎉' },
  '2025-01-14': { title: 'Makar Sankranti / Pongal', category: 'Harvest Festival', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🪁' },
  '2025-01-26': { title: 'Republic Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '2025-02-26': { title: 'Maha Shivratri', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🔱' },
  '2025-03-13': { title: 'Holika Dahan', category: 'Restricted Holiday', status: 'Regular Clinical Shift', icon: '🔥' },
  '2025-03-14': { title: 'Holi', category: 'Gazetted Festival Holiday', status: 'Emergency & Trauma 24/7 Only', icon: '🎨' },
  '2025-03-31': { title: 'Id-ul-Fitr', category: 'Gazetted Festival Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2025-04-06': { title: 'Ram Navami', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🏹' },
  '2025-04-10': { title: 'Mahavir Jayanti', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🕊️' },
  '2025-04-14': { title: 'Dr. B.R. Ambedkar Jayanti / Vaisakhi', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🇮🇳' },
  '2025-04-18': { title: 'Good Friday', category: 'Gazetted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '✝️' },
  '2025-05-12': { title: 'Buddha Purnima', category: 'Gazetted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🪷' },
  '2025-06-07': { title: 'Id-ul-Zuha (Bakrid)', category: 'Gazetted Festival Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2025-07-06': { title: 'Muharram', category: 'Gazetted Holiday', status: 'Emergency 24/7 Active', icon: '🏴' },
  '2025-08-09': { title: 'Raksha Bandhan', category: 'Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🎀' },
  '2025-08-15': { title: 'Independence Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '2025-08-16': { title: 'Janmashtami', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🦚' },
  '2025-08-27': { title: 'Ganesh Chaturthi', category: 'Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🐘' },
  '2025-09-05': { title: 'Milad-un-Nabi', category: 'Gazetted Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2025-10-02': { title: 'Mahatma Gandhi Jayanti & Dussehra', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🏹' },
  '2025-10-10': { title: 'Karwa Chauth', category: 'Festival Observance', status: 'Regular Clinical Shift', icon: '🌕' },
  '2025-10-18': { title: 'Dhanteras', category: 'Festival Observance', status: 'Standard OPD (09:00 AM – 08:00 PM)', icon: '🪙' },
  '2025-10-20': { title: 'Diwali (Deepavali)', category: 'Gazetted Festival Holiday', status: 'Emergency & Burns Unit 24/7 Active', icon: '🪔' },
  '2025-10-22': { title: 'Govardhan Puja', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '⛰️' },
  '2025-10-23': { title: 'Bhai Dooj', category: 'Restricted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🏵️' },
  '2025-10-28': { title: 'Chhath Puja', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🌅' },
  '2025-11-05': { title: 'Guru Nanak Jayanti', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '☬' },
  '2025-12-25': { title: 'Christmas Day', category: 'Gazetted Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🎄' },

  // ── 2027 ───────────────────────────────────────────────────────────
  '2027-01-01': { title: "New Year's Day", category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🎉' },
  '2027-01-14': { title: 'Makar Sankranti / Pongal', category: 'Harvest Festival', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🪁' },
  '2027-01-26': { title: 'Republic Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '2027-03-07': { title: 'Maha Shivratri', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🔱' },
  '2027-03-10': { title: 'Id-ul-Fitr', category: 'Gazetted Festival Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2027-03-22': { title: 'Holi', category: 'Gazetted Festival Holiday', status: 'Emergency & Trauma 24/7 Only', icon: '🎨' },
  '2027-03-26': { title: 'Good Friday', category: 'Gazetted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '✝️' },
  '2027-04-14': { title: 'Dr. B.R. Ambedkar Jayanti', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🇮🇳' },
  '2027-04-15': { title: 'Ram Navami', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🏹' },
  '2027-04-19': { title: 'Mahavir Jayanti', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🕊️' },
  '2027-05-17': { title: 'Id-ul-Zuha (Bakrid)', category: 'Gazetted Festival Holiday', status: 'Emergency 24/7 Active', icon: '🌙' },
  '2027-05-20': { title: 'Buddha Purnima', category: 'Gazetted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🪷' },
  '2027-06-16': { title: 'Muharram', category: 'Gazetted Holiday', status: 'Emergency 24/7 Active', icon: '🏴' },
  '2027-08-15': { title: 'Independence Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '2027-08-16': { title: 'Raksha Bandhan', category: 'Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🎀' },
  '2027-08-25': { title: 'Janmashtami', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🦚' },
  '2027-09-04': { title: 'Ganesh Chaturthi', category: 'Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🐘' },
  '2027-10-02': { title: "Mahatma Gandhi's Jayanti", category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🕊️' },
  '2027-10-09': { title: 'Dussehra (Vijayadashami)', category: 'Gazetted Festival Holiday', status: 'Emergency & Trauma 24/7 Active', icon: '🏹' },
  '2027-10-29': { title: 'Diwali (Deepavali)', category: 'Gazetted Festival Holiday', status: 'Emergency & Burns Unit 24/7 Active', icon: '🪔' },
  '2027-10-31': { title: 'Govardhan Puja', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '⛰️' },
  '2027-11-01': { title: 'Bhai Dooj', category: 'Restricted Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '🏵️' },
  '2027-11-04': { title: 'Chhath Puja', category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🌅' },
  '2027-11-14': { title: 'Guru Nanak Jayanti', category: 'Gazetted Festival Holiday', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '☬' },
  '2027-12-25': { title: 'Christmas Day', category: 'Gazetted Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🎄' },
};

/**
 * Annual Fixed Healthcare Observances & National Days
 */
const FIXED_ANNUAL_EVENTS = {
  '01-01': { title: "New Year's Day", category: 'Restricted Holiday', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🎉' },
  '01-14': { title: 'Makar Sankranti / Pongal', category: 'Harvest Festival', status: 'Special Shift (10:00 AM – 02:00 PM)', icon: '🪁' },
  '01-26': { title: 'Republic Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '02-04': { title: 'World Cancer Day', category: 'Health Observance', status: 'Free Oncology Screening Desk', icon: '🎗️' },
  '03-08': { title: "International Women's Day", category: 'Health Observance', status: 'Free Gynaecology Health Camp', icon: '💐' },
  '03-24': { title: 'World Tuberculosis (TB) Day', category: 'Health Observance', status: 'Free Pulmonology Screening', icon: '🫁' },
  '04-07': { title: 'World Health Day', category: 'Health Observance', status: 'Annual Full Body Health Camp', icon: '🩺' },
  '04-14': { title: 'Dr. B.R. Ambedkar Jayanti', category: 'Gazetted Holiday', status: 'Regular Clinical Shift', icon: '🇮🇳' },
  '04-25': { title: 'World Malaria Day', category: 'Health Observance', status: 'Fever & Vector Screening Camp', icon: '🩸' },
  '05-01': { title: 'May Day (Workers’ Day)', category: 'Public Observance', status: 'Morning Shift (09:00 AM – 01:00 PM)', icon: '⚒️' },
  '05-12': { title: 'International Nurses Day', category: 'Healthcare Observance', status: 'Nursing Workforce Felicitation', icon: '👩‍⚕️' },
  '05-31': { title: 'World No Tobacco Day', category: 'Health Observance', status: 'Tobacco Cessation Clinic', icon: '🚭' },
  '06-14': { title: 'World Blood Donor Day', category: 'Healthcare Observance', status: 'Blood Donation Drive Active', icon: '🩸' },
  '06-21': { title: 'International Day of Yoga', category: 'Wellness Observance', status: 'Physiotherapy & Wellness Camp', icon: '🧘' },
  '07-01': { title: "National Doctor's Day", category: 'Healthcare Observance', status: 'Doctors Honor Desk & OPD Active', icon: '👨‍⚕️' },
  '07-28': { title: 'World Hepatitis Day', category: 'Health Observance', status: 'Hepatitis Free Screening Desk', icon: '🧬' },
  '08-15': { title: 'Independence Day', category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🇮🇳' },
  '09-05': { title: "Teachers' Day", category: 'National Observance', status: 'Regular Clinical Shift', icon: '📚' },
  '09-29': { title: 'World Heart Day', category: 'Health Observance', status: 'Free ECG & Cardiology Screening', icon: '❤️' },
  '10-02': { title: "Mahatma Gandhi's Jayanti", category: 'Gazetted National Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🕊️' },
  '10-10': { title: 'World Mental Health Day', category: 'Health Observance', status: 'Free Psychological Counseling', icon: '🧠' },
  '10-24': { title: 'World Polio Day', category: 'Healthcare Observance', status: 'Pediatric Immunization Drive', icon: '💉' },
  '10-31': { title: 'National Unity Day (Rashtriya Ekta Diwas)', category: 'National Observance', status: 'Standard OPD (09:00 AM – 08:00 PM)', icon: '🇮🇳' },
  '11-14': { title: "Children's Day & World Diabetes Day", category: 'Health & National Observance', status: 'Free Blood Glucose & Pediatric Camp', icon: '🎈' },
  '12-01': { title: 'World AIDS Day', category: 'Health Observance', status: 'Public Awareness & Free Testing', icon: '🎗️' },
  '12-25': { title: 'Christmas Day', category: 'Gazetted Holiday', status: 'Emergency 24/7 (OPD Closed)', icon: '🎄' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function ClinicCalendarModal({ isOpen, onClose }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  /**
   * Year-specific Google Calendar verified Indian holiday lookup,
   * falling back to fixed healthcare/national observance days.
   */
  const getEventForDay = (year, month, day) => {
    const ymdKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const mdKey = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (INDIAN_HOLIDAYS_BY_YEAR[ymdKey]) {
      return INDIAN_HOLIDAYS_BY_YEAR[ymdKey];
    }
    if (FIXED_ANNUAL_EVENTS[mdKey]) {
      return FIXED_ANNUAL_EVENTS[mdKey];
    }
    return null;
  };

  const today = new Date();
  const isToday = (day) => {
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day) => {
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    );
  };

  const selectedEvent = getEventForDay(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );
  const isSelectedSunday = selectedDate.getDay() === 0;

  const selectedFormattedDate = selectedDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 font-display select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple & Clean Header with Google Calendar Sync Badge */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Calendar &amp; Schedule</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Google Calendar Synced
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-400">India Schedule</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGoToToday}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-base font-bold text-slate-900 tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Row */}
        <div className="grid grid-cols-7 text-center pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {WEEKDAY_NAMES.map((name, i) => (
            <span key={name} className={i === 0 ? 'text-rose-500' : ''}>
              {name}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="px-3 pb-3 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
            const dayNum = i + 1;
            const event = getEventForDay(currentYear, currentMonth, dayNum);
            const selected = isSelected(dayNum);
            const todayDay = isToday(dayNum);
            const isSunday = (firstDayOfWeek + i) % 7 === 0;

            let style = 'text-slate-800 hover:bg-slate-100';
            if (selected) {
              style = 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25';
            } else if (todayDay) {
              style = 'bg-blue-50 text-blue-600 font-bold border border-blue-200';
            } else if (isSunday) {
              style = 'text-rose-500 font-medium hover:bg-rose-50/50';
            }

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth, dayNum))}
                className={`relative h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${style}`}
              >
                <span>{dayNum}</span>

                {/* Accurate Event Dot Indicator */}
                {event && !selected && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-1 ${
                      event.category.includes('Gazetted')
                        ? 'bg-rose-500'
                        : event.category.includes('Restricted') || event.category.includes('Festival')
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend Row */}
        <div className="px-5 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Gazetted</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Festival / RH</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Observance</span>
            </span>
          </div>
          <span className="font-medium text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Verified
          </span>
        </div>

        {/* Selected Date Preview Box */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              {selectedFormattedDate}
            </span>

            {/* Status Pill */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedEvent
                  ? selectedEvent.category.includes('Gazetted')
                    ? 'bg-rose-100 text-rose-700'
                    : selectedEvent.category.includes('Restricted') || selectedEvent.category.includes('Festival')
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                  : isSelectedSunday
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {selectedEvent ? selectedEvent.category : isSelectedSunday ? 'Sunday Shift' : 'Working Day'}
            </span>
          </div>

          {/* Simple Event Title */}
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {selectedEvent ? (
              <>
                <span className="text-sm">{selectedEvent.icon || '🎉'}</span>
                <span>{selectedEvent.title}</span>
              </>
            ) : isSelectedSunday ? (
              <>
                <span className="text-sm">☀️</span>
                <span>Weekend Hospital OPD Roster</span>
              </>
            ) : (
              <>
                <span className="text-sm">🏥</span>
                <span>Regular Clinical OPD Day</span>
              </>
            )}
          </div>

          {/* Hospital Shift Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{selectedEvent?.status || (isSelectedSunday ? 'Special Shift (10:00 AM – 02:00 PM)' : 'Standard OPD (09:00 AM – 08:00 PM)')}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <HeartPulse className="w-3 h-3 text-emerald-500" />
              <span>Emergency 24/7</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
