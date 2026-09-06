export interface CityItem {
  name: string;
  subtitle?: string;
}

export interface CountryData {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  cities: (string | CityItem)[];
}

export const COUNTRIES_DATA: CountryData[] = [
  {
    name: "Nigeria",
    code: "NG",
    dialCode: "+234",
    flag: "🇳🇬",
    cities: [
      { name: "Federal Capital Territory (FCT)", subtitle: "Capital: Abuja" },
      { name: "Abia State", subtitle: "Capital: Umuahia" },
      { name: "Adamawa State", subtitle: "Capital: Yola" },
      { name: "Akwa Ibom State", subtitle: "Capital: Uyo" },
      { name: "Anambra State", subtitle: "Capital: Awka" },
      { name: "Bauchi State", subtitle: "Capital: Bauchi" },
      { name: "Bayelsa State", subtitle: "Capital: Yenagoa" },
      { name: "Benue State", subtitle: "Capital: Makurdi" },
      { name: "Borno State", subtitle: "Capital: Maiduguri" },
      { name: "Cross River State", subtitle: "Capital: Calabar" },
      { name: "Delta State", subtitle: "Capital: Asaba" },
      { name: "Ebonyi State", subtitle: "Capital: Abakaliki" },
      { name: "Edo State", subtitle: "Capital: Benin City" },
      { name: "Ekiti State", subtitle: "Capital: Ado-Ekiti" },
      { name: "Enugu State", subtitle: "Capital: Enugu" },
      { name: "Gombe State", subtitle: "Capital: Gombe" },
      { name: "Imo State", subtitle: "Capital: Owerri" },
      { name: "Jigawa State", subtitle: "Capital: Dutse" },
      { name: "Kaduna State", subtitle: "Capital: Kaduna" },
      { name: "Kano State", subtitle: "Capital: Kano" },
      { name: "Katsina State", subtitle: "Capital: Katsina" },
      { name: "Kebbi State", subtitle: "Capital: Birnin Kebbi" },
      { name: "Kogi State", subtitle: "Capital: Lokoja" },
      { name: "Kwara State", subtitle: "Capital: Ilorin" },
      { name: "Lagos State", subtitle: "Capital: Ikeja" },
      { name: "Nasarawa State", subtitle: "Capital: Lafia" },
      { name: "Niger State", subtitle: "Capital: Minna" },
      { name: "Ogun State", subtitle: "Capital: Abeokuta" },
      { name: "Ondo State", subtitle: "Capital: Akure" },
      { name: "Osun State", subtitle: "Capital: Osogbo" },
      { name: "Oyo State", subtitle: "Capital: Ibadan" },
      { name: "Plateau State", subtitle: "Capital: Jos" },
      { name: "Rivers State", subtitle: "Capital: Port Harcourt" },
      { name: "Sokoto State", subtitle: "Capital: Sokoto" },
      { name: "Taraba State", subtitle: "Capital: Jalingo" },
      { name: "Yobe State", subtitle: "Capital: Damaturu" },
      { name: "Zamfara State", subtitle: "Capital: Gusau" },
    ]
  },
  {
    name: "United States",
    code: "US",
    dialCode: "+1",
    flag: "🇺🇸",
    cities: [
      { name: "Washington D.C.", subtitle: "Capital: Federal District" },
      { name: "Alabama", subtitle: "Capital: Montgomery" },
      { name: "Alaska", subtitle: "Capital: Juneau" },
      { name: "Arizona", subtitle: "Capital: Phoenix" },
      { name: "Arkansas", subtitle: "Capital: Little Rock" },
      { name: "California", subtitle: "Capital: Sacramento" },
      { name: "Colorado", subtitle: "Capital: Denver" },
      { name: "Connecticut", subtitle: "Capital: Hartford" },
      { name: "Delaware", subtitle: "Capital: Dover" },
      { name: "Florida", subtitle: "Capital: Tallahassee" },
      { name: "Georgia", subtitle: "Capital: Atlanta" },
      { name: "Hawaii", subtitle: "Capital: Honolulu" },
      { name: "Idaho", subtitle: "Capital: Boise" },
      { name: "Illinois", subtitle: "Capital: Springfield" },
      { name: "Indiana", subtitle: "Capital: Indianapolis" },
      { name: "Iowa", subtitle: "Capital: Des Moines" },
      { name: "Kansas", subtitle: "Capital: Topeka" },
      { name: "Kentucky", subtitle: "Capital: Frankfort" },
      { name: "Louisiana", subtitle: "Capital: Baton Rouge" },
      { name: "Maine", subtitle: "Capital: Augusta" },
      { name: "Maryland", subtitle: "Capital: Annapolis" },
      { name: "Massachusetts", subtitle: "Capital: Boston" },
      { name: "Michigan", subtitle: "Capital: Lansing" },
      { name: "Minnesota", subtitle: "Capital: Saint Paul" },
      { name: "Mississippi", subtitle: "Capital: Jackson" },
      { name: "Missouri", subtitle: "Capital: Jefferson City" },
      { name: "Montana", subtitle: "Capital: Helena" },
      { name: "Nebraska", subtitle: "Capital: Lincoln" },
      { name: "Nevada", subtitle: "Capital: Carson City" },
      { name: "New Hampshire", subtitle: "Capital: Concord" },
      { name: "New Jersey", subtitle: "Capital: Trenton" },
      { name: "New Mexico", subtitle: "Capital: Santa Fe" },
      { name: "New York", subtitle: "Capital: Albany" },
      { name: "North Carolina", subtitle: "Capital: Raleigh" },
      { name: "North Dakota", subtitle: "Capital: Bismarck" },
      { name: "Ohio", subtitle: "Capital: Columbus" },
      { name: "Oklahoma", subtitle: "Capital: Oklahoma City" },
      { name: "Oregon", subtitle: "Capital: Salem" },
      { name: "Pennsylvania", subtitle: "Capital: Harrisburg" },
      { name: "Rhode Island", subtitle: "Capital: Providence" },
      { name: "South Carolina", subtitle: "Capital: Columbia" },
      { name: "South Dakota", subtitle: "Capital: Pierre" },
      { name: "Tennessee", subtitle: "Capital: Nashville" },
      { name: "Texas", subtitle: "Capital: Austin" },
      { name: "Utah", subtitle: "Capital: Salt Lake City" },
      { name: "Vermont", subtitle: "Capital: Montpelier" },
      { name: "Virginia", subtitle: "Capital: Richmond" },
      { name: "Washington", subtitle: "Capital: Olympia" },
      { name: "West Virginia", subtitle: "Capital: Charleston" },
      { name: "Wisconsin", subtitle: "Capital: Madison" },
      { name: "Wyoming", subtitle: "Capital: Cheyenne" },
    ]
  },
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    flag: "🇬🇧",
    cities: [
      { name: "England", subtitle: "Capital: London" },
      { name: "Scotland", subtitle: "Capital: Edinburgh" },
      { name: "Wales", subtitle: "Capital: Cardiff" },
      { name: "Northern Ireland", subtitle: "Capital: Belfast" },
    ]
  },
  {
    name: "Canada",
    code: "CA",
    dialCode: "+1",
    flag: "🇨🇦",
    cities: [
      { name: "Ontario", subtitle: "Capital: Toronto" },
      { name: "Quebec", subtitle: "Capital: Quebec City" },
      { name: "British Columbia", subtitle: "Capital: Victoria" },
      { name: "Alberta", subtitle: "Capital: Edmonton" },
      { name: "Manitoba", subtitle: "Capital: Winnipeg" },
      { name: "Saskatchewan", subtitle: "Capital: Regina" },
      { name: "Nova Scotia", subtitle: "Capital: Halifax" },
      { name: "New Brunswick", subtitle: "Capital: Fredericton" },
      { name: "Newfoundland and Labrador", subtitle: "Capital: St. John's" },
      { name: "Prince Edward Island", subtitle: "Capital: Charlottetown" },
      { name: "Northwest Territories", subtitle: "Capital: Yellowknife" },
      { name: "Yukon", subtitle: "Capital: Whitehorse" },
      { name: "Nunavut", subtitle: "Capital: Iqaluit" },
    ]
  },
  {
    name: "Ghana",
    code: "GH",
    dialCode: "+233",
    flag: "🇬🇭",
    cities: [
      { name: "Greater Accra Region", subtitle: "Capital: Accra" },
      { name: "Ashanti Region", subtitle: "Capital: Kumasi" },
      { name: "Northern Region", subtitle: "Capital: Tamale" },
      { name: "Western Region", subtitle: "Capital: Sekondi-Takoradi" },
      { name: "Central Region", subtitle: "Capital: Cape Coast" },
      { name: "Eastern Region", subtitle: "Capital: Koforidua" },
      { name: "Volta Region", subtitle: "Capital: Ho" },
      { name: "Bono Region", subtitle: "Capital: Sunyani" },
      { name: "Bono East Region", subtitle: "Capital: Techiman" },
      { name: "Upper East Region", subtitle: "Capital: Bolgatanga" },
      { name: "Upper West Region", subtitle: "Capital: Wa" },
      { name: "Ahafo Region", subtitle: "Capital: Goaso" },
      { name: "Western North Region", subtitle: "Capital: Sefwi Wiawso" },
      { name: "Oti Region", subtitle: "Capital: Dambai" },
      { name: "Savannah Region", subtitle: "Capital: Damongo" },
      { name: "North East Region", subtitle: "Capital: Nalerigu" },
    ]
  },
  {
    name: "Kenya",
    code: "KE",
    dialCode: "+254",
    flag: "🇰🇪",
    cities: [
      { name: "Nairobi County", subtitle: "Capital: Nairobi" },
      { name: "Mombasa County", subtitle: "Capital: Mombasa" },
      { name: "Kisumu County", subtitle: "Capital: Kisumu" },
      { name: "Nakuru County", subtitle: "Capital: Nakuru" },
      { name: "Uasin Gishu County", subtitle: "Capital: Eldoret" },
      { name: "Kiambu County", subtitle: "Capital: Kiambu" },
      { name: "Kilifi County", subtitle: "Capital: Kilifi" },
      { name: "Machakos County", subtitle: "Capital: Machakos" },
      { name: "Nyeri County", subtitle: "Capital: Nyeri" },
      { name: "Meru County", subtitle: "Capital: Meru" },
      { name: "Kakamega County", subtitle: "Capital: Kakamega" },
      { name: "Trans-Nzoia County", subtitle: "Capital: Kitale" },
      { name: "Garissa County", subtitle: "Capital: Garissa" },
      { name: "Kisii County", subtitle: "Capital: Kisii" },
      { name: "Turkana County", subtitle: "Capital: Lodwar" },
      { name: "Kajiado County", subtitle: "Capital: Kajiado" },
      { name: "Kericho County", subtitle: "Capital: Kericho" },
    ]
  },
  {
    name: "South Africa",
    code: "ZA",
    dialCode: "+27",
    flag: "🇿🇦",
    cities: [
      { name: "Gauteng", subtitle: "Capital: Johannesburg / Pretoria" },
      { name: "Western Cape", subtitle: "Capital: Cape Town" },
      { name: "KwaZulu-Natal", subtitle: "Capital: Pietermaritzburg" },
      { name: "Eastern Cape", subtitle: "Capital: Bhisho" },
      { name: "Free State", subtitle: "Capital: Bloemfontein" },
      { name: "Limpopo", subtitle: "Capital: Polokwane" },
      { name: "Mpumalanga", subtitle: "Capital: Nelspruit (Mbombela)" },
      { name: "North West", subtitle: "Capital: Mahikeng" },
      { name: "Northern Cape", subtitle: "Capital: Kimberley" },
    ]
  },
  {
    name: "Germany",
    code: "DE",
    dialCode: "+49",
    flag: "🇩🇪",
    cities: [
      { name: "Berlin", subtitle: "Capital: Berlin" },
      { name: "Bavaria (Bayern)", subtitle: "Capital: Munich (München)" },
      { name: "Baden-Württemberg", subtitle: "Capital: Stuttgart" },
      { name: "North Rhine-Westphalia", subtitle: "Capital: Düsseldorf" },
      { name: "Hesse (Hessen)", subtitle: "Capital: Wiesbaden" },
      { name: "Hamburg", subtitle: "Capital: Hamburg" },
      { name: "Lower Saxony (Niedersachsen)", subtitle: "Capital: Hanover (Hannover)" },
      { name: "Saxony (Sachsen)", subtitle: "Capital: Dresden" },
      { name: "Rhineland-Palatinate", subtitle: "Capital: Mainz" },
      { name: "Schleswig-Holstein", subtitle: "Capital: Kiel" },
      { name: "Brandenburg", subtitle: "Capital: Potsdam" },
      { name: "Saxony-Anhalt", subtitle: "Capital: Magdeburg" },
      { name: "Thuringia (Thüringen)", subtitle: "Capital: Erfurt" },
      { name: "Bremen", subtitle: "Capital: Bremen" },
      { name: "Mecklenburg-Vorpommern", subtitle: "Capital: Schwerin" },
      { name: "Saarland", subtitle: "Capital: Saarbrücken" },
    ]
  },
  {
    name: "France",
    code: "FR",
    dialCode: "+33",
    flag: "🇫🇷",
    cities: [
      { name: "Île-de-France", subtitle: "Capital: Paris" },
      { name: "Auvergne-Rhône-Alpes", subtitle: "Capital: Lyon" },
      { name: "Provence-Alpes-Côte d'Azur", subtitle: "Capital: Marseille" },
      { name: "Occitanie", subtitle: "Capital: Toulouse" },
      { name: "Nouvelle-Aquitaine", subtitle: "Capital: Bordeaux" },
      { name: "Hauts-de-France", subtitle: "Capital: Lille" },
      { name: "Grand Est", subtitle: "Capital: Strasbourg" },
      { name: "Pays de la Loire", subtitle: "Capital: Nantes" },
      { name: "Brittany (Bretagne)", subtitle: "Capital: Rennes" },
      { name: "Normandy (Normandie)", subtitle: "Capital: Rouen" },
      { name: "Bourgogne-Franche-Comté", subtitle: "Capital: Dijon" },
      { name: "Centre-Val de Loire", subtitle: "Capital: Orléans" },
      { name: "Corsica (Corse)", subtitle: "Capital: Ajaccio" },
    ]
  },
  {
    name: "India",
    code: "IN",
    dialCode: "+91",
    flag: "🇮🇳",
    cities: [
      { name: "Delhi (NCT)", subtitle: "Capital: New Delhi" },
      { name: "Maharashtra", subtitle: "Capital: Mumbai" },
      { name: "Karnataka", subtitle: "Capital: Bengaluru" },
      { name: "Telangana", subtitle: "Capital: Hyderabad" },
      { name: "Tamil Nadu", subtitle: "Capital: Chennai" },
      { name: "West Bengal", subtitle: "Capital: Kolkata" },
      { name: "Gujarat", subtitle: "Capital: Gandhinagar" },
      { name: "Uttar Pradesh", subtitle: "Capital: Lucknow" },
      { name: "Haryana", subtitle: "Capital: Chandigarh" },
      { name: "Punjab", subtitle: "Capital: Chandigarh" },
      { name: "Rajasthan", subtitle: "Capital: Jaipur" },
      { name: "Kerala", subtitle: "Capital: Thiruvananthapuram" },
      { name: "Madhya Pradesh", subtitle: "Capital: Bhopal" },
      { name: "Bihar", subtitle: "Capital: Patna" },
      { name: "Odisha", subtitle: "Capital: Bhubaneswar" },
      { name: "Andhra Pradesh", subtitle: "Capital: Amaravati" },
      { name: "Assam", subtitle: "Capital: Dispur" },
      { name: "Jharkhand", subtitle: "Capital: Ranchi" },
      { name: "Chhattisgarh", subtitle: "Capital: Raipur" },
      { name: "Uttarakhand", subtitle: "Capital: Dehradun" },
      { name: "Himachal Pradesh", subtitle: "Capital: Shimla" },
      { name: "Goa", subtitle: "Capital: Panaji" },
      { name: "Jammu and Kashmir", subtitle: "Capital: Srinagar / Jammu" },
    ]
  },
  {
    name: "Australia",
    code: "AU",
    dialCode: "+61",
    flag: "🇦🇺",
    cities: [
      { name: "Australian Capital Territory (ACT)", subtitle: "Capital: Canberra" },
      { name: "New South Wales (NSW)", subtitle: "Capital: Sydney" },
      { name: "Victoria (VIC)", subtitle: "Capital: Melbourne" },
      { name: "Queensland (QLD)", subtitle: "Capital: Brisbane" },
      { name: "Western Australia (WA)", subtitle: "Capital: Perth" },
      { name: "South Australia (SA)", subtitle: "Capital: Adelaide" },
      { name: "Tasmania (TAS)", subtitle: "Capital: Hobart" },
      { name: "Northern Territory (NT)", subtitle: "Capital: Darwin" },
    ]
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    dialCode: "+971",
    flag: "🇦🇪",
    cities: [
      { name: "Abu Dhabi", subtitle: "Capital: Abu Dhabi" },
      { name: "Dubai", subtitle: "Capital: Dubai" },
      { name: "Sharjah", subtitle: "Capital: Sharjah" },
      { name: "Ajman", subtitle: "Capital: Ajman" },
      { name: "Ras Al Khaimah", subtitle: "Capital: Ras Al Khaimah" },
      { name: "Fujairah", subtitle: "Capital: Fujairah" },
      { name: "Umm Al Quwain", subtitle: "Capital: Umm Al Quwain" },
    ]
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    dialCode: "+966",
    flag: "🇸🇦",
    cities: [
      { name: "Riyadh Province", subtitle: "Capital: Riyadh" },
      { name: "Makkah Province", subtitle: "Capital: Mecca (Holy City)" },
      { name: "Madinah Province", subtitle: "Capital: Medina (Holy City)" },
      { name: "Eastern Province (Ash Sharqiyah)", subtitle: "Capital: Dammam" },
      { name: "Asir Province", subtitle: "Capital: Abha" },
      { name: "Tabuk Province", subtitle: "Capital: Tabuk" },
      { name: "Al-Qassim Province", subtitle: "Capital: Buraidah" },
      { name: "Hail Province", subtitle: "Capital: Hail" },
      { name: "Jazan Province", subtitle: "Capital: Jazan" },
      { name: "Najran Province", subtitle: "Capital: Najran" },
      { name: "Northern Borders Province", subtitle: "Capital: Arar" },
      { name: "Al-Jawf Province", subtitle: "Capital: Sakakah" },
      { name: "Al-Bahah Province", subtitle: "Capital: Al-Bahah" },
    ]
  },
  {
    name: "Ireland",
    code: "IE",
    dialCode: "+353",
    flag: "🇮🇪",
    cities: [
      { name: "Leinster", subtitle: "Capital: Dublin" },
      { name: "Munster", subtitle: "Capital: Cork" },
      { name: "Connacht", subtitle: "Capital: Galway" },
      { name: "Ulster", subtitle: "Capital: Cavan" },
    ]
  },
  {
    name: "Netherlands",
    code: "NL",
    dialCode: "+31",
    flag: "🇳🇱",
    cities: [
      { name: "North Holland (Noord-Holland)", subtitle: "Capital: Haarlem" },
      { name: "South Holland (Zuid-Holland)", subtitle: "Capital: The Hague" },
      { name: "Utrecht", subtitle: "Capital: Utrecht" },
      { name: "North Brabant (Noord-Brabant)", subtitle: "Capital: 's-Hertogenbosch" },
      { name: "Gelderland", subtitle: "Capital: Arnhem" },
      { name: "Overijssel", subtitle: "Capital: Zwolle" },
      { name: "Groningen", subtitle: "Capital: Groningen" },
      { name: "Friesland (Fryslân)", subtitle: "Capital: Leeuwarden" },
      { name: "Drenthe", subtitle: "Capital: Assen" },
      { name: "Limburg", subtitle: "Capital: Maastricht" },
      { name: "Zeeland", subtitle: "Capital: Middelburg" },
      { name: "Flevoland", subtitle: "Capital: Lelystad" },
    ]
  },
  {
    name: "Spain",
    code: "ES",
    dialCode: "+34",
    flag: "🇪🇸",
    cities: [
      { name: "Community of Madrid", subtitle: "Capital: Madrid" },
      { name: "Catalonia (Cataluña)", subtitle: "Capital: Barcelona" },
      { name: "Valencian Community", subtitle: "Capital: Valencia" },
      { name: "Andalusia (Andalucía)", subtitle: "Capital: Seville" },
      { name: "Basque Country (País Vasco)", subtitle: "Capital: Vitoria-Gasteiz" },
      { name: "Galicia", subtitle: "Capital: Santiago de Compostela" },
      { name: "Castile and León", subtitle: "Capital: Valladolid" },
      { name: "Castilla-La Mancha", subtitle: "Capital: Toledo" },
      { name: "Canary Islands", subtitle: "Capital: Las Palmas / Santa Cruz" },
      { name: "Balearic Islands", subtitle: "Capital: Palma" },
      { name: "Region of Murcia", subtitle: "Capital: Murcia" },
      { name: "Aragon (Aragón)", subtitle: "Capital: Zaragoza" },
      { name: "Extremadura", subtitle: "Capital: Mérida" },
      { name: "Asturias", subtitle: "Capital: Oviedo" },
      { name: "Navarre", subtitle: "Capital: Pamplona" },
      { name: "Cantabria", subtitle: "Capital: Santander" },
      { name: "La Rioja", subtitle: "Capital: Logroño" },
    ]
  },
  {
    name: "Italy",
    code: "IT",
    dialCode: "+39",
    flag: "🇮🇹",
    cities: [
      { name: "Lazio", subtitle: "Capital: Rome" },
      { name: "Lombardy (Lombardia)", subtitle: "Capital: Milan" },
      { name: "Campania", subtitle: "Capital: Naples" },
      { name: "Piedmont (Piemonte)", subtitle: "Capital: Turin" },
      { name: "Sicily (Sicilia)", subtitle: "Capital: Palermo" },
      { name: "Veneto", subtitle: "Capital: Venice" },
      { name: "Emilia-Romagna", subtitle: "Capital: Bologna" },
      { name: "Tuscany (Toscana)", subtitle: "Capital: Florence" },
      { name: "Apulia (Puglia)", subtitle: "Capital: Bari" },
      { name: "Calabria", subtitle: "Capital: Catanzaro" },
      { name: "Sardinia (Sardegna)", subtitle: "Capital: Cagliari" },
      { name: "Liguria", subtitle: "Capital: Genoa" },
      { name: "Marche", subtitle: "Capital: Ancona" },
      { name: "Abruzzo", subtitle: "Capital: L'Aquila" },
      { name: "Friuli Venezia Giulia", subtitle: "Capital: Trieste" },
      { name: "Trentino-Alto Adige", subtitle: "Capital: Trento" },
      { name: "Umbria", subtitle: "Capital: Perugia" },
      { name: "Basilicata", subtitle: "Capital: Potenza" },
      { name: "Molise", subtitle: "Capital: Campobasso" },
      { name: "Aosta Valley", subtitle: "Capital: Aosta" },
    ]
  },
  {
    name: "Switzerland",
    code: "CH",
    dialCode: "+41",
    flag: "🇨🇭",
    cities: [
      { name: "Canton of Zurich", subtitle: "Capital: Zurich" },
      { name: "Canton of Bern", subtitle: "Capital: Bern" },
      { name: "Canton of Geneva", subtitle: "Capital: Geneva" },
      { name: "Canton of Basel-Stadt", subtitle: "Capital: Basel" },
      { name: "Canton of Vaud", subtitle: "Capital: Lausanne" },
      { name: "Canton of Lucerne", subtitle: "Capital: Lucerne" },
      { name: "Canton of St. Gallen", subtitle: "Capital: St. Gallen" },
      { name: "Canton of Ticino", subtitle: "Capital: Bellinzona" },
      { name: "Canton of Zug", subtitle: "Capital: Zug" },
      { name: "Canton of Aargau", subtitle: "Capital: Aarau" },
      { name: "Canton of Valais", subtitle: "Capital: Sion" },
      { name: "Canton of Fribourg", subtitle: "Capital: Fribourg" },
      { name: "Canton of Graubünden", subtitle: "Capital: Chur" },
      { name: "Canton of Neuchâtel", subtitle: "Capital: Neuchâtel" },
      { name: "Canton of Schwyz", subtitle: "Capital: Schwyz" },
      { name: "Canton of Schaffhausen", subtitle: "Capital: Schaffhausen" },
      { name: "Canton of Solothurn", subtitle: "Capital: Solothurn" },
      { name: "Canton of Thurgau", subtitle: "Capital: Frauenfeld" },
    ]
  },
  {
    name: "Sweden",
    code: "SE",
    dialCode: "+46",
    flag: "🇸🇪",
    cities: [
      { name: "Stockholm County", subtitle: "Capital: Stockholm" },
      { name: "Västra Götaland County", subtitle: "Capital: Gothenburg" },
      { name: "Skåne County", subtitle: "Capital: Malmö" },
      { name: "Uppsala County", subtitle: "Capital: Uppsala" },
      { name: "Östergötland County", subtitle: "Capital: Linköping" },
      { name: "Västmanland County", subtitle: "Capital: Västerås" },
      { name: "Örebro County", subtitle: "Capital: Örebro" },
      { name: "Jönköping County", subtitle: "Capital: Jönköping" },
      { name: "Halland County", subtitle: "Capital: Halmstad" },
      { name: "Gävleborg County", subtitle: "Capital: Gävle" },
      { name: "Värmland County", subtitle: "Capital: Karlstad" },
      { name: "Västerbotten County", subtitle: "Capital: Umeå" },
      { name: "Norrbotten County", subtitle: "Capital: Luleå" },
      { name: "Dalarna County", subtitle: "Capital: Falun" },
      { name: "Södermanland County", subtitle: "Capital: Nyköping" },
      { name: "Västernorrland County", subtitle: "Capital: Härnösand" },
      { name: "Kalmar County", subtitle: "Capital: Kalmar" },
      { name: "Kronoberg County", subtitle: "Capital: Växjö" },
      { name: "Blekinge County", subtitle: "Capital: Karlskrona" },
      { name: "Jämtland County", subtitle: "Capital: Östersund" },
      { name: "Gotland County", subtitle: "Capital: Visby" },
    ]
  },
  {
    name: "Norway",
    code: "NO",
    dialCode: "+47",
    flag: "🇳🇴",
    cities: [
      { name: "Oslo", subtitle: "Capital: Oslo" },
      { name: "Vestland", subtitle: "Capital: Bergen" },
      { name: "Trøndelag", subtitle: "Capital: Steinkjer" },
      { name: "Rogaland", subtitle: "Capital: Stavanger" },
      { name: "Agder", subtitle: "Capital: Kristiansand" },
      { name: "Akershus", subtitle: "Capital: Oslo" },
      { name: "Buskerud", subtitle: "Capital: Drammen" },
      { name: "Østfold", subtitle: "Capital: Sarpsborg" },
      { name: "Innlandet", subtitle: "Capital: Hamar" },
      { name: "Vestfold", subtitle: "Capital: Tønsberg" },
      { name: "Telemark", subtitle: "Capital: Skien" },
      { name: "Møre og Romsdal", subtitle: "Capital: Molde" },
      { name: "Nordland", subtitle: "Capital: Bodø" },
      { name: "Troms", subtitle: "Capital: Tromsø" },
      { name: "Finnmark", subtitle: "Capital: Vadsø" },
    ]
  },
  {
    name: "Denmark",
    code: "DK",
    dialCode: "+45",
    flag: "🇩🇰",
    cities: [
      { name: "Capital Region of Denmark", subtitle: "Capital: Hillerød" },
      { name: "Central Denmark Region", subtitle: "Capital: Viborg" },
      { name: "Region of Southern Denmark", subtitle: "Capital: Vejle" },
      { name: "North Denmark Region", subtitle: "Capital: Aalborg" },
      { name: "Region Zealand", subtitle: "Capital: Sorø" },
    ]
  },
  {
    name: "Finland",
    code: "FI",
    dialCode: "+358",
    flag: "🇫🇮",
    cities: [
      { name: "Uusimaa", subtitle: "Capital: Helsinki" },
      { name: "Pirkanmaa", subtitle: "Capital: Tampere" },
      { name: "Southwest Finland", subtitle: "Capital: Turku" },
      { name: "North Ostrobothnia", subtitle: "Capital: Oulu" },
      { name: "Central Finland", subtitle: "Capital: Jyväskylä" },
      { name: "Päijät-Häme", subtitle: "Capital: Lahti" },
      { name: "North Savo", subtitle: "Capital: Kuopio" },
      { name: "Satakunta", subtitle: "Capital: Pori" },
      { name: "South Savo", subtitle: "Capital: Mikkeli" },
      { name: "Lapland", subtitle: "Capital: Rovaniemi" },
      { name: "Kymenlaakso", subtitle: "Capital: Kouvola" },
      { name: "Ostrobothnia", subtitle: "Capital: Vaasa" },
      { name: "South Ostrobothnia", subtitle: "Capital: Seinäjoki" },
      { name: "North Karelia", subtitle: "Capital: Joensuu" },
      { name: "Kainuu", subtitle: "Capital: Kajaani" },
      { name: "Central Ostrobothnia", subtitle: "Capital: Kokkola" },
      { name: "South Karelia", subtitle: "Capital: Lappeenranta" },
      { name: "Åland", subtitle: "Capital: Mariehamn" },
    ]
  },
  {
    name: "Poland",
    code: "PL",
    dialCode: "+48",
    flag: "🇵🇱",
    cities: [
      { name: "Masovian Voivodeship", subtitle: "Capital: Warsaw" },
      { name: "Lesser Poland Voivodeship", subtitle: "Capital: Kraków" },
      { name: "Lower Silesian Voivodeship", subtitle: "Capital: Wrocław" },
      { name: "Greater Poland Voivodeship", subtitle: "Capital: Poznań" },
      { name: "Pomeranian Voivodeship", subtitle: "Capital: Gdańsk" },
      { name: "Łódź Voivodeship", subtitle: "Capital: Łódź" },
      { name: "Silesian Voivodeship", subtitle: "Capital: Katowice" },
      { name: "West Pomeranian Voivodeship", subtitle: "Capital: Szczecin" },
      { name: "Lublin Voivodeship", subtitle: "Capital: Lublin" },
      { name: "Kuyavian-Pomeranian Voivodeship", subtitle: "Capital: Bydgoszcz" },
      { name: "Subcarpathian Voivodeship", subtitle: "Capital: Rzeszów" },
      { name: "Warmian-Masurian Voivodeship", subtitle: "Capital: Olsztyn" },
      { name: "Podlaskie Voivodeship", subtitle: "Capital: Białystok" },
      { name: "Świętokrzyskie Voivodeship", subtitle: "Capital: Kielce" },
      { name: "Opole Voivodeship", subtitle: "Capital: Opole" },
      { name: "Lubusz Voivodeship", subtitle: "Capital: Gorzów Wielkopolski" },
    ]
  },
  {
    name: "Portugal",
    code: "PT",
    dialCode: "+351",
    flag: "🇵🇹",
    cities: [
      { name: "Lisbon District", subtitle: "Capital: Lisbon" },
      { name: "Porto District", subtitle: "Capital: Porto" },
      { name: "Braga District", subtitle: "Capital: Braga" },
      { name: "Setúbal District", subtitle: "Capital: Setúbal" },
      { name: "Aveiro District", subtitle: "Capital: Aveiro" },
      { name: "Coimbra District", subtitle: "Capital: Coimbra" },
      { name: "Faro District (Algarve)", subtitle: "Capital: Faro" },
      { name: "Leiria District", subtitle: "Capital: Leiria" },
      { name: "Santarém District", subtitle: "Capital: Santarém" },
      { name: "Viseu District", subtitle: "Capital: Viseu" },
      { name: "Madeira Autonomous Region", subtitle: "Capital: Funchal" },
      { name: "Azores Autonomous Region", subtitle: "Capital: Ponta Delgada" },
      { name: "Viana do Castelo District", subtitle: "Capital: Viana do Castelo" },
      { name: "Vila Real District", subtitle: "Capital: Vila Real" },
      { name: "Castelo Branco District", subtitle: "Capital: Castelo Branco" },
      { name: "Évora District", subtitle: "Capital: Évora" },
      { name: "Guarda District", subtitle: "Capital: Guarda" },
      { name: "Beja District", subtitle: "Capital: Beja" },
      { name: "Bragança District", subtitle: "Capital: Bragança" },
      { name: "Portalegre District", subtitle: "Capital: Portalegre" },
    ]
  },
  {
    name: "Belgium",
    code: "BE",
    dialCode: "+32",
    flag: "🇧🇪",
    cities: [
      { name: "Brussels-Capital Region", subtitle: "Capital: Brussels" },
      { name: "Antwerp Province", subtitle: "Capital: Antwerp" },
      { name: "East Flanders", subtitle: "Capital: Ghent" },
      { name: "Flemish Brabant", subtitle: "Capital: Leuven" },
      { name: "West Flanders", subtitle: "Capital: Bruges" },
      { name: "Limburg", subtitle: "Capital: Hasselt" },
      { name: "Liège Province", subtitle: "Capital: Liège" },
      { name: "Hainaut Province", subtitle: "Capital: Mons" },
      { name: "Namur Province", subtitle: "Capital: Namur" },
      { name: "Walloon Brabant", subtitle: "Capital: Wavre" },
      { name: "Luxembourg Province", subtitle: "Capital: Arlon" },
    ]
  },
  {
    name: "Austria",
    code: "AT",
    dialCode: "+43",
    flag: "🇦🇹",
    cities: [
      { name: "Vienna (Wien)", subtitle: "Capital: Vienna" },
      { name: "Lower Austria", subtitle: "Capital: St. Pölten" },
      { name: "Upper Austria", subtitle: "Capital: Linz" },
      { name: "Styria", subtitle: "Capital: Graz" },
      { name: "Tyrol", subtitle: "Capital: Innsbruck" },
      { name: "Carinthia", subtitle: "Capital: Klagenfurt" },
      { name: "Salzburg", subtitle: "Capital: Salzburg" },
      { name: "Vorarlberg", subtitle: "Capital: Bregenz" },
      { name: "Burgenland", subtitle: "Capital: Eisenstadt" },
    ]
  },
  {
    name: "New Zealand",
    code: "NZ",
    dialCode: "+64",
    flag: "🇳🇿",
    cities: [
      { name: "Auckland Region", subtitle: "Capital: Auckland" },
      { name: "Wellington Region", subtitle: "Capital: Wellington" },
      { name: "Canterbury Region", subtitle: "Capital: Christchurch" },
      { name: "Waikato Region", subtitle: "Capital: Hamilton" },
      { name: "Bay of Plenty", subtitle: "Capital: Tauranga" },
      { name: "Otago Region", subtitle: "Capital: Dunedin" },
      { name: "Manawatū-Whanganui", subtitle: "Capital: Palmerston North" },
      { name: "Hawke's Bay", subtitle: "Capital: Napier" },
      { name: "Northland", subtitle: "Capital: Whangarei" },
      { name: "Taranaki", subtitle: "Capital: New Plymouth" },
      { name: "Southland", subtitle: "Capital: Invercargill" },
      { name: "Tasman", subtitle: "Capital: Richmond" },
      { name: "Nelson", subtitle: "Capital: Nelson" },
      { name: "Marlborough", subtitle: "Capital: Blenheim" },
      { name: "Gisborne", subtitle: "Capital: Gisborne" },
      { name: "West Coast", subtitle: "Capital: Greymouth" },
    ]
  },
  {
    name: "Singapore",
    code: "SG",
    dialCode: "+65",
    flag: "🇸🇬",
    cities: [
      { name: "Central Region", subtitle: "Capital: Downtown Core" },
      { name: "West Region", subtitle: "Capital: Jurong East" },
      { name: "East Region", subtitle: "Capital: Tampines" },
      { name: "North Region", subtitle: "Capital: Woodlands" },
      { name: "North-East Region", subtitle: "Capital: Seletar" },
    ]
  },
  {
    name: "Malaysia",
    code: "MY",
    dialCode: "+60",
    flag: "🇲🇾",
    cities: [
      { name: "Federal Territory of Kuala Lumpur", subtitle: "Capital: Kuala Lumpur" },
      { name: "Federal Territory of Putrajaya", subtitle: "Capital: Putrajaya" },
      { name: "Selangor", subtitle: "Capital: Shah Alam" },
      { name: "Penang (Pulau Pinang)", subtitle: "Capital: George Town" },
      { name: "Johor", subtitle: "Capital: Johor Bahru" },
      { name: "Perak", subtitle: "Capital: Ipoh" },
      { name: "Sarawak", subtitle: "Capital: Kuching" },
      { name: "Sabah", subtitle: "Capital: Kota Kinabalu" },
      { name: "Melaka (Malacca)", subtitle: "Capital: Malacca City" },
      { name: "Kedah", subtitle: "Capital: Alor Setar" },
      { name: "Pahang", subtitle: "Capital: Kuantan" },
      { name: "Negeri Sembilan", subtitle: "Capital: Seremban" },
      { name: "Kelantan", subtitle: "Capital: Kota Bharu" },
      { name: "Terengganu", subtitle: "Capital: Kuala Terengganu" },
      { name: "Perlis", subtitle: "Capital: Kangar" },
      { name: "Federal Territory of Labuan", subtitle: "Capital: Victoria" },
    ]
  },
  {
    name: "Rwanda",
    code: "RW",
    dialCode: "+250",
    flag: "🇷🇼",
    cities: [
      { name: "Kigali City", subtitle: "Capital: Kigali" },
      { name: "Southern Province", subtitle: "Capital: Nyanza" },
      { name: "Western Province", subtitle: "Capital: Karongi" },
      { name: "Northern Province", subtitle: "Capital: Musanze" },
      { name: "Eastern Province", subtitle: "Capital: Rwamagana" },
    ]
  },
  {
    name: "Uganda",
    code: "UG",
    dialCode: "+256",
    flag: "🇺🇬",
    cities: [
      { name: "Central Region", subtitle: "Capital: Kampala" },
      { name: "Western Region", subtitle: "Capital: Mbarara" },
      { name: "Eastern Region", subtitle: "Capital: Jinja" },
      { name: "Northern Region", subtitle: "Capital: Gulu" },
    ]
  },
  {
    name: "Tanzania",
    code: "TZ",
    dialCode: "+255",
    flag: "🇹🇿",
    cities: [
      { name: "Dodoma Region", subtitle: "Capital: Dodoma" },
      { name: "Dar es Salaam Region", subtitle: "Capital: Dar es Salaam" },
      { name: "Mwanza Region", subtitle: "Capital: Mwanza" },
      { name: "Arusha Region", subtitle: "Capital: Arusha" },
      { name: "Kilimanjaro Region", subtitle: "Capital: Moshi" },
      { name: "Mbeya Region", subtitle: "Capital: Mbeya" },
      { name: "Morogoro Region", subtitle: "Capital: Morogoro" },
      { name: "Tanga Region", subtitle: "Capital: Tanga" },
      { name: "Zanzibar Urban/West", subtitle: "Capital: Zanzibar City" },
    ]
  },
  {
    name: "Egypt",
    code: "EG",
    dialCode: "+20",
    flag: "🇪🇬",
    cities: [
      { name: "Cairo Governorate", subtitle: "Capital: Cairo" },
      { name: "Giza Governorate", subtitle: "Capital: Giza" },
      { name: "Alexandria Governorate", subtitle: "Capital: Alexandria" },
      { name: "Qalyubia Governorate", subtitle: "Capital: Banha" },
      { name: "Port Said Governorate", subtitle: "Capital: Port Said" },
      { name: "Suez Governorate", subtitle: "Capital: Suez" },
      { name: "Luxor Governorate", subtitle: "Capital: Luxor" },
      { name: "Aswan Governorate", subtitle: "Capital: Aswan" },
      { name: "Dakahlia Governorate", subtitle: "Capital: Mansoura" },
      { name: "Gharbia Governorate", subtitle: "Capital: Tanta" },
      { name: "Asyut Governorate", subtitle: "Capital: Asyut" },
      { name: "Red Sea Governorate", subtitle: "Capital: Hurghada" },
      { name: "South Sinai Governorate", subtitle: "Capital: El Tor" },
    ]
  },
  {
    name: "Morocco",
    code: "MA",
    dialCode: "+212",
    flag: "🇲🇦",
    cities: [
      { name: "Rabat-Salé-Kénitra", subtitle: "Capital: Rabat" },
      { name: "Casablanca-Settat", subtitle: "Capital: Casablanca" },
      { name: "Marrakech-Safi", subtitle: "Capital: Marrakech" },
      { name: "Fès-Meknès", subtitle: "Capital: Fes" },
      { name: "Tanger-Tetouan-Al Hoceima", subtitle: "Capital: Tangier" },
      { name: "Souss-Massa", subtitle: "Capital: Agadir" },
      { name: "Oriental", subtitle: "Capital: Oujda" },
      { name: "Béni Mellal-Khénifra", subtitle: "Capital: Béni Mellal" },
      { name: "Drâa-Tafilalet", subtitle: "Capital: Errachidia" },
      { name: "Guelmim-Oued Noun", subtitle: "Capital: Guelmim" },
      { name: "Laâyoune-Sakia El Hamra", subtitle: "Capital: Laâyoune" },
      { name: "Dakhla-Oued Ed-Dahab", subtitle: "Capital: Dakhla" },
    ]
  },
  {
    name: "China",
    code: "CN",
    dialCode: "+86",
    flag: "🇨🇳",
    cities: [
      { name: "Beijing Municipality", subtitle: "Capital: Beijing" },
      { name: "Shanghai Municipality", subtitle: "Capital: Shanghai" },
      { name: "Guangdong Province", subtitle: "Capital: Guangzhou" },
      { name: "Zhejiang Province", subtitle: "Capital: Hangzhou" },
      { name: "Jiangsu Province", subtitle: "Capital: Nanjing" },
      { name: "Sichuan Province", subtitle: "Capital: Chengdu" },
      { name: "Hubei Province", subtitle: "Capital: Wuhan" },
      { name: "Chongqing Municipality", subtitle: "Capital: Chongqing" },
      { name: "Shaanxi Province", subtitle: "Capital: Xi'an" },
      { name: "Shandong Province", subtitle: "Capital: Jinan" },
      { name: "Fujian Province", subtitle: "Capital: Fuzhou" },
      { name: "Tianjin Municipality", subtitle: "Capital: Tianjin" },
      { name: "Henan Province", subtitle: "Capital: Zhengzhou" },
      { name: "Hunan Province", subtitle: "Capital: Changsha" },
    ]
  },
  {
    name: "Japan",
    code: "JP",
    dialCode: "+81",
    flag: "🇯🇵",
    cities: [
      { name: "Tokyo Metropolis", subtitle: "Capital: Tokyo" },
      { name: "Kanagawa Prefecture", subtitle: "Capital: Yokohama" },
      { name: "Osaka Prefecture", subtitle: "Capital: Osaka" },
      { name: "Aichi Prefecture", subtitle: "Capital: Nagoya" },
      { name: "Hokkaido", subtitle: "Capital: Sapporo" },
      { name: "Fukuoka Prefecture", subtitle: "Capital: Fukuoka" },
      { name: "Hyogo Prefecture", subtitle: "Capital: Kobe" },
      { name: "Kyoto Prefecture", subtitle: "Capital: Kyoto" },
      { name: "Saitama Prefecture", subtitle: "Capital: Saitama" },
      { name: "Chiba Prefecture", subtitle: "Capital: Chiba" },
      { name: "Hiroshima Prefecture", subtitle: "Capital: Hiroshima" },
      { name: "Miyagi Prefecture", subtitle: "Capital: Sendai" },
      { name: "Shizuoka Prefecture", subtitle: "Capital: Shizuoka" },
      { name: "Okinawa Prefecture", subtitle: "Capital: Naha" },
    ]
  },
  {
    name: "South Korea",
    code: "KR",
    dialCode: "+82",
    flag: "🇰🇷",
    cities: [
      { name: "Seoul Special City", subtitle: "Capital: Seoul" },
      { name: "Busan Metropolitan City", subtitle: "Capital: Busan" },
      { name: "Incheon Metropolitan City", subtitle: "Capital: Incheon" },
      { name: "Gyeonggi Province", subtitle: "Capital: Suwon" },
      { name: "Daegu Metropolitan City", subtitle: "Capital: Daegu" },
      { name: "Daejeon Metropolitan City", subtitle: "Capital: Daejeon" },
      { name: "Gwangju Metropolitan City", subtitle: "Capital: Gwangju" },
      { name: "Ulsan Metropolitan City", subtitle: "Capital: Ulsan" },
      { name: "Sejong Special Autonomous City", subtitle: "Capital: Sejong" },
      { name: "Gangwon Province", subtitle: "Capital: Chuncheon" },
      { name: "Jeju Special Self-Governing Province", subtitle: "Capital: Jeju City" },
    ]
  },
  {
    name: "Brazil",
    code: "BR",
    dialCode: "+55",
    flag: "🇧🇷",
    cities: [
      { name: "Federal District (Distrito Federal)", subtitle: "Capital: Brasília" },
      { name: "São Paulo State", subtitle: "Capital: São Paulo" },
      { name: "Rio de Janeiro State", subtitle: "Capital: Rio de Janeiro" },
      { name: "Minas Gerais", subtitle: "Capital: Belo Horizonte" },
      { name: "Bahia", subtitle: "Capital: Salvador" },
      { name: "Paraná", subtitle: "Capital: Curitiba" },
      { name: "Rio Grande do Sul", subtitle: "Capital: Porto Alegre" },
      { name: "Pernambuco", subtitle: "Capital: Recife" },
      { name: "Ceará", subtitle: "Capital: Fortaleza" },
      { name: "Amazonas", subtitle: "Capital: Manaus" },
      { name: "Santa Catarina", subtitle: "Capital: Florianópolis" },
      { name: "Goiás", subtitle: "Capital: Goiânia" },
    ]
  },
  {
    name: "Mexico",
    code: "MX",
    dialCode: "+52",
    flag: "🇲🇽",
    cities: [
      { name: "Mexico City (CDMX)", subtitle: "Capital: Mexico City" },
      { name: "Jalisco", subtitle: "Capital: Guadalajara" },
      { name: "Nuevo León", subtitle: "Capital: Monterrey" },
      { name: "State of Mexico (Edomex)", subtitle: "Capital: Toluca" },
      { name: "Puebla", subtitle: "Capital: Puebla" },
      { name: "Guanajuato", subtitle: "Capital: Guanajuato" },
      { name: "Baja California", subtitle: "Capital: Mexicali" },
      { name: "Chihuahua", subtitle: "Capital: Chihuahua" },
      { name: "Yucatán", subtitle: "Capital: Mérida" },
      { name: "Quintana Roo", subtitle: "Capital: Chetumal" },
      { name: "Querétaro", subtitle: "Capital: Querétaro" },
      { name: "Veracruz", subtitle: "Capital: Xalapa" },
    ]
  },
  {
    name: "Argentina",
    code: "AR",
    dialCode: "+54",
    flag: "🇦🇷",
    cities: [
      { name: "Autonomous City of Buenos Aires (CABA)", subtitle: "Capital: Buenos Aires" },
      { name: "Buenos Aires Province", subtitle: "Capital: La Plata" },
      { name: "Córdoba Province", subtitle: "Capital: Córdoba" },
      { name: "Santa Fe Province", subtitle: "Capital: Santa Fe" },
      { name: "Mendoza Province", subtitle: "Capital: Mendoza" },
      { name: "Tucumán Province", subtitle: "Capital: San Miguel de Tucumán" },
      { name: "Salta Province", subtitle: "Capital: Salta" },
      { name: "Entre Ríos Province", subtitle: "Capital: Paraná" },
      { name: "Neuquén Province", subtitle: "Capital: Neuquén" },
    ]
  },
  {
    name: "Chile",
    code: "CL",
    dialCode: "+56",
    flag: "🇨🇱",
    cities: [
      { name: "Santiago Metropolitan Region", subtitle: "Capital: Santiago" },
      { name: "Valparaíso Region", subtitle: "Capital: Valparaíso" },
      { name: "Biobío Region", subtitle: "Capital: Concepción" },
      { name: "Antofagasta Region", subtitle: "Capital: Antofagasta" },
      { name: "Coquimbo Region", subtitle: "Capital: La Serena" },
      { name: "Araucanía Region", subtitle: "Capital: Temuco" },
      { name: "Los Lagos Region", subtitle: "Capital: Puerto Montt" },
    ]
  },
  {
    name: "Colombia",
    code: "CO",
    dialCode: "+57",
    flag: "🇨🇴",
    cities: [
      { name: "Capital District (Bogotá D.C.)", subtitle: "Capital: Bogotá" },
      { name: "Antioquia Department", subtitle: "Capital: Medellín" },
      { name: "Valle del Cauca Department", subtitle: "Capital: Cali" },
      { name: "Atlántico Department", subtitle: "Capital: Barranquilla" },
      { name: "Bolívar Department", subtitle: "Capital: Cartagena" },
      { name: "Santander Department", subtitle: "Capital: Bucaramanga" },
      { name: "Cundinamarca Department", subtitle: "Capital: Bogotá" },
      { name: "Tolima Department", subtitle: "Capital: Ibagué" },
      { name: "Magdalena Department", subtitle: "Capital: Santa Marta" },
    ]
  },
  {
    name: "Indonesia",
    code: "ID",
    dialCode: "+62",
    flag: "🇮🇩",
    cities: [
      { name: "Special Capital Region of Jakarta", subtitle: "Capital: Jakarta" },
      { name: "East Kalimantan (IKN)", subtitle: "Capital: Nusantara" },
      { name: "West Java (Jawa Barat)", subtitle: "Capital: Bandung" },
      { name: "East Java (Jawa Timur)", subtitle: "Capital: Surabaya" },
      { name: "Central Java (Jawa Tengah)", subtitle: "Capital: Semarang" },
      { name: "North Sumatra (Sumatera Utara)", subtitle: "Capital: Medan" },
      { name: "Banten", subtitle: "Capital: Serang" },
      { name: "Bali", subtitle: "Capital: Denpasar" },
      { name: "South Sulawesi", subtitle: "Capital: Makassar" },
      { name: "South Sumatra", subtitle: "Capital: Palembang" },
    ]
  },
  {
    name: "Philippines",
    code: "PH",
    dialCode: "+63",
    flag: "🇵🇭",
    cities: [
      { name: "National Capital Region (Metro Manila)", subtitle: "Capital: Manila" },
      { name: "Central Visayas", subtitle: "Capital: Cebu City" },
      { name: "Davao Region", subtitle: "Capital: Davao City" },
      { name: "Calabarzon (Region IV-A)", subtitle: "Capital: Calamba" },
      { name: "Central Luzon (Region III)", subtitle: "Capital: San Fernando" },
      { name: "Western Visayas (Region VI)", subtitle: "Capital: Iloilo City" },
      { name: "Northern Mindanao (Region X)", subtitle: "Capital: Cagayan de Oro" },
    ]
  },
  {
    name: "Pakistan",
    code: "PK",
    dialCode: "+92",
    flag: "🇵🇰",
    cities: [
      { name: "Islamabad Capital Territory", subtitle: "Capital: Islamabad" },
      { name: "Sindh", subtitle: "Capital: Karachi" },
      { name: "Punjab", subtitle: "Capital: Lahore" },
      { name: "Khyber Pakhtunkhwa (KPK)", subtitle: "Capital: Peshawar" },
      { name: "Balochistan", subtitle: "Capital: Quetta" },
      { name: "Gilgit-Baltistan", subtitle: "Capital: Gilgit" },
      { name: "Azad Jammu and Kashmir", subtitle: "Capital: Muzaffarabad" },
    ]
  },
  {
    name: "Bangladesh",
    code: "BD",
    dialCode: "+880",
    flag: "🇧🇩",
    cities: [
      { name: "Dhaka Division", subtitle: "Capital: Dhaka" },
      { name: "Chittagong Division", subtitle: "Capital: Chittagong" },
      { name: "Khulna Division", subtitle: "Capital: Khulna" },
      { name: "Rajshahi Division", subtitle: "Capital: Rajshahi" },
      { name: "Sylhet Division", subtitle: "Capital: Sylhet" },
      { name: "Barisal Division", subtitle: "Capital: Barisal" },
      { name: "Rangpur Division", subtitle: "Capital: Rangpur" },
      { name: "Mymensingh Division", subtitle: "Capital: Mymensingh" },
    ]
  },
  {
    name: "Vietnam",
    code: "VN",
    dialCode: "+84",
    flag: "🇻🇳",
    cities: [
      { name: "Hanoi Municipality", subtitle: "Capital: Hanoi" },
      { name: "Ho Chi Minh City Municipality", subtitle: "Capital: Ho Chi Minh City" },
      { name: "Da Nang Municipality", subtitle: "Capital: Da Nang" },
      { name: "Hai Phong Municipality", subtitle: "Capital: Hai Phong" },
      { name: "Can Tho Municipality", subtitle: "Capital: Can Tho" },
      { name: "Dong Nai Province", subtitle: "Capital: Bien Hoa" },
      { name: "Thua Thien Hue Province", subtitle: "Capital: Hue" },
      { name: "Khanh Hoa Province", subtitle: "Capital: Nha Trang" },
      { name: "Ba Ria-Vung Tau Province", subtitle: "Capital: Vung Tau" },
    ]
  },
  {
    name: "Thailand",
    code: "TH",
    dialCode: "+66",
    flag: "🇹🇭",
    cities: [
      { name: "Bangkok Special Administrative Area", subtitle: "Capital: Bangkok" },
      { name: "Chiang Mai Province", subtitle: "Capital: Chiang Mai" },
      { name: "Chonburi Province", subtitle: "Capital: Chonburi" },
      { name: "Phuket Province", subtitle: "Capital: Phuket" },
      { name: "Nonthaburi Province", subtitle: "Capital: Nonthaburi" },
      { name: "Nakhon Ratchasima Province", subtitle: "Capital: Nakhon Ratchasima" },
      { name: "Songkhla Province", subtitle: "Capital: Songkhla" },
    ]
  },
  {
    name: "Turkey",
    code: "TR",
    dialCode: "+90",
    flag: "🇹🇷",
    cities: [
      { name: "Ankara Province", subtitle: "Capital: Ankara" },
      { name: "Istanbul Province", subtitle: "Capital: Istanbul" },
      { name: "Izmir Province", subtitle: "Capital: Izmir" },
      { name: "Bursa Province", subtitle: "Capital: Bursa" },
      { name: "Antalya Province", subtitle: "Capital: Antalya" },
      { name: "Adana Province", subtitle: "Capital: Adana" },
      { name: "Konya Province", subtitle: "Capital: Konya" },
      { name: "Gaziantep Province", subtitle: "Capital: Gaziantep" },
      { name: "Mersin Province", subtitle: "Capital: Mersin" },
    ]
  },
  {
    name: "Israel",
    code: "IL",
    dialCode: "+972",
    flag: "🇮🇱",
    cities: [
      { name: "Jerusalem District", subtitle: "Capital: Jerusalem" },
      { name: "Tel Aviv District", subtitle: "Capital: Tel Aviv" },
      { name: "Central District", subtitle: "Capital: Ramla" },
      { name: "Haifa District", subtitle: "Capital: Haifa" },
      { name: "Southern District", subtitle: "Capital: Beersheba" },
      { name: "Northern District", subtitle: "Capital: Nof HaGalil" },
    ]
  },
  {
    name: "Qatar",
    code: "QA",
    dialCode: "+974",
    flag: "🇶🇦",
    cities: [
      { name: "Doha (Ad-Dawhah)", subtitle: "Capital: Doha" },
      { name: "Al Rayyan Municipality", subtitle: "Capital: Al Rayyan" },
      { name: "Al Daayen Municipality", subtitle: "Capital: Lusail" },
      { name: "Al Wakrah Municipality", subtitle: "Capital: Al Wakrah" },
      { name: "Al Khor Municipality", subtitle: "Capital: Al Khor" },
      { name: "Umm Salal Municipality", subtitle: "Capital: Umm Salal" },
    ]
  },
  {
    name: "Kuwait",
    code: "KW",
    dialCode: "+965",
    flag: "🇰🇼",
    cities: [
      { name: "Capital Governorate (Al Asimah)", subtitle: "Capital: Kuwait City" },
      { name: "Hawalli Governorate", subtitle: "Capital: Hawalli" },
      { name: "Al Ahmadi Governorate", subtitle: "Capital: Al Ahmadi" },
      { name: "Farwaniya Governorate", subtitle: "Capital: Al Farwaniyah" },
      { name: "Mubarak Al-Kabeer Governorate", subtitle: "Capital: Mubarak Al-Kabeer" },
      { name: "Jahra Governorate", subtitle: "Capital: Al Jahra" },
    ]
  },
  {
    name: "Bahrain",
    code: "BH",
    dialCode: "+973",
    flag: "🇧🇭",
    cities: [
      { name: "Capital Governorate", subtitle: "Capital: Manama" },
      { name: "Muharraq Governorate", subtitle: "Capital: Muharraq" },
      { name: "Northern Governorate", subtitle: "Capital: Sar" },
      { name: "Southern Governorate", subtitle: "Capital: Riffa" },
    ]
  },
  {
    name: "Oman",
    code: "OM",
    dialCode: "+968",
    flag: "🇴🇲",
    cities: [
      { name: "Muscat Governorate", subtitle: "Capital: Muscat" },
      { name: "Dhofar Governorate", subtitle: "Capital: Salalah" },
      { name: "Al Batinah North Governorate", subtitle: "Capital: Sohar" },
      { name: "Ad Dakhiliyah Governorate", subtitle: "Capital: Nizwa" },
      { name: "Ash Sharqiyah South Governorate", subtitle: "Capital: Sur" },
      { name: "Al Batinah South Governorate", subtitle: "Capital: Rustaq" },
    ]
  },
  {
    name: "Cameroon",
    code: "CM",
    dialCode: "+237",
    flag: "🇨🇲",
    cities: [
      { name: "Centre Region", subtitle: "Capital: Yaoundé" },
      { name: "Littoral Region", subtitle: "Capital: Douala" },
      { name: "Northwest Region", subtitle: "Capital: Bamenda" },
      { name: "Southwest Region", subtitle: "Capital: Buea" },
      { name: "West Region", subtitle: "Capital: Bafoussam" },
      { name: "North Region", subtitle: "Capital: Garoua" },
      { name: "Far North Region", subtitle: "Capital: Maroua" },
      { name: "Adamawa Region", subtitle: "Capital: Ngaoundéré" },
      { name: "South Region", subtitle: "Capital: Ebolowa" },
      { name: "East Region", subtitle: "Capital: Bertoua" },
    ]
  },
  {
    name: "Ivory Coast",
    code: "CI",
    dialCode: "+225",
    flag: "🇨🇮",
    cities: [
      { name: "Autonomous District of Yamoussoukro", subtitle: "Capital: Yamoussoukro" },
      { name: "Autonomous District of Abidjan", subtitle: "Capital: Abidjan" },
      { name: "Gbêkê Region", subtitle: "Capital: Bouaké" },
      { name: "San-Pédro Region", subtitle: "Capital: San-Pédro" },
      { name: "Haut-Sassandra Region", subtitle: "Capital: Daloa" },
      { name: "Poro Region", subtitle: "Capital: Korhogo" },
      { name: "Tonkpi Region", subtitle: "Capital: Man" },
      { name: "Gôh Region", subtitle: "Capital: Gagnoa" },
    ]
  },
  {
    name: "Senegal",
    code: "SN",
    dialCode: "+221",
    flag: "🇸🇳",
    cities: [
      { name: "Dakar Region", subtitle: "Capital: Dakar" },
      { name: "Thiès Region", subtitle: "Capital: Thiès" },
      { name: "Diourbel Region", subtitle: "Capital: Diourbel" },
      { name: "Saint-Louis Region", subtitle: "Capital: Saint-Louis" },
      { name: "Ziguinchor Region", subtitle: "Capital: Ziguinchor" },
      { name: "Kaolack Region", subtitle: "Capital: Kaolack" },
      { name: "Fatick Region", subtitle: "Capital: Fatick" },
      { name: "Kolda Region", subtitle: "Capital: Kolda" },
      { name: "Tambacounda Region", subtitle: "Capital: Tambacounda" },
    ]
  },
  {
    name: "Ethiopia",
    code: "ET",
    dialCode: "+251",
    flag: "🇪🇹",
    cities: [
      { name: "Addis Ababa", subtitle: "Capital: Addis Ababa" },
      { name: "Dire Dawa", subtitle: "Capital: Dire Dawa" },
      { name: "Oromia Region", subtitle: "Capital: Addis Ababa" },
      { name: "Amhara Region", subtitle: "Capital: Bahir Dar" },
      { name: "Sidama Region", subtitle: "Capital: Hawassa" },
      { name: "Tigray Region", subtitle: "Capital: Mekelle" },
      { name: "Somali Region", subtitle: "Capital: Jigjiga" },
    ]
  },
  {
    name: "Zambia",
    code: "ZM",
    dialCode: "+260",
    flag: "🇿🇲",
    cities: [
      { name: "Lusaka Province", subtitle: "Capital: Lusaka" },
      { name: "Copperbelt Province", subtitle: "Capital: Ndola" },
      { name: "Central Province", subtitle: "Capital: Kabwe" },
      { name: "Southern Province", subtitle: "Capital: Choma" },
      { name: "Eastern Province", subtitle: "Capital: Chipata" },
      { name: "Northern Province", subtitle: "Capital: Kasama" },
      { name: "North-Western Province", subtitle: "Capital: Solwezi" },
      { name: "Western Province", subtitle: "Capital: Mongu" },
      { name: "Luapula Province", subtitle: "Capital: Mansa" },
      { name: "Muchinga Province", subtitle: "Capital: Chinsali" },
    ]
  },
  {
    name: "Zimbabwe",
    code: "ZW",
    dialCode: "+263",
    flag: "🇿🇼",
    cities: [
      { name: "Harare Province", subtitle: "Capital: Harare" },
      { name: "Bulawayo Province", subtitle: "Capital: Bulawayo" },
      { name: "Manicaland Province", subtitle: "Capital: Mutare" },
      { name: "Midlands Province", subtitle: "Capital: Gweru" },
      { name: "Mashonaland West Province", subtitle: "Capital: Chinhoyi" },
      { name: "Mashonaland East Province", subtitle: "Capital: Marondera" },
      { name: "Mashonaland Central Province", subtitle: "Capital: Bindura" },
      { name: "Masvingo Province", subtitle: "Capital: Masvingo" },
      { name: "Matabeleland North Province", subtitle: "Capital: Lupane" },
      { name: "Matabeleland South Province", subtitle: "Capital: Gwanda" },
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
 * Gets state items with clean metadata (State Name as label, Capital as subtitle) for a country.
 */
export const getCityItemsForCountry = (countryName: string): { label: string; value: string; subtitle?: string }[] => {
  const country = getCountryByName(countryName);
  if (!country) return [];
  return country.cities.map(c => {
    if (typeof c === 'string') {
      return {
        label: c,
        value: c,
        subtitle: country.name,
      };
    }
    return {
      label: c.name,
      value: c.name,
      subtitle: c.subtitle || country.name,
    };
  });
};

/**
 * Gets flat state/city names for a given country name.
 */
export const getCitiesForCountry = (countryName: string): string[] => {
  const country = getCountryByName(countryName);
  if (!country) return [];
  return country.cities.map(c => typeof c === 'string' ? c : c.name);
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
