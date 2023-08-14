export const DAYS = ['Sun.', 'Mon.', 'Tues.', 'Wed.', 'Thur.', 'Fri.', 'Sat.'];

export const PRONOUNS = {
	FAE_FAER_FAERS: '(f)ae, (f)aer, (f)aers',
	EEY_EM_EIRS: 'e/ey, em, eirs',
	HE_HIM_HIS: 'he, him, his',
	PER_PER_PERS: 'per, per, pers',
	SHE_HER_HERS: 'she, her, hers',
	THEY_THEM_THEIRS: 'they, them, theirs',
	VE_VER_VIS: 've, ver, vis',
	XE_XEM_XYRS: 'xe, xem, xyrs',
	ZEZIE_HIR_HIRS: 'ze/zie, hir, hirs'
};

export type PRONOUNS_ENUM = keyof typeof PRONOUNS;

export const LANGUAGES = [
	{ name: 'Afrikaans', code: 'af' },
	{ name: 'Albanian - shqip', code: 'sq' },
	{ name: 'Amharic - አማርኛ', code: 'am' },
	{ name: 'Arabic - العربية', code: 'ar' },
	{ name: 'Aragonese - aragonés', code: 'an' },
	{ name: 'Armenian - հայերեն', code: 'hy' },
	{ name: 'Asturian - asturianu', code: 'ast' },
	{ name: 'Azerbaijani - azərbaycan dili', code: 'az' },
	{ name: 'Basque - euskara', code: 'eu' },
	{ name: 'Belarusian - беларуская', code: 'be' },
	{ name: 'Bengali - বাংলা', code: 'bn' },
	{ name: 'Bosnian - bosanski', code: 'bs' },
	{ name: 'Breton - brezhoneg', code: 'br' },
	{ name: 'Bulgarian - български', code: 'bg' },
	{ name: 'Catalan - català', code: 'ca' },
	{ name: 'Central Kurdish - کوردی (دەستنوسی عەرەبی)', code: 'ckb' },
	{ name: 'Chinese - 中文', code: 'zh' },
	{ name: 'Chinese (Hong Kong) - 中文（香港）', code: 'zh-HK' },
	{ name: 'Chinese (Simplified) - 中文（简体）', code: 'zh-CN' },
	{ name: 'Chinese (Traditional) - 中文（繁體）', code: 'zh-TW' },
	{ name: 'Corsican', code: 'co' },
	{ name: 'Croatian - hrvatski', code: 'hr' },
	{ name: 'Czech - čeština', code: 'cs' },
	{ name: 'Danish - dansk', code: 'da' },
	{ name: 'Dutch - Nederlands', code: 'nl' },
	{ name: 'English', code: 'en' },
	{ name: 'English (Australia)', code: 'en-AU' },
	{ name: 'English (Canada)', code: 'en-CA' },
	{ name: 'English (India)', code: 'en-IN' },
	{ name: 'English (New Zealand)', code: 'en-NZ' },
	{ name: 'English (South Africa)', code: 'en-ZA' },
	{ name: 'English (United Kingdom)', code: 'en-GB' },
	{ name: 'English (United States)', code: 'en-US' },
	{ name: 'Esperanto - esperanto', code: 'eo' },
	{ name: 'Estonian - eesti', code: 'et' },
	{ name: 'Faroese - føroyskt', code: 'fo' },
	{ name: 'Filipino', code: 'fil' },
	{ name: 'Finnish - suomi', code: 'fi' },
	{ name: 'French - français', code: 'fr' },
	{ name: 'French (Canada) - français (Canada)', code: 'fr-CA' },
	{ name: 'French (France) - français (France)', code: 'fr-FR' },
	{ name: 'French (Switzerland) - français (Suisse)', code: 'fr-CH' },
	{ name: 'Galician - galego', code: 'gl' },
	{ name: 'Georgian - ქართული', code: 'ka' },
	{ name: 'German - Deutsch', code: 'de' },
	{ name: 'German (Austria) - Deutsch (Österreich)', code: 'de-AT' },
	{ name: 'German (Germany) - Deutsch (Deutschland)', code: 'de-DE' },
	{ name: 'German (Liechtenstein) - Deutsch (Liechtenstein)', code: 'de-LI' },
	{ name: 'German (Switzerland) - Deutsch (Schweiz)', code: 'de-CH' },
	{ name: 'Greek - Ελληνικά', code: 'el' },
	{ name: 'Guarani', code: 'gn' },
	{ name: 'Gujarati - ગુજરાતી', code: 'gu' },
	{ name: 'Hausa', code: 'ha' },
	{ name: 'Hawaiian - ʻŌlelo Hawaiʻi', code: 'haw' },
	{ name: 'Hebrew - עברית', code: 'he' },
	{ name: 'Hindi - हिन्दी', code: 'hi' },
	{ name: 'Hungarian - magyar', code: 'hu' },
	{ name: 'Icelandic - íslenska', code: 'is' },
	{ name: 'Indonesian - Indonesia', code: 'id' },
	{ name: 'Interlingua', code: 'ia' },
	{ name: 'Irish - Gaeilge', code: 'ga' },
	{ name: 'Italian - italiano', code: 'it' },
	{ name: 'Italian (Italy) - italiano (Italia)', code: 'it-IT' },
	{ name: 'Italian (Switzerland) - italiano (Svizzera)', code: 'it-CH' },
	{ name: 'Japanese - 日本語', code: 'ja' },
	{ name: 'Kannada - ಕನ್ನಡ', code: 'kn' },
	{ name: 'Kazakh - қазақ тілі', code: 'kk' },
	{ name: 'Khmer - ខ្មែរ', code: 'km' },
	{ name: 'Korean - 한국어', code: 'ko' },
	{ name: 'Kurdish - Kurdî', code: 'ku' },
	{ name: 'Kyrgyz - кыргызча', code: 'ky' },
	{ name: 'Lao - ລາວ', code: 'lo' },
	{ name: 'Latin', code: 'la' },
	{ name: 'Latvian - latviešu', code: 'lv' },
	{ name: 'Lingala - lingála', code: 'ln' },
	{ name: 'Lithuanian - lietuvių', code: 'lt' },
	{ name: 'Macedonian - македонски', code: 'mk' },
	{ name: 'Malay - Bahasa Melayu', code: 'ms' },
	{ name: 'Malayalam - മലയാളം', code: 'ml' },
	{ name: 'Maltese - Malti', code: 'mt' },
	{ name: 'Marathi - मराठी', code: 'mr' },
	{ name: 'Mongolian - монгол', code: 'mn' },
	{ name: 'Nepali - नेपाली', code: 'ne' },
	{ name: 'Norwegian - norsk', code: 'no' },
	{ name: 'Norwegian Bokmål - norsk bokmål', code: 'nb' },
	{ name: 'Norwegian Nynorsk - nynorsk', code: 'nn' },
	{ name: 'Occitan', code: 'oc' },
	{ name: 'Oriya - ଓଡ଼ିଆ', code: 'or' },
	{ name: 'Oromo - Oromoo', code: 'om' },
	{ name: 'Pashto - پښتو', code: 'ps' },
	{ name: 'Persian - فارسی', code: 'fa' },
	{ name: 'Polish - polski', code: 'pl' },
	{ name: 'Portuguese - português', code: 'pt' },
	{ name: 'Portuguese (Brazil) - português (Brasil)', code: 'pt-BR' },
	{ name: 'Portuguese (Portugal) - português (Portugal)', code: 'pt-PT' },
	{ name: 'Punjabi - ਪੰਜਾਬੀ', code: 'pa' },
	{ name: 'Quechua', code: 'qu' },
	{ name: 'Romanian - română', code: 'ro' },
	{ name: 'Romanian (Moldova) - română (Moldova)', code: 'mo' },
	{ name: 'Romansh - rumantsch', code: 'rm' },
	{ name: 'Russian - русский', code: 'ru' },
	{ name: 'Scottish Gaelic', code: 'gd' },
	{ name: 'Serbian - српски', code: 'sr' },
	{ name: 'Serbo - Croatian', code: 'sh' },
	{ name: 'Shona - chiShona', code: 'sn' },
	{ name: 'Sindhi', code: 'sd' },
	{ name: 'Sinhala - සිංහල', code: 'si' },
	{ name: 'Slovak - slovenčina', code: 'sk' },
	{ name: 'Slovenian - slovenščina', code: 'sl' },
	{ name: 'Somali - Soomaali', code: 'so' },
	{ name: 'Southern Sotho', code: 'st' },
	{ name: 'Spanish - español', code: 'es' },
	{ name: 'Spanish (Argentina) - español (Argentina)', code: 'es-AR' },
	{ name: 'Spanish (Latin America) - español (Latinoamérica)', code: 'es-419' },
	{ name: 'Spanish (Mexico) - español (México)', code: 'es-MX' },
	{ name: 'Spanish (Spain) - español (España)', code: 'es-ES' },
	{ name: 'Spanish (United States) - español (Estados Unidos)', code: 'es-US' },
	{ name: 'Sundanese', code: 'su' },
	{ name: 'Swahili - Kiswahili', code: 'sw' },
	{ name: 'Swedish - svenska', code: 'sv' },
	{ name: 'Tajik - тоҷикӣ', code: 'tg' },
	{ name: 'Tamil - தமிழ்', code: 'ta' },
	{ name: 'Tatar', code: 'tt' },
	{ name: 'Telugu - తెలుగు', code: 'te' },
	{ name: 'Thai - ไทย', code: 'th' },
	{ name: 'Tigrinya - ትግርኛ', code: 'ti' },
	{ name: 'Tongan - lea fakatonga', code: 'to' },
	{ name: 'Turkish - Türkçe', code: 'tr' },
	{ name: 'Turkmen', code: 'tk' },
	{ name: 'Twi', code: 'tw' },
	{ name: 'Ukrainian - українська', code: 'uk' },
	{ name: 'Urdu - اردو', code: 'ur' },
	{ name: 'Uyghur', code: 'ug' },
	{ name: 'Uzbek - o‘zbek', code: 'uz' },
	{ name: 'Vietnamese - Tiếng Việt', code: 'vi' },
	{ name: 'Walloon - wa', code: 'wa' },
	{ name: 'Welsh - Cymraeg', code: 'cy' },
	{ name: 'Western Frisian', code: 'fy' },
	{ name: 'Xhosa', code: 'xh' },
	{ name: 'Yiddish', code: 'yi' },
	{ name: 'Yoruba - Èdè Yorùbá', code: 'yo' },
	{ name: 'Zulu - isiZulu', code: 'zu' }
];

export const EMOTICONS_REVERSE: { [key: string]: string } = {
	house: '🏠',
	car: '🚗',
	person: '👤',
	people: '👥',
	school: '🏫',
	star1: '⭐️',
	star2: '🌟',
	star3: '🙏'
};

export type DateDetails = {
	englishDay: string;
	monthDay: string;
	availRange: string;
	notes: string | null;
	emoticons: string;
	startHr: number;
	startMin: number;
	endHr: number;
	endMin: number;
	householdId: number;
	status?: string;
};

export type BusyDetails = {
	status: 'Busy';
	availRange: string;
};
export type Dates = { [key: string]: DateDetails[] };

export type Row = {
	englishDay: string;
	monthDay: string;
	availRange: string | undefined;
	notes: string | undefined;
	emoticons: Set<string>;
	startHr: number | undefined;
	startMin: number | undefined;
	endHr: number | undefined;
	endMin: number | undefined;
};
