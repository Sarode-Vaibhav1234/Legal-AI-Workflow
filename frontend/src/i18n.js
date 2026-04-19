// i18n.js - Internationalization configuration with react-i18next
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Auth
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      email: 'Email Address',
      password: 'Password',
      full_name: 'Full Name',
      login_title: 'Welcome Back',
      login_subtitle: 'Sign in to your Legal AI Workspace',
      signup_title: 'Create Account',
      signup_subtitle: 'Join the Legal AI Workflow Platform',
      no_account: "Don't have an account?",
      have_account: 'Already have an account?',
      register: 'Register',
      // Navigation
      dashboard: 'Dashboard',
      cases: 'Cases',
      notices: 'Notices',
      drafting: 'Drafting',
      research_ai: 'Research AI',
      assign_case: 'Assign Case',
      assigned_cases: 'Assigned Cases',
      // General
      intelligent_legal: 'Intelligent Legal Workflow',
      loading: 'Loading...',
      error: 'An error occurred',
    },
  },
  hi: {
    translation: {
      // Auth
      login: 'लॉगिन',
      signup: 'साइन अप',
      logout: 'लॉगआउट',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      full_name: 'पूरा नाम',
      login_title: 'वापस स्वागत है',
      login_subtitle: 'अपने कानूनी AI कार्यक्षेत्र में साइन इन करें',
      signup_title: 'खाता बनाएं',
      signup_subtitle: 'कानूनी AI वर्कफ़्लो प्लेटफ़ॉर्म में शामिल हों',
      no_account: 'खाता नहीं है?',
      have_account: 'पहले से खाता है?',
      register: 'पंजीकरण',
      // Navigation
      dashboard: 'डैशबोर्ड',
      cases: 'मामले',
      notices: 'नोटिस',
      drafting: 'मसौदा',
      research_ai: 'AI अनुसंधान',
      assign_case: 'मामला सौंपें',
      assigned_cases: 'सौंपे गए मामले',
      // General
      intelligent_legal: 'बुद्धिमान कानूनी वर्कफ़्लो',
      loading: 'लोड हो रहा है...',
      error: 'एक त्रुटि हुई',
    },
  },
  ta: {
    translation: {
      // Auth
      login: 'உள்நுழைவு',
      signup: 'பதிவு செய்',
      logout: 'வெளியேறு',
      email: 'மின்னஞ்சல் முகவரி',
      password: 'கடவுச்சொல்',
      full_name: 'முழு பெயர்',
      login_title: 'மீண்டும் வரவேற்கிறோம்',
      login_subtitle: 'உங்கள் சட்ட AI பணியிடத்தில் உள்நுழைக',
      signup_title: 'கணக்கை உருவாக்கு',
      signup_subtitle: 'சட்ட AI வேலைப்பாட்டு தளத்தில் சேரு',
      no_account: 'கணக்கு இல்லையா?',
      have_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
      register: 'பதிவு',
      // Navigation
      dashboard: 'டாஷ்போர்டு',
      cases: 'வழக்குகள்',
      notices: 'அறிவிப்புகள்',
      drafting: 'வரைவு',
      research_ai: 'AI ஆராய்ச்சி',
      assign_case: 'வழக்கை ஒதுக்கு',
      assigned_cases: 'ஒதுக்கப்பட்ட வழக்குகள்',
      // General
      intelligent_legal: 'அறிவார்ந்த சட்ட பணிப்பாய்வு',
      loading: 'ஏற்றுகிறது...',
      error: 'ஒரு பிழை ஏற்பட்டது',
    },
  },
  bn: {
    translation: {
      // Auth
      login: 'লগইন',
      signup: 'সাইন আপ',
      logout: 'লগআউট',
      email: 'ইমেইল ঠিকানা',
      password: 'পাসওয়ার্ড',
      full_name: 'পূর্ণ নাম',
      login_title: 'স্বাগতম',
      login_subtitle: 'আপনার আইনি AI কর্মক্ষেত্রে সাইন ইন করুন',
      signup_title: 'অ্যাকাউন্ট তৈরি করুন',
      signup_subtitle: 'আইনি AI ওয়ার্কফ্লো প্ল্যাটফর্মে যোগ দিন',
      no_account: 'অ্যাকাউন্ট নেই?',
      have_account: 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?',
      register: 'নিবন্ধন',
      // Navigation
      dashboard: 'ড্যাশবোর্ড',
      cases: 'মামলা',
      notices: 'নোটিশ',
      drafting: 'খসড়া',
      research_ai: 'AI গবেষণা',
      assign_case: 'মামলা বরাদ্দ',
      assigned_cases: 'বরাদ্দকৃত মামলা',
      // General
      intelligent_legal: 'বুদ্ধিমান আইনি কর্মপ্রবাহ',
      loading: 'লোড হচ্ছে...',
      error: 'একটি ত্রুটি ঘটেছে',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('i18n_language') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
