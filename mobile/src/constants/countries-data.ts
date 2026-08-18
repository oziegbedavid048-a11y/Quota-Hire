export interface CountryData {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  cities: string[];
}

export const COUNTRIES_DATA: CountryData[] = [
  {
    name: "Nigeria",
    code: "NG",
    dialCode: "+234",
    flag: "🇳🇬",
    cities: [
      "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Benin City", "Enugu", "Kaduna",
      "Calabar", "Asaba", "Warri", "Jos", "Owerri", "Abeokuta", "Uyo", "Akure", "Ilorin",
      "Maiduguri", "Zaria", "Aba", "Onitsha", "Sokoto", "Minna", "Bauchi", "Lokoja", "Yola"
    ]
  },
  {
    name: "United States",
    code: "US",
    dialCode: "+1",
    flag: "🇺🇸",
    cities: [
      "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio",
      "San Diego", "Dallas", "Austin", "San Jose", "San Francisco", "Seattle", "Denver",
      "Washington D.C.", "Boston", "Atlanta", "Miami", "Nashville", "Las Vegas", "Portland",
      "Charlotte", "Orlando", "Detroit", "Minneapolis", "Tampa", "Salt Lake City", "Raleigh"
    ]
  },
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    flag: "🇬🇧",
    cities: [
      "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Leeds", "Bristol",
      "Liverpool", "Sheffield", "Newcastle", "Belfast", "Cardiff", "Nottingham", "Southampton",
      "Oxford", "Cambridge", "Brighton", "Leicester", "Coventry", "Aberdeen", "York", "Bath"
    ]
  },
  {
    name: "Canada",
    code: "CA",
    dialCode: "+1",
    flag: "🇨🇦",
    cities: [
      "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Quebec City",
      "Winnipeg", "Halifax", "Victoria", "Hamilton", "Kitchener", "London", "Surrey", "Mississauga"
    ]
  },
  {
    name: "Ghana",
    code: "GH",
    dialCode: "+233",
    flag: "🇬🇭",
    cities: [
      "Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Sunyani", "Cape Coast", "Koforidua",
      "Tema", "Ho", "Techiman", "Obuasi", "Kasoa", "Bolgatanga", "Wa"
    ]
  },
  {
    name: "Kenya",
    code: "KE",
    dialCode: "+254",
    flag: "🇰🇪",
    cities: [
      "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale",
      "Garissa", "Kakamega", "Nyeri", "Machakos", "Meru", "Naivasha"
    ]
  },
  {
    name: "South Africa",
    code: "ZA",
    dialCode: "+27",
    flag: "🇿🇦",
    cities: [
      "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein",
      "East London", "Sandton", "Soweto", "Polokwane", "Nelspruit", "Pietermaritzburg", "Kimberley"
    ]
  },
  {
    name: "Germany",
    code: "DE",
    dialCode: "+49",
    flag: "🇩🇪",
    cities: [
      "Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Stuttgart", "Düsseldorf",
      "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg", "Bonn"
    ]
  },
  {
    name: "France",
    code: "FR",
    dialCode: "+33",
    flag: "🇫🇷",
    cities: [
      "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
      "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon", "Grenoble"
    ]
  },
  {
    name: "India",
    code: "IN",
    dialCode: "+91",
    flag: "🇮🇳",
    cities: [
      "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
      "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Chandigarh", "Indore", "Kochi", "Noida", "Gurugram"
    ]
  },
  {
    name: "Australia",
    code: "AU",
    dialCode: "+61",
    flag: "🇦🇺",
    cities: [
      "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast",
      "Hobart", "Darwin", "Newcastle", "Cairns", "Geelong", "Townsville", "Wollongong"
    ]
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    dialCode: "+971",
    flag: "🇦🇪",
    cities: [
      "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"
    ]
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    dialCode: "+966",
    flag: "🇸🇦",
    cities: [
      "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Dhahran", "Abha", "Taif"
    ]
  },
  {
    name: "Ireland",
    code: "IE",
    dialCode: "+353",
    flag: "🇮🇪",
    cities: [
      "Dublin", "Cork", "Galway", "Limerick", "Waterford", "Drogheda", "Dundalk", "Swords", "Bray"
    ]
  },
  {
    name: "Netherlands",
    code: "NL",
    dialCode: "+31",
    flag: "🇳🇱",
    cities: [
      "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg",
      "Almere", "Breda", "Nijmegen", "Haarlem", "Arnhem", "Maastricht"
    ]
  },
  {
    name: "Spain",
    code: "ES",
    dialCode: "+34",
    flag: "🇪🇸",
    cities: [
      "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia",
      "Palma", "Las Palmas", "Bilbao", "Alicante", "Cordoba", "Valladolid"
    ]
  },
  {
    name: "Italy",
    code: "IT",
    dialCode: "+39",
    flag: "🇮🇹",
    cities: [
      "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence",
      "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste"
    ]
  },
  {
    name: "Switzerland",
    code: "CH",
    dialCode: "+41",
    flag: "🇨🇭",
    cities: [
      "Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Lucerne", "St. Gallen", "Lugano", "Winterthur"
    ]
  },
  {
    name: "Sweden",
    code: "SE",
    dialCode: "+46",
    flag: "🇸🇪",
    cities: [
      "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg"
    ]
  },
  {
    name: "Norway",
    code: "NO",
    dialCode: "+47",
    flag: "🇳🇴",
    cities: [
      "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", "Kristiansand", "Drammen", "Tromsø"
    ]
  },
  {
    name: "Denmark",
    code: "DK",
    dialCode: "+45",
    flag: "🇩🇰",
    cities: [
      "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens"
    ]
  },
  {
    name: "Finland",
    code: "FI",
    dialCode: "+358",
    flag: "🇫🇮",
    cities: [
      "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti", "Kuopio"
    ]
  },
  {
    name: "Poland",
    code: "PL",
    dialCode: "+48",
    flag: "🇵🇱",
    cities: [
      "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice"
    ]
  },
  {
    name: "Portugal",
    code: "PT",
    dialCode: "+351",
    flag: "🇵🇹",
    cities: [
      "Lisbon", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", "Funchal", "Coimbra", "Setúbal", "Aveiro", "Faro"
    ]
  },
  {
    name: "Belgium",
    code: "BE",
    dialCode: "+32",
    flag: "🇧🇪",
    cities: [
      "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons"
    ]
  },
  {
    name: "Austria",
    code: "AT",
    dialCode: "+43",
    flag: "🇦🇹",
    cities: [
      "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels"
    ]
  },
  {
    name: "New Zealand",
    code: "NZ",
    dialCode: "+64",
    flag: "🇳🇿",
    cities: [
      "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier-Hastings", "Dunedin", "Palmerston North"
    ]
  },
  {
    name: "Singapore",
    code: "SG",
    dialCode: "+65",
    flag: "🇸🇬",
    cities: [
      "Singapore", "Jurong", "Tampines", "Woodlands", "Bedok", "Ang Mo Kio", "Yishun"
    ]
  },
  {
    name: "Malaysia",
    code: "MY",
    dialCode: "+60",
    flag: "🇲🇾",
    cities: [
      "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam", "Petaling Jaya", "Kuching", "Kota Kinabalu", "Malacca"
    ]
  },
  {
    name: "Rwanda",
    code: "RW",
    dialCode: "+250",
    flag: "🇷🇼",
    cities: [
      "Kigali", "Butare", "Gisenyi", "Ruhengeri", "Gitarama", "Byumba", "Cyangugu", "Kibuye"
    ]
  },
  {
    name: "Uganda",
    code: "UG",
    dialCode: "+256",
    flag: "🇺🇬",
    cities: [
      "Kampala", "Entebbe", "Gulu", "Jinja", "Mbarara", "Mbale", "Masaka", "Kasese", "Lira"
    ]
  },
  {
    name: "Tanzania",
    code: "TZ",
    dialCode: "+255",
    flag: "🇹🇿",
    cities: [
      "Dar es Salaam", "Dodoma", "Mwanza", "Arusha", "Mbeya", "Morogoro", "Tanga", "Zanzibar City"
    ]
  },
  {
    name: "Egypt",
    code: "EG",
    dialCode: "+20",
    flag: "🇪🇬",
    cities: [
      "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Mansoura", "Tanta", "Asyut"
    ]
  },
  {
    name: "Morocco",
    code: "MA",
    dialCode: "+212",
    flag: "🇲🇦",
    cities: [
      "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan"
    ]
  },
  {
    name: "China",
    code: "CN",
    dialCode: "+86",
    flag: "🇨🇳",
    cities: [
      "Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Chengdu", "Hangzhou", "Wuhan", "Chongqing", "Nanjing", "Xi'an", "Tianjin"
    ]
  },
  {
    name: "Japan",
    code: "JP",
    dialCode: "+81",
    flag: "🇯🇵",
    cities: [
      "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama", "Hiroshima", "Sendai"
    ]
  },
  {
    name: "South Korea",
    code: "KR",
    dialCode: "+82",
    flag: "🇰🇷",
    cities: [
      "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Changwon", "Seongnam"
    ]
  },
  {
    name: "Brazil",
    code: "BR",
    dialCode: "+55",
    flag: "🇧🇷",
    cities: [
      "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"
    ]
  },
  {
    name: "Mexico",
    code: "MX",
    dialCode: "+52",
    flag: "🇲🇽",
    cities: [
      "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "Toluca", "León", "Juárez", "Cancún", "Querétaro", "Mérida"
    ]
  },
  {
    name: "Argentina",
    code: "AR",
    dialCode: "+54",
    flag: "🇦🇷",
    cities: [
      "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "San Miguel de Tucumán", "La Plata", "Mar del Plata", "Salta", "Santa Fe"
    ]
  },
  {
    name: "Chile",
    code: "CL",
    dialCode: "+56",
    flag: "🇨🇱",
    cities: [
      "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Rancagua", "Talca", "Arica", "Puerto Montt"
    ]
  },
  {
    name: "Colombia",
    code: "CO",
    dialCode: "+57",
    flag: "🇨🇴",
    cities: [
      "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Soledad", "Ibagué", "Bucaramanga", "Santa Marta"
    ]
  },
  {
    name: "Indonesia",
    code: "ID",
    dialCode: "+62",
    flag: "🇮🇩",
    cities: [
      "Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", "Semarang", "Tangerang", "Depok", "Palembang", "Makassar", "Denpasar"
    ]
  },
  {
    name: "Philippines",
    code: "PH",
    dialCode: "+63",
    flag: "🇵🇭",
    cities: [
      "Manila", "Quezon City", "Davao City", "Caloocan", "Cebu City", "Zamboanga City", "Taguig", "Pasig", "Makati", "Cagayan de Oro"
    ]
  },
  {
    name: "Pakistan",
    code: "PK",
    dialCode: "+92",
    flag: "🇵🇰",
    cities: [
      "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Peshawar", "Multan", "Islamabad", "Quetta", "Sialkot"
    ]
  },
  {
    name: "Bangladesh",
    code: "BD",
    dialCode: "+880",
    flag: "🇧🇩",
    cities: [
      "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Bogura", "Comilla", "Mymensingh", "Barisal", "Rangpur"
    ]
  },
  {
    name: "Vietnam",
    code: "VN",
    dialCode: "+84",
    flag: "🇻🇳",
    cities: [
      "Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho", "Bien Hoa", "Hue", "Nha Trang", "Vung Tau"
    ]
  },
  {
    name: "Thailand",
    code: "TH",
    dialCode: "+66",
    flag: "🇹🇭",
    cities: [
      "Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Hat Yai", "Udon Thani", "Pak Kret", "Pattaya", "Phuket"
    ]
  },
  {
    name: "Turkey",
    code: "TR",
    dialCode: "+90",
    flag: "🇹🇷",
    cities: [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Sanliurfa", "Mersin"
    ]
  },
  {
    name: "Israel",
    code: "IL",
    dialCode: "+972",
    flag: "🇮🇱",
    cities: [
      "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba", "Holon", "Bnei Brak"
    ]
  },
  {
    name: "Qatar",
    code: "QA",
    dialCode: "+974",
    flag: "🇶🇦",
    cities: [
      "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal", "Al Daayen", "Madinat ash Shamal"
    ]
  },
  {
    name: "Kuwait",
    code: "KW",
    dialCode: "+965",
    flag: "🇰🇼",
    cities: [
      "Kuwait City", "Hawalli", "Salmiya", "Al Ahmadi", "Sabah Al Salem", "Al Farwaniyah", "Fahaheel"
    ]
  },
  {
    name: "Bahrain",
    code: "BH",
    dialCode: "+973",
    flag: "🇧🇭",
    cities: [
      "Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra", "Budaiya"
    ]
  },
  {
    name: "Oman",
    code: "OM",
    dialCode: "+968",
    flag: "🇴🇲",
    cities: [
      "Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Seeb", "Barka", "Rustaq", "Ibri"
    ]
  },
  {
    name: "Cameroon",
    code: "CM",
    dialCode: "+237",
    flag: "🇨🇲",
    cities: [
      "Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua", "Bafoussam", "Ngaoundéré", "Kumba", "Limbe"
    ]
  },
  {
    name: "Ivory Coast",
    code: "CI",
    dialCode: "+225",
    flag: "🇨🇮",
    cities: [
      "Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo", "Man", "Gagnoa"
    ]
  },
  {
    name: "Senegal",
    code: "SN",
    dialCode: "+221",
    flag: "🇸🇳",
    cities: [
      "Dakar", "Touba", "Thiès", "Rufisque", "Kaolack", "M'Bour", "Ziguinchor", "Saint-Louis"
    ]
  },
  {
    name: "Ethiopia",
    code: "ET",
    dialCode: "+251",
    flag: "🇪🇹",
    cities: [
      "Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Adama", "Hawassa", "Bahir Dar", "Jimma", "Dessie"
    ]
  },
  {
    name: "Zambia",
    code: "ZM",
    dialCode: "+260",
    flag: "🇿🇲",
    cities: [
      "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira", "Livingstone", "Luanshya", "Kasama"
    ]
  },
  {
    name: "Zimbabwe",
    code: "ZW",
    dialCode: "+263",
    flag: "🇿🇼",
    cities: [
      "Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", "Kwekwe", "Kadoma", "Masvingo", "Chinhoyi"
    ]
  },
  {
    name: "Hong Kong",
    code: "HK",
    dialCode: "+852",
    flag: "🇭🇰",
    cities: [
      "Hong Kong Island", "Kowloon", "New Territories", "Sha Tin", "Tsuen Wan", "Tuen Mun", "Yuen Long"
    ]
  },
  {
    name: "Taiwan",
    code: "TW",
    dialCode: "+886",
    flag: "🇹🇼",
    cities: [
      "Taipei", "New Taipei", "Kaohsiung", "Taichung", "Tainan", "Taoyuan", "Hsinchu", "Keelung"
    ]
  },
  {
    name: "Greece",
    code: "GR",
    dialCode: "+30",
    flag: "🇬🇷",
    cities: [
      "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Chania", "Rhodes"
    ]
  },
  {
    name: "Czech Republic",
    code: "CZ",
    dialCode: "+420",
    flag: "🇨🇿",
    cities: [
      "Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové"
    ]
  },
  {
    name: "Romania",
    code: "RO",
    dialCode: "+40",
    flag: "🇷🇴",
    cities: [
      "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov", "Galați", "Ploiești"
    ]
  },
  {
    name: "Hungary",
    code: "HU",
    dialCode: "+36",
    flag: "🇭🇺",
    cities: [
      "Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét", "Székesfehérvár"
    ]
  },
  {
    name: "Cyprus",
    code: "CY",
    dialCode: "+357",
    flag: "🇨🇾",
    cities: [
      "Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia", "Ayia Napa", "Protaras"
    ]
  },
  {
    name: "Malta",
    code: "MT",
    dialCode: "+356",
    flag: "🇲🇹",
    cities: [
      "Valletta", "Birkirkara", "Mosta", "Sliema", "Qormi", "Żabbar", "St. Paul's Bay", "Saint Julian's"
    ]
  },
  {
    name: "Luxembourg",
    code: "LU",
    dialCode: "+352",
    flag: "🇱🇺",
    cities: [
      "Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck", "Diekirch", "Wiltz"
    ]
  },
  {
    name: "Iceland",
    code: "IS",
    dialCode: "+354",
    flag: "🇮🇸",
    cities: [
      "Reykjavík", "Kópavogur", "Hafnarfjörður", "Akureyri", "Reykjanesbær", "Garðabær", "Mosfellsbær"
    ]
  },
  {
    name: "Estonia",
    code: "EE",
    dialCode: "+372",
    flag: "🇪🇪",
    cities: [
      "Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere", "Kuressaare"
    ]
  },
  {
    name: "Latvia",
    code: "LV",
    dialCode: "+371",
    flag: "🇱🇻",
    cities: [
      "Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala", "Ventspils", "Rēzekne", "Valmiera"
    ]
  },
  {
    name: "Lithuania",
    code: "LT",
    dialCode: "+370",
    flag: "🇱🇹",
    cities: [
      "Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai"
    ]
  },
  {
    name: "Croatia",
    code: "HR",
    dialCode: "+385",
    flag: "🇭🇷",
    cities: [
      "Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula", "Slavonski Brod", "Karlovac", "Dubrovnik"
    ]
  },
  {
    name: "Slovakia",
    code: "SK",
    dialCode: "+421",
    flag: "🇸🇰",
    cities: [
      "Bratislava", "Košice", "Prešov", "Žilina", "Banská Bystrica", "Nitra", "Trnava", "Martin"
    ]
  },
  {
    name: "Slovenia",
    code: "SI",
    dialCode: "+386",
    flag: "🇸🇮",
    cities: [
      "Ljubljana", "Maribor", "Kranj", "Celje", "Koper", "Novo Mesto", "Velenje", "Nova Gorica"
    ]
  },
  {
    name: "Bulgaria",
    code: "BG",
    dialCode: "+359",
    flag: "🇧🇬",
    cities: [
      "Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven", "Dobrich"
    ]
  },
  {
    name: "Serbia",
    code: "RS",
    dialCode: "+381",
    flag: "🇷🇸",
    cities: [
      "Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo", "Čačak"
    ]
  },
  {
    name: "Ukraine",
    code: "UA",
    dialCode: "+380",
    flag: "🇺🇦",
    cities: [
      "Kyiv", "Kharkiv", "Odesa", "Dnipro", "Donetsk", "Zaporizhzhia", "Lviv", "Kryvyi Rih", "Mykolaiv"
    ]
  },
  {
    name: "Peru",
    code: "PE",
    dialCode: "+51",
    flag: "🇵🇪",
    cities: [
      "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Huancayo", "Iquitos", "Tacna"
    ]
  },
  {
    name: "Sri Lanka",
    code: "LK",
    dialCode: "+94",
    flag: "🇱🇰",
    cities: [
      "Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Jaffna", "Negombo", "Kandy", "Galle", "Kotte"
    ]
  },
  {
    name: "Nepal",
    code: "NP",
    dialCode: "+977",
    flag: "🇳🇵",
    cities: [
      "Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Birgunj", "Dharan", "Hetauda"
    ]
  }
];

/**
 * Returns a list of all countries sorted alphabetically.
 */
export const getAllCountries = (): CountryData[] => {
  return [...COUNTRIES_DATA].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Finds a country by name (case-insensitive).
 */
export const getCountryByName = (name: string): CountryData | undefined => {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  return COUNTRIES_DATA.find(c => c.name.toLowerCase() === lower);
};

/**
 * Finds a country by dialing code (e.g. "+234", "234", "+1").
 */
export const getCountryByDialCode = (dialCode: string): CountryData | undefined => {
  if (!dialCode) return undefined;
  const clean = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  return COUNTRIES_DATA.find(c => c.dialCode === clean);
};

/**
 * Gets cities for a given country name.
 */
export const getCitiesForCountry = (countryName: string): string[] => {
  const country = getCountryByName(countryName);
  if (!country) return [];
  return [...country.cities].sort((a, b) => a.localeCompare(b));
};

/**
 * Strips any leading dialing code (e.g. "+234 " or "+1 ") and returns just the subscriber number.
 */
export const extractSubscriberNumber = (phone: string, currentDialCode?: string): string => {
  if (!phone) return "";
  let clean = phone.trim();
  if (currentDialCode && clean.startsWith(currentDialCode)) {
    return clean.slice(currentDialCode.length).trim();
  }
  // Try matching any dialCode in COUNTRIES_DATA
  for (const c of COUNTRIES_DATA) {
    if (clean.startsWith(c.dialCode)) {
      return clean.slice(c.dialCode.length).trim();
    }
  }
  return clean;
};
