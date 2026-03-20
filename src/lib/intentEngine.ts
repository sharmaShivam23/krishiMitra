export interface IntentResult {
  action: 'navigate' | 'speak_only' | 'unknown';
  path?: string;
  responseSpeech: string;
}

export const processVoiceCommand = (transcript: string, locale: string = 'hi'): IntentResult => {
  const text = transcript.toLowerCase();

  // 1. Home Page / Main Page
  if (text.includes('home') || text.includes('ghar') || text.includes('mukhya') || text.includes('wapas') || text.includes('shuru') || text.includes('main page')) {
    return {
      action: 'navigate',
      path: `/${locale}`,
      responseSpeech: locale === 'pa' ? 'ਮੁੱਖ ਪੰਨੇ ਤੇ ਵਾਪਸ ਜਾ ਰਿਹਾ ਹਾਂ' : 'Mukhya page par wapas jaa raha hoon.'
    };
  }

  // 2. Mandi Prices / Advisor
  if (text.includes('mandi') || text.includes('bhav') || text.includes('rate') || text.includes('kimat') || text.includes('price')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/mandi-prices/mandi-advisor`,
      responseSpeech: locale === 'pa' ? 'ਮੰਡੀ ਦੇ ਭਾਅ ਦਿਖਾ ਰਿਹਾ ਹਾਂ' : 'Mandi ke bhav aur advisor khol raha hoon.'
    };
  }

  // 3. Crop Intelligence
  if (text.includes('crop') || text.includes('fasal') || text.includes('kheti') || text.includes('intelligence') || text.includes('jankari') || text.includes('salah')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/crop-intelligence`,
      responseSpeech: locale === 'pa' ? 'ਫਸਲ ਦੀ ਜਾਣਕਾਰੀ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ' : 'Fasal ki jankari aur salah khol raha hoon.'
    };
  }

  // 4. Community Forum
  if (text.includes('community') || text.includes('forum') || text.includes('saval') || text.includes('kisan') || text.includes('charcha') || text.includes('network')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/community`,
      responseSpeech: locale === 'pa' ? 'ਕਿਸਾਨ ਨੈੱਟਵਰਕ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ' : 'Kisan network aur charcha khol raha hoon.'
    };
  }

  // 5. Collective Selling Pools
  if (text.includes('pool') || text.includes('samooh') || text.includes('ekatha') || text.includes('milkar') || text.includes('group') || text.includes('collective')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/selling-pool`,
      responseSpeech: locale === 'pa' ? 'ਸਮੂਹਿਕ ਵਿਕਰੀ ਪੂਲ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ' : 'Samoohik bikri pool khol raha hoon.'
    };
  }

  // 6. Weather
  if (text.includes('mausam') || text.includes('weather') || text.includes('barish') || text.includes('dhup')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/weather`,
      responseSpeech: locale === 'pa' ? 'ਅੱਜ ਦਾ ਮੌਸਮ ਇਹ ਹੈ' : 'Aaj ka mausam screen par hai.'
    };
  }

  // 7. Disease Detection / AI Scanner
  if (text.includes('bimari') || text.includes('disease') || text.includes('keeda') || text.includes('scan') || text.includes('photo')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/disease`,
      responseSpeech: locale === 'pa' ? 'ਕਿਰਪਾ ਕਰਕੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ' : 'Kripya patte ki photo upload karein, AI bimari check karega.'
    };
  }

  // 8. Equipment / Services
  if (text.includes('tractor') || text.includes('rent') || text.includes('machine') || text.includes('kiraye') || text.includes('service')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/Services`,
      responseSpeech: locale === 'pa' ? 'ਕਿਰਾਏ ਦੀਆਂ ਮਸ਼ੀਨਾਂ ਇੱਥੇ ਹਨ' : 'Kiraye ki machine aur services yahan uplabdh hain.'
    };
  }

  // 9. Government Schemes
  if (text.includes('yojana') || text.includes('scheme') || text.includes('subsidy') || text.includes('sarkari')) {
    return {
      action: 'navigate',
      path: `/${locale}/dashboard/schemes`,
      responseSpeech: locale === 'pa' ? 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ' : 'Sarkari yojanao ki jankari khol raha hoon.'
    };
  }

  // Fallback - Error Handling
  return {
    action: 'unknown',
    responseSpeech: locale === 'pa' ? 'ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ, ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।' : 'Mujhe samajh nahi aaya. Kripya dobara bole, ya aasan shabdon ka prayog karein.'
  };
};