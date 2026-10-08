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
    "わ": "wa", "を": "wo",
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
    "ワ": "wa", "ヲ": "wo",
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

const dakuonAlternativeSpellings = {
    "じ": ["zi"],
    "ぢ": ["di"],
    "づ": ["du"],
    "ジ": ["zi"],
    "ヂ": ["di"],
    "ヅ": ["du"]
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
                translation: "Dawno, dawno temu, niedaleko gór mieszkali starszy pan i starsza pani. Pewnego dnia starsza pani znalazła w rzece wielką brzoskwinię. Z brzoskwini narodził się zdrowy chłopiec. Starsza para nazwała go Momotarō.",
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
                translation: "Gdy Momotarō dorósł, postanowił wyruszyć na wyspę demonów. Starsza pani przygotowała dla niego kuleczki z prosa. Po drodze spotkał psa, małpę i bażanta. Każde z nich dostało kuleczkę i dołączyło do jego drużyny.",
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
                translation: "Wszyscy wsiedli na łódź i popłynęli na wyspę demonów. Kiedy dotarli na wyspę, pojawiły się demony. Momotarō i jego przyjaciele połączyli siły i zwyciężyli. Zabrali skarby i wrócili do wioski, gdzie mieszkańcy serdecznie ich powitali.",
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
        key: "queens-nephew",
        title: "Siostrzeniec królowej",
        source: "Autorskie, krótkie streszczenie na podstawie The Queen's Nephew (1896), Joseph Spillmann",
        chapters: [
            {
                chapterNumber: 1,
                title: "Wybór Sikatory",
                translation: "W Bungo na Kiusiu żył król Siwan. Jego siostrzeniec Sikatora dorastał na dworze królewskim. Poznał księcia Sebastiana i młodego Stefana, którzy wierzyli w chrześcijaństwo. Ciotka chciała, by Sikatora został potężnym władcą, ale on wybrał swoją wiarę. Stefan nie wyrzekł się wiary mimo cierpienia, a Sebastian stanął w jego obronie. Król wybrał Sikatorę na następcę, a Sikatora przyjął chrzest. Później także król przyjął chrześcijaństwo i nastał czas pokoju.",
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
                        { text: " おい、", reading: " oi" },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " おば", reading: " oba" },
                        { text: "の", reading: "no", particle: true },
                        { text: " もと", reading: " moto" },
                        { text: "で", reading: "de", particle: true },
                        { text: " そだちました。", reading: " sodachimashita" }
                    ],
                    [
                        { text: "おうじ", reading: "ouji" },
                        { text: " せばすちゃん", reading: " sebasuchan" },
                        { text: "と", reading: "to", particle: true },
                        { text: " しょうねん", reading: " shounen" },
                        { text: " すてふぁん", reading: " sutefan" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " きりすときょう", reading: " kirisutokyou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " しんじていました。", reading: " shinjiteimashita" }
                    ],
                    [
                        { text: "おば", reading: "oba" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " くに", reading: " kuni" },
                        { text: "を", reading: "o", particle: true },
                        { text: " おさめる", reading: " osameru" },
                        { text: " おう", reading: " ou" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " なってほしい", reading: " nattehoshii" },
                        { text: "と", reading: "to", particle: true },
                        { text: " いいました。", reading: " iimashita" }
                    ],
                    [
                        { text: "しかし、", reading: "shikashi" },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しんこう", reading: " shinkou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " えらびました。", reading: " erabimashita" }
                    ],
                    [
                        { text: "すてふぁん", reading: "sutefan" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しんこう", reading: " shinkou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " すてず、", reading: " sutezu" },
                        { text: " せばすちゃん", reading: " sebasuchan" },
                        { text: "も", reading: "mo", particle: true },
                        { text: " かれ", reading: " kare" },
                        { text: "を", reading: "o", particle: true },
                        { text: " まもりました。", reading: " mamorimashita" }
                    ],
                    [
                        { text: "おう", reading: "ou" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "を", reading: "o", particle: true },
                        { text: " あとつぎ", reading: " atotsugi" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " えらびました。", reading: " erabimashita" },
                        { text: " しかとら", reading: " shikatora" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " せんきょうし", reading: " senkyoushi" },
                        { text: "から", reading: "kara", particle: true },
                        { text: " せんれい", reading: " senrei" },
                        { text: "を", reading: "o", particle: true },
                        { text: " うけました。", reading: " ukemashita" }
                    ],
                    [
                        { text: "のちに、", reading: "nochini" },
                        { text: " しわん", reading: " shiwan" },
                        { text: "も", reading: "mo", particle: true },
                        { text: " きりすときょう", reading: " kirisutokyou" },
                        { text: "を", reading: "o", particle: true },
                        { text: " うけいれました。", reading: " ukeiremashita" },
                        { text: " くに", reading: " kuni" },
                        { text: "は", reading: "wa", particle: true },
                        { text: " へいわ", reading: " heiwa" },
                        { text: "に", reading: "ni", particle: true },
                        { text: " なりました。", reading: " narimashita" }
                    ]
                ]
            }
        ]
    }
];

global.KanaData = { hiragana, katakana, rowsDefMap, supplementalRows, dakuonAlternativeSpellings, readingStories };
})(window);
