export interface IntentResult {
  action: 'navigate' | 'speak_only' | 'unknown';
  path?: string;
  responseSpeech: string;
}

export const processVoiceCommand = (transcript: string, locale: string = 'hi'): IntentResult => {
  const text = transcript.toLowerCase();

  const navigationVerbs = [
    'open', 'khol', 'chalo', 'jao', 'jaa', 'le chalo', 'dikhao', 'show', 'go to', 'take me',
    'khol do', 'chale', 'wapas', 'back', 'home', 'screen', 'page'
  ];

  const advisoryWords = [
    'kaise', 'kya', 'kab', 'kyu', 'kyon', 'kitna', 'batao', 'samjhao', 'suggest', 'advice',
    'help', 'problem', 'issue', 'should i', 'best', 'recommend'
  ];

  const hasNavigationVerb = navigationVerbs.some((word) => text.includes(word));
  const hasAdvisorySignal = advisoryWords.some((word) => text.includes(word)) || text.includes('?');

  const routeByTopic: Array<{ keywords: string[]; path: string; responsePa: string; responseDefault: string }> = [
    {
      keywords: ['home', 'ghar', 'mukhya', 'wapas', 'shuru', 'main page'],
      path: `/${locale}`,
      responsePa: 'ਮੁੱਖ ਪੰਨੇ ਤੇ ਵਾਪਸ ਜਾ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Mukhya page par wapas jaa raha hoon.'
    },
    {
      keywords: ['mandi', 'bhav', 'rate', 'kimat', 'price'],
      path: `/${locale}/dashboard/mandi-prices/mandi-advisor2`,
      responsePa: 'ਮੰਡੀ ਦੇ ਭਾਅ ਦਿਖਾ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Mandi ke bhav aur advisor khol raha hoon.'
    },
    {
      keywords: ['crop', 'fasal', 'kheti', 'intelligence', 'jankari', 'salah'],
      path: `/${locale}/dashboard/crop-intelligence`,
      responsePa: 'ਫਸਲ ਦੀ ਜਾਣਕਾਰੀ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Fasal ki jankari aur salah khol raha hoon.'
    },
    {
      keywords: ['community', 'forum', 'saval', 'kisan', 'charcha', 'network'],
      path: `/${locale}/dashboard/community`,
      responsePa: 'ਕਿਸਾਨ ਨੈੱਟਵਰਕ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Kisan network aur charcha khol raha hoon.'
    },
    {
      keywords: ['pool', 'samooh', 'ekatha', 'milkar', 'group', 'collective'],
      path: `/${locale}/dashboard/selling-pool`,
      responsePa: 'ਸਮੂਹਿਕ ਵਿਕਰੀ ਪੂਲ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Samoohik bikri pool khol raha hoon.'
    },
    {
      keywords: ['mausam', 'weather', 'barish', 'dhup'],
      path: `/${locale}/dashboard/weather`,
      responsePa: 'ਅੱਜ ਦਾ ਮੌਸਮ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Aaj ka mausam screen par khol raha hoon.'
    },
    {
      keywords: ['bimari', 'disease', 'keeda', 'scan', 'photo'],
      path: `/${locale}/dashboard/disease-detection`,
      responsePa: 'ਕਿਰਪਾ ਕਰਕੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
      responseDefault: 'Kripya patte ki photo upload karein, AI bimari check karega.'
    },
    {
      keywords: ['tractor', 'rent', 'machine', 'kiraye', 'service'],
      path: `/${locale}/dashboard/Services`,
      responsePa: 'ਕਿਰਾਏ ਦੀਆਂ ਮਸ਼ੀਨਾਂ ਇੱਥੇ ਹਨ',
      responseDefault: 'Kiraye ki machine aur services yahan uplabdh hain.'
    },
    {
      keywords: ['yojana', 'scheme', 'subsidy', 'sarkari'],
      path: `/${locale}/dashboard/schemes`,
      responsePa: 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ',
      responseDefault: 'Sarkari yojanao ki jankari khol raha hoon.'
    }
  ];

  const matchedTopic = routeByTopic.find((topic) => topic.keywords.some((keyword) => text.includes(keyword)));

  if (matchedTopic && hasNavigationVerb && !hasAdvisorySignal) {
    return {
      action: 'navigate',
      path: matchedTopic.path,
      responseSpeech: locale === 'pa' ? matchedTopic.responsePa : matchedTopic.responseDefault
    };
  }

  if (matchedTopic) {
    return {
      action: 'speak_only',
      responseSpeech: locale === 'pa'
        ? 'ਸਮਝ ਗਿਆ। ਮੈਂ ਇਸ ਬਾਰੇ ਸਧੀ ਸਲਾਹ ਦੇ ਸਕਦਾ ਹਾਂ।'
        : 'Samajh gaya. Main is baare mein seedhi salah de sakta hoon.'
    };
  }

  return {
    action: 'unknown',
    responseSpeech: locale === 'pa' ? 'ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ, ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।' : 'Mujhe samajh nahi aaya. Kripya dobara bole, ya aasan shabdon ka prayog karein.'
  };
};