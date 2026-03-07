// src/utils/dbTranslator.ts

const dictionary: Record<string, Record<string, string>> = {
  // === CROPS ===
  "Green Gram": { hi: "मूंग", pa: "ਮੂੰਗੀ" },
  "Black Gram": { hi: "उड़द", pa: "ਮਾਂਹ" },
  "Pigeon Pea": { hi: "अरहर / तुअर", pa: "ਅਰਹਰ" },
  "Pearl Millet": { hi: "बाजरा", pa: "ਬਾਜਰਾ" },
  "Sunflower": { hi: "सूरजमुखी", pa: "ਸੂਰਜਮੁਖੀ" },
  "Groundnut": { hi: "मूंगफली", pa: "ਮੂੰਗਫਲੀ" },
  "Sugarcane": { hi: "गन्ना", pa: "ਗੰਨਾ" },
  "Chickpea": { hi: "चना", pa: "ਛੋਲੇ" },
  "Soybean": { hi: "सोयाबीन", pa: "ਸੋਇਆਬੀਨ" },
  "Soyabean": { hi: "सोयाबीन", pa: "ਸੋਇਆਬੀਨ" },
  "Sorghum": { hi: "ज्वार", pa: "ਜਵਾਰ" },
  "Mustard": { hi: "सरसों", pa: "ਸਰ੍ਹੋਂ" },
  "Barley": { hi: "जौ", pa: "ਜੌਂ" },
  "Cotton": { hi: "कपास", pa: "ਕਪਾਹ" },
  "Wheat": { hi: "गेहूं", pa: "ਕਣਕ" },
  "Maize": { hi: "मक्का", pa: "ਮੱਕੀ" },
  "Onion": { hi: "प्याज", pa: "ਪਿਆਜ਼" },
  "Potato": { hi: "आलू", pa: "ਆਲੂ" },
  "Paddy": { hi: "धान", pa: "ਝੋਨਾ" },
  "Rice": { hi: "चावल", pa: "ਚੌਲ" },

  // === LOCAL NAMES / ALIASES ===
  "Makka": { hi: "मक्का", pa: "ਮੱਕੀ" },
  "Jau": { hi: "जौ", pa: "ਜੌਂ" },
  "Moong": { hi: "मूंग", pa: "ਮੂੰਗੀ" },
  "Urad": { hi: "उड़द", pa: "ਮਾਂਹ" },
  "Surajmukhi": { hi: "सूरजमुखी", pa: "ਸੂਰਜਮੁਖੀ" },
  "Arhar / Tur": { hi: "अरहर", pa: "ਅਰਹਰ" },
  "Dhan / Chawal": { hi: "धान / चावल", pa: "ਝੋਨਾ / ਚੌਲ" },
  "Jowar": { hi: "ज्वार", pa: "ਜਵਾਰ" },
  "Mungfali": { hi: "मूंगफली", pa: "ਮੂੰਗਫਲੀ" },
  "Kapas": { hi: "कपास", pa: "ਕਪਾਹ" },
  "Gehu": { hi: "गेहूं", pa: "ਕਣਕ" },
  "Sarso": { hi: "सरसों", pa: "ਸਰ੍ਹੋਂ" },
  "Ganna": { hi: "गन्ना", pa: "ਗੰਨਾ" },
  "Pyaz": { hi: "प्याज", pa: "ਪਿਆਜ਼" },
  "Aloo": { hi: "आलू", pa: "ਆਲੂ" },
  "Chana": { hi: "चना", pa: "ਛੋਲੇ" },
  "Tomato": { hi: "टमाटर", pa: "ਟਮਾਟਰ" },
  "Basmati Dhan": { hi: "बासमती धान", pa: "ਬਾਸਮਤੀ ਝੋਨਾ" },

  // === SOIL TYPES ===
  "Well-drained Loamy": { hi: "अच्छी जल निकासी वाली दोमट", pa: "ਚੰਗੀ ਨਿਕਾਸੀ ਵਾਲੀ ਦੋਮਟ" },
  "Well-drained Loam": { hi: "अच्छी जल निकासी वाली दोमट", pa: "ਚੰਗੀ ਨਿਕਾਸੀ ਵਾਲੀ ਦੋਮਟ" },
  "Well-drained sandy": { hi: "अच्छी जल निकासी वाली बलुई", pa: "ਚੰਗੀ ਨਿਕਾਸੀ ਵਾਲੀ ਰੇਤਲੀ" },
  "Black Cotton Soil": { hi: "काली कपास मिट्टी", pa: "ਕਾਲੀ ਕਪਾਹ ਮਿੱਟੀ" },
  "Sandy Loam": { hi: "बलुई दोमट", pa: "ਰੇਤਲੀ ਦੋਮਟ" },
  "Clay Loam": { hi: "चिकनी दोमट", pa: "ਚੀਕਣੀ ਦੋਮਟ" },
  "Deep Black": { hi: "गहरी काली मिट्टी", pa: "ਡੂੰਘੀ ਕਾਲੀ ਮਿੱਟੀ" },
  "Deep Loam": { hi: "गहरी दोमट", pa: "ਡੂੰਘੀ ਦੋਮਟ" },
  "Heavy Clay": { hi: "भारी चिकनी मिट्टी", pa: "ਭਾਰੀ ਚੀਕਣੀ ਮਿੱਟੀ" },
  "Black Soil": { hi: "काली मिट्टी", pa: "ਕਾਲੀ ਮਿੱਟੀ" },
  "Alluvial": { hi: "जलोढ़", pa: "ਜਲੋਢ" },
  "Clayey": { hi: "चिकनी मिट्टी", pa: "ਚੀਕਣੀ ਮਿੱਟੀ" },
  "Loamy": { hi: "दोमट", pa: "ਦੋਮਟ" },
  "Loam": { hi: "दोमट मिट्टी", pa: "ਦੋਮਟ ਮਿੱਟੀ" },

  // === WATER & CONDITIONS ===
  "Low to Moderate": { hi: "कम से मध्यम", pa: "ਘੱਟ ਤੋਂ ਦਰਮਿਆਨਾ" },
  "Very High": { hi: "बहुत उच्च", pa: "ਬਹੁਤ ਉੱਚ" },
  "Moderate": { hi: "मध्यम", pa: "ਦਰਮਿਆਨਾ" },
  "High": { hi: "उच्च", pa: "ਉੱਚ" },
  "Low": { hi: "कम", pa: "ਘੱਟ" },

  // === UNITS ===
  "q/ha": { hi: "क्विंटल/हेक्टेयर", pa: "ਕੁਇੰਟਲ/ਹੈਕਟੇਅਰ" },
  "Cycle": { hi: "दिनों का चक्र", pa: "ਦਿਨਾਂ ਦਾ ਚੱਕਰ" }
};

export const translateDBText = (text: string | undefined, locale: string) => {
  if (!text) return '';
  if (locale === 'en') return text; // If English, return as is

  let translatedText = text;

  // Sort keys by length (longest first). 
  // This ensures "Black Cotton Soil" is translated before "Black Soil" or "Soil"
  const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

  for (const englishWord of sortedKeys) {
    const translations = dictionary[englishWord];
    if (translations[locale]) {
      // Replaces the word regardless of uppercase/lowercase
      const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translations[locale]);
    }
  }

  return translatedText;
};