import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
    en: {
        translation: {
            "signup": "Sign Up",
            "login": "Login",
            "name": "Full Name",
            "email": "Email Address",
            "phone": "Phone Number",
            "language": "Preferred Language",
            "submit": "Submit",
            "send_otp": "Send OTP",
            "verify_otp": "Verify OTP",
            "otp_sent": "OTP sent to your email",
            "otp_placeholder": "Enter 6-digit OTP",
            "citizen_portal": "Citizen Portal",
            "welcome": "Welcome back",
            "logout": "Logout",
            "not_verified": "Not verified yet?",
            "already_account": "Already have an account? Login",
            "no_account": "Don't have an account? Sign Up"
        }
    },
    hi: {
        translation: {
            "signup": "साइन अप करें",
            "login": "लॉग इन करें",
            "name": "पूरा नाम",
            "email": "ईमेल पता",
            "phone": "फ़ोन नंबर",
            "language": "पसंदीदा भाषा",
            "submit": "जमा करें",
            "send_otp": "ओटीपी भेजें",
            "verify_otp": "ओटीपी सत्यापित करें",
            "otp_sent": "आपके ईमेल पर ओटीपी भेजा गया",
            "otp_placeholder": "6-अंकीय ओटीपी दर्ज करें",
            "citizen_portal": "नागरिक पोर्टल",
            "welcome": "वापसी पर स्वागत है",
            "logout": "लॉग आउट",
            "not_verified": "अभी सत्यापित नहीं हैं?",
            "already_account": "क्या आपके पास पहले से खाता है? लॉग इन करें",
            "no_account": "खाता नहीं है? साइन अप करें"
        }
    },
    es: {
        translation: {
            "signup": "Registrarse",
            "login": "Iniciar sesión",
            "name": "Nombre completo",
            "email": "Correo electrónico",
            "phone": "Número de teléfono",
            "language": "Idioma preferido",
            "submit": "Enviar",
            "send_otp": "Enviar OTP",
            "verify_otp": "Verificar OTP",
            "otp_sent": "OTP enviado a su correo",
            "otp_placeholder": "Ingrese OTP de 6 dígitos",
            "citizen_portal": "Portal Ciudadano",
            "welcome": "Bienvenido de nuevo",
            "logout": "Cerrar sesión",
            "not_verified": "¿Aún no verificado?",
            "already_account": "¿Ya tienes una cuenta? Iniciar sesión",
            "no_account": "¿No tienes cuenta? Registrarse"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('language') || 'en', // default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
