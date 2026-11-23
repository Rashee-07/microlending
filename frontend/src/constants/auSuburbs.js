// Address dropdowns: State -> only that state's suburbs -> postcode filled in.
// A short list of capitals and larger towns per state; add a line here to offer another suburb.

export const AU_SUBURBS = [
  // NSW
  { suburb: "Sydney", state: "NSW", postcode: "2000" },
  { suburb: "Bondi", state: "NSW", postcode: "2026" },
  { suburb: "Chatswood", state: "NSW", postcode: "2067" },
  { suburb: "Parramatta", state: "NSW", postcode: "2150" },
  { suburb: "Liverpool", state: "NSW", postcode: "2170" },
  { suburb: "Penrith", state: "NSW", postcode: "2750" },
  { suburb: "Gosford", state: "NSW", postcode: "2250" },
  { suburb: "Newcastle", state: "NSW", postcode: "2300" },
  { suburb: "Wollongong", state: "NSW", postcode: "2500" },
  { suburb: "Tamworth", state: "NSW", postcode: "2340" },
  { suburb: "Coffs Harbour", state: "NSW", postcode: "2450" },
  { suburb: "Byron Bay", state: "NSW", postcode: "2481" },
  { suburb: "Albury", state: "NSW", postcode: "2640" },
  { suburb: "Wagga Wagga", state: "NSW", postcode: "2650" },
  { suburb: "Orange", state: "NSW", postcode: "2800" },
  { suburb: "Dubbo", state: "NSW", postcode: "2830" },
  // VIC
  { suburb: "Melbourne", state: "VIC", postcode: "3000" },
  { suburb: "Footscray", state: "VIC", postcode: "3011" },
  { suburb: "Box Hill", state: "VIC", postcode: "3128" },
  { suburb: "Dandenong", state: "VIC", postcode: "3175" },
  { suburb: "St Kilda", state: "VIC", postcode: "3182" },
  { suburb: "Frankston", state: "VIC", postcode: "3199" },
  { suburb: "Geelong", state: "VIC", postcode: "3220" },
  { suburb: "Ballarat", state: "VIC", postcode: "3350" },
  { suburb: "Mildura", state: "VIC", postcode: "3500" },
  { suburb: "Bendigo", state: "VIC", postcode: "3550" },
  { suburb: "Shepparton", state: "VIC", postcode: "3630" },
  // QLD
  { suburb: "Brisbane", state: "QLD", postcode: "4000" },
  { suburb: "Southport", state: "QLD", postcode: "4215" },
  { suburb: "Surfers Paradise", state: "QLD", postcode: "4217" },
  { suburb: "Ipswich", state: "QLD", postcode: "4305" },
  { suburb: "Toowoomba", state: "QLD", postcode: "4350" },
  { suburb: "Maroochydore", state: "QLD", postcode: "4558" },
  { suburb: "Bundaberg", state: "QLD", postcode: "4670" },
  { suburb: "Rockhampton", state: "QLD", postcode: "4700" },
  { suburb: "Mackay", state: "QLD", postcode: "4740" },
  { suburb: "Townsville", state: "QLD", postcode: "4810" },
  { suburb: "Cairns", state: "QLD", postcode: "4870" },
  // WA
  { suburb: "Perth", state: "WA", postcode: "6000" },
  { suburb: "Joondalup", state: "WA", postcode: "6027" },
  { suburb: "Fremantle", state: "WA", postcode: "6160" },
  { suburb: "Mandurah", state: "WA", postcode: "6210" },
  { suburb: "Bunbury", state: "WA", postcode: "6230" },
  { suburb: "Kalgoorlie", state: "WA", postcode: "6430" },
  { suburb: "Geraldton", state: "WA", postcode: "6530" },
  { suburb: "Broome", state: "WA", postcode: "6725" },
  // SA
  { suburb: "Adelaide", state: "SA", postcode: "5000" },
  { suburb: "Glenelg", state: "SA", postcode: "5045" },
  { suburb: "Mount Gambier", state: "SA", postcode: "5290" },
  { suburb: "Whyalla", state: "SA", postcode: "5600" },
  { suburb: "Port Augusta", state: "SA", postcode: "5700" },
  // TAS
  { suburb: "Hobart", state: "TAS", postcode: "7000" },
  { suburb: "Launceston", state: "TAS", postcode: "7250" },
  { suburb: "Devonport", state: "TAS", postcode: "7310" },
  { suburb: "Burnie", state: "TAS", postcode: "7320" },
  // ACT
  { suburb: "Canberra", state: "ACT", postcode: "2601" },
  { suburb: "Belconnen", state: "ACT", postcode: "2617" },
  // NT
  { suburb: "Darwin", state: "NT", postcode: "0800" },
  { suburb: "Palmerston", state: "NT", postcode: "0830" },
  { suburb: "Katherine", state: "NT", postcode: "0850" },
  { suburb: "Alice Springs", state: "NT", postcode: "0870" },
];

/** The suburbs of one state, A-Z. */
export function suburbsIn(state) {
  return AU_SUBURBS.filter((s) => s.state === state).sort((a, b) => a.suburb.localeCompare(b.suburb));
}

/** The postcode of a suburb in a state, or "" when it is not in the list. */
export function postcodeOf(state, suburb) {
  const match = AU_SUBURBS.find((s) => s.state === state && s.suburb === suburb);
  return match ? match.postcode : "";
}
