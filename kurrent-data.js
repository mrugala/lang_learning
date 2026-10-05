// Dane do treningu pisma Kurrent (Deutsche Kurrent).
// Litery: klucz -> grupa liter, "reading" to wymowa kurrentowa, a uwagi
// ("note") tylko tam, gdzie coś trzeba realnie wyjaśnić.
// Słowa: niemieckie rzeczowniki (substantive) z rodzajnikiem, więc zawsze
// zaczynają się wielką literą.
window.kurrentLetters = [
    {
        key: "a",
        label: "a",
        items: [
            { char: "a", upper: "A", reading: "a" },
            { char: "b", upper: "B", reading: "b" },
            { char: "c", upper: "C", reading: "c" },
            { char: "d", upper: "D", reading: "d" }
        ]
    },
    {
        key: "e",
        label: "e",
        items: [
            { char: "e", upper: "E", reading: "e" },
            { char: "f", upper: "F", reading: "f" },
            { char: "g", upper: "G", reading: "g" },
            { char: "h", upper: "H", reading: "h" }
        ]
    },
    {
        key: "i",
        label: "i",
        items: [
            { char: "i", upper: "I", reading: "i" },
            { char: "j", upper: "J", reading: "j" },
            { char: "k", upper: "K", reading: "k" },
            { char: "l", upper: "L", reading: "l" }
        ]
    },
    {
        key: "m",
        label: "m",
        items: [
            { char: "m", upper: "M", reading: "m" },
            { char: "n", upper: "N", reading: "n" },
            { char: "o", upper: "O", reading: "o" },
            { char: "p", upper: "P", reading: "p" }
        ]
    },
    {
        key: "q",
        label: "q",
        items: [
            { char: "q", upper: "Q", reading: "kv" },
            { char: "r", upper: "R", reading: "r" },
            { char: "s", upper: "S", reading: "z" },
            { char: "t", upper: "T", reading: "t" }
        ]
    },
    {
        key: "u",
        label: "u",
        items: [
            { char: "u", upper: "U", reading: "u" },
            { char: "v", upper: "V", reading: "f" },
            { char: "w", upper: "W", reading: "w" },
            { char: "x", upper: "X", reading: "ks" }
        ]
    },
    {
        key: "y",
        label: "y",
        items: [
            { char: "y", upper: "Y", reading: "y" },
            { char: "z", upper: "Z", reading: "c", note: "z z ogonkiem (ʒ)" }
        ]
    },
    {
        key: "umlaut",
        label: "ä ö ü",
        items: [
            { char: "ä", upper: "Ä", reading: "ae", variants: ["ae", "ä"] },
            { char: "ö", upper: "Ö", reading: "oe", variants: ["oe", "ö"] },
            { char: "ü", upper: "Ü", reading: "ue", variants: ["ue", "ü"] }
        ]
    },
    {
        key: "eszett",
        label: "ß",
        items: [
            { char: "ß", reading: "ss", variants: ["ss", "sz"], note: "ligatura długiego s (ſ) i z z ogonkiem (ʒ)" }
        ]
    }
];

window.kurrentDecks = [
    {
        key: "haustiere",
        label: "Zwierzęta",
        items: [
            { word: "der Hund", plural: "die Hunde", meaning: "pies" },
            { word: "die Katze", plural: "die Katzen", meaning: "kot" },
            { word: "das Pferd", plural: "die Pferde", meaning: "koń" },
            { word: "die Kuh", plural: "die Kühe", meaning: "krowa" },
            { word: "das Schaf", plural: "die Schafe", meaning: "owca" },
            { word: "die Gans", plural: "die Gänse", meaning: "gęś" },
            { word: "der Vogel", plural: "die Vögel", meaning: "ptak" },
            { word: "der Bär", plural: "die Bären", meaning: "niedźwiedź" }
        ]
    },
    {
        key: "essen",
        label: "Jedzenie",
        items: [
            { word: "der Apfel", plural: "die Äpfel", meaning: "jabłko" },
            { word: "das Brot", plural: "die Brote", meaning: "chleb" },
            { word: "die Butter", plural: "die Butter", meaning: "masło" },
            { word: "der Käse", plural: "die Käse", meaning: "ser" },
            { word: "das Obst", plural: "die Obstsorten", meaning: "owoce" },
            { word: "der Salat", plural: "die Salate", meaning: "sałatka" },
            { word: "die Suppe", plural: "die Suppen", meaning: "zupa" },
            { word: "der Zucker", plural: "die Zucker", meaning: "cukier" }
        ]
    },
    {
        key: "haus",
        label: "Dom",
        items: [
            { word: "das Haus", plural: "die Häuser", meaning: "dom" },
            { word: "die Tür", plural: "die Türen", meaning: "drzwi" },
            { word: "das Fenster", plural: "die Fenster", meaning: "okno" },
            { word: "der Tisch", plural: "die Tische", meaning: "stół" },
            { word: "der Stuhl", plural: "die Stühle", meaning: "krzesło" },
            { word: "das Bett", plural: "die Betten", meaning: "łóżko" },
            { word: "die Lampe", plural: "die Lampen", meaning: "lampa" },
            { word: "der Schlüssel", plural: "die Schlüssel", meaning: "klucz" }
        ]
    },
    {
        key: "natur",
        label: "Natura",
        items: [
            { word: "der Baum", plural: "die Bäume", meaning: "drzewo" },
            { word: "die Blume", plural: "die Blumen", meaning: "kwiat" },
            { word: "das Blatt", plural: "die Blätter", meaning: "liść" },
            { word: "der Wald", plural: "die Wälder", meaning: "las" },
            { word: "der Berg", plural: "die Berge", meaning: "góra" },
            { word: "das Wasser", plural: "die Gewässer", meaning: "woda" },
            { word: "der Mond", plural: "die Monde", meaning: "księżyc" },
            { word: "die Sonne", plural: "die Sonnen", meaning: "słońce" }
        ]
    },
    {
        key: "stadt",
        label: "Miasto",
        items: [
            { word: "die Stadt", plural: "die Städte", meaning: "miasto" },
            { word: "die Straße", plural: "die Straßen", meaning: "ulica" },
            { word: "der Markt", plural: "die Märkte", meaning: "rynek" },
            { word: "die Kirche", plural: "die Kirchen", meaning: "kościół" },
            { word: "die Brücke", plural: "die Brücken", meaning: "most" },
            { word: "der Bahnhof", plural: "die Bahnhöfe", meaning: "dworzec" },
            { word: "das Museum", plural: "die Museen", meaning: "muzeum" },
            { word: "die Schule", plural: "die Schulen", meaning: "szkoła" }
        ]
    },
    {
        key: "schule",
        label: "Szkoła",
        items: [
            { word: "das Buch", plural: "die Bücher", meaning: "książka" },
            { word: "das Heft", plural: "die Hefte", meaning: "zeszyt" },
            { word: "die Feder", plural: "die Federn", meaning: "pióro" },
            { word: "die Tafel", plural: "die Tafeln", meaning: "tablica" },
            { word: "der Bleistift", plural: "die Bleistifte", meaning: "ołówek" },
            { word: "das Lineal", plural: "die Lineale", meaning: "linijka" },
            { word: "der Rucksack", plural: "die Rucksäcke", meaning: "plecak" },
            { word: "die Mappe", plural: "die Mappen", meaning: "teczka" }
        ]
    },
    {
        key: "koerper",
        label: "Ciało",
        items: [
            { word: "der Kopf", plural: "die Köpfe", meaning: "głowa" },
            { word: "das Auge", plural: "die Augen", meaning: "oko" },
            { word: "die Nase", plural: "die Nasen", meaning: "nos" },
            { word: "der Mund", plural: "die Münder", meaning: "usta" },
            { word: "das Ohr", plural: "die Ohren", meaning: "ucho" },
            { word: "die Hand", plural: "die Hände", meaning: "ręka" },
            { word: "der Fuß", plural: "die Füße", meaning: "stopa" },
            { word: "das Haar", plural: "die Haare", meaning: "włosy" }
        ]
    },
    {
        key: "werkzeug",
        label: "Narzędzia",
        items: [
            { word: "der Hammer", plural: "die Hämmer", meaning: "młotek" },
            { word: "die Säge", plural: "die Sägen", meaning: "piła" },
            { word: "der Schraubenzieher", plural: "die Schraubenzieher", meaning: "śrubokręt" },
            { word: "die Zange", plural: "die Zangen", meaning: "kleszcze" },
            { word: "der Nagel", plural: "die Nägel", meaning: "gwóźdź" },
            { word: "das Sägeblatt", plural: "die Sägeblätter", meaning: "brzesnica" },
            { word: "der Kessel", plural: "die Kessel", meaning: "kotel" },
            { word: "der Korb", plural: "die Körbe", meaning: "kosz" }
        ]
    },
    {
        key: "kleidung",
        label: "Ubrania",
        items: [
            { word: "das Kleid", plural: "die Kleider", meaning: "sukienka" },
            { word: "die Hose", plural: "die Hosen", meaning: "spodnie" },
            { word: "der Rock", plural: "die Röcke", meaning: "spódnica / marynarka" },
            { word: "das Hemd", plural: "die Hemden", meaning: "koszula" },
            { word: "der Schuh", plural: "die Schuhe", meaning: "but" },
            { word: "der Hut", plural: "die Hüte", meaning: "kapelusz" },
            { word: "der Mantel", plural: "die Mäntel", meaning: "płaszcz" },
            { word: "der Handschuh", plural: "die Handschuhe", meaning: "rękawica" }
        ]
    },
    {
        key: "obst-gemuese",
        label: "Owoce i warzywa",
        items: [
            { word: "die Birne", plural: "die Birnen", meaning: "gruszka" },
            { word: "die Orange", plural: "die Orangen", meaning: "pomarańcza" },
            { word: "die Zitrone", plural: "die Zitronen", meaning: "cytryna" },
            { word: "die Banane", plural: "die Bananen", meaning: "banan" },
            { word: "der Pfirsich", plural: "die Pfirsiche", meaning: "brzoskwinia" },
            { word: "die Erdbeere", plural: "die Erdbeeren", meaning: "truskawka" },
            { word: "die Kirsche", plural: "die Kirschen", meaning: "wiśnia" },
            { word: "die Traube", plural: "die Trauben", meaning: "winogrono" },
            { word: "die Melone", plural: "die Melonen", meaning: "melon" },
            { word: "die Kartoffel", plural: "die Kartoffeln", meaning: "ziemniak" },
            { word: "die Tomate", plural: "die Tomaten", meaning: "pomidor" },
            { word: "die Karotte", plural: "die Karotten", meaning: "marchew" },
            { word: "der Kohl", plural: "die Kohle", meaning: "kapusta" },
            { word: "die Zwiebel", plural: "die Zwiebeln", meaning: "cebula" },
            { word: "der Knoblauch", plural: "die Knoblauch", meaning: "czosnek" },
            { word: "die Gurke", plural: "die Gurken", meaning: "ogórek" },
            { word: "die Erbse", plural: "die Erbsen", meaning: "groch" },
            { word: "der Pilz", plural: "die Pilze", meaning: "grzyb" },
            { word: "der Spargel", plural: "die Spargel", meaning: "szparagi" }
        ]
    },
    {
        key: "getraenke",
        label: "Napoje",
        items: [
            { word: "das Mineralwasser", plural: "die Mineralwässer", meaning: "woda mineralna" },
            { word: "der Kaffee", plural: "die Kaffees", meaning: "kawa" },
            { word: "der Tee", plural: "die Tees", meaning: "herbata" },
            { word: "die Milch", plural: "die Milche", meaning: "mleko" },
            { word: "der Saft", plural: "die Säfte", meaning: "sok" },
            { word: "das Bier", plural: "die Biere", meaning: "piwo" },
            { word: "der Wein", plural: "die Weine", meaning: "wino" },
            { word: "die Limonade", plural: "die Limonaden", meaning: "lemoniada" },
            { word: "der Sekt", plural: "die Sekte", meaning: "szampan" },
            { word: "der Schnaps", plural: "die Schnäpse", meaning: "wódka" },
            { word: "der Kaffeekanne", plural: "die Kaffeekannen", meaning: "dzbanek do kawy" }
        ]
    },
    {
        key: "schulwaren",
        label: "Przybory szkolne",
        items: [
            { word: "der Kugelschreiber", plural: "die Kugelschreiber", meaning: "długopis" },
            { word: "der Füllstift", plural: "die Füllstifte", meaning: "pióro wieczne" },
            { word: "der Radiergummi", plural: "die Radiergummis", meaning: "gumka do mazania" },
            { word: "der Tuschestift", plural: "die Tuschestifte", meaning: "flamaster" },
            { word: "die Schere", plural: "die Scheren", meaning: "nożyczki" },
            { word: "der Kleber", plural: "die Kleber", meaning: "klej" },
            { word: "das Geodreieck", plural: "die Geodreiecke", meaning: "ekierka" },
            { word: "der Zirkel", plural: "die Zirkel", meaning: "cyrkiel" },
            { word: "der Ordner", plural: "die Ordner", meaning: "segregator" },
            { word: "das Federmäppchen", plural: "die Federmäppchen", meaning: "piórnik" },
            { word: "die Schultasche", plural: "die Schultaschen", meaning: "plecak szkolny" },
            { word: "der Schulranzen", plural: "die Schulranzen", meaning: "tylkojas" },
            { word: "der Farbstift", plural: "die Farbstifte", meaning: "kredka" },
            { word: "die Bastelschere", plural: "die Bastelscheren", meaning: "nożyczki dla dzieci" }
        ]
    },
    {
        key: "buero",
        label: "Biuro",
        items: [
            { word: "der Schreibtisch", plural: "die Schreibtische", meaning: "biurko" },
            { word: "der Bürostuhl", plural: "die Bürostühle", meaning: "fotel biurowy" },
            { word: "der Schrank", plural: "die Schränke", meaning: "szafka" },
            { word: "die Schublade", plural: "die Schubladen", meaning: "szuflada" },
            { word: "der Aktenordner", plural: "die Aktenordner", meaning: "teczka aktowa" },
            { word: "der Hefter", plural: "die Hefter", meaning: "zszywacz" },
            { word: "die Büroklammer", plural: "die Büroklammern", meaning: "spinacz" },
            { word: "der Locher", plural: "die Locher", meaning: "dziurkacz" },
            { word: "die Papierschere", plural: "die Papierscheren", meaning: "nożyczki do papieru" },
            { word: "der Brief", plural: "die Briefe", meaning: "list" },
            { word: "der Umschlag", plural: "die Umschläge", meaning: "koperta" },
            { word: "das Formular", plural: "die Formulare", meaning: "formularz" },
            { word: "die Notiz", plural: "die Notizen", meaning: "notatka" },
            { word: "der Kalender", plural: "die Kalender", meaning: "kalendarz" },
            { word: "der Stempel", plural: "die Stempel", meaning: "pieczęć / stempel" },
            { word: "die Visitenkarte", plural: "die Visitenkarten", meaning: "wizytówka" },
            { word: "das Register", plural: "die Register", meaning: "rejestr / księga" },
            { word: "der Aktenvermerk", plural: "die Aktenvermerke", meaning: "notatka w aktach" }
        ]
    },
    {
        key: "tierzucht",
        label: "Zwierzęta hodowlane",
        items: [
            { word: "der Bulle", plural: "die Bullen", meaning: "byk" },
            { word: "das Kalb", plural: "die Kälber", meaning: "cielę" },
            { word: "der Bock", plural: "die Böcke", meaning: "kozioł" },
            { word: "die Ziege", plural: "die Ziegen", meaning: "koza" },
            { word: "das Schwein", plural: "die Schweine", meaning: "świnia" },
            { word: "das Huhn", plural: "die Hühner", meaning: "kura" },
            { word: "der Hahn", plural: "die Hähne", meaning: "kogut" },
            { word: "die Ente", plural: "die Enten", meaning: "kaczka" },
            { word: "das Kaninchen", plural: "die Kaninchen", meaning: "królik" },
            { word: "der Bienenstock", plural: "die Bienenstöcke", meaning: "ul" },
            { word: "die Biene", plural: "die Bienen", meaning: "pszczoła" },
            { word: "das Geflügel", plural: "die Geflügel", meaning: "drób" }
        ]
    },
    {
        key: "tiere-wild",
        label: "Zwierzęta dzikie",
        items: [
            { word: "der Wolf", plural: "die Wölfe", meaning: "wilk" },
            { word: "der Fuchs", plural: "die Füchse", meaning: "lis" },
            { word: "die Wildkatze", plural: "die Wildkatzen", meaning: "dziki kot" },
            { word: "der Hirsch", plural: "die Hirsche", meaning: "jeleń" },
            { word: "das Reh", plural: "die Rehe", meaning: "sarna" },
            { word: "der Eber", plural: "die Eber", meaning: "dzik" },
            { word: "der Hase", plural: "die Hasen", meaning: "zając" },
            { word: "der Igel", plural: "die Igel", meaning: "jeż" },
            { word: "das Eichhörnchen", plural: "die Eichhörnchen", meaning: "wiewiórka" },
            { word: "die Fledermaus", plural: "die Fledermäuse", meaning: "nietoperz" },
            { word: "der Maulwurf", plural: "die Maulwürfe", meaning: "kret" },
            { word: "die Möwe", plural: "die Möwen", meaning: "mewa" },
            { word: "der Adler", plural: "die Adler", meaning: "orzeł" },
            { word: "die Eule", plural: "die Eulen", meaning: "sowa" },
            { word: "der Barsch", plural: "die Barsche", meaning: "okoń" },
            { word: "die Forelle", plural: "die Forellen", meaning: "pstrąg" }
        ]
    },
    {
        key: "koerper-2",
        label: "Ciało i zdrowie",
        items: [
            { word: "der Hals", plural: "die Hälse", meaning: "gardło / szyja" },
            { word: "die Schulter", plural: "die Schultern", meaning: "ramię" },
            { word: "der Rücken", plural: "die Rücken", meaning: "plecy" },
            { word: "der Bauch", plural: "die Bäuche", meaning: "brzuch" },
            { word: "das Bein", plural: "die Beine", meaning: "noga" },
            { word: "der Finger", plural: "die Finger", meaning: "palec" },
            { word: "die Lippe", plural: "die Lippen", meaning: " warga" },
            { word: "der Zahn", plural: "die Zähne", meaning: "ząb" },
            { word: "die Zunge", plural: "die Zungen", meaning: "język" },
            { word: "das Herz", plural: "die Herzen", meaning: "serce" },
            { word: "die Lunge", plural: "die Lungen", meaning: "płuco" },
            { word: "das Gelenk", plural: "die Gelenke", meaning: "staw" }
        ]
    },
    {
        key: "kirche",
        label: "Kościół katolicki",
        items: [
            { word: "der Altar", plural: "die Altäre", meaning: "ołtarz" },
            { word: "der Kelch", plural: "die Kelche", meaning: "kielich liturgiczny" },
            { word: "die Hostie", plural: "die Hostien", meaning: "hostia" },
            { word: "die Bibel", plural: "die Bibeln", meaning: "Biblia" },
            { word: "das Kreuz", plural: "die Kreuze", meaning: "krzyż" },
            { word: "der Kerzenleuchter", plural: "die Kerzenleuchter", meaning: "świecznik" },
            { word: "das Weihrauchfass", plural: "die Weihrauchfässer", meaning: "kadzielnica" },
            { word: "die Glocke", plural: "die Glocken", meaning: "dzwon" },
            { word: "das Weihwasser", plural: "die Weihwässer", meaning: "woda święcona" },
            { word: "der Weihrauch", plural: "die Weihräucher", meaning: "kadzidło" },
            { word: "die Kerze", plural: "die Kerzen", meaning: "świeca" },
            { word: "das Kirchenlied", plural: "die Kirchenlieder", meaning: "pieśń kościelna" }
        ]
    },
    {
        key: "kirche-sakramenty",
        label: "Sakramenty",
        items: [
            { word: "die Taufe", plural: "die Taufen", meaning: "chrzest" },
            { word: "die Firmung", plural: "die Firmungen", meaning: "bierzmowanie" },
            { word: "die Kommunion", plural: "die Kommunionen", meaning: "Komunia święta" },
            { word: "die Beichte", plural: "die Beichten", meaning: "spowiedź" },
            { word: "die Eucharistie", plural: "die Eucharistien", meaning: "Eucharystia" },
            { word: "die Salbung", plural: "die Salbungen", meaning: "namaszczenie chorych" },
            { word: "die Weihe", plural: "die Weihen", meaning: "święcenia kapłańskie" },
            { word: "die Ersthkommunion", plural: "die Ersthkommunionen", meaning: "pierwsza Komunia" },
            { word: "die Osterkommunion", plural: "die Osterkommunionen", meaning: "Komunia wielkanocna" }
        ]
    },
    {
        key: "kirche-personen",
        label: "Osoby kościelne",
        items: [
            { word: "der Priester", plural: "die Priester", meaning: "kapłan" },
            { word: "der Pater", plural: "die Patres", meaning: "ksiądz katolicki" },
            { word: "der Mönch", plural: "die Mönche", meaning: "zakonnik" },
            { word: "die Nonne", plural: "die Nonnen", meaning: "zakonnica" },
            { word: "der Papst", plural: "die Päpste", meaning: "papież" },
            { word: "der Kardinal", plural: "die Kardinäle", meaning: "kardynał" },
            { word: "der Bischof", plural: "die Bischöfe", meaning: "biskup" },
            { word: "der Erzbischof", plural: "die Erzbischöfe", meaning: "arcybiskup" },
            { word: "der Apostel", plural: "die Apostel", meaning: "apostoł" },
            { word: "die Maria", plural: "die Marien", meaning: "Matka Boska" },
            { word: "der Sohn", plural: "die Söhne", meaning: "Syn Boży" }
        ]
    },
    {
        key: "kirche-inhalte",
        label: "Wiarę i treści",
        items: [
            { word: "der Gott", plural: "die Götter", meaning: "Pan Bóg" },
            { word: "die Messe", plural: "die Messen", meaning: "Msza święta" },
            { word: "die Predigt", plural: "die Predigten", meaning: "kazanie" },
            { word: "das Gebet", plural: "die Gebete", meaning: "modlitwa" },
            { word: "der Glaube", plural: "die Glauben", meaning: "wiara" },
            { word: "die Theologie", plural: "die Theologien", meaning: "teologia" },
            { word: "das Evangelium", plural: "die Evangelien", meaning: "Ewangelia / dobra nowina" },
            { word: "die Auferstehung", plural: "die Auferstehungen", meaning: "zmartwychwstanie" },
            { word: "die Inkarnation", plural: "die Inkarnationen", meaning: "Wcielenie" },
            { word: "das Leiden", plural: "die Leiden", meaning: "męka" },
            { word: "die Opfergabe", plural: "die Opfergaben", meaning: "ofiarowanie / składka" },
            { word: "der Gottesdienst", plural: "die Gottesdienste", meaning: "nabożenstwo" },
            { word: "das Sakrament", plural: "die Sakramente", meaning: "sakrament" },
            { word: "das Opfer", plural: "die Opfer", meaning: "ofiara / poświęcenie" },
            { word: "der Gesang", plural: "die Gesänge", meaning: "pieśń liturgiczna" }
        ]
    }
];
