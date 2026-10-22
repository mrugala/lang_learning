(function (global) {
    "use strict";

const hiragana = {
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "ゐ": "wi", "ゑ": "we", "を": "wo",
    "ん": "n"
};

const katakana = {
    "ア": "a", "イ": "i", "ウ": "u", "エ": "e", "オ": "o",
    "カ": "ka", "キ": "ki", "ク": "ku", "ケ": "ke", "コ": "ko",
    "サ": "sa", "シ": "shi", "ス": "su", "セ": "se", "ソ": "so",
    "タ": "ta", "チ": "chi", "ツ": "tsu", "テ": "te", "ト": "to",
    "ナ": "na", "ニ": "ni", "ヌ": "nu", "ネ": "ne", "ノ": "no",
    "ハ": "ha", "ヒ": "hi", "フ": "fu", "ヘ": "he", "ホ": "ho",
    "マ": "ma", "ミ": "mi", "ム": "mu", "メ": "me", "モ": "mo",
    "ヤ": "ya", "ユ": "yu", "ヨ": "yo",
    "ラ": "ra", "リ": "ri", "ル": "ru", "レ": "re", "ロ": "ro",
    "ワ": "wa", "ヰ": "wi", "ヱ": "we", "ヲ": "wo",
    "ン": "n"
};

const rowsDefMap = {
    hiragana: [
        { key: "a", label: "", chars: ["あ", "い", "う", "え", "お"], translit: ["a", "i", "u", "e", "o"] },
        { key: "k", label: "k", chars: ["か", "き", "く", "け", "こ"], translit: ["ka", "ki", "ku", "ke", "ko"] },
        { key: "s", label: "s", chars: ["さ", "し", "す", "せ", "そ"], translit: ["sa", "shi", "su", "se", "so"] },
        { key: "t", label: "t", chars: ["た", "ち", "つ", "て", "と"], translit: ["ta", "chi", "tsu", "te", "to"] },
        { key: "n", label: "n", chars: ["な", "に", "ぬ", "ね", "の"], translit: ["na", "ni", "nu", "ne", "no"] },
        { key: "h", label: "h", chars: ["は", "ひ", "ふ", "へ", "ほ"], translit: ["ha", "hi", "fu", "he", "ho"] },
        { key: "m", label: "m", chars: ["ま", "み", "む", "め", "も"], translit: ["ma", "mi", "mu", "me", "mo"] },
        { key: "y", label: "y", chars: ["や", "", "ゆ", "", "よ"], translit: ["ya", "", "yu", "", "yo"] },
        { key: "r", label: "r", chars: ["ら", "り", "る", "れ", "ろ"], translit: ["ra", "ri", "ru", "re", "ro"] },
        { key: "w", label: "w", chars: ["わ", "", "", "", "を"], translit: ["wa", "", "", "", "wo"] },
        { key: "n2", label: "", chars: ["ん"], translit: ["n"] }
    ],
    katakana: [
        { key: "a", label: "", chars: ["ア", "イ", "ウ", "エ", "オ"], translit: ["a", "i", "u", "e", "o"] },
        { key: "k", label: "k", chars: ["カ", "キ", "ク", "ケ", "コ"], translit: ["ka", "ki", "ku", "ke", "ko"] },
        { key: "s", label: "s", chars: ["サ", "シ", "ス", "セ", "ソ"], translit: ["sa", "shi", "su", "se", "so"] },
        { key: "t", label: "t", chars: ["タ", "チ", "ツ", "テ", "ト"], translit: ["ta", "chi", "tsu", "te", "to"] },
        { key: "n", label: "n", chars: ["ナ", "ニ", "ヌ", "ネ", "ノ"], translit: ["na", "ni", "nu", "ne", "no"] },
        { key: "h", label: "h", chars: ["ハ", "ヒ", "フ", "ヘ", "ホ"], translit: ["ha", "hi", "fu", "he", "ho"] },
        { key: "m", label: "m", chars: ["マ", "ミ", "ム", "メ", "モ"], translit: ["ma", "mi", "mu", "me", "mo"] },
        { key: "y", label: "y", chars: ["ヤ", "", "ユ", "", "ヨ"], translit: ["ya", "", "yu", "", "yo"] },
        { key: "r", label: "r", chars: ["ラ", "リ", "ル", "レ", "ロ"], translit: ["ra", "ri", "ru", "re", "ro"] },
        { key: "w", label: "w", chars: ["ワ", "", "", "", "ヲ"], translit: ["wa", "", "", "", "wo"] },
        { key: "n2", label: "", chars: ["ン"], translit: ["n"] }
    ]
};

const supplementalRows = {
    dakuon: [
        { key: "g", label: "g", baseKey: "k", chars: ["が", "ぎ", "ぐ", "げ", "ご"], translit: ["ga", "gi", "gu", "ge", "go"] },
        { key: "z", label: "z", baseKey: "s", chars: ["ざ", "じ", "ず", "ぜ", "ぞ"], translit: ["za", "ji", "zu", "ze", "zo"] },
        { key: "d", label: "d", baseKey: "t", chars: ["だ", "ぢ", "づ", "で", "ど"], translit: ["da", "ji", "zu", "de", "do"] },
        { key: "b", label: "b", baseKey: "h", chars: ["ば", "び", "ぶ", "べ", "ぼ"], translit: ["ba", "bi", "bu", "be", "bo"] },
        { key: "p", label: "p", baseKey: "y", chars: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"], translit: ["pa", "pi", "pu", "pe", "po"], group: "handakuon" }
    ],
    youon: [
        { key: "ky", label: "ky", baseKey: "k", chars: ["きゃ", "きゅ", "きょ"], translit: ["kya", "kyu", "kyo"] },
        { key: "gy", label: "gy", baseKey: "k", voicing: "dakuten", chars: ["ぎゃ", "ぎゅ", "ぎょ"], translit: ["gya", "gyu", "gyo"] },
        { key: "sh", label: "sh", baseKey: "s", chars: ["しゃ", "しゅ", "しょ"], translit: ["sha", "shu", "sho"] },
        { key: "j", label: "j", baseKey: "s", voicing: "dakuten", chars: ["じゃ", "じゅ", "じょ"], translit: ["ja", "ju", "jo"] },
        { key: "ch", label: "ch", baseKey: "t", chars: ["ちゃ", "ちゅ", "ちょ"], translit: ["cha", "chu", "cho"] },
        { key: "j2", label: "j", baseKey: "t", voicing: "dakuten", chars: ["ぢゃ", "ぢゅ", "ぢょ"], translit: ["ja", "ju", "jo"] },
        { key: "ny", label: "ny", baseKey: "n", chars: ["にゃ", "にゅ", "にょ"], translit: ["nya", "nyu", "nyo"] },
        { key: "hy", label: "hy", baseKey: "h", chars: ["ひゃ", "ひゅ", "ひょ"], translit: ["hya", "hyu", "hyo"] },
        { key: "by", label: "by", baseKey: "h", voicing: "dakuten", chars: ["びゃ", "びゅ", "びょ"], translit: ["bya", "byu", "byo"] },
        { key: "py", label: "py", baseKey: "y", voicing: "handakuten", chars: ["ぴゃ", "ぴゅ", "ぴょ"], translit: ["pya", "pyu", "pyo"] },
        { key: "my", label: "my", baseKey: "m", chars: ["みゃ", "みゅ", "みょ"], translit: ["mya", "myu", "myo"] },
        { key: "ry", label: "ry", baseKey: "y", chars: ["りゃ", "りゅ", "りょ"], translit: ["rya", "ryu", "ryo"] }
    ]
};

/* Additional katakana combinations used mainly for foreign words.
   Each row keeps five entries so the row stays aligned with the five-column
   grid of the rendered table; a missing combination is left as an empty
   string and the renderer shows a placeholder cell in its place. */
const foreignKatakanaRows = [
    { key: "she", label: "sh / ch / j", chars: ["シェ", "チェ", "ジェ", "", ""], translit: ["she", "che", "je", "", ""] },
    { key: "tsa", label: "ts", chars: ["ツァ", "ツェ", "ツォ", "", ""], translit: ["tsa", "tse", "tso", "", ""] },
    { key: "f", label: "f", chars: ["ファ", "フィ", "フェ", "フォ", ""], translit: ["fa", "fi", "fe", "fo", ""] },
    { key: "t2", label: "t / d", chars: ["ティ", "ディ", "デュ", "", ""], translit: ["ti", "dhi", "dyu", "", ""] },
    { key: "w2", label: "w / q", chars: ["ウィ", "ウェ", "ウォ", "", "クォ"], translit: ["wi", "we", "wo", "", "quo"] },
    { key: "v", label: "v", chars: ["ヴァ", "ヴィ", "ヴェ", "ヴォ", ""], translit: ["va", "vi", "ve", "vo", ""] }
];

const foreignKatakanaColumns = ["1", "2", "3", "4", "5"];

const dakuonAlternativeSpellings = {
    "じ": ["zi"],
    "ぢ": ["di"],
    "づ": ["du"],
    "ジ": ["zi"],
    "ヂ": ["di"],
    "ヅ": ["du"]
};

const readingParticleMeanings = {
    "が": "oznacza podmiot zdania; wskazuje, kto lub co wykonuje czynność albo jest opisywane",
    "から": "od; z — wskazuje początek, źródło lub punkt wyjścia",
    "で": "w; za pomocą — wskazuje miejsce czynności albo sposób jej wykonania",
    "と": "i; z — łączy rzeczowniki lub wskazuje towarzysza; może też wprowadzać cytat",
    "に": "do; w; o — wskazuje cel, miejsce, czas lub odbiorcę",
    "の": "wskazuje przynależność lub związek; często odpowiada polskiemu „-a/-ego” albo „z”",
    "は": "wskazuje temat zdania; czytane jako „wa”",
    "へ": "w kierunku; do — wskazuje kierunek ruchu, czytane jako „e”",
    "も": "też; również",
    "を": "oznacza dopełnienie czynności; czytane jako „o”",
    "という": "zwrot wprowadzający nazwę lub określenie: „zwany”, „o nazwie”",
    "より": "od; z — wskazuje źródło lub punkt wyjścia (styl klasyczny)",
    "にて": "w; za pomocą — klasyczna forma odpowiadająca dzisiejszemu „で”",
    "よ": "partykuła wołacza — użyta przy zwracaniu się do kogoś, odpowiada polskiemu wołaczowi („o...!”)",
    "て": "łącznik — spaja czasownik lub inną partykułę z dalszą częścią zdania (odpowiednik „i”, „a potem”)",
    "まで": "aż do; do — wskazuje granicę lub punkt końcowy (czasu, miejsca, zakresu)"
};

const readingCharacterNames = {
    "momotarou": "Momotarō",
    "momotaroutachi": "Momotarō i jego towarzysze",
    "mika": "Mika",
    "yuki": "Yuki",
    "shiwan": "Siwan",
    "shikatora": "Sikatora",
    "shikatondono": "Sikatondono",
    "sebasutian": "Sebastian",
    "sutefan": "Stefan",
    "tobiasu": "Tobiasz",
    "furanshisu": "Franciszek",
    "shimon": "Szymon",
    "iezusu": "Jezus",
    "iezusukirisuto": "Jezus Chrystus",
    "maria": "Maryja",
    "ponshiopirato": "Poncjusz Piłat"
};

const readingStories = [
    {
        key: "momotaro",
        title: "Momotarō",
        source: "Tradycyjna japońska baśń ludowa — opracowanie do ćwiczeń",
        chapters: [
            {
                chapterNumber: 1,
                title: "Brzoskwinia i Momotarō",
                verseTranslations: [
                    "Dawno, dawno temu starszy pan i starsza pani mieszkali niedaleko gór.",
                    "Pewnego dnia starsza pani znalazła w rzece wielką brzoskwinię.",
                    "Z brzoskwini urodził się zdrowy chłopiec.",
                    "Starsza para nazwała dziecko Momotarō."
                ],
                verses: [
            [
                { text: "むかしむかし、", reading: "mukashimukashi" },
                { text: "やま", reading: "yama" },
                { text: "の", reading: "no", particle: true },
                { text: " ちかく", reading: " chikaku" },
                { text: "に", reading: "ni", particle: true },
                { text: " おじいさん", reading: " ojiisan" },
                { text: "と", reading: "to", particle: true },
                { text: " おばあさん", reading: " obaasan" },
                { text: "が", reading: "ga", particle: true },
                { text: " すんでいました。", reading: " sundeimashita" }
            ],
            [
                { text: "あるひ、", reading: "aruhi" },
                { text: "おばあさん", reading: "obaasan" },
                { text: "は", reading: "wa", particle: true },
                { text: " かわ", reading: " kawa" },
                { text: "で", reading: "de", particle: true },
                { text: " おおきな", reading: " ookina" },
                { text: " もも", reading: " momo" },
                { text: "を", reading: "o", particle: true },
                { text: " みつけました。", reading: " mitsukemashita" }
            ],
            [
                { text: "もも", reading: "momo" },
                { text: "から", reading: "kara", particle: true },
                { text: " げんきな", reading: " genkina" },
                { text: " おとこのこ", reading: " otokonoko" },
                { text: "が", reading: "ga", particle: true },
                { text: " うまれました。", reading: " umaremashita" }
            ],
            [
                { text: "ふたり", reading: "futari" },
                { text: "は", reading: "wa", particle: true },
                { text: " こども", reading: " kodomo" },
                { text: "を", reading: "o", particle: true },
                { text: " ももたろう", reading: " momotarou" },
                { text: "と", reading: "to", particle: true },
                { text: " よびました。", reading: " yobimashita" }
            ]
                ]
            },
            {
                chapterNumber: 2,
                title: "Wyprawa Momotarō",
                verseTranslations: [
                    "Gdy Momotarō dorósł, postanowił wyruszyć na Wyspę Demonów.",
                    "Starsza pani przygotowała kuleczki z prosa i dała je Momotarō.",
                    "Po drodze spotkał psa, małpę i bażanta.",
                    "Wszyscy dostali kuleczki z prosa i zostali jego towarzyszami."
                ],
                verses: [
            [
                { text: "おおきくなった", reading: "ookikunatta" },
                { text: " ももたろう", reading: " momotarou" },
                { text: "は", reading: "wa", particle: true },
                { text: " おにがしま", reading: " onigashima" },
                { text: "へ", reading: "e", particle: true },
                { text: " いくこと", reading: " ikukoto" },
                { text: "に", reading: "ni", particle: true },
                { text: " しました。", reading: " shimashita" }
            ],
            [
                { text: "おばあさん", reading: "obaasan" },
                { text: "は", reading: "wa", particle: true },
                { text: " きびだんご", reading: " kibidango" },
                { text: "を", reading: "o", particle: true },
                { text: " つくり、", reading: " tsukuri" },
                { text: " ももたろう", reading: " momotarou" },
                { text: "に", reading: "ni", particle: true },
                { text: " わたしました。", reading: " watashimashita" }
            ],
            [
                { text: "みち", reading: "michi" },
                { text: "で", reading: "de", particle: true },
                { text: " いぬ", reading: " inu" },
                { text: "と", reading: "to", particle: true },
                { text: " さる", reading: " saru" },
                { text: "と", reading: "to", particle: true },
                { text: " きじ", reading: " kiji" },
                { text: "に", reading: "ni", particle: true },
                { text: " あいました。", reading: " aimashita" }
            ],
            [
                { text: "みんな", reading: "minna" },
                { text: "は", reading: "wa", particle: true },
                { text: " きびだんご", reading: " kibidango" },
                { text: "を", reading: "o", particle: true },
                { text: " もらい、", reading: " morai" },
                { text: " なかま", reading: " nakama" },
                { text: "に", reading: "ni", particle: true },
                { text: " なりました。", reading: " narimashita" }
            ]
                ]
            },
            {
                chapterNumber: 3,
                title: "Na wyspie demonów",
                verseTranslations: [
                    "Wszyscy wsiedli na łódź i popłynęli na Wyspę Demonów.",
                    "Gdy dotarli na wyspę, pojawiły się demony.",
                    "Momotarō i jego towarzysze połączyli siły i pokonali demony.",
                    "Zabrali skarby i wrócili do wioski.",
                    "Mieszkańcy wioski serdecznie ich powitali."
                ],
                verses: [
            [
                { text: "みんな", reading: "minna" },
                { text: "は", reading: "wa", particle: true },
                { text: " ふね", reading: " fune" },
                { text: "に", reading: "ni", particle: true },
                { text: " のって、", reading: " notte" },
                { text: " おにがしま", reading: " onigashima" },
                { text: "へ", reading: "e", particle: true },
                { text: " むかいました。", reading: " mukaimashita" }
            ],
            [
                { text: "しま", reading: "shima" },
                { text: "に", reading: "ni", particle: true },
                { text: " つくと、", reading: " tsukuto" },
                { text: " おにたち", reading: " onitachi" },
                { text: "が", reading: "ga", particle: true },
                { text: " でてきました。", reading: " detekimashita" }
            ],
            [
                { text: "ももたろうたち", reading: "momotaroutachi" },
                { text: "は", reading: "wa", particle: true },
                { text: " ちから", reading: " chikara" },
                { text: "を", reading: "o", particle: true },
                { text: " あわせて、", reading: " awasete" },
                { text: " おにたち", reading: " onitachi" },
                { text: "に", reading: "ni", particle: true },
                { text: " かちました。", reading: " kachimashita" }
            ],
            [
                { text: "たから", reading: "takara" },
                { text: "を", reading: "o", particle: true },
                { text: " もって、", reading: " motte" },
                { text: " むら", reading: " mura" },
                { text: "へ", reading: "e", particle: true },
                { text: " かえりました。", reading: " kaerimashita" }
            ],
            [
                { text: "むら", reading: "mura" },
                { text: "の", reading: "no", particle: true },
                { text: " ひとびと", reading: " hitobito" },
                { text: "は", reading: "wa", particle: true },
                { text: " みんな", reading: " minna" },
                { text: "を", reading: "o", particle: true },
                { text: " あたたかく", reading: " atatakaku" },
                { text: " むかえました。", reading: " mukaemashita" }
            ]
                ]
            }
        ]
    },
    {
        key: "mika-studies-japanese",
        title: "Mika uczy się japońskiego",
        source: "Oryginalna, autorska historia dla początkujących",
        chapters: [
            {
                chapterNumber: 1,
                title: "Codzienna nauka",
                verseTranslations: [
                    "Mika jest studentką.",
                    "Codziennie uczy się języka japońskiego.",
                    "Rano czyta książkę.",
                    "Zapisuje nowe słowa w zeszycie."
                ],
                verses: [
                    [
                        { text: "みか", reading: "mika" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " がくせい", reading: " gakusei" },
                        { text: "です。", reading: "desu" }
                    ],
                    [
                        { text: "まいにち", reading: "mainichi" },
                        { text: " にほんご", reading: " nihongo" },
                        { text: "を", reading: "o", particle: true },
                        { text: " べんきょう", reading: " benkyou" },
                        { text: "します。", reading: " shimasu" }
                    ],
                    [
                        { text: "あさ、", reading: "asa" },
                        { text: " ほん", reading: " hon" },
                        { text: "を", reading: "o", particle: true },
                        { text: " よみます。", reading: " yomimasu" }
                    ],
                    [
                        { text: "ノート", reading: "nooto", foreignWord: true },
                        { text: "に", reading: "ni", particle: true },
                        { text: " あたらしい", reading: " atarashii" },
                        { text: " ことば", reading: " kotoba" },
                        { text: "を", reading: "o", particle: true },
                        { text: " かきます。", reading: " kakimasu" }
                    ]
                ]
            },
            {
                chapterNumber: 2,
                title: "W bibliotece",
                verseTranslations: [
                    "W sobotę idzie do biblioteki.",
                    "Nauczyciel mówi powoli.",
                    "Mika pyta o słowa, których nie rozumie.",
                    "Uczy się razem z przyjaciółmi."
                ],
                verses: [
                    [
                        { text: "どようび", reading: "doyoubi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " としょかん", reading: " toshokan" },
                        { text: "へ", reading: "e", particle: true },
                        { text: " いきます。", reading: " ikimasu" }
                    ],
                    [
                        { text: "せんせい", reading: "sensei" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " ゆっくり", reading: " yukkuri" },
                        { text: " はなします。", reading: " hanashimasu" }
                    ],
                    [
                        { text: "みか", reading: "mika" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " わからない", reading: " wakaranai" },
                        { text: " ことば", reading: " kotoba" },
                        { text: "を", reading: "o", particle: true },
                        { text: " ききます。", reading: " kikimasu" }
                    ],
                    [
                        { text: "ともだち", reading: "tomodachi" },
                        { text: "と", reading: "to", particle: true },
                        { text: " いっしょ", reading: " issho" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " べんきょう", reading: " benkyou" },
                        { text: "します。", reading: " shimasu" }
                    ]
                ]
            },
            {
                chapterNumber: 3,
                title: "Pierwsza rozmowa",
                verseTranslations: [
                    "Mika mówi po japońsku.",
                    "Yuki słucha.",
                    "Mika próbuje powiedzieć to jeszcze raz.",
                    "Mika cieszy się i postanawia uczyć się także jutro."
                ],
                verses: [
                    [
                        { text: "みか", reading: "mika" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " にほんご", reading: " nihongo" },
                        { text: "で", reading: "de", particle: true },
                        { text: " はなします。", reading: " hanashimasu" }
                    ],
                    [
                        { text: "ゆき", reading: "yuki" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " ききます。", reading: " kikimasu" }
                    ],
                    [
                        { text: "みか", reading: "mika" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " もういちど", reading: " mouichido" },
                        { text: " いいます。", reading: " iimasu" }
                    ],
                    [
                        { text: "みか", reading: "mika" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " うれしい", reading: " ureshii" },
                        { text: "です。", reading: " desu" },
                        { text: " あした", reading: " ashita" },
                        { text: "も", reading: "mo", particle: true },
                        { text: " べんきょう", reading: " benkyou" },
                        { text: "します。", reading: " shimasu" }
                    ]
                ]
            }
        ]
    },
    {
        key: "queens-nephew",
        title: "Siostrzeniec królowej",
        source: "Autorskie streszczenie na podstawie The Queen's Nephew: An Historical Narration from the Early Japanese Mission (1896), ks. Joseph Spillmann",
        chapters: [
            {
                chapterNumber: 1,
                title: "Początek historii Sikatory",
                verseTranslations: [
                    "Dawno temu w Bungo na Kiusiu panował król Siwan.",
                    "Jego siostrzeniec Sikatora został adoptowanym synem Sikatondona, brata królowej.",
                    "Królowa pragnęła, by Sikatora został potężnym władcą.",
                    "Sebastian opowiedział Sikatorze o nauce chrześcijańskiej."
                ],
                verses: [
                    [
                        { text: "むかし、", reading: "mukashi" },
                        { text: " きゅうしゅう", reading: " kyuushuu" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ぶんご", reading: " bungo" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " しわん", reading: " shiwan" },
                        { text: "という", reading: "toiu" },
                        { text: " おう", reading: " ou" },
                        { text: "が", reading: "ga", particle: true },
                        { text: " いました。", reading: " imashita" }
                    ],
                    [
                        { text: "おう", reading: "ou" },
                        { text: "の", reading: "no", particle: true },
                        { text: " おい", reading: " oi" },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " おば", reading: " oba" },
                        { text: "の", reading: "no", particle: true },
                        { text: " おとうと", reading: " otouto" },
                        { text: " しかとんどの", reading: " shikatondono" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ようし", reading: " youshi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " なりました。", reading: " narimashita" }
                    ],
                    [
                        { text: "おうひ", reading: "ouhi" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "が", reading: "ga", particle: true },
                        { text: " つよい", reading: " tsuyoi" },
                        { text: " おう", reading: " ou" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " なる", reading: " naru" },
                        { text: "こと", reading: "koto" },
                        { text: "を", reading: "o", particle: true },
                        { text: " のぞみました。", reading: " nozomimashita" }
                    ],
                    [
                        { text: "せばすてぃあん", reading: "sebasutian", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " きりすときょう", reading: " kirisutokyou" },
                        { text: "の", reading: "no", particle: true },
                        { text: " おしえ", reading: " oshie" },
                        { text: "を", reading: "o", particle: true },
                        { text: " はなしました。", reading: " hanashimashita" }
                    ]
                ]
            },
            {
                chapterNumber: 2,
                title: "Paziem był Stefan",
                verseTranslations: [
                    "Sikatora spotkał Stefana, pazia na królewskim dworze.",
                    "Stefan był chrześcijaninem od dzieciństwa i przyjął chrzest jako dziecko.",
                    "Niewidomego Tobiasza prowadził młody Franciszek.",
                    "Obaj rozmawiali o miłości i przebaczeniu.",
                    "Królowa dowiedziała się, że Sikatora zainteresował się chrześcijaństwem."
                ],
                verses: [
                    [
                        { text: "しかとら", reading: "shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " おう", reading: " ou" },
                        { text: "の", reading: "no", particle: true },
                        { text: " こもの", reading: " komono" },
                        { text: " すてふぁん", reading: " sutefan", foreignName: true },
                        { text: "に", reading: "ni", particle: true },
                        { text: " あいました。", reading: " aimashita" }
                    ],
                    [
                        { text: "すてふぁん", reading: "sutefan", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " こども", reading: " kodomo" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ころ", reading: " koro" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " せんれい", reading: " senrei" },
                        { text: "を", reading: "o", particle: true },
                        { text: " うけた", reading: " uketa" },
                        { text: " きりすと", reading: " kirisuto" },
                        { text: "でした。", reading: " deshita" }
                    ],
                    [
                        { text: "とびあす", reading: "tobiasu", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " め", reading: " me" },
                        { text: "が", reading: "ga", particle: true },
                        { text: " みえず、", reading: " miezu" },
                        { text: " わかい", reading: " wakai" },
                        { text: " ふらんしす", reading: " furanshisu", foreignName: true },
                        { text: "が", reading: "ga", particle: true },
                        { text: " みちびきました。", reading: " michibikimashita" }
                    ],
                    [
                        { text: "ふたり", reading: "futari" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " あい", reading: " ai" },
                        { text: "と", reading: "to", particle: true },
                        { text: " ゆるし", reading: " yurushi" },
                        { text: "について", reading: "nitsuite" },
                        { text: " はなしました。", reading: " hanashimashita" }
                    ],
                    [
                        { text: "おうひ", reading: "ouhi" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "が", reading: "ga", particle: true },
                        { text: " しんこう", reading: " shinkou" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " きょうみ", reading: " kyoumi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " もった", reading: " motta" },
                        { text: "と", reading: "to", particle: true },
                        { text: " しりました。", reading: " shirimashita" }
                    ]
                ]
            },
            {
                chapterNumber: 3,
                title: "Próba Stefana",
                verseTranslations: [
                    "Sikatondono groził Sikatorze, by ten porzucił wiarę.",
                    "Stefan odmówił wyrzeczenia się chrześcijaństwa.",
                    "Królowa kazała go wychłostać i chciała skazać na śmierć.",
                    "Sebastian poprosił króla, by ocalił Stefana.",
                    "Król wybrał Sikatorę na następcę i uwolnił Stefana.",
                    "Sikatora postanowił przyjąć chrześcijaństwo.",
                    "Sikatora przyjął chrzest i imię Szymon."
                ],
                verses: [
                    [
                        { text: "しかとんどの", reading: "shikatondono" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " しんこう", reading: " shinkou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " すてる", reading: " suteru" },
                        { text: "よう", reading: "you" },
                        { text: " おどしました。", reading: " odoshimashita" }
                    ],
                    [
                        { text: "すてふぁん", reading: "sutefan", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しんこう", reading: " shinkou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " すてる", reading: " suteru" },
                        { text: "こと", reading: "koto" },
                        { text: "を", reading: "o", particle: true },
                        { text: " ことわりました。", reading: " kotowarimashita" }
                    ],
                    [
                        { text: "おうひ", reading: "ouhi" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " すてふぁん", reading: " sutefan", foreignName: true },
                        { text: "を", reading: "o", particle: true },
                        { text: " うたせ、", reading: " utase" },
                        { text: " しけい", reading: " shikei" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " しよう", reading: " shiyou" },
                        { text: "と", reading: "to", particle: true },
                        { text: "しました。", reading: " shimashita" }
                    ],
                    [
                        { text: "せばすてぃあん", reading: "sebasutian", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " おう", reading: " ou" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " すてふぁん", reading: " sutefan", foreignName: true },
                        { text: "を", reading: "o", particle: true },
                        { text: " すくう", reading: " sukuu" },
                        { text: "よう", reading: "you" },
                        { text: " たのみました。", reading: " tanomimashita" }
                    ],
                    [
                        { text: "おう", reading: "ou" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "を", reading: "o", particle: true },
                        { text: " あとつぎ", reading: " atotsugi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " えらび、", reading: " erabi" },
                        { text: " すてふぁん", reading: " sutefan", foreignName: true },
                        { text: "を", reading: "o", particle: true },
                        { text: " じゆう", reading: " jiyuu" },
                        { text: "に", reading: "ni", particle: true },
                        { text: "しました。", reading: " shimashita" }
                    ],
                    [
                        { text: "しかとら", reading: "shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " きりすときょう", reading: " kirisutokyou" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " したがう", reading: " shitagau" },
                        { text: "こと", reading: "koto" },
                        { text: "を", reading: "o", particle: true },
                        { text: " きめました。", reading: " kimemashita" }
                    ],
                    [
                        { text: "しかとら", reading: "shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " せんれい", reading: " senrei" },
                        { text: "を", reading: "o", particle: true },
                        { text: " うけ、", reading: " uke" },
                        { text: " しもん", reading: " shimon", foreignName: true },
                        { text: "という", reading: "toiu" },
                        { text: " なまえ", reading: " namae" },
                        { text: "を", reading: "o", particle: true },
                        { text: " もらいました。", reading: " moraimashita" }
                    ]
                ]
            },
            {
                chapterNumber: 4,
                title: "Wierność Szymona",
                verseTranslations: [
                    "Szymon, przybrany syn Sikatondona, był chrześcijaninem.",
                    "Nie wyrzekł się wiary i spędził dwa lata w więzieniu.",
                    "Król wezwał Szymona z powrotem z więzienia.",
                    "Gdy wojsko Sikatondona znalazło się w niebezpieczeństwie, Szymon ocalił przybranego ojca.",
                    "Szymon oddał życie, a król Siwan przyjął chrzest i imię Franciszek."
                ],
                verses: [
                    [
                        { text: "しもん", reading: "shimon", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとんどの", reading: " shikatondono" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ようし", reading: " youshi" },
                        { text: "で、", reading: "de", particle: true },
                        { text: " きりすときょう", reading: " kirisutokyou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " しんじていました。", reading: " shinjiteimashita" }
                    ],
                    [
                        { text: "しもん", reading: "shimon", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しんこう", reading: " shinkou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " すてず、", reading: " sutezu" },
                        { text: " ろうや", reading: " rouya" },
                        { text: "で", reading: "de", particle: true },
                        { text: " ふたとせ", reading: " futatose" },
                        { text: "を", reading: "o", particle: true },
                        { text: " すごしました。", reading: " sugoshimashita" }
                    ],
                    [
                        { text: "おう", reading: "ou" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しもん", reading: " shimon", foreignName: true },
                        { text: "を", reading: "o", particle: true },
                        { text: " ろうや", reading: " rouya" },
                        { text: "から", reading: "kara", particle: true },
                        { text: " よびもどしました。", reading: " yobimodoshimashita" }
                    ],
                    [
                        { text: "たたかい", reading: "tatakai" },
                        { text: "で", reading: "de", particle: true },
                        { text: " しかとんどの", reading: " shikatondono" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ぐん", reading: " gun" },
                        { text: "が", reading: "ga", particle: true },
                        { text: " きけん", reading: " kiken" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " なり、", reading: " nari" },
                        { text: " しもん", reading: " shimon", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " ちち", reading: " chichi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " すくいました。", reading: " sukuimashita" }
                    ],
                    [
                        { text: "しもん", reading: "shimon", foreignName: true },
                        { text: "は", reading: "wa", particle: true },
                        { text: " いのち", reading: " inochi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " おとしましたが、", reading: " otoshimashitaga" },
                        { text: " しわん", reading: " shiwan" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " ふらんしす", reading: " furanshisu", foreignName: true },
                        { text: "の", reading: "no", particle: true },
                        { text: " な", reading: " na" },
                        { text: "で", reading: "de", particle: true },
                        { text: " せんれい", reading: " senrei" },
                        { text: "を", reading: "o", particle: true },
                        { text: " うけました。", reading: " ukemashita" }
                    ]
                ]
            }
        ]
    },
    {
        key: "rosary",
        title: "Modlitwy różańcowe",
        source: "Tradycyjny katolicki tekst japoński (kanji i hiragana): seibo-archive.com, \"Prayers of the Rosary in Japanese\"",
        chapters: [
            {
                chapterNumber: 1,
                title: "Znak Krzyża: 十字架（じゅうじか）のしるし",
                verseTranslations: [
                    "W imię Ojca i Syna, i Ducha Świętego. Amen."
                ],
                verses: [
                    [
                        { text: "ちち", reading: "chichi" },
                        { text: "と", reading: "to", particle: true },
                        { text: " こ", reading: " ko" },
                        { text: "と", reading: "to", particle: true },
                        { text: " せいれい", reading: " seirei" },
                        { text: "と", reading: "to", particle: true },
                        { text: "の", reading: "no", particle: true },
                        { text: " みな", reading: " mina" },
                        { text: "に", reading: "ni", particle: true },
                        { text: "より", reading: "yori", particle: true },
                        { text: "て。", reading: "te", particle: true },
                        { text: " あーめん。", reading: " aamen" }
                    ]
                ]
            },
            {
                chapterNumber: 2,
                title: "Skład Apostolski: 使徒信経（しとしんきょう）",
                verseTranslations: [
                    "Wierzę w Boga, Ojca wszechmogącego, Stworzyciela nieba i ziemi, i w Jezusa Chrystusa, Syna Jego jedynego, Pana naszego, który się począł z Ducha Świętego, narodził się z Maryi Panny,",
                    "umęczon pod Ponckim Piłatem, ukrzyżowan, umarł i pogrzebion, zstąpił do piekieł, trzeciego dnia zmartwychwstał,",
                    "wstąpił na niebiosa, siedzi po prawicy Boga, Ojca wszechmogącego, stamtąd przyjdzie sądzić żywych i umarłych.",
                    "Wierzę w Ducha Świętego, święty Kościół powszechny, świętych obcowanie, grzechów odpuszczenie, ciała zmartwychwstanie, żywot wieczny. Amen."
                ],
                verses: [
                    [
                        { text: "われ", reading: "ware" },
                        { text: "は、", reading: "wa", particle: true },
                        { text: " てんち", reading: " tenchi" },
                        { text: "の", reading: "no", particle: true },
                        { text: " そうぞうしゅ、", reading: " souzoushu" },
                        { text: " ぜんのう", reading: " zennou" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ちちなる", reading: " chichinaru" },
                        { text: " てんしゅ", reading: " tenshu" },
                        { text: "を", reading: "o", particle: true },
                        { text: " しんじ、", reading: " shinji" },
                        { text: " また", reading: " mata" },
                        { text: " その", reading: " sono" },
                        { text: " おんひとりご、", reading: " onhitorigo" },
                        { text: "われら", reading: "warera" },
                        { text: "の", reading: "no", particle: true },
                        { text: " しゅ", reading: " shu" },
                        { text: " いえずす・きりすと、", reading: " iezusukirisuto", foreignName: true },
                        { text: "すなわち、", reading: "sunawachi" },
                        { text: " せいれい", reading: " seirei" },
                        { text: "に", reading: "ni", particle: true },
                        { text: "より", reading: "yori", particle: true },
                        { text: "て", reading: "te", particle: true },
                        { text: " やどり、", reading: " yadori" },
                        { text: " どうてい", reading: " doutei" },
                        { text: " まりあ", reading: " maria", foreignName: true },
                        { text: "より", reading: "yori", particle: true },
                        { text: " うまれ、", reading: " umare" }
                    ],
                    [
                        { text: "ぽんしお・ぴらと", reading: "ponshiopirato", foreignName: true },
                        { text: "の", reading: "no", particle: true },
                        { text: " かんか", reading: " kanka" },
                        { text: "にて", reading: "nite", particle: true },
                        { text: " くるしみ", reading: " kurushimi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " うけ、", reading: " uke" },
                        { text: "じゅうじか", reading: "juujika" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " つけられ、", reading: " tsukerare" },
                        { text: " しし", reading: " shishi" },
                        { text: "て", reading: "te", particle: true },
                        { text: " ほうむられ、", reading: " houmurare" },
                        { text: " こせいしょ", reading: " koseisho" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " くだりて", reading: " kudarite" },
                        { text: " みっかめ", reading: " mikkame" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " ししゃ", reading: " shisha" },
                        { text: "の", reading: "no", particle: true },
                        { text: " うち", reading: " uchi" },
                        { text: "より", reading: "yori", particle: true },
                        { text: " よみがえり、", reading: " yomigaeri" }
                    ],
                    [
                        { text: "てん", reading: "ten" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " のぼりて", reading: " noborite" },
                        { text: " ぜんのう", reading: " zennou" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ちちなる", reading: " chichinaru" },
                        { text: " てんしゅ", reading: " tenshu" },
                        { text: "の", reading: "no", particle: true },
                        { text: " みぎ", reading: " migi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " ざし、", reading: " zashi" },
                        { text: " かしこ", reading: " kashiko" },
                        { text: "より", reading: "yori", particle: true },
                        { text: " いける", reading: " ikeru" },
                        { text: " ひと", reading: " hito" },
                        { text: "と", reading: "to", particle: true },
                        { text: " しせる", reading: " shiseru" },
                        { text: " ひと", reading: " hito" },
                        { text: "と", reading: "to", particle: true },
                        { text: "を", reading: "o", particle: true },
                        { text: " さばかん", reading: " sabakan" },
                        { text: " ため", reading: " tame" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " きたりたもう", reading: " kitaritamou" },
                        { text: " しゅ", reading: " shu" },
                        { text: "を", reading: "o", particle: true },
                        { text: " しんじたてまつる。", reading: " shinjitatematsuru" }
                    ],
                    [
                        { text: "われ", reading: "ware" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " せいれい、", reading: " seirei" },
                        { text: " せいなる", reading: " seinaru" },
                        { text: " こうきょうかい、", reading: " koukyoukai" },
                        { text: " しょせいじん", reading: " shoseijin" },
                        { text: "の", reading: "no", particle: true },
                        { text: " つうこう、", reading: " tsuukou" },
                        { text: " つみ", reading: " tsumi" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ゆるし、", reading: " yurushi" },
                        { text: " にくしん", reading: " nikushin" },
                        { text: "の", reading: "no", particle: true },
                        { text: " よみがえり、", reading: " yomigaeri" },
                        { text: " おわりなき", reading: " owarinaki" },
                        { text: " いのち", reading: " inochi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " しんじたてまつる。", reading: " shinjitatematsuru" },
                        { text: " あーめん。", reading: " aamen" }
                    ]
                ]
            },
            {
                chapterNumber: 3,
                title: "Ojcze nasz: 主祷文（しゅとうぶん）",
                verseTranslations: [
                    "Ojcze nasz, któryś jest w niebie, święć się imię Twoje, przyjdź królestwo Twoje, bądź wola Twoja jako w niebie tak i na ziemi.",
                    "Chleba naszego powszedniego daj nam dzisiaj,",
                    "i odpuść nam nasze winy, jako i my odpuszczamy naszym winowajcom.",
                    "I nie wódź nas na pokuszenie, ale nas zbaw ode złego. Amen."
                ],
                verses: [
                    [
                        { text: "てん", reading: "ten" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " まします", reading: " mashimasu" },
                        { text: " われら", reading: " warera" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ちち", reading: " chichi" },
                        { text: "よ、", reading: "yo", particle: true },
                        { text: " ねがわく", reading: " negawaku" },
                        { text: "は、", reading: "wa", particle: true },
                        { text: " みな", reading: " mina" },
                        { text: "の", reading: "no", particle: true },
                        { text: " とうとまれん", reading: " toutomaren" },
                        { text: " こと", reading: " koto" },
                        { text: "を、", reading: "o", particle: true },
                        { text: " みくに", reading: " mikuni" },
                        { text: "の", reading: "no", particle: true },
                        { text: " きたらん", reading: " kitaran" },
                        { text: " こと", reading: " koto" },
                        { text: "を、", reading: "o", particle: true },
                        { text: " みむね", reading: " mimune" },
                        { text: "の", reading: "no", particle: true },
                        { text: " てん", reading: " ten" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " おこなわるる", reading: " okonawaruru" },
                        { text: " ごとく、", reading: " gotoku" },
                        { text: "ち", reading: "chi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: "も", reading: "mo", particle: true },
                        { text: " おこなわれん", reading: " okonawaren" },
                        { text: " こと", reading: " koto" },
                        { text: "を。", reading: "o", particle: true }
                    ],
                    [
                        { text: "われら", reading: "warera" },
                        { text: "の", reading: "no", particle: true },
                        { text: " にちよう", reading: " nichiyou" },
                        { text: "の", reading: "no", particle: true },
                        { text: " かて", reading: " kate" },
                        { text: "を、", reading: "o", particle: true },
                        { text: " こんにち", reading: " konnichi" },
                        { text: " われら", reading: " warera" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " あたえたまえ。", reading: " ataetamae" }
                    ],
                    [
                        { text: "われら", reading: "warera" },
                        { text: "が", reading: "ga", particle: true },
                        { text: " ひと", reading: " hito" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " ゆるす", reading: " yurusu" },
                        { text: " ごとく、", reading: " gotoku" },
                        { text: "われら", reading: "warera" },
                        { text: "の", reading: "no", particle: true },
                        { text: " つみ", reading: " tsumi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " ゆるしたまえ。", reading: " yurushitamae" }
                    ],
                    [
                        { text: "われら", reading: "warera" },
                        { text: "を", reading: "o", particle: true },
                        { text: " こころみ", reading: " kokoromi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " ひきたまわざれ、", reading: " hikitamawazare" },
                        { text: "われら", reading: "warera" },
                        { text: "を", reading: "o", particle: true },
                        { text: " あく", reading: " aku" },
                        { text: "より", reading: "yori", particle: true },
                        { text: " すくいたまえ。", reading: " sukuitamae" },
                        { text: " あーめん。", reading: " aamen" }
                    ]
                ]
            },
            {
                chapterNumber: 4,
                title: "Zdrowaś Maryjo: 天使祝詞（てんししゅくし）",
                verseTranslations: [
                    "Zdrowaś Maryjo, łaski pełna, Pan z Tobą.",
                    "Błogosławionaś Ty między niewiastami, i błogosławiony owoc żywota Twojego, Jezus.",
                    "Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen."
                ],
                verses: [
                    [
                        { text: "めでたし、", reading: "medetashi" },
                        { text: " せいちょう", reading: " seichou" },
                        { text: "みちみてる", reading: "michimiteru" },
                        { text: " まりあ、", reading: " maria", foreignName: true },
                        { text: " しゅ", reading: " shu" },
                        { text: " おんみ", reading: " onmi" },
                        { text: "と", reading: "to", particle: true },
                        { text: " とも", reading: " tomo" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " まします。", reading: " mashimasu" }
                    ],
                    [
                        { text: "おんみ", reading: "onmi" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " おんな", reading: " onna" },
                        { text: "の", reading: "no", particle: true },
                        { text: " うち", reading: " uchi" },
                        { text: "にて", reading: "nite", particle: true },
                        { text: " しゅくせられ、", reading: " shukuserare" },
                        { text: " ごたいない", reading: " gotainai" },
                        { text: "の", reading: "no", particle: true },
                        { text: " おんこ", reading: " onko" },
                        { text: " いえずす", reading: " iezusu", foreignName: true },
                        { text: "も", reading: "mo", particle: true },
                        { text: " しゅくせられたもう。", reading: " shukuseraretamou" } //shukuserare tamou
                    ],
                    [
                        { text: "てんしゅ", reading: "tenshu" },
                        { text: "の", reading: "no", particle: true },
                        { text: " おんはは", reading: " onhaha" },
                        { text: " せい", reading: " sei" },
                        { text: " まりあ、", reading: " maria", foreignName: true },
                        { text: " つみびとなる", reading: " tsumibitonaru" }, //tsumibito naru
                        { text: " われら", reading: " warera" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ため", reading: " tame" },
                        { text: "に、", reading: "ni", particle: true },
                        { text: " いま", reading: " ima" },
                        { text: "も", reading: "mo", particle: true },
                        { text: " りんじゅう", reading: " rinjuu" },
                        { text: "の", reading: "no", particle: true },
                        { text: " とき", reading: " toki" },
                        { text: "も", reading: "mo", particle: true },
                        { text: " いのりたまえ。", reading: " inoritamae" }, //inori tamae
                        { text: " あーめん。", reading: " aamen" }
                    ]
                ]
            },
            {
                chapterNumber: 5,
                title: "Chwała Ojcu: 栄唱（えいしょう）",
                verseTranslations: [
                    "Chwała Ojcu i Synowi, i Duchowi Świętemu,",
                    "jak była na początku, teraz i zawsze, i na wieki wieków. Amen."
                ],
                verses: [
                    [
                        { text: "ねがわく", reading: "negawaku" },
                        { text: "は、", reading: "wa", particle: true },
                        { text: " ちち", reading: " chichi" },
                        { text: "と", reading: "to", particle: true },
                        { text: " こ", reading: " ko" },
                        { text: "と", reading: "to", particle: true },
                        { text: " せいれい", reading: " seirei" },
                        { text: "と", reading: "to", particle: true },
                        { text: "に", reading: "ni", particle: true },
                        { text: " さかえあらん", reading: " sakaearan" },
                        { text: " こと", reading: " koto" },
                        { text: "を。", reading: "o", particle: true }
                    ],
                    [
                        { text: "はじめ", reading: "hajime" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " ありし", reading: " arishi" },
                        { text: " ごとく、", reading: " gotoku" },
                        { text: " いま", reading: " ima" },
                        { text: "も", reading: "mo", particle: true },
                        { text: " いつも", reading: " itsumo" },
                        { text: " よよ", reading: " yoyo" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " いたる", reading: " itaru" },
                        { text: "まで。", reading: "made", particle: true },
                        { text: " あーめん。", reading: " aamen" }
                    ]
                ]
            },
            {
                chapterNumber: 6,
                title: "Modlitwa Fatimska: ファティマの祈り（ふぁてぃまのいのり）",
                verseTranslations: [
                    "O mój Jezu, przebacz nam nasze grzechy.",
                    "Zachowaj nas od ognia piekielnego.",
                    "Zaprowadź do nieba wszystkie dusze, szczególnie te, które najbardziej potrzebują Twojego miłosierdzia."
                ],
                verses: [
                    [
                        { text: "ああ、", reading: "aa" },
                        { text: " いえずす", reading: " iezusu", foreignName: true },
                        { text: "よ、", reading: "yo", particle: true },
                        { text: " われら", reading: " warera" },
                        { text: "の", reading: "no", particle: true },
                        { text: " つみ", reading: " tsumi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " ゆるしたまえ。", reading: " yurushitamae" } //yurushi tamae
                    ],
                    [
                        { text: "われら", reading: "warera" },
                        { text: "を", reading: "o", particle: true },
                        { text: " じごく", reading: " jigoku" },
                        { text: "の", reading: "no", particle: true },
                        { text: " ひ", reading: " hi" },
                        { text: "より", reading: "yori", particle: true },
                        { text: " まもりたまえ。", reading: " mamoritamae" } //mamori tamae
                    ],
                    [
                        { text: "また", reading: "mata" },
                        { text: " すべて", reading: " subete" },
                        { text: "の", reading: "no", particle: true },
                        { text: " れいこん、", reading: " reikon" },
                        { text: " ことに", reading: " kotoni" },
                        { text: " しゅ", reading: " shu" },
                        { text: "の", reading: "no", particle: true },
                        { text: " おんあわれみ", reading: " onawaremi" },
                        { text: "を", reading: "o", particle: true },
                        { text: " もっとも", reading: " mottomo" },
                        { text: " ひつよう", reading: " hitsuyou" },
                        { text: "と", reading: "to", particle: true },
                        { text: " する", reading: " suru" },
                        { text: " れいこん", reading: " reikon" },
                        { text: "を", reading: "o", particle: true },
                        { text: " てんごく", reading: " tengoku" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " みちびきたまえ。", reading: " michibikitamae" } //michibiki tamae
                    ]
                ]
            }
        ]
    },
];

global.KanaData = {
    hiragana,
    katakana,
    rowsDefMap,
    supplementalRows,
    foreignKatakanaRows,
    foreignKatakanaColumns,
    dakuonAlternativeSpellings,
    readingParticleMeanings,
    readingCharacterNames,
    readingStories
};
})(window);
