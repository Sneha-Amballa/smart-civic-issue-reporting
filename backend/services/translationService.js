const axios = require('axios');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function translateToTarget(text, targetLang = 'en') {
    if (!text) {
        return {
            translatedText: '',
            detectedLanguage: 'en',
            wasTranslated: false
        };
    }

    try {
        const response = await axios.post(
            `${AI_BASE}/translate`,
            { text, target_lang: targetLang },
            { timeout: 15000 }
        );

        return {
            translatedText: response.data.translated_text || text,
            detectedLanguage: response.data.detected_language || 'unknown',
            wasTranslated: Boolean(response.data.was_translated)
        };
    } catch (error) {
        console.error(`Translation Service Error (${targetLang}):`, error.response?.data || error.message);
        return {
            translatedText: text,
            detectedLanguage: 'unknown',
            wasTranslated: false
        };
    }
}

/**
 * Returns translated variants for compatibility with existing schema.
 * Hindi/Telugu are preserved as source text when local translation only targets English.
 */
async function translateText(text) {
    const result = await translateAndDetect(text);
    return result.translations;
}

async function translateAndDetect(text) {
    if (!text) {
        return {
            translations: { en: '', hi: '', te: '' },
            detectedLanguage: 'en'
        };
    }

    // Run translations in parallel for speed
    try {
        const [enRes, hiRes, teRes] = await Promise.all([
            translateToTarget(text, 'en'),
            translateToTarget(text, 'hi'),
            translateToTarget(text, 'te')
        ]);

        const detectedLanguage = enRes.detectedLanguage === 'unknown' ? 'en' : enRes.detectedLanguage;

        return {
            translations: {
                en: enRes.translatedText,
                hi: hiRes.translatedText,
                te: teRes.translatedText
            },
            detectedLanguage
        };
    } catch (err) {
        console.error("Parallel translation failed:", err.message);
        return {
            translations: { en: text, hi: text, te: text },
            detectedLanguage: 'en'
        };
    }
}

module.exports = { translateText, translateAndDetect };
