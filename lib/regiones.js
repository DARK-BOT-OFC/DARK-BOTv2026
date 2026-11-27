const PhoneNumber = require('awesome-phonenumber');

function iso2ToFlag(iso2) {
    if (!iso2 || typeof iso2 !== 'string' || iso2.length !== 2) return '🌍';
    const upper = iso2.toUpperCase();
    if (upper === 'XK') return '🇽🇰';
    const codePoints = [...upper].map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// Catálogo amplio de prefijos telefónicos, países, regiones y banderas
const COUNTRY_PREFIXES = {
    // Norteamérica y Caribe (+1 y códigos NANP)
    '1': { country: 'Estados Unidos / Canadá / NANP', region: 'Norteamérica', flag: '🇺🇸' },
    '1242': { country: 'Bahamas', region: 'Caribe', flag: '🇧🇸' },
    '1246': { country: 'Barbados', region: 'Caribe', flag: '🇧🇧' },
    '1264': { country: 'Anguila', region: 'Caribe', flag: '🇦🇮' },
    '1268': { country: 'Antigua y Barbuda', region: 'Caribe', flag: '🇦🇬' },
    '1284': { country: 'Islas Vírgenes Británicas', region: 'Caribe', flag: '🇻🇬' },
    '1340': { country: 'Islas Vírgenes de EE. UU.', region: 'Caribe', flag: '🇻🇮' },
    '1345': { country: 'Islas Caimán', region: 'Caribe', flag: '🇰🇾' },
    '1441': { country: 'Bermudas', region: 'Norteamérica', flag: '🇧🇲' },
    '1473': { country: 'Granada', region: 'Caribe', flag: '🇬🇩' },
    '1649': { country: 'Islas Turcas y Caicos', region: 'Caribe', flag: '🇹🇨' },
    '1658': { country: 'Jamaica', region: 'Caribe', flag: '🇯🇲' },
    '1664': { country: 'Montserrat', region: 'Caribe', flag: '🇲🇸' },
    '1670': { country: 'Islas Marianas del Norte', region: 'Oceanía', flag: '🇲🇵' },
    '1671': { country: 'Guam', region: 'Oceanía', flag: '🇬🇺' },
    '1684': { country: 'Samoa Americana', region: 'Oceanía', flag: '🇦🇸' },
    '1721': { country: 'Sint Maarten', region: 'Caribe', flag: '🇸🇽' },
    '1758': { country: 'Santa Lucía', region: 'Caribe', flag: '🇱🇨' },
    '1767': { country: 'Dominica', region: 'Caribe', flag: '🇩🇲' },
    '1784': { country: 'San Vicente y las Granadinas', region: 'Caribe', flag: '🇻🇨' },
    '1787': { country: 'Puerto Rico', region: 'Caribe', flag: '🇵🇷' },
    '1809': { country: 'República Dominicana', region: 'Caribe', flag: '🇩🇴' },
    '1829': { country: 'República Dominicana', region: 'Caribe', flag: '🇩🇴' },
    '1849': { country: 'República Dominicana', region: 'Caribe', flag: '🇩🇴' },
    '1868': { country: 'Trinidad y Tobago', region: 'Caribe', flag: '🇹🇹' },
    '1869': { country: 'San Cristóbal y Nieves', region: 'Caribe', flag: '🇰🇳' },
    '1876': { country: 'Jamaica', region: 'Caribe', flag: '🇯🇲' },
    '1939': { country: 'Puerto Rico', region: 'Caribe', flag: '🇵🇷' },

    // Latinoamérica y Sudamérica
    '51': { country: 'Perú', region: 'Sudamérica', flag: '🇵🇪' },
    '52': { country: 'México', region: 'Norteamérica', flag: '🇲🇽' },
    '501': { country: 'Belice', region: 'Centroamérica', flag: '🇧🇿' },
    '502': { country: 'Guatemala', region: 'Centroamérica', flag: '🇬🇹' },
    '503': { country: 'El Salvador', region: 'Centroamérica', flag: '🇸🇻' },
    '504': { country: 'Honduras', region: 'Centroamérica', flag: '🇭🇳' },
    '505': { country: 'Nicaragua', region: 'Centroamérica', flag: '🇳🇮' },
    '506': { country: 'Costa Rica', region: 'Centroamérica', flag: '🇨🇷' },
    '507': { country: 'Panamá', region: 'Centroamérica', flag: '🇵🇦' },
    '508': { country: 'San Pedro y Miquelón', region: 'Norteamérica', flag: '🇵🇲' },
    '509': { country: 'Haití', region: 'Caribe', flag: '🇭🇹' },
    '53': { country: 'Cuba', region: 'Caribe', flag: '🇨🇺' },
    '54': { country: 'Argentina', region: 'Sudamérica', flag: '🇦🇷' },
    '55': { country: 'Brasil', region: 'Sudamérica', flag: '🇧🇷' },
    '56': { country: 'Chile', region: 'Sudamérica', flag: '🇨🇱' },
    '57': { country: 'Colombia', region: 'Sudamérica', flag: '🇨🇴' },
    '58': { country: 'Venezuela', region: 'Sudamérica', flag: '🇻🇪' },
    '590': { country: 'Guadalupe / San Bartolomé / San Martín', region: 'Caribe', flag: '🇬🇵' },
    '591': { country: 'Bolivia', region: 'Sudamérica', flag: '🇧🇴' },
    '592': { country: 'Guyana', region: 'Sudamérica', flag: '🇬🇾' },
    '593': { country: 'Ecuador', region: 'Sudamérica', flag: '🇪🇨' },
    '594': { country: 'Guayana Francesa', region: 'Sudamérica', flag: '🇬🇫' },
    '595': { country: 'Paraguay', region: 'Sudamérica', flag: '🇵🇾' },
    '596': { country: 'Martinica', region: 'Caribe', flag: '🇲🇶' },
    '597': { country: 'Surinam', region: 'Sudamérica', flag: '🇸🇷' },
    '598': { country: 'Uruguay', region: 'Sudamérica', flag: '🇺🇾' },
    '5993': { country: 'San Eustaquio', region: 'Caribe', flag: '🇧🇶' },
    '5994': { country: 'Saba', region: 'Caribe', flag: '🇧🇶' },
    '5997': { country: 'Bonaire', region: 'Caribe', flag: '🇧🇶' },
    '5999': { country: 'Curazao', region: 'Caribe', flag: '🇨🇼' },
    '599': { country: 'Caribe Neerlandés / Curazao', region: 'Caribe', flag: '🇨🇼' },
    '297': { country: 'Aruba', region: 'Caribe', flag: '🇦🇼' },
    '299': { country: 'Groenlandia', region: 'Norteamérica', flag: '🇬🇱' },
    '500': { country: 'Islas Malvinas (Falkland)', region: 'Sudamérica', flag: '🇫🇰' },

    // Europa
    '30': { country: 'Grecia', region: 'Europa', flag: '🇬🇷' },
    '31': { country: 'Países Bajos', region: 'Europa', flag: '🇳🇱' },
    '32': { country: 'Bélgica', region: 'Europa', flag: '🇧🇪' },
    '33': { country: 'Francia', region: 'Europa', flag: '🇫🇷' },
    '34': { country: 'España', region: 'Europa', flag: '🇪🇸' },
    '36': { country: 'Hungría', region: 'Europa', flag: '🇭🇺' },
    '39': { country: 'Italia / Ciudad del Vaticano', region: 'Europa', flag: '🇮🇹' },
    '40': { country: 'Rumania', region: 'Europa', flag: '🇷🇴' },
    '41': { country: 'Suiza', region: 'Europa', flag: '🇨🇭' },
    '43': { country: 'Austria', region: 'Europa', flag: '🇦🇹' },
    '44': { country: 'Reino Unido', region: 'Europa', flag: '🇬🇧' },
    '45': { country: 'Dinamarca', region: 'Europa', flag: '🇩🇰' },
    '46': { country: 'Suecia', region: 'Europa', flag: '🇸🇪' },
    '47': { country: 'Noruega', region: 'Europa', flag: '🇳🇴' },
    '48': { country: 'Polonia', region: 'Europa', flag: '🇵🇱' },
    '49': { country: 'Alemania', region: 'Europa', flag: '🇩🇪' },
    '298': { country: 'Islas Feroe', region: 'Europa', flag: '🇫🇴' },
    '350': { country: 'Gibraltar', region: 'Europa', flag: '🇬🇮' },
    '351': { country: 'Portugal', region: 'Europa', flag: '🇵🇹' },
    '352': { country: 'Luxemburgo', region: 'Europa', flag: '🇱🇺' },
    '353': { country: 'Irlanda', region: 'Europa', flag: '🇮🇪' },
    '354': { country: 'Islandia', region: 'Europa', flag: '🇮🇸' },
    '355': { country: 'Albania', region: 'Europa', flag: '🇦🇱' },
    '356': { country: 'Malta', region: 'Europa', flag: '🇲🇹' },
    '357': { country: 'Chipre', region: 'Europa', flag: '🇨🇾' },
    '35818': { country: 'Åland', region: 'Europa', flag: '🇦🇽' },
    '358': { country: 'Finlandia', region: 'Europa', flag: '🇫🇮' },
    '359': { country: 'Bulgaria', region: 'Europa', flag: '🇧🇬' },
    '370': { country: 'Lituania', region: 'Europa', flag: '🇱🇹' },
    '371': { country: 'Letonia', region: 'Europa', flag: '🇱🇻' },
    '372': { country: 'Estonia', region: 'Europa', flag: '🇪🇪' },
    '373': { country: 'Moldavia', region: 'Europa', flag: '🇲🇩' },
    '374': { country: 'Armenia', region: 'Europa / Asia', flag: '🇦🇲' },
    '375': { country: 'Bielorrusia', region: 'Europa', flag: '🇧🇾' },
    '376': { country: 'Andorra', region: 'Europa', flag: '🇦🇩' },
    '377': { country: 'Mónaco', region: 'Europa', flag: '🇲🇨' },
    '378': { country: 'San Marino', region: 'Europa', flag: '🇸🇲' },
    '379': { country: 'Ciudad del Vaticano', region: 'Europa', flag: '🇻🇦' },
    '380': { country: 'Ucrania', region: 'Europa', flag: '🇺🇦' },
    '381': { country: 'Serbia', region: 'Europa', flag: '🇷🇸' },
    '382': { country: 'Montenegro', region: 'Europa', flag: '🇲🇪' },
    '383': { country: 'Kosovo', region: 'Europa', flag: '🇽🇰' },
    '385': { country: 'Croacia', region: 'Europa', flag: '🇭🇷' },
    '386': { country: 'Eslovenia', region: 'Europa', flag: '🇸🇮' },
    '387': { country: 'Bosnia y Herzegovina', region: 'Europa', flag: '🇧🇦' },
    '389': { country: 'Macedonia del Norte', region: 'Europa', flag: '🇲🇰' },
    '420': { country: 'República Checa', region: 'Europa', flag: '🇨🇿' },
    '421': { country: 'Eslovaquia', region: 'Europa', flag: '🇸🇰' },
    '423': { country: 'Liechtenstein', region: 'Europa', flag: '🇱🇮' },

    // Eurasia (+7 y afines)
    '7840': { country: 'Abjasia', region: 'Europa / Asia', flag: '🇬🇪' },
    '7940': { country: 'Abjasia', region: 'Europa / Asia', flag: '🇬🇪' },
    '7850': { country: 'Osetia del Sur', region: 'Europa / Asia', flag: '🇬🇪' },
    '7929': { country: 'Osetia del Sur', region: 'Europa / Asia', flag: '🇬🇪' },
    '76': { country: 'Kazajistán', region: 'Asia / Europa', flag: '🇰🇿' },
    '77': { country: 'Kazajistán', region: 'Asia / Europa', flag: '🇰🇿' },
    '7': { country: 'Rusia / Kazajistán', region: 'Europa / Asia', flag: '🇷🇺' },

    // África
    '20': { country: 'Egipto', region: 'África', flag: '🇪🇬' },
    '27': { country: 'Sudáfrica', region: 'África', flag: '🇿🇦' },
    '211': { country: 'Sudán del Sur', region: 'África', flag: '🇸🇸' },
    '212': { country: 'Marruecos / Sahara Occidental', region: 'África', flag: '🇲🇦' },
    '213': { country: 'Argelia', region: 'África', flag: '🇩🇿' },
    '216': { country: 'Túnez', region: 'África', flag: '🇹🇳' },
    '218': { country: 'Libia', region: 'África', flag: '🇱🇾' },
    '220': { country: 'Gambia', region: 'África', flag: '🇬🇲' },
    '221': { country: 'Senegal', region: 'África', flag: '🇸🇳' },
    '222': { country: 'Mauritania', region: 'África', flag: '🇲🇷' },
    '223': { country: 'Malí', region: 'África', flag: '🇲🇱' },
    '224': { country: 'Guinea', region: 'África', flag: '🇬🇳' },
    '225': { country: 'Costa de Marfil', region: 'África', flag: '🇨🇮' },
    '226': { country: 'Burkina Faso', region: 'África', flag: '🇧🇫' },
    '227': { country: 'Níger', region: 'África', flag: '🇳🇪' },
    '228': { country: 'Togo', region: 'África', flag: '🇹🇬' },
    '229': { country: 'Benín', region: 'África', flag: '🇧🇯' },
    '230': { country: 'Mauricio', region: 'África', flag: '🇲🇺' },
    '231': { country: 'Liberia', region: 'África', flag: '🇱🇷' },
    '232': { country: 'Sierra Leona', region: 'África', flag: '🇸🇱' },
    '233': { country: 'Ghana', region: 'África', flag: '🇬🇭' },
    '234': { country: 'Nigeria', region: 'África', flag: '🇳🇬' },
    '235': { country: 'Chad', region: 'África', flag: '🇹🇩' },
    '236': { country: 'República Centroafricana', region: 'África', flag: '🇨🇫' },
    '237': { country: 'Camerún', region: 'África', flag: '🇨🇲' },
    '238': { country: 'Cabo Verde', region: 'África', flag: '🇨🇻' },
    '239': { country: 'Santo Tomé y Príncipe', region: 'África', flag: '🇸🇹' },
    '240': { country: 'Guinea Ecuatorial', region: 'África', flag: '🇬🇶' },
    '241': { country: 'Gabón', region: 'África', flag: '🇬🇦' },
    '242': { country: 'República del Congo', region: 'África', flag: '🇨🇬' },
    '243': { country: 'República Democrática del Congo', region: 'África', flag: '🇨🇩' },
    '244': { country: 'Angola', region: 'África', flag: '🇦🇴' },
    '245': { country: 'Guinea-Bisáu', region: 'África', flag: '🇬🇼' },
    '246': { country: 'Territorio Británico del Océano Índico', region: 'África / Índico', flag: '🇮🇴' },
    '247': { country: 'Isla Ascensión', region: 'África', flag: '🇦🇨' },
    '248': { country: 'Seychelles', region: 'África', flag: '🇸🇨' },
    '249': { country: 'Sudán', region: 'África', flag: '🇸🇩' },
    '250': { country: 'Ruanda', region: 'África', flag: '🇷🇼' },
    '251': { country: 'Etiopía', region: 'África', flag: '🇪🇹' },
    '252': { country: 'Somalia', region: 'África', flag: '🇸🇴' },
    '253': { country: 'Yibuti', region: 'África', flag: '🇩🇯' },
    '254': { country: 'Kenia', region: 'África', flag: '🇰🇪' },
    '255': { country: 'Tanzania', region: 'África', flag: '🇹🇿' },
    '256': { country: 'Uganda', region: 'África', flag: '🇺🇬' },
    '257': { country: 'Burundi', region: 'África', flag: '🇧🇮' },
    '258': { country: 'Mozambique', region: 'África', flag: '🇲🇿' },
    '260': { country: 'Zambia', region: 'África', flag: '🇿🇲' },
    '261': { country: 'Madagascar', region: 'África', flag: '🇲🇬' },
    '262269': { country: 'Mayotte', region: 'África', flag: '🇾🇹' },
    '262639': { country: 'Mayotte', region: 'África', flag: '🇾🇹' },
    '262': { country: 'Reunión / Mayotte', region: 'África', flag: '🇷🇪' },
    '263': { country: 'Zimbabue', region: 'África', flag: '🇿🇼' },
    '264': { country: 'Namibia', region: 'África', flag: '🇳🇦' },
    '265': { country: 'Malaui', region: 'África', flag: '🇲🇼' },
    '266': { country: 'Lesoto', region: 'África', flag: '🇱🇸' },
    '267': { country: 'Botsuana', region: 'África', flag: '🇧🇼' },
    '268': { country: 'Esuatini', region: 'África', flag: '🇸🇿' },
    '269': { country: 'Comoras', region: 'África', flag: '🇰🇲' },
    '2908': { country: 'Santa Elena / Tristán de Acuña', region: 'África', flag: '🇸🇭' },
    '290': { country: 'Santa Elena', region: 'África', flag: '🇸🇭' },
    '291': { country: 'Eritrea', region: 'África', flag: '🇪🇷' },

    // Asia y Oriente Medio
    '60': { country: 'Malasia', region: 'Asia', flag: '🇲🇾' },
    '62': { country: 'Indonesia', region: 'Asia', flag: '🇮🇩' },
    '63': { country: 'Filipinas', region: 'Asia', flag: '🇵🇭' },
    '65': { country: 'Singapur', region: 'Asia', flag: '🇸🇬' },
    '66': { country: 'Tailandia', region: 'Asia', flag: '🇹🇭' },
    '81': { country: 'Japón', region: 'Asia', flag: '🇯🇵' },
    '82': { country: 'Corea del Sur', region: 'Asia', flag: '🇰🇷' },
    '84': { country: 'Vietnam', region: 'Asia', flag: '🇻🇳' },
    '86': { country: 'China', region: 'Asia', flag: '🇨🇳' },
    '90': { country: 'Turquía', region: 'Europa / Asia', flag: '🇹🇷' },
    '91': { country: 'India', region: 'Asia', flag: '🇮🇳' },
    '92': { country: 'Pakistán', region: 'Asia', flag: '🇵🇰' },
    '93': { country: 'Afganistán', region: 'Asia', flag: '🇦🇫' },
    '94': { country: 'Sri Lanka', region: 'Asia', flag: '🇱🇰' },
    '95': { country: 'Myanmar', region: 'Asia', flag: '🇲🇲' },
    '98': { country: 'Irán', region: 'Asia', flag: '🇮🇷' },
    '670': { country: 'Timor Oriental', region: 'Asia', flag: '🇹🇱' },
    '673': { country: 'Brunéi', region: 'Asia', flag: '🇧🇳' },
    '850': { country: 'Corea del Norte', region: 'Asia', flag: '🇰🇵' },
    '852': { country: 'Hong Kong', region: 'Asia', flag: '🇭🇰' },
    '853': { country: 'Macao', region: 'Asia', flag: '🇲🇴' },
    '855': { country: 'Camboya', region: 'Asia', flag: '🇰🇭' },
    '856': { country: 'Laos', region: 'Asia', flag: '🇱🇦' },
    '880': { country: 'Bangladés', region: 'Asia', flag: '🇧🇩' },
    '886': { country: 'Taiwán', region: 'Asia', flag: '🇹🇼' },
    '960': { country: 'Maldivas', region: 'Asia', flag: '🇲🇻' },
    '961': { country: 'Líbano', region: 'Asia', flag: '🇱🇧' },
    '962': { country: 'Jordania', region: 'Asia', flag: '🇯🇴' },
    '963': { country: 'Siria', region: 'Asia', flag: '🇸🇾' },
    '964': { country: 'Irak', region: 'Asia', flag: '🇮🇶' },
    '965': { country: 'Kuwait', region: 'Asia', flag: '🇰🇼' },
    '966': { country: 'Arabia Saudita', region: 'Asia', flag: '🇸🇦' },
    '967': { country: 'Yemen', region: 'Asia', flag: '🇾🇪' },
    '968': { country: 'Omán', region: 'Asia', flag: '🇴🇲' },
    '970': { country: 'Palestina', region: 'Asia', flag: '🇵🇸' },
    '971': { country: 'Emiratos Árabes Unidos', region: 'Asia', flag: '🇦🇪' },
    '972': { country: 'Israel', region: 'Asia', flag: '🇮🇱' },
    '973': { country: 'Baréin', region: 'Asia', flag: '🇧🇭' },
    '974': { country: 'Catar', region: 'Asia', flag: '🇶🇦' },
    '975': { country: 'Bután', region: 'Asia', flag: '🇧🇹' },
    '976': { country: 'Mongolia', region: 'Asia', flag: '🇲🇳' },
    '977': { country: 'Nepal', region: 'Asia', flag: '🇳🇵' },
    '992': { country: 'Tayikistán', region: 'Asia', flag: '🇹🇯' },
    '993': { country: 'Turkmenistán', region: 'Asia', flag: '🇹🇲' },
    '994': { country: 'Azerbaiyán', region: 'Asia / Europa', flag: '🇦🇿' },
    '995': { country: 'Georgia', region: 'Asia / Europa', flag: '🇬🇪' },
    '996': { country: 'Kirguistán', region: 'Asia', flag: '🇰🇬' },
    '998': { country: 'Uzbekistán', region: 'Asia', flag: '🇺🇿' },

    // Oceanía
    '6189162': { country: 'Islas Cocos', region: 'Oceanía', flag: '🇨🇨' },
    '6189164': { country: 'Isla de Navidad', region: 'Oceanía', flag: '🇨🇽' },
    '61': { country: 'Australia', region: 'Oceanía', flag: '🇦🇺' },
    '64': { country: 'Nueva Zelanda', region: 'Oceanía', flag: '🇳🇿' },
    '6723': { country: 'Isla Norfolk', region: 'Oceanía', flag: '🇳🇫' },
    '672': { country: 'Territorios Externos de Australia', region: 'Oceanía', flag: '🇦🇺' },
    '674': { country: 'Nauru', region: 'Oceanía', flag: '🇳🇷' },
    '675': { country: 'Papúa Nueva Guinea', region: 'Oceanía', flag: '🇵🇬' },
    '676': { country: 'Tonga', region: 'Oceanía', flag: '🇹🇴' },
    '677': { country: 'Islas Salomón', region: 'Oceanía', flag: '🇸🇧' },
    '678': { country: 'Vanuatu', region: 'Oceanía', flag: '🇻🇺' },
    '679': { country: 'Fiyi', region: 'Oceanía', flag: '🇫🇯' },
    '680': { country: 'Palaos', region: 'Oceanía', flag: '🇵🇼' },
    '681': { country: 'Wallis y Futuna', region: 'Oceanía', flag: '🇼🇫' },
    '682': { country: 'Islas Cook', region: 'Oceanía', flag: '🇨🇰' },
    '683': { country: 'Niue', region: 'Oceanía', flag: '🇳🇺' },
    '685': { country: 'Samoa', region: 'Oceanía', flag: '🇼🇸' },
    '686': { country: 'Kiribati', region: 'Oceanía', flag: '🇰🇮' },
    '687': { country: 'Nueva Caledonia', region: 'Oceanía', flag: '🇳🇨' },
    '688': { country: 'Tuvalu', region: 'Oceanía', flag: '🇹🇻' },
    '689': { country: 'Polinesia Francesa', region: 'Oceanía', flag: '🇵🇫' },
    '690': { country: 'Tokelau', region: 'Oceanía', flag: '🇹🇰' },
    '691': { country: 'Micronesia', region: 'Oceanía', flag: '🇫🇲' },
    '692': { country: 'Islas Marshall', region: 'Oceanía', flag: '🇲🇭' }
};

const SORTED_PREFIXES = Object.keys(COUNTRY_PREFIXES).sort((a, b) => b.length - a.length);

const regionNamesEs = (() => {
    try {
        return new Intl.DisplayNames(['es'], { type: 'region' });
    } catch {
        return null;
    }
})();

const CONTINENT_BY_ISO2 = {
    US: 'Norteamérica', CA: 'Norteamérica', MX: 'Norteamérica', GL: 'Norteamérica', PM: 'Norteamérica', BM: 'Norteamérica',
    BZ: 'Centroamérica', GT: 'Centroamérica', SV: 'Centroamérica', HN: 'Centroamérica', NI: 'Centroamérica', CR: 'Centroamérica', PA: 'Centroamérica',
    BS: 'Caribe', BB: 'Caribe', CU: 'Caribe', DM: 'Caribe', DO: 'Caribe', GD: 'Caribe', HT: 'Caribe', JM: 'Caribe',
    KN: 'Caribe', LC: 'Caribe', VC: 'Caribe', TT: 'Caribe', PR: 'Caribe', AW: 'Caribe', CW: 'Caribe', SX: 'Caribe',
    BQ: 'Caribe', AI: 'Caribe', VG: 'Caribe', VI: 'Caribe', KY: 'Caribe', TC: 'Caribe', MS: 'Caribe', GP: 'Caribe', MQ: 'Caribe',
    AR: 'Sudamérica', BO: 'Sudamérica', BR: 'Sudamérica', CL: 'Sudamérica', CO: 'Sudamérica', EC: 'Sudamérica',
    GY: 'Sudamérica', PY: 'Sudamérica', PE: 'Sudamérica', SR: 'Sudamérica', UY: 'Sudamérica', VE: 'Sudamérica', GF: 'Sudamérica', FK: 'Sudamérica',
    ES: 'Europa', PT: 'Europa', FR: 'Europa', DE: 'Europa', IT: 'Europa', GB: 'Europa', NL: 'Europa', BE: 'Europa',
    CH: 'Europa', AT: 'Europa', SE: 'Europa', NO: 'Europa', DK: 'Europa', FI: 'Europa', PL: 'Europa', RO: 'Europa',
    GR: 'Europa', IE: 'Europa', UA: 'Europa', RU: 'Europa / Asia', AL: 'Europa', AD: 'Europa', BG: 'Europa', HR: 'Europa',
    CY: 'Europa', CZ: 'Europa', EE: 'Europa', FO: 'Europa', GI: 'Europa', HU: 'Europa', IS: 'Europa', LV: 'Europa',
    LI: 'Europa', LT: 'Europa', LU: 'Europa', MT: 'Europa', MD: 'Europa', MC: 'Europa', ME: 'Europa', MK: 'Europa',
    SM: 'Europa', RS: 'Europa', SK: 'Europa', SI: 'Europa', VA: 'Europa', BY: 'Europa', XK: 'Europa', AX: 'Europa',
    JP: 'Asia', CN: 'Asia', KR: 'Asia', KP: 'Asia', IN: 'Asia', ID: 'Asia', PH: 'Asia', TH: 'Asia', VN: 'Asia',
    MY: 'Asia', SG: 'Asia', TR: 'Europa / Asia', SA: 'Asia', AE: 'Asia', QA: 'Asia', IL: 'Asia', PS: 'Asia',
    JO: 'Asia', LB: 'Asia', SY: 'Asia', IQ: 'Asia', KW: 'Asia', OM: 'Asia', YE: 'Asia', BH: 'Asia', IR: 'Asia',
    AF: 'Asia', BD: 'Asia', BT: 'Asia', BN: 'Asia', KH: 'Asia', HK: 'Asia', MO: 'Asia', KZ: 'Asia / Europa',
    KG: 'Asia', LA: 'Asia', MV: 'Asia', MN: 'Asia', MM: 'Asia', NP: 'Asia', PK: 'Asia', LK: 'Asia', TW: 'Asia',
    TJ: 'Asia', TL: 'Asia', TM: 'Asia', UZ: 'Asia', AM: 'Europa / Asia', AZ: 'Asia / Europa', GE: 'Asia / Europa',
    AU: 'Oceanía', NZ: 'Oceanía', FJ: 'Oceanía', PG: 'Oceanía', SB: 'Oceanía', VU: 'Oceanía', NC: 'Oceanía', PF: 'Oceanía',
    WS: 'Oceanía', TO: 'Oceanía', PW: 'Oceanía', FM: 'Oceanía', MH: 'Oceanía', KI: 'Oceanía', NR: 'Oceanía', TV: 'Oceanía',
    CK: 'Oceanía', NU: 'Oceanía', WF: 'Oceanía', TK: 'Oceanía', GU: 'Oceanía', AS: 'Oceanía', MP: 'Oceanía', NF: 'Oceanía', CC: 'Oceanía', CX: 'Oceanía',
    EG: 'África', ZA: 'África', NG: 'África', MA: 'África', KE: 'África', DZ: 'África', TN: 'África', LY: 'África',
    GH: 'África', ET: 'África', TZ: 'África', UG: 'África', CM: 'África', CI: 'África', SN: 'África', AO: 'África',
    MZ: 'África', MG: 'África', ZM: 'África', ZW: 'África', BW: 'África', NA: 'África', RW: 'África', SD: 'África',
    SS: 'África', ML: 'África', BF: 'África', NE: 'África', TD: 'África', GN: 'África', BJ: 'África', TG: 'África',
    SL: 'África', LR: 'África', MR: 'África', GM: 'África', GW: 'África', CV: 'África', GQ: 'África', GA: 'África',
    CG: 'África', CD: 'África', CF: 'África', BI: 'África', ER: 'África', DJ: 'África', SO: 'África', KM: 'África',
    MU: 'África', SC: 'África', MW: 'África', LS: 'África', SZ: 'África', RE: 'África', YT: 'África', SH: 'África', AC: 'África', IO: 'África / Índico'
};

function detectNationAndRegion(rawJidOrPhone) {
    if (!rawJidOrPhone) {
        return { flag: '❓', country: 'Desconocida', region: 'Desconocida', prefix: '', iso2: '', isLid: false };
    }

    const str = String(rawJidOrPhone);
    const isLid = str.endsWith('@lid');
    let cleanPart = str.split('@')[0];
    if (cleanPart.includes(':')) {
        cleanPart = cleanPart.split(':')[0];
    }
    const digits = cleanPart.replace(/[^0-9]/g, '');

    if (!digits) {
        return { flag: '❓', country: 'Desconocida', region: 'Desconocida', prefix: '', iso2: '', isLid };
    }

    if (isLid || digits.length > 15) {
        return {
            flag: '🆔',
            country: 'ID Interno (@lid)',
            region: 'Sin país telefónico',
            prefix: '',
            iso2: '',
            isLid: true
        };
    }

    let matchedPrefix = '';
    for (const prefix of SORTED_PREFIXES) {
        if (digits.startsWith(prefix)) {
            matchedPrefix = prefix;
            break;
        }
    }

    const fallback = matchedPrefix ? COUNTRY_PREFIXES[matchedPrefix] : null;
    let iso2 = '';
    let countryFromLib = '';

    try {
        const pn = PhoneNumber('+' + digits);
        if (pn.isValid() || pn.getRegionCode()) {
            iso2 = pn.getRegionCode() || '';
            if (iso2 && regionNamesEs) {
                countryFromLib = regionNamesEs.of(iso2) || '';
            }
        }
    } catch {}

    const flag = (iso2 ? iso2ToFlag(iso2) : '') || fallback?.flag || '🌍';
    const country = countryFromLib || fallback?.country || 'País no identificado';
    const region = fallback?.region || (iso2 ? CONTINENT_BY_ISO2[iso2] : '') || 'Región no identificada';

    return {
        flag,
        country,
        region,
        prefix: matchedPrefix ? `+${matchedPrefix}` : '',
        iso2,
        isLid: false
    };
}

module.exports = {
    COUNTRY_PREFIXES,
    detectNationAndRegion
};
