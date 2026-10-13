/**
 * Derby / club catalog for the multi-team test branch.
 *
 * Core list: FourFourTwo “50 Biggest Derbies in the World” (2016).
 * Extra: Bayer Leverkusen ↔ 1. FC Köln, plus original KSC ↔ VfB.
 * Plus Nationalmannschaften (kit primary/secondary + separate flag paint).
 * Kit colors are classic primary/secondary hex approximations.
 */

export type ClubId = string;

export type ClubKind = "club" | "national";

/** Procedural flag paint — separate from kit tint colors. */
export type FlagSpec =
  | { style: "h"; colors: string[] }
  | { style: "v"; colors: string[] }
  | { style: "cross"; field: string; cross: string }
  | { style: "nordic"; field: string; cross: string }
  | { style: "circle"; field: string; disc: string }
  | { style: "saltire"; field: string; saltire: string };

export type Club = {
  id: ClubId;
  short: string;
  name: string;
  country: string;
  league: string;
  /** Kit / jersey tint (not necessarily flag colors). */
  primary: string;
  secondary: string;
  kind: ClubKind;
  /** National flag paint for logos / fan props / standards. */
  flag?: FlagSpec;
  /** Continent / region bucket for national pick UI. */
  region?: string;
  /** FIFA men's ranking (approx.) — nationals only; lower = stronger. */
  fifaRank?: number;
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

/** International fixture (Länderspiel / rivalry). */
export type NationalFixture = {
  id: string;
  name: string;
  a: ClubId;
  b: ClubId;
  region: string;
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
  return { id, short, name, country, league, primary, secondary, kind: "club" };
}

function nation(
  id: ClubId,
  short: string,
  name: string,
  region: string,
  primary: string,
  secondary: string,
  flag: FlagSpec,
  fifaRank?: number,
): Club {
  return {
    id,
    short,
    name,
    country: name,
    league: "Nationalmannschaft",
    primary,
    secondary,
    kind: "national",
    flag,
    region,
    fifaRank,
  };
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
  dynamodresden: club(
    "dynamodresden",
    "SGD",
    "SG Dynamo Dresden",
    "Deutschland",
    "3. Liga",
    "#FFD200",
    "#000000",
  ),
  waldhof: club(
    "waldhof",
    "WMA",
    "SV Waldhof Mannheim",
    "Deutschland",
    "3. Liga",
    "#003DA5",
    "#000000",
  ),
  kaiserslautern: club(
    "kaiserslautern",
    "FCK",
    "1. FC Kaiserslautern",
    "Deutschland",
    "2. Bundesliga",
    "#E30613",
    "#FFFFFF",
  ),
  efferen: club(
    "efferen",
    "BCE",
    "BC Efferen",
    "Deutschland",
    "Amateur",
    "#0047AB",
    "#FFFFFF",
  ),

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

  // --- Nationalmannschaften (FIFA Top-25 + extras; kit = home jersey) ---
  arg: nation("arg", "ARG", "Argentinien", "Südamerika", "#74ACDF", "#FFFFFF", { style: "h", colors: ["#74ACDF", "#FFFFFF", "#74ACDF"] }, 1),
  fra: nation("fra", "FRA", "Frankreich", "Europa", "#002395", "#FFFFFF", { style: "v", colors: ["#002395", "#FFFFFF", "#ED2939"] }, 2),
  esp: nation("esp", "ESP", "Spanien", "Europa", "#C60B1E", "#FABD00", { style: "h", colors: ["#AA151B", "#F1BF00", "#AA151B"] }, 3),
  eng: nation("eng", "ENG", "England", "Europa", "#FFFFFF", "#00205B", { style: "cross", field: "#FFFFFF", cross: "#C8102E" }, 4),
  bra: nation("bra", "BRA", "Brasilien", "Südamerika", "#FEE72F", "#009C3B", { style: "h", colors: ["#009C3B", "#FFDF00", "#002776"] }, 5),
  por: nation("por", "POR", "Portugal", "Europa", "#FF0000", "#006600", { style: "v", colors: ["#006600", "#FF0000"] }, 6),
  ned: nation("ned", "NED", "Niederlande", "Europa", "#FF6600", "#FFFFFF", { style: "h", colors: ["#AE1C28", "#FFFFFF", "#21468B"] }, 7),
  bel: nation("bel", "BEL", "Belgien", "Europa", "#EF3340", "#FAE100", { style: "v", colors: ["#000000", "#FAE042", "#ED2939"] }, 8),
  ita: nation("ita", "ITA", "Italien", "Europa", "#0066B3", "#FFFFFF", { style: "v", colors: ["#009246", "#FFFFFF", "#CE2B37"] }, 9),
  ger: nation("ger", "GER", "Deutschland", "Europa", "#FFFFFF", "#000000", { style: "h", colors: ["#000000", "#DD0000", "#FFCE00"] }, 10),
  cro: nation("cro", "CRO", "Kroatien", "Europa", "#FF0000", "#FFFFFF", { style: "h", colors: ["#FF0000", "#FFFFFF", "#171796"] }, 11),
  mar: nation("mar", "MAR", "Marokko", "Afrika", "#C1272D", "#006233", { style: "h", colors: ["#C1272D", "#006233"] }, 12),
  col: nation("col", "COL", "Kolumbien", "Südamerika", "#FCD116", "#003893", { style: "h", colors: ["#FCD116", "#003893", "#CE1126"] }, 13),
  uru: nation("uru", "URU", "Uruguay", "Südamerika", "#5BA3D9", "#000000", { style: "h", colors: ["#FFFFFF", "#0038A8"] }, 14),
  usa: nation("usa", "USA", "USA", "Nordamerika", "#FFFFFF", "#002868", { style: "h", colors: ["#B22234", "#FFFFFF", "#3C3B6E"] }, 15),
  mex: nation("mex", "MEX", "Mexiko", "Nordamerika", "#006847", "#FFFFFF", { style: "v", colors: ["#006847", "#FFFFFF", "#CE1126"] }, 16),
  sui: nation("sui", "SUI", "Schweiz", "Europa", "#FF0000", "#FFFFFF", { style: "cross", field: "#FF0000", cross: "#FFFFFF" }, 17),
  jap: nation("jap", "JPN", "Japan", "Asien", "#000080", "#FFFFFF", { style: "circle", field: "#FFFFFF", disc: "#BC002D" }, 18),
  sen: nation("sen", "SEN", "Senegal", "Afrika", "#00853F", "#FDEF42", { style: "v", colors: ["#00853F", "#FDEF42", "#E31B23"] }, 19),
  irn: nation("irn", "IRN", "Iran", "Asien", "#FFFFFF", "#239F40", { style: "h", colors: ["#239F40", "#FFFFFF", "#DA0000"] }, 20),
  den: nation("den", "DEN", "Dänemark", "Europa", "#C8102E", "#FFFFFF", { style: "nordic", field: "#C8102E", cross: "#FFFFFF" }, 21),
  kor: nation("kor", "KOR", "Südkorea", "Asien", "#C60C30", "#003478", { style: "h", colors: ["#FFFFFF", "#C60C30", "#003478"] }, 22),
  aut: nation("aut", "AUT", "Österreich", "Europa", "#ED2939", "#FFFFFF", { style: "h", colors: ["#ED2939", "#FFFFFF", "#ED2939"] }, 23),
  aus: nation("aus", "AUS", "Australien", "Asien", "#00008B", "#FFCD00", { style: "h", colors: ["#00008B", "#FFCD00"] }, 24),
  ukr: nation("ukr", "UKR", "Ukraine", "Europa", "#0057B7", "#FFD700", { style: "h", colors: ["#0057B7", "#FFD700"] }, 25),
  // Extras beyond Top-25 (free pick)
  swe: nation("swe", "SWE", "Schweden", "Europa", "#FFCD00", "#006AA7", { style: "nordic", field: "#006AA7", cross: "#FECC00" }),
  nor: nation("nor", "NOR", "Norwegen", "Europa", "#BA0C2F", "#00205B", { style: "nordic", field: "#BA0C2F", cross: "#FFFFFF" }),
  pol: nation("pol", "POL", "Polen", "Europa", "#FFFFFF", "#DC143C", { style: "h", colors: ["#FFFFFF", "#DC143C"] }),
  tur: nation("tur", "TUR", "Türkei", "Europa", "#E30A17", "#FFFFFF", { style: "circle", field: "#E30A17", disc: "#FFFFFF" }),
  sco: nation("sco", "SCO", "Schottland", "Europa", "#0065BD", "#FFFFFF", { style: "saltire", field: "#005EB8", saltire: "#FFFFFF" }),
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

/** ~10 famous Länderspiel-Derbys for Nation → Klassiker. */
export const NATIONAL_FIXTURES: NationalFixture[] = [
  { id: "de-nl", name: "Klassiker DE–NL", a: "ger", b: "ned", region: "Europa" },
  { id: "bra-arg", name: "Superclásico das Américas", a: "bra", b: "arg", region: "Südamerika" },
  { id: "eng-ger", name: "England–Deutschland", a: "eng", b: "ger", region: "Europa" },
  { id: "arg-fra", name: "WM-Finale-Feeling", a: "arg", b: "fra", region: "Welt" },
  { id: "esp-por", name: "Iberisches Duell", a: "esp", b: "por", region: "Europa" },
  { id: "usa-mex", name: "CONCACAF Rivalry", a: "usa", b: "mex", region: "Nordamerika" },
  { id: "sco-eng", name: "Auld Enemy", a: "sco", b: "eng", region: "Europa" },
  { id: "jap-kor", name: "Ostasien-Derby", a: "jap", b: "kor", region: "Asien" },
  { id: "ita-fra", name: "Frankreich–Italien", a: "fra", b: "ita", region: "Europa" },
  { id: "mar-sen", name: "Afrika-Klassiker", a: "mar", b: "sen", region: "Afrika" },
];

export const DEFAULT_NATIONAL_FIXTURE_ID = "de-nl";
export const DEFAULT_PLAYER_NATION: ClubId = "ger";
export const DEFAULT_AI_NATION: ClubId = "ned";

export function getClub(id: ClubId): Club {
  const c = CLUBS[id];
  if (!c) throw new Error(`Unknown club: ${id}`);
  return c;
}

/** Resolve catalog id from short code (e.g. B04 → leverkusen). Case-insensitive. */
export function clubIdFromShort(short: string | undefined): ClubId | undefined {
  if (!short) return undefined;
  const want = short.trim().toLowerCase();
  if (!want) return undefined;
  for (const c of Object.values(CLUBS)) {
    if (c.short.toLowerCase() === want) return c.id;
  }
  return undefined;
}

export function isNational(club: Club | ClubId): boolean {
  const c = typeof club === "string" ? CLUBS[club] : club;
  return !!c && c.kind === "national";
}

export function allClubs(): Club[] {
  return Object.values(CLUBS)
    .filter((c) => c.kind !== "national")
    .sort((a, b) =>
      a.country === b.country
        ? a.name.localeCompare(b.name, "de")
        : a.country.localeCompare(b.country, "de"),
    );
}

export function allNationals(): Club[] {
  return Object.values(CLUBS)
    .filter((c) => c.kind === "national")
    .sort((a, b) => {
      const ra = a.fifaRank ?? 999;
      const rb = b.fifaRank ?? 999;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name, "de");
    });
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

export function nationalsByRegion(): { region: string; nations: Club[] }[] {
  const map = new Map<string, Club[]>();
  for (const c of allNationals()) {
    const region = c.region ?? "Welt";
    const list = map.get(region) ?? [];
    list.push(c);
    map.set(region, list);
  }
  const order = ["Europa", "Südamerika", "Nordamerika", "Asien", "Afrika", "Welt"];
  return [...map.entries()]
    .sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      const sa = ia < 0 ? 99 : ia;
      const sb = ib < 0 ? 99 : ib;
      return sa === sb ? a[0].localeCompare(b[0], "de") : sa - sb;
    })
    .map(([region, nations]) => ({
      region,
      nations: nations.sort(
        (a, b) => (a.fifaRank ?? 999) - (b.fifaRank ?? 999),
      ),
    }));
}

/** Colors from a national flag for cheer confetti. */
export function flagCheerColors(flag: FlagSpec): string[] {
  if (flag.style === "h" || flag.style === "v") return [...flag.colors];
  if (flag.style === "cross" || flag.style === "nordic") {
    return [flag.field, flag.cross];
  }
  if (flag.style === "circle") return [flag.field, flag.disc];
  if (flag.style === "saltire") return [flag.field, flag.saltire];
  return [];
}

/** Confetti palette: flag colors for nations, kit prim/sec for clubs. */
export function cheerPalette(side: "ksc" | "vfb"): [string, string] {
  const flag = clubFlag(side);
  if (flag) {
    const cols = flagCheerColors(flag).filter(Boolean);
    if (cols.length >= 2) return [cols[0]!, cols[1]!];
    if (cols.length === 1) return [cols[0]!, clubSecondary(side)];
  }
  return [clubPrimary(side), clubSecondary(side)];
}

export function nationalFixturesByRegion(): {
  region: string;
  fixtures: NationalFixture[];
}[] {
  const map = new Map<string, NationalFixture[]>();
  for (const f of NATIONAL_FIXTURES) {
    const list = map.get(f.region) ?? [];
    list.push(f);
    map.set(f.region, list);
  }
  const order = ["Europa", "Südamerika", "Nordamerika", "Asien", "Afrika", "Welt"];
  return [...map.entries()]
    .sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      const sa = ia < 0 ? 99 : ia;
      const sb = ib < 0 ? 99 : ib;
      return sa === sb ? a[0].localeCompare(b[0], "de") : sa - sb;
    })
    .map(([region, fixtures]) => ({ region, fixtures }));
}

export function findNationalFixture(id: string): NationalFixture | undefined {
  return NATIONAL_FIXTURES.find((f) => f.id === id);
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

/** Effective kit for this matchup (away may switch to secondary on primary clash). */
let kitHeimPrimary = CLUBS.ksc!.primary;
let kitHeimSecondary = CLUBS.ksc!.secondary;
let kitGastPrimary = CLUBS.vfb!.primary;
let kitGastSecondary = CLUBS.vfb!.secondary;
/** True when Gast plays secondary because primaries clash. */
let gastKitClash = false;

function parseHexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

function rgbDist(a: string, b: string): number {
  const [r1, g1, b1] = parseHexRgb(a);
  const [r2, g2, b2] = parseHexRgb(b);
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHslSimple(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/** True when two kit primaries would be hard to tell apart on pitch/tribune. */
export function kitPrimariesClash(a: string, b: string): boolean {
  if (rgbDist(a, b) < 72) return true;
  const [r1, g1, b1] = parseHexRgb(a);
  const [r2, g2, b2] = parseHexRgb(b);
  const [h1, s1, l1] = rgbToHslSimple(r1, g1, b1);
  const [h2, s2, l2] = rgbToHslSimple(r2, g2, b2);
  // Both near-white / near-black
  if (l1 > 0.85 && l2 > 0.85) return true;
  if (l1 < 0.12 && l2 < 0.12) return true;
  // Same hue family (e.g. Leverkusen vs Köln red)
  if (s1 > 0.28 && s2 > 0.28) {
    let dh = Math.abs(h1 - h2);
    if (dh > 180) dh = 360 - dh;
    if (dh < 32 && Math.abs(l1 - l2) < 0.28) return true;
  }
  return false;
}

function contrastFallback(against: string): string {
  return hexLuma(against) > 140 ? "#0f172a" : "#f8fafc";
}

function resolveMatchKits(): void {
  kitHeimPrimary = brandHeim.primary;
  kitHeimSecondary = brandHeim.secondary;
  kitGastPrimary = brandGast.primary;
  kitGastSecondary = brandGast.secondary;
  gastKitClash = false;

  if (!kitPrimariesClash(kitHeimPrimary, kitGastPrimary)) return;

  // Away plays in secondary (classic kit clash)
  const awayAlt = brandGast.secondary;
  if (
    !kitPrimariesClash(kitHeimPrimary, awayAlt) &&
    rgbDist(awayAlt, brandGast.primary) > 28
  ) {
    kitGastPrimary = awayAlt;
    kitGastSecondary = brandGast.primary;
    gastKitClash = true;
    return;
  }
  // Secondary also clashes / is too close — pick high-contrast fallback
  kitGastPrimary = contrastFallback(kitHeimPrimary);
  kitGastSecondary = brandGast.primary;
  gastKitClash = true;
}

export function setSideBranding(heimClubId: ClubId, gastClubId: ClubId): void {
  brandHeim = getClub(heimClubId);
  brandGast = getClub(gastClubId);
  resolveMatchKits();
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

/** Match kit primary (tribune / units) — away may be secondary on clash. */
export function clubPrimary(side: "ksc" | "vfb"): string {
  return side === "ksc" ? kitHeimPrimary : kitGastPrimary;
}

/** Match kit secondary (trim / FX accents). */
export function clubSecondary(side: "ksc" | "vfb"): string {
  return side === "ksc" ? kitHeimSecondary : kitGastSecondary;
}

/**
 * Accent for pyro / smoke / signs: always the match primary
 * (white kits → white pyro & Schilder, not leftover blue).
 */
export function clubFxColor(side: "ksc" | "vfb"): string {
  return clubPrimary(side);
}

export function awayKitClashActive(): boolean {
  return gastKitClash;
}

/** Flag paint for a side (nationals only). */
export function clubFlag(side: "ksc" | "vfb"): FlagSpec | undefined {
  return side === "ksc" ? brandHeim.flag : brandGast.flag;
}

export function brandingIsNational(side: "ksc" | "vfb"): boolean {
  return (side === "ksc" ? brandHeim : brandGast).kind === "national";
}

export function currentBranding(): { heim: Club; gast: Club } {
  return { heim: brandHeim, gast: brandGast };
}

function hexLuma(hex: string): number {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Solid UI fill when kit primary is too light (e.g. Germany white). */
function uiFill(primary: string, secondary: string): string {
  if (hexLuma(primary) < 180) return primary;
  if (hexLuma(secondary) < 180) return secondary;
  return "#0f172a";
}

function uiInk(fill: string): string {
  return hexLuma(fill) < 160 ? "#ffffff" : "#0f172a";
}

/** Push club colors into CSS variables used by HUD / buttons. */
export function applyClubCssVars(root: HTMLElement = document.documentElement): void {
  const heimP = clubPrimary("ksc");
  const gastP = clubPrimary("vfb");
  const heimS = clubSecondary("ksc");
  const gastS = clubSecondary("vfb");
  root.style.setProperty("--ksc", heimP);
  root.style.setProperty("--vfb", gastP);
  root.style.setProperty("--ksc-secondary", heimS);
  root.style.setProperty("--vfb-secondary", gastS);
  const kscUi = uiFill(heimP, heimS);
  const vfbUi = uiFill(gastP, gastS);
  root.style.setProperty("--ksc-ui", kscUi);
  root.style.setProperty("--vfb-ui", vfbUi);
  root.style.setProperty("--ksc-ink", uiInk(kscUi));
  root.style.setProperty("--vfb-ink", uiInk(vfbUi));
}

/** Catalog check: every entry has distinct primary + secondary. */
export function allClubsHaveKitPair(): boolean {
  return Object.values(CLUBS).every(
    (c) => !!c.primary && !!c.secondary && c.primary.toLowerCase() !== c.secondary.toLowerCase(),
  );
}

export function ensureRequiredClubsPresent(): { liverpool: boolean; leverkusen: boolean } {
  return {
    liverpool: !!CLUBS.liverpool && DERBIES.some((d) => d.a === "liverpool" || d.b === "liverpool"),
    leverkusen:
      !!CLUBS.leverkusen && DERBIES.some((d) => d.a === "leverkusen" || d.b === "leverkusen"),
  };
}
