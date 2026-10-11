/**
 * Derby / club catalog for the multi-team test branch.
 *
 * Core list: FourFourTwo “50 Biggest Derbies in the World” (2016).
 * Extra: Bayer Leverkusen ↔ 1. FC Köln, plus original KSC ↔ VfB.
 * Kit colors are classic primary/secondary hex approximations.
 */

export type ClubId = string;

export type Club = {
  id: ClubId;
  short: string;
  name: string;
  country: string;
  league: string;
  primary: string;
  secondary: string;
};

export type Derby = {
  id: string;
  name: string;
  /** FFT rank 1–50, or null for extras */
  rank: number | null;
  a: ClubId;
  b: ClubId;
  country: string;
  league: string;
};

function club(
  id: ClubId,
  short: string,
  name: string,
  country: string,
  league: string,
  primary: string,
  secondary: string,
): Club {
  return { id, short, name, country, league, primary, secondary };
}

export const CLUBS: Record<ClubId, Club> = {
  // --- Germany ---
  ksc: club("ksc", "KSC", "Karlsruher SC", "Deutschland", "2. Bundesliga", "#0156A7", "#FFFFFF"),
  vfb: club("vfb", "VfB", "VfB Stuttgart", "Deutschland", "Bundesliga", "#E32219", "#FFFFFF"),
  bvb: club("bvb", "BVB", "Borussia Dortmund", "Deutschland", "Bundesliga", "#FDE100", "#000000"),
  schalke: club("schalke", "S04", "FC Schalke 04", "Deutschland", "2. Bundesliga", "#004D9E", "#FFFFFF"),
  hsv: club("hsv", "HSV", "Hamburger SV", "Deutschland", "2. Bundesliga", "#005CA9", "#FFFFFF"),
  stpauli: club("stpauli", "STP", "FC St. Pauli", "Deutschland", "Bundesliga", "#E30613", "#8B4513"),
  leverkusen: club(
    "leverkusen",
    "B04",
    "Bayer 04 Leverkusen",
    "Deutschland",
    "Bundesliga",
    "#E32221",
    "#000000",
  ),
  koeln: club("koeln", "KOE", "1. FC Köln", "Deutschland", "Bundesliga", "#ED1C24", "#FFFFFF"),

  // --- England ---
  liverpool: club("liverpool", "LIV", "Liverpool FC", "England", "Premier League", "#C8102E", "#FFFFFF"),
  manutd: club("manutd", "MUN", "Manchester United", "England", "Premier League", "#DA291C", "#FBE122"),
  arsenal: club("arsenal", "ARS", "Arsenal FC", "England", "Premier League", "#EF0107", "#FFFFFF"),
  tottenham: club("tottenham", "TOT", "Tottenham Hotspur", "England", "Premier League", "#132257", "#FFFFFF"),
  newcastle: club("newcastle", "NEW", "Newcastle United", "England", "Premier League", "#241F20", "#FFFFFF"),
  sunderland: club("sunderland", "SUN", "Sunderland AFC", "England", "Championship", "#EB172B", "#FFFFFF"),
  portsmouth: club("portsmouth", "POR", "Portsmouth FC", "England", "Championship", "#003087", "#FFFFFF"),
  southampton: club("southampton", "SOU", "Southampton FC", "England", "Championship", "#D71920", "#FFFFFF"),
  sheffutd: club("sheffutd", "SHU", "Sheffield United", "England", "Championship", "#EE2737", "#FFFFFF"),
  sheffwed: club("sheffwed", "SHW", "Sheffield Wednesday", "England", "Championship", "#007CC3", "#FFFFFF"),

  // --- Spain ---
  barcelona: club("barcelona", "FCB", "FC Barcelona", "Spanien", "La Liga", "#A50044", "#004D98"),
  realmadrid: club("realmadrid", "RMA", "Real Madrid", "Spanien", "La Liga", "#FEBE10", "#00529F"),
  athletic: club("athletic", "ATH", "Athletic Club", "Spanien", "La Liga", "#EE2523", "#FFFFFF"),
  realsociedad: club("realsociedad", "RSO", "Real Sociedad", "Spanien", "La Liga", "#0067B1", "#FFFFFF"),
  betis: club("betis", "BET", "Real Betis", "Spanien", "La Liga", "#00954C", "#FFFFFF"),
  sevilla: club("sevilla", "SEV", "Sevilla FC", "Spanien", "La Liga", "#D71920", "#FFFFFF"),

  // --- Italy ---
  lazio: club("lazio", "LAZ", "SS Lazio", "Italien", "Serie A", "#87D8F7", "#FFFFFF"),
  roma: club("roma", "ROM", "AS Roma", "Italien", "Serie A", "#8E1F2F", "#F0BC42"),
  acmilan: club("acmilan", "MIL", "AC Milan", "Italien", "Serie A", "#FB090B", "#000000"),
  inter: club("inter", "INT", "Inter Milan", "Italien", "Serie A", "#010E80", "#000000"),
  genoa: club("genoa", "GEN", "Genoa CFC", "Italien", "Serie A", "#AD102B", "#0B2B5B"),
  sampdoria: club("sampdoria", "SAM", "UC Sampdoria", "Italien", "Serie B", "#1B49A2", "#C8102E"),

  // --- France ---
  marseille: club("marseille", "OM", "Olympique Marseille", "Frankreich", "Ligue 1", "#2FA8E0", "#FFFFFF"),
  psg: club("psg", "PSG", "Paris Saint-Germain", "Frankreich", "Ligue 1", "#004170", "#DA291C"),
  lyon: club("lyon", "OL", "Olympique Lyonnais", "Frankreich", "Ligue 1", "#003399", "#D71F26"),
  saintetienne: club(
    "saintetienne",
    "STE",
    "AS Saint-Étienne",
    "Frankreich",
    "Ligue 1",
    "#00983E",
    "#FFFFFF",
  ),

  // --- Scotland / Ireland ---
  celtic: club("celtic", "CEL", "Celtic FC", "Schottland", "Scottish Premiership", "#018749", "#FFFFFF"),
  rangers: club("rangers", "RAN", "Rangers FC", "Schottland", "Scottish Premiership", "#1B458F", "#FFFFFF"),
  glentoran: club("glentoran", "GLE", "Glentoran FC", "Nordirland", "NIFL Premiership", "#00843D", "#FFFFFF"),
  linfield: club("linfield", "LIN", "Linfield FC", "Nordirland", "NIFL Premiership", "#0054A4", "#FFFFFF"),

  // --- Netherlands / Portugal / Greece / Turkey ---
  ajax: club("ajax", "AJA", "AFC Ajax", "Niederlande", "Eredivisie", "#D2122E", "#FFFFFF"),
  feyenoord: club("feyenoord", "FEY", "Feyenoord", "Niederlande", "Eredivisie", "#E2001A", "#FFFFFF"),
  benfica: club("benfica", "BEN", "SL Benfica", "Portugal", "Primeira Liga", "#ED1C24", "#FFFFFF"),
  sporting: club("sporting", "SCP", "Sporting CP", "Portugal", "Primeira Liga", "#008057", "#FFFFFF"),
  olympiacos: club("olympiacos", "OLY", "Olympiacos", "Griechenland", "Super League", "#E30613", "#FFFFFF"),
  panathinaikos: club(
    "panathinaikos",
    "PAO",
    "Panathinaikos",
    "Griechenland",
    "Super League",
    "#006633",
    "#FFFFFF",
  ),
  fenerbahce: club("fenerbahce", "FEN", "Fenerbahçe", "Türkei", "Süper Lig", "#FFED00", "#00205B"),
  galatasaray: club("galatasaray", "GAL", "Galatasaray", "Türkei", "Süper Lig", "#A90432", "#FDB913"),

  // --- Balkans / East Europe ---
  partizan: club("partizan", "PAR", "Partizan Belgrad", "Serbien", "SuperLiga", "#000000", "#FFFFFF"),
  redstar: club("redstar", "CZV", "Roter Stern Belgrad", "Serbien", "SuperLiga", "#E30613", "#FFFFFF"),
  hajduk: club("hajduk", "HAJ", "Hajduk Split", "Kroatien", "HNL", "#1D5C9A", "#FFFFFF"),
  dinamozagreb: club("dinamozagreb", "DZG", "Dinamo Zagreb", "Kroatien", "HNL", "#003DA5", "#FFFFFF"),
  velez: club("velez", "VEL", "FK Velež", "Bosnien", "Premijer Liga", "#C8102E", "#FFFFFF"),
  zrinjski: club("zrinjski", "ZRI", "HSK Zrinjski", "Bosnien", "Premijer Liga", "#C8102E", "#FFFFFF"),
  dinamobuc: club("dinamobuc", "DIN", "Dinamo Bukarest", "Rumänien", "Liga I", "#E30613", "#FFFFFF"),
  fcsb: club("fcsb", "FCS", "FCSB", "Rumänien", "Liga I", "#E30613", "#00205B"),
  cskasofia: club("cskasofia", "CSK", "CSKA Sofia", "Bulgarien", "efbet Liga", "#C8102E", "#FFFFFF"),
  levski: club("levski", "LEV", "Lewski Sofia", "Bulgarien", "efbet Liga", "#0033A0", "#FFFFFF"),
  dynamomoscow: club("dynamomoscow", "DYN", "Dynamo Moskau", "Russland", "Premier Liga", "#1E90FF", "#FFFFFF"),
  spartakmoscow: club(
    "spartakmoscow",
    "SPA",
    "Spartak Moskau",
    "Russland",
    "Premier Liga",
    "#E30613",
    "#FFFFFF",
  ),

  // --- South America ---
  boca: club("boca", "BOC", "Boca Juniors", "Argentinien", "Primera División", "#003DA5", "#FDB913"),
  river: club("river", "RIV", "River Plate", "Argentinien", "Primera División", "#E4002B", "#FFFFFF"),
  nacional: club("nacional", "NAC", "Club Nacional", "Uruguay", "Primera División", "#003DA5", "#FFFFFF"),
  penarol: club("penarol", "PEN", "Peñarol", "Uruguay", "Primera División", "#FFD100", "#000000"),
  gremio: club("gremio", "GRE", "Grêmio", "Brasilien", "Série A", "#0D8AD6", "#000000"),
  internacional: club(
    "internacional",
    "INTB",
    "Internacional",
    "Brasilien",
    "Série A",
    "#E30613",
    "#FFFFFF",
  ),
  flamengo: club("flamengo", "FLA", "Flamengo", "Brasilien", "Série A", "#C8102E", "#000000"),
  fluminense: club("fluminense", "FLU", "Fluminense", "Brasilien", "Série A", "#006400", "#C8102E"),
  corinthians: club("corinthians", "COR", "Corinthians", "Brasilien", "Série A", "#000000", "#FFFFFF"),
  palmeiras: club("palmeiras", "PAL", "Palmeiras", "Brasilien", "Série A", "#006437", "#FFFFFF"),
  bahia: club("bahia", "BAH", "EC Bahia", "Brasilien", "Série A", "#0066B3", "#E30613"),
  vitoria: club("vitoria", "VIT", "EC Vitória", "Brasilien", "Série A", "#E30613", "#000000"),
  independiente: club(
    "independiente",
    "IND",
    "Independiente",
    "Argentinien",
    "Primera División",
    "#E30613",
    "#FFFFFF",
  ),
  racing: club("racing", "RAC", "Racing Club", "Argentinien", "Primera División", "#8AC5E8", "#FFFFFF"),
  newells: club("newells", "NOB", "Newell's Old Boys", "Argentinien", "Primera División", "#E30613", "#000000"),
  rosario: club("rosario", "CEN", "Rosario Central", "Argentinien", "Primera División", "#003DA5", "#FDB913"),
  cerro: club("cerro", "CCP", "Cerro Porteño", "Paraguay", "Primera División", "#E30613", "#003DA5"),
  olimpia: club("olimpia", "OLI", "Club Olimpia", "Paraguay", "Primera División", "#000000", "#FFFFFF"),
  alianza: club("alianza", "ALI", "Alianza Lima", "Peru", "Liga 1", "#003DA5", "#FFFFFF"),
  universitario: club(
    "universitario",
    "UNI",
    "Universitario",
    "Peru",
    "Liga 1",
    "#8B0000",
    "#F5D76E",
  ),
  america_cali: club(
    "america_cali",
    "AME",
    "América de Cali",
    "Kolumbien",
    "Categoría Primera A",
    "#E30613",
    "#FFFFFF",
  ),
  deporcali: club(
    "deporcali",
    "CAL",
    "Deportivo Cali",
    "Kolumbien",
    "Categoría Primera A",
    "#007A33",
    "#FFFFFF",
  ),
  colocolo: club("colocolo", "COL", "Colo-Colo", "Chile", "Primera División", "#000000", "#FFFFFF"),
  udechile: club(
    "udechile",
    "UCH",
    "Universidad de Chile",
    "Chile",
    "Primera División",
    "#003DA5",
    "#E30613",
  ),
  blooming: club("blooming", "BLO", "Blooming", "Bolivien", "División Profesional", "#003DA5", "#FFFFFF"),
  oriente: club(
    "oriente",
    "OP",
    "Oriente Petrolero",
    "Bolivien",
    "División Profesional",
    "#007A33",
    "#FFFFFF",
  ),
  barcelona_ecu: club(
    "barcelona_ecu",
    "BSC",
    "Barcelona SC",
    "Ecuador",
    "LigaPro",
    "#FDB913",
    "#000000",
  ),
  emelec: club("emelec", "EME", "Emelec", "Ecuador", "LigaPro", "#003DA5", "#FFFFFF"),
  everton_chile: club(
    "everton_chile",
    "EVE",
    "Everton Viña del Mar",
    "Chile",
    "Primera División",
    "#003DA5",
    "#FDB913",
  ),
  santiagow: club(
    "santiagow",
    "SW",
    "Santiago Wanderers",
    "Chile",
    "Primera B",
    "#007A33",
    "#FFFFFF",
  ),

  // --- Other ---
  alahly: club("alahly", "AHL", "Al Ahly", "Ägypten", "Premier League", "#E30613", "#FFFFFF"),
  zamalek: club("zamalek", "ZAM", "Zamalek SC", "Ägypten", "Premier League", "#FFFFFF", "#E30613"),
  chivas: club("chivas", "CHI", "Chivas Guadalajara", "Mexiko", "Liga MX", "#E30613", "#FFFFFF"),
  clubamerica: club("clubamerica", "AME", "Club América", "Mexiko", "Liga MX", "#FDB913", "#003DA5"),
  raja: club("raja", "RAJ", "Raja Casablanca", "Marokko", "Botola", "#007A33", "#FFFFFF"),
  wydad: club("wydad", "WAC", "Wydad Casablanca", "Marokko", "Botola", "#E30613", "#FFFFFF"),
  esteghlal: club("esteghlal", "EST", "Esteghlal", "Iran", "Persian Gulf Pro", "#003DA5", "#FFFFFF"),
  persepolis: club("persepolis", "PRS", "Persepolis", "Iran", "Persian Gulf Pro", "#E30613", "#FFFFFF"),
  kaizer: club("kaizer", "KAI", "Kaizer Chiefs", "Südafrika", "PSL", "#FDB913", "#000000"),
  orlando: club("orlando", "ORL", "Orlando Pirates", "Südafrika", "PSL", "#000000", "#FFFFFF"),
  fcseoul: club("fcseoul", "SEO", "FC Seoul", "Südkorea", "K League", "#E30613", "#000000"),
  suwon: club("suwon", "SUW", "Suwon Bluewings", "Südkorea", "K League", "#003DA5", "#E30613"),
  eastbengal: club("eastbengal", "EB", "East Bengal", "Indien", "Indian Super League", "#E30613", "#FDB913"),
  mohunbagan: club(
    "mohunbagan",
    "MB",
    "Mohun Bagan",
    "Indien",
    "Indian Super League",
    "#007A33",
    "#8B0000",
  ),
  portland: club("portland", "PTI", "Portland Timbers", "USA", "MLS", "#004812", "#FFFFFF"),
  seattle: club("seattle", "SEA", "Seattle Sounders", "USA", "MLS", "#5D9732", "#005595"),
};

/** FFT 50 (rank) + extras (rank null). Pair order is display-only. */
export const DERBIES: Derby[] = [
  { id: "superclasico", name: "Superclásico", rank: 1, a: "boca", b: "river", country: "Argentinien", league: "Primera División" },
  { id: "elclasico", name: "El Clásico", rank: 2, a: "barcelona", b: "realmadrid", country: "Spanien", league: "La Liga" },
  { id: "oldfirm", name: "Old Firm", rank: 3, a: "celtic", b: "rangers", country: "Schottland", league: "Scottish Premiership" },
  { id: "clasicouru", name: "Clásico del fútbol uruguayo", rank: 4, a: "nacional", b: "penarol", country: "Uruguay", league: "Primera División" },
  { id: "dellacapitale", name: "Derby della Capitale", rank: 5, a: "lazio", b: "roma", country: "Italien", league: "Serie A" },
  { id: "intercontinental", name: "Kıtalararası Derbi", rank: 6, a: "fenerbahce", b: "galatasaray", country: "Türkei", league: "Süper Lig" },
  { id: "northwest", name: "North West Derby", rank: 7, a: "liverpool", b: "manutd", country: "England", league: "Premier League" },
  { id: "grenal", name: "Grenal", rank: 8, a: "gremio", b: "internacional", country: "Brasilien", league: "Série A" },
  { id: "revierderby", name: "Revierderby", rank: 9, a: "bvb", b: "schalke", country: "Deutschland", league: "Bundesliga" },
  { id: "cairo", name: "Cairo Derby", rank: 10, a: "alahly", b: "zamalek", country: "Ägypten", league: "Premier League" },
  { id: "leclassique", name: "Le Classique", rank: 11, a: "marseille", b: "psg", country: "Frankreich", league: "Ligue 1" },
  { id: "nacionalmx", name: "Clásico Nacional", rank: 12, a: "chivas", b: "clubamerica", country: "Mexiko", league: "Liga MX" },
  { id: "madonnina", name: "Derby della Madonnina", rank: 13, a: "acmilan", b: "inter", country: "Italien", league: "Serie A" },
  { id: "southcoast", name: "South Coast Derby", rank: 14, a: "portsmouth", b: "southampton", country: "England", league: "Championship" },
  { id: "avellaneda", name: "Clásico de Avellaneda", rank: 15, a: "independiente", b: "racing", country: "Argentinien", league: "Primera División" },
  { id: "deklassieker", name: "De Klassieker", rank: 16, a: "ajax", b: "feyenoord", country: "Niederlande", league: "Eredivisie" },
  { id: "mostar", name: "Mostar Derby", rank: 17, a: "velez", b: "zrinjski", country: "Bosnien", league: "Premijer Liga" },
  { id: "flaflu", name: "Fla-Flu", rank: 18, a: "flamengo", b: "fluminense", country: "Brasilien", league: "Série A" },
  { id: "derbyofgreece", name: "Derby of the Eternal Enemies", rank: 19, a: "olympiacos", b: "panathinaikos", country: "Griechenland", league: "Super League" },
  { id: "northlondon", name: "North London Derby", rank: 20, a: "arsenal", b: "tottenham", country: "England", league: "Premier League" },
  { id: "kolkata", name: "Kolkata Derby", rank: 21, a: "eastbengal", b: "mohunbagan", country: "Indien", league: "Indian Super League" },
  { id: "eternalbelgrade", name: "Ewiges Derby", rank: 22, a: "partizan", b: "redstar", country: "Serbien", league: "SuperLiga" },
  { id: "paulista", name: "Derby Paulista", rank: 23, a: "corinthians", b: "palmeiras", country: "Brasilien", league: "Série A" },
  { id: "tynewear", name: "Tyne–Wear Derby", rank: 24, a: "newcastle", b: "sunderland", country: "England", league: "Premier League" },
  { id: "sevilladerby", name: "Derbi sevillano", rank: 25, a: "betis", b: "sevilla", country: "Spanien", league: "La Liga" },
  { id: "casablanca", name: "Casablanca Derby", rank: 26, a: "raja", b: "wydad", country: "Marokko", league: "Botola" },
  { id: "eternalcroatia", name: "Ewiges Derby (HR)", rank: 27, a: "hajduk", b: "dinamozagreb", country: "Kroatien", league: "HNL" },
  { id: "lisbon", name: "Derby de Lisboa", rank: 28, a: "benfica", b: "sporting", country: "Portugal", league: "Primeira Liga" },
  { id: "superclasicochile", name: "Superclásico chileno", rank: 29, a: "colocolo", b: "udechile", country: "Chile", league: "Primera División" },
  { id: "dellalanterna", name: "Derby della Lanterna", rank: 30, a: "genoa", b: "sampdoria", country: "Italien", league: "Serie A" },
  { id: "soweto", name: "Soweto Derby", rank: 31, a: "kaizer", b: "orlando", country: "Südafrika", league: "PSL" },
  { id: "eternalbucharest", name: "Ewiges Derby (RO)", rank: 32, a: "dinamobuc", b: "fcsb", country: "Rumänien", league: "Liga I" },
  { id: "tehran", name: "Tehran Derby", rank: 33, a: "esteghlal", b: "persepolis", country: "Iran", league: "Persian Gulf Pro" },
  { id: "clasicoecu", name: "Clásico del Astillero", rank: 34, a: "barcelona_ecu", b: "emelec", country: "Ecuador", league: "LigaPro" },
  { id: "bigtwo", name: "Big Two Derby", rank: 35, a: "glentoran", b: "linfield", country: "Nordirland", league: "NIFL Premiership" },
  { id: "clasicopy", name: "Clásico del fútbol paraguayo", rank: 36, a: "cerro", b: "olimpia", country: "Paraguay", league: "Primera División" },
  { id: "eternalsofia", name: "Ewiges Derby (BG)", rank: 37, a: "cskasofia", b: "levski", country: "Bulgarien", league: "efbet Liga" },
  { id: "clasicoperu", name: "Clásico peruano", rank: 38, a: "alianza", b: "universitario", country: "Peru", league: "Liga 1" },
  { id: "stadtderbyhh", name: "Hamburger Stadtderby", rank: 39, a: "hsv", b: "stpauli", country: "Deutschland", league: "Bundesliga" },
  { id: "clasicocali", name: "Clásico vallecaucano", rank: 40, a: "america_cali", b: "deporcali", country: "Kolumbien", league: "Categoría Primera A" },
  { id: "moscow", name: "Moskauer Derby", rank: 41, a: "dynamomoscow", b: "spartakmoscow", country: "Russland", league: "Premier Liga" },
  { id: "baiano", name: "Ba-Vi", rank: 42, a: "bahia", b: "vitoria", country: "Brasilien", league: "Série A" },
  { id: "supermatch", name: "Super Match", rank: 43, a: "fcseoul", b: "suwon", country: "Südkorea", league: "K League" },
  { id: "puertochile", name: "Clásico Porteño", rank: 44, a: "everton_chile", b: "santiagow", country: "Chile", league: "Primera División" },
  { id: "basque", name: "Basque Derby", rank: 45, a: "athletic", b: "realsociedad", country: "Spanien", league: "La Liga" },
  { id: "rosario", name: "Clásico rosarino", rank: 46, a: "newells", b: "rosario", country: "Argentinien", league: "Primera División" },
  { id: "rhone", name: "Le Derby (Rhône)", rank: 47, a: "lyon", b: "saintetienne", country: "Frankreich", league: "Ligue 1" },
  { id: "cascadia", name: "Cascadia Cup", rank: 48, a: "portland", b: "seattle", country: "USA", league: "MLS" },
  { id: "cruceño", name: "Clásico cruceño", rank: 49, a: "blooming", b: "oriente", country: "Bolivien", league: "División Profesional" },
  { id: "steelcity", name: "Steel City Derby", rank: 50, a: "sheffutd", b: "sheffwed", country: "England", league: "Championship" },
  // Extras (not FFT-ranked)
  { id: "rheinisch", name: "Rheinisches Derby", rank: null, a: "leverkusen", b: "koeln", country: "Deutschland", league: "Bundesliga" },
  { id: "badenwuerttemberg", name: "Baden-Württemberg", rank: null, a: "ksc", b: "vfb", country: "Deutschland", league: "Bundesliga" },
];

export function getClub(id: ClubId): Club {
  const c = CLUBS[id];
  if (!c) throw new Error(`Unknown club: ${id}`);
  return c;
}

export function allClubs(): Club[] {
  return Object.values(CLUBS).sort((a, b) =>
    a.country === b.country
      ? a.name.localeCompare(b.name, "de")
      : a.country.localeCompare(b.country, "de"),
  );
}

export function clubsByCountry(): { country: string; clubs: Club[] }[] {
  const map = new Map<string, Club[]>();
  for (const c of allClubs()) {
    const list = map.get(c.country) ?? [];
    list.push(c);
    map.set(c.country, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([country, clubs]) => ({ country, clubs }));
}

export function derbiesByCountry(): { country: string; derbies: Derby[] }[] {
  const map = new Map<string, Derby[]>();
  for (const d of DERBIES) {
    const list = map.get(d.country) ?? [];
    list.push(d);
    map.set(d.country, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([country, derbies]) => ({ country, derbies }));
}

export function derbiesByLeague(): { league: string; country: string; derbies: Derby[] }[] {
  const map = new Map<string, Derby[]>();
  for (const d of DERBIES) {
    const key = `${d.country} · ${d.league}`;
    const list = map.get(key) ?? [];
    list.push(d);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "de"))
    .map(([key, derbies]) => {
      const [country, league] = key.split(" · ");
      return {
        country: country!,
        league: league!,
        derbies: derbies.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)),
      };
    });
}

export function findDerby(id: string): Derby | undefined {
  return DERBIES.find((d) => d.id === id);
}

/** Default branding when none chosen */
export const DEFAULT_PLAYER_CLUB: ClubId = "ksc";
export const DEFAULT_AI_CLUB: ClubId = "vfb";
export const DEFAULT_DERBY_ID = "badenwuerttemberg";

/** Live branding for the current match / menu preview (side slots stay ksc|vfb). */
let brandHeim: Club = CLUBS.ksc!;
let brandGast: Club = CLUBS.vfb!;

export function setSideBranding(heimClubId: ClubId, gastClubId: ClubId): void {
  brandHeim = getClub(heimClubId);
  brandGast = getClub(gastClubId);
  // Invalidate live-tinted sprite cache (lazy import avoids cycles)
  void import("./liveTint").then((m) => m.bumpLiveTintEpoch()).catch(() => {});
}

export function brandingForSide(side: "ksc" | "vfb" | "neutral" | null | undefined): Club | null {
  if (side === "ksc") return brandHeim;
  if (side === "vfb") return brandGast;
  return null;
}

export function clubShort(side: "ksc" | "vfb"): string {
  return side === "ksc" ? brandHeim.short : brandGast.short;
}

export function clubPrimary(side: "ksc" | "vfb"): string {
  return side === "ksc" ? brandHeim.primary : brandGast.primary;
}

export function clubSecondary(side: "ksc" | "vfb"): string {
  return side === "ksc" ? brandHeim.secondary : brandGast.secondary;
}

export function currentBranding(): { heim: Club; gast: Club } {
  return { heim: brandHeim, gast: brandGast };
}

/** Push club colors into CSS variables used by HUD / buttons. */
export function applyClubCssVars(root: HTMLElement = document.documentElement): void {
  root.style.setProperty("--ksc", brandHeim.primary);
  root.style.setProperty("--vfb", brandGast.primary);
  root.style.setProperty("--ksc-secondary", brandHeim.secondary);
  root.style.setProperty("--vfb-secondary", brandGast.secondary);
}

export function ensureRequiredClubsPresent(): { liverpool: boolean; leverkusen: boolean } {
  return {
    liverpool: !!CLUBS.liverpool && DERBIES.some((d) => d.a === "liverpool" || d.b === "liverpool"),
    leverkusen:
      !!CLUBS.leverkusen && DERBIES.some((d) => d.a === "leverkusen" || d.b === "leverkusen"),
  };
}
