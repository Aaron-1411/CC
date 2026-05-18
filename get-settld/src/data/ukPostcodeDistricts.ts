// Full UK postcode district map → one entry per real district, plus a friendly
// place name. Keeps the Areas dataset duplicate-free with full UK coverage.
//
// Coverage philosophy:
// - Greater London: every London postcode district (E, EC, N, NW, SE, SW, W, WC)
//   and every outer-London "BR/CR/DA/EN/HA/IG/KT/RM/SM/TW/UB/WD" district that
//   covers a London borough.
// - Rest of UK: every postcode area, with an enumerated representative district
//   list (the populated ones — gaps are excluded).
//
// Format per entry: [district code, friendly name]

import type { RegionName } from "./areas";

type District = [code: string, name: string];

// ===== Greater London — by postcode district =====
const LONDON_E: District[] = [
  ["E1", "Whitechapel"], ["E1W", "Wapping"], ["E2", "Bethnal Green"], ["E3", "Bow"],
  ["E4", "Chingford"], ["E5", "Clapton"], ["E6", "East Ham"], ["E7", "Forest Gate"],
  ["E8", "Hackney"], ["E9", "Homerton"], ["E10", "Leyton"], ["E11", "Leytonstone"],
  ["E12", "Manor Park"], ["E13", "Plaistow"], ["E14", "Canary Wharf"], ["E15", "Stratford"],
  ["E16", "Royal Docks"], ["E17", "Walthamstow"], ["E18", "South Woodford"], ["E20", "Olympic Park"],
];
const LONDON_EC: District[] = [
  ["EC1A", "Barbican"], ["EC1M", "Clerkenwell"], ["EC1N", "Hatton Garden"], ["EC1R", "Finsbury"],
  ["EC1V", "Old Street"], ["EC1Y", "Bunhill"], ["EC2A", "Shoreditch"], ["EC2M", "Liverpool St"],
  ["EC2N", "Old Broad St"], ["EC2R", "Bank"], ["EC2V", "Guildhall"], ["EC2Y", "Moorgate"],
  ["EC3A", "Aldgate"], ["EC3M", "Tower Hill"], ["EC3N", "Tower Gateway"], ["EC3R", "Monument"],
  ["EC3V", "Cornhill"], ["EC4A", "Fleet Street"], ["EC4M", "St Paul's"], ["EC4N", "Cannon Street"],
  ["EC4R", "Cannon St (S)"], ["EC4V", "Blackfriars"], ["EC4Y", "Temple"],
];
const LONDON_N: District[] = [
  ["N1", "Islington"], ["N1C", "King's Cross"], ["N2", "East Finchley"], ["N3", "Finchley Central"],
  ["N4", "Finsbury Park"], ["N5", "Highbury"], ["N6", "Highgate"], ["N7", "Holloway"],
  ["N8", "Crouch End"], ["N9", "Edmonton"], ["N10", "Muswell Hill"], ["N11", "New Southgate"],
  ["N12", "North Finchley"], ["N13", "Palmers Green"], ["N14", "Southgate"], ["N15", "Seven Sisters"],
  ["N16", "Stoke Newington"], ["N17", "Tottenham"], ["N18", "Upper Edmonton"], ["N19", "Archway"],
  ["N20", "Whetstone"], ["N21", "Winchmore Hill"], ["N22", "Wood Green"],
];
const LONDON_NW: District[] = [
  ["NW1", "Camden Town"], ["NW2", "Cricklewood"], ["NW3", "Hampstead"], ["NW4", "Hendon"],
  ["NW5", "Kentish Town"], ["NW6", "Kilburn"], ["NW7", "Mill Hill"], ["NW8", "St John's Wood"],
  ["NW9", "Colindale"], ["NW10", "Willesden"], ["NW11", "Golders Green"],
];
const LONDON_SE: District[] = [
  ["SE1", "Borough"], ["SE2", "Abbey Wood"], ["SE3", "Blackheath"], ["SE4", "Brockley"],
  ["SE5", "Camberwell"], ["SE6", "Catford"], ["SE7", "Charlton"], ["SE8", "Deptford"],
  ["SE9", "Eltham"], ["SE10", "Greenwich"], ["SE11", "Kennington"], ["SE12", "Lee"],
  ["SE13", "Lewisham"], ["SE14", "New Cross"], ["SE15", "Peckham"], ["SE16", "Rotherhithe"],
  ["SE17", "Walworth"], ["SE18", "Woolwich"], ["SE19", "Crystal Palace"], ["SE20", "Penge"],
  ["SE21", "Dulwich"], ["SE22", "East Dulwich"], ["SE23", "Forest Hill"], ["SE24", "Herne Hill"],
  ["SE25", "South Norwood"], ["SE26", "Sydenham"], ["SE27", "West Norwood"], ["SE28", "Thamesmead"],
];
const LONDON_SW: District[] = [
  ["SW1A", "Westminster"], ["SW1E", "Victoria"], ["SW1H", "St James's Park"], ["SW1P", "Pimlico"],
  ["SW1V", "Pimlico (S)"], ["SW1W", "Belgravia"], ["SW1X", "Knightsbridge"], ["SW1Y", "St James's"],
  ["SW2", "Brixton"], ["SW3", "Chelsea"], ["SW4", "Clapham"], ["SW5", "Earl's Court"],
  ["SW6", "Fulham"], ["SW7", "South Kensington"], ["SW8", "Battersea (N)"], ["SW9", "Stockwell"],
  ["SW10", "West Brompton"], ["SW11", "Battersea"], ["SW12", "Balham"], ["SW13", "Barnes"],
  ["SW14", "Mortlake"], ["SW15", "Putney"], ["SW16", "Streatham"], ["SW17", "Tooting"],
  ["SW18", "Wandsworth"], ["SW19", "Wimbledon"], ["SW20", "Raynes Park"],
];
const LONDON_W: District[] = [
  ["W1A", "Marylebone"], ["W1B", "Fitzrovia"], ["W1C", "Marylebone (W)"], ["W1D", "Soho"],
  ["W1F", "Soho (W)"], ["W1G", "Marylebone (E)"], ["W1H", "Marble Arch"], ["W1J", "Mayfair"],
  ["W1K", "Mayfair (N)"], ["W1S", "Mayfair (E)"], ["W1T", "Fitzrovia (E)"], ["W1U", "Marylebone (N)"],
  ["W1W", "Fitzrovia (N)"], ["W2", "Bayswater"], ["W3", "Acton"], ["W4", "Chiswick"],
  ["W5", "Ealing"], ["W6", "Hammersmith"], ["W7", "Hanwell"], ["W8", "Kensington"],
  ["W9", "Maida Vale"], ["W10", "North Kensington"], ["W11", "Notting Hill"], ["W12", "Shepherd's Bush"],
  ["W13", "West Ealing"], ["W14", "West Kensington"],
];
const LONDON_WC: District[] = [
  ["WC1A", "New Oxford St"], ["WC1B", "Bloomsbury"], ["WC1E", "Bloomsbury (W)"], ["WC1H", "Bloomsbury (N)"],
  ["WC1N", "Bloomsbury (E)"], ["WC1R", "Bloomsbury (S)"], ["WC1V", "Holborn"], ["WC1X", "King's Cross (S)"],
  ["WC2A", "Lincoln's Inn"], ["WC2B", "Aldwych"], ["WC2E", "Covent Garden"], ["WC2H", "Leicester Sq"],
  ["WC2N", "Charing Cross"], ["WC2R", "Strand"],
];
const LONDON_OUTER: District[] = [
  ["BR1", "Bromley"], ["BR2", "Hayes & Bromley S"], ["BR3", "Beckenham"], ["BR4", "West Wickham"],
  ["BR5", "Orpington (N)"], ["BR6", "Orpington"], ["BR7", "Chislehurst"], ["BR8", "Swanley"],
  ["CR0", "Croydon"], ["CR2", "South Croydon"], ["CR3", "Caterham"], ["CR4", "Mitcham"],
  ["CR5", "Coulsdon"], ["CR6", "Warlingham"], ["CR7", "Thornton Heath"], ["CR8", "Purley"],
  ["DA1", "Dartford"], ["DA5", "Bexley"], ["DA6", "Bexleyheath"], ["DA7", "Bexleyheath (E)"],
  ["DA8", "Erith"], ["DA14", "Sidcup"], ["DA15", "Sidcup (N)"], ["DA16", "Welling"], ["DA17", "Belvedere"],
  ["EN1", "Enfield"], ["EN2", "Enfield Chase"], ["EN3", "Enfield Highway"], ["EN4", "East Barnet"],
  ["EN5", "Barnet"], ["EN8", "Cheshunt"],
  ["HA0", "Wembley"], ["HA1", "Harrow"], ["HA2", "Harrow (S)"], ["HA3", "Kenton"],
  ["HA4", "Ruislip"], ["HA5", "Pinner"], ["HA7", "Stanmore"], ["HA8", "Edgware"], ["HA9", "Wembley (N)"],
  ["IG1", "Ilford"], ["IG2", "Gants Hill"], ["IG3", "Seven Kings"], ["IG4", "Redbridge"],
  ["IG5", "Clayhall"], ["IG6", "Hainault"], ["IG7", "Chigwell"], ["IG8", "Woodford Green"],
  ["IG11", "Barking"],
  ["KT1", "Kingston"], ["KT2", "Norbiton"], ["KT3", "New Malden"], ["KT4", "Worcester Park"],
  ["KT5", "Surbiton (N)"], ["KT6", "Surbiton"], ["KT7", "Thames Ditton"], ["KT8", "East Molesey"],
  ["KT9", "Chessington"], ["KT10", "Esher"],
  ["RM1", "Romford"], ["RM6", "Chadwell Heath"], ["RM7", "Rush Green"], ["RM8", "Becontree"],
  ["RM9", "Dagenham"], ["RM10", "Dagenham (E)"], ["RM11", "Hornchurch"], ["RM12", "Hornchurch (S)"],
  ["RM13", "Rainham"], ["RM14", "Upminster"],
  ["SM1", "Sutton"], ["SM2", "Belmont"], ["SM3", "Cheam"], ["SM4", "Morden"], ["SM5", "Carshalton"], ["SM6", "Wallington"],
  ["TW1", "Twickenham"], ["TW2", "Whitton"], ["TW3", "Hounslow"], ["TW4", "Hounslow West"],
  ["TW5", "Heston"], ["TW7", "Isleworth"], ["TW8", "Brentford"], ["TW9", "Richmond"],
  ["TW10", "Richmond Hill"], ["TW11", "Teddington"], ["TW12", "Hampton"], ["TW13", "Feltham"], ["TW14", "Feltham (N)"],
  ["UB1", "Southall"], ["UB2", "Southall (S)"], ["UB3", "Hayes"], ["UB4", "Hayes (N)"],
  ["UB5", "Northolt"], ["UB6", "Greenford"], ["UB7", "West Drayton"], ["UB8", "Uxbridge"],
  ["UB9", "Harefield"], ["UB10", "Hillingdon"],
  ["WD6", "Borehamwood"],
];

type RegionDistricts = Record<string, District[]>;

const SOUTH_EAST: RegionDistricts = {
  RG: [["RG1","Reading Central"],["RG2","Reading S"],["RG4","Caversham"],["RG5","Woodley"],["RG6","Earley"],["RG10","Twyford"],["RG12","Bracknell"],["RG14","Newbury"],["RG21","Basingstoke"],["RG30","West Reading"],["RG40","Wokingham"],["RG41","Wokingham W"],["RG45","Crowthorne"]],
  BN: [["BN1","Brighton"],["BN2","Kemptown"],["BN3","Hove"],["BN10","Peacehaven"],["BN11","Worthing"],["BN12","Goring"],["BN15","Lancing"],["BN17","Littlehampton"],["BN20","Eastbourne W"],["BN21","Eastbourne"],["BN22","Eastbourne N"],["BN25","Seaford"],["BN27","Hailsham"],["BN43","Shoreham"]],
  OX: [["OX1","Oxford City"],["OX2","Oxford W"],["OX3","Headington"],["OX4","Cowley"],["OX5","Kidlington"],["OX10","Wallingford"],["OX11","Didcot"],["OX14","Abingdon"],["OX16","Banbury"],["OX26","Bicester"],["OX28","Witney"],["OX29","Eynsham"]],
  GU: [["GU1","Guildford"],["GU2","Guildford W"],["GU7","Godalming"],["GU9","Farnham"],["GU11","Aldershot"],["GU14","Farnborough"],["GU15","Camberley"],["GU21","Woking"],["GU22","Woking S"],["GU27","Haslemere"],["GU34","Alton"],["GU51","Fleet"]],
  CT: [["CT1","Canterbury"],["CT2","Canterbury N"],["CT5","Whitstable"],["CT6","Herne Bay"],["CT9","Margate"],["CT10","Broadstairs"],["CT11","Ramsgate"],["CT14","Deal"],["CT16","Dover"],["CT20","Folkestone"],["CT21","Hythe"]],
  SO: [["SO14","Southampton C"],["SO15","Southampton W"],["SO16","Southampton N"],["SO17","Highfield"],["SO18","Southampton E"],["SO19","Sholing"],["SO22","Winchester W"],["SO23","Winchester"],["SO30","Hedge End"],["SO31","Hamble"],["SO40","Totton"],["SO45","Hythe"],["SO50","Eastleigh"],["SO53","Chandler's Ford"]],
  PO: [["PO1","Portsmouth"],["PO2","Portsea"],["PO3","Copnor"],["PO4","Southsea"],["PO5","Southsea S"],["PO6","Cosham"],["PO9","Havant"],["PO12","Gosport"],["PO16","Fareham"],["PO19","Chichester"],["PO22","Bognor"],["PO30","Newport IoW"]],
  ME: [["ME1","Rochester"],["ME2","Strood"],["ME4","Chatham"],["ME5","Chatham S"],["ME7","Gillingham"],["ME8","Rainham"],["ME10","Sittingbourne"],["ME14","Maidstone"],["ME15","Maidstone S"],["ME16","Maidstone W"],["ME20","Aylesford"]],
  TN: [["TN1","Tunbridge Wells"],["TN2","Tunbridge Wells E"],["TN4","Southborough"],["TN9","Tonbridge"],["TN13","Sevenoaks"],["TN15","Sevenoaks W"],["TN23","Ashford"],["TN24","Ashford N"],["TN34","Hastings"],["TN37","St Leonards"],["TN38","St Leonards W"],["TN40","Bexhill"]],
  RH: [["RH1","Redhill"],["RH2","Reigate"],["RH4","Dorking"],["RH6","Horley"],["RH10","Crawley"],["RH11","Crawley W"],["RH12","Horsham"],["RH13","Horsham S"],["RH15","Burgess Hill"],["RH16","Haywards Heath"],["RH19","East Grinstead"]],
  MK: [["MK1","Bletchley"],["MK2","Bletchley S"],["MK3","Bletchley W"],["MK6","Central MK"],["MK7","Walnut Tree"],["MK9","CMK"],["MK10","Monkston"],["MK11","Wolverton"],["MK14","Great Linford"],["MK40","Bedford"],["MK41","Bedford N"],["MK42","Bedford S"],["MK43","Cranfield"],["MK45","Flitwick"]],
  SL: [["SL1","Slough"],["SL2","Slough N"],["SL3","Langley"],["SL4","Windsor"],["SL5","Ascot"],["SL6","Maidenhead"],["SL7","Marlow"],["SL9","Gerrards Cross"]],
};

const SOUTH_WEST: RegionDistricts = {
  BS: [["BS1","Bristol C"],["BS2","St Pauls"],["BS3","Bedminster"],["BS4","Brislington"],["BS5","Easton"],["BS6","Redland"],["BS7","Horfield"],["BS8","Clifton"],["BS9","Stoke Bishop"],["BS10","Henbury"],["BS11","Avonmouth"],["BS13","Hartcliffe"],["BS14","Whitchurch"],["BS15","Kingswood"],["BS16","Fishponds"],["BS20","Portishead"],["BS21","Clevedon"],["BS22","Weston-S-M"],["BS23","Weston C"],["BS31","Keynsham"],["BS37","Yate"]],
  BA: [["BA1","Bath"],["BA2","Bath S"],["BA3","Radstock"],["BA4","Shepton Mallet"],["BA5","Wells"],["BA11","Frome"],["BA13","Westbury"],["BA14","Trowbridge"],["BA15","Bradford-on-Avon"],["BA16","Street"],["BA20","Yeovil"],["BA21","Yeovil N"],["BA22","Yeovil W"]],
  EX: [["EX1","Exeter C"],["EX2","Exeter S"],["EX4","Exeter N"],["EX8","Exmouth"],["EX10","Sidmouth"],["EX14","Honiton"],["EX15","Cullompton"],["EX16","Tiverton"],["EX20","Okehampton"],["EX31","Barnstaple"],["EX32","Barnstaple E"],["EX34","Ilfracombe"],["EX38","Torrington"]],
  PL: [["PL1","Plymouth C"],["PL2","Plymouth N"],["PL3","Mannamead"],["PL4","Plymouth E"],["PL5","Plymouth NW"],["PL6","Plympton"],["PL7","Plympton E"],["PL9","Plymstock"],["PL14","Liskeard"],["PL19","Tavistock"],["PL21","Ivybridge"],["PL27","Wadebridge"],["PL31","Bodmin"]],
  BH: [["BH1","Bournemouth"],["BH2","Westbourne"],["BH4","Branksome"],["BH5","Boscombe"],["BH8","Charminster"],["BH9","Winton"],["BH13","Sandbanks"],["BH14","Lower Parkstone"],["BH15","Poole"],["BH17","Poole N"],["BH21","Wimborne"],["BH23","Christchurch"],["BH24","Ringwood"]],
  TR: [["TR1","Truro"],["TR3","Devoran"],["TR7","Newquay"],["TR10","Penryn"],["TR11","Falmouth"],["TR15","Redruth"],["TR18","Penzance"],["TR26","St Ives"]],
  SP: [["SP1","Salisbury"],["SP2","Salisbury W"],["SP4","Amesbury"],["SP10","Andover"],["SP11","Andover W"]],
  GL: [["GL1","Gloucester"],["GL2","Gloucester W"],["GL4","Gloucester S"],["GL50","Cheltenham"],["GL51","Cheltenham W"],["GL52","Cheltenham E"],["GL53","Cheltenham S"],["GL54","Bourton"],["GL55","Chipping Campden"],["GL56","Moreton"]],
  SN: [["SN1","Swindon C"],["SN2","Swindon N"],["SN3","Swindon E"],["SN5","Swindon W"],["SN6","Highworth"],["SN10","Devizes"],["SN12","Melksham"],["SN13","Corsham"],["SN14","Chippenham"],["SN15","Chippenham N"],["SN16","Malmesbury"]],
  TQ: [["TQ1","Torquay"],["TQ2","Torquay W"],["TQ4","Paignton"],["TQ5","Brixham"],["TQ6","Dartmouth"],["TQ12","Newton Abbot"],["TQ13","Bovey Tracey"]],
  DT: [["DT1","Dorchester"],["DT2","Dorchester W"],["DT3","Weymouth N"],["DT4","Weymouth"],["DT6","Bridport"],["DT9","Sherborne"]],
};

const EAST_ENGLAND: RegionDistricts = {
  CB: [["CB1","Cambridge SE"],["CB2","Cambridge S"],["CB3","Cambridge W"],["CB4","Cambridge N"],["CB5","Cambridge E"],["CB6","Ely"],["CB7","Ely N"],["CB8","Newmarket"],["CB9","Haverhill"],["CB10","Saffron Walden"],["CB11","Saffron Walden N"],["CB22","Sawston"],["CB23","Cambourne"],["CB24","Histon"],["CB25","Burwell"]],
  NR: [["NR1","Norwich C"],["NR2","Norwich W"],["NR3","Norwich N"],["NR4","Cringleford"],["NR5","Bowthorpe"],["NR6","Hellesdon"],["NR7","Sprowston"],["NR12","Wroxham"],["NR14","Loddon"],["NR18","Wymondham"],["NR21","Fakenham"],["NR25","Holt"],["NR30","Great Yarmouth"],["NR31","Gorleston"]],
  IP: [["IP1","Ipswich C"],["IP2","Ipswich S"],["IP3","Ipswich E"],["IP4","Ipswich NE"],["IP5","Kesgrave"],["IP11","Felixstowe"],["IP12","Woodbridge"],["IP14","Stowmarket"],["IP15","Aldeburgh"],["IP22","Diss"],["IP24","Thetford"],["IP28","Mildenhall"],["IP33","Bury St Edmunds"]],
  CO: [["CO1","Colchester C"],["CO2","Colchester S"],["CO3","Colchester W"],["CO4","Colchester N"],["CO7","Wivenhoe"],["CO9","Halstead"],["CO10","Sudbury"],["CO11","Manningtree"],["CO12","Harwich"],["CO13","Frinton"],["CO15","Clacton"],["CO16","St Osyth"]],
  CM: [["CM1","Chelmsford"],["CM2","Chelmsford S"],["CM3","Maldon"],["CM7","Braintree"],["CM8","Witham"],["CM9","Maldon (S)"],["CM11","Billericay"],["CM12","Billericay C"],["CM13","Brentwood"],["CM14","Brentwood W"],["CM15","Brentwood N"],["CM20","Harlow"],["CM23","Bishop's Stortford"]],
  AL: [["AL1","St Albans"],["AL3","St Albans W"],["AL4","St Albans E"],["AL5","Harpenden"],["AL7","Welwyn GC"],["AL8","Welwyn"],["AL9","Hatfield"],["AL10","Hatfield N"]],
  WD: [["WD3","Rickmansworth"],["WD17","Watford C"],["WD18","Watford W"],["WD19","South Oxhey"],["WD23","Bushey"],["WD24","Watford N"],["WD25","Garston"]],
  LU: [["LU1","Luton C"],["LU2","Luton E"],["LU3","Luton N"],["LU4","Luton W"],["LU5","Dunstable"],["LU6","Dunstable W"],["LU7","Leighton Buzzard"]],
  SG: [["SG1","Stevenage"],["SG2","Stevenage E"],["SG4","Hitchin"],["SG5","Hitchin W"],["SG6","Letchworth"],["SG7","Baldock"],["SG8","Royston"],["SG12","Ware"],["SG13","Hertford"],["SG14","Hertford N"]],
  SS: [["SS1","Southend C"],["SS2","Southend N"],["SS3","Shoeburyness"],["SS6","Rayleigh"],["SS7","Benfleet"],["SS8","Canvey Island"],["SS9","Leigh-on-Sea"],["SS14","Basildon"],["SS15","Laindon"],["SS17","Stanford"]],
  PE: [["PE1","Peterborough"],["PE2","Peterborough S"],["PE3","Peterborough W"],["PE4","Peterborough N"],["PE7","Whittlesey"],["PE13","Wisbech"],["PE15","March"],["PE19","St Neots"],["PE21","Boston"],["PE25","Skegness"],["PE29","Huntingdon"],["PE30","King's Lynn"]],
};

const WEST_MIDLANDS: RegionDistricts = {
  B: [["B1","Birmingham C"],["B2","Birmingham E"],["B3","Birmingham W"],["B4","Aston"],["B5","Edgbaston"],["B6","Aston N"],["B9","Bordesley"],["B12","Balsall Heath"],["B13","Moseley"],["B14","King's Heath"],["B15","Edgbaston W"],["B16","Edgbaston N"],["B17","Harborne"],["B18","Hockley"],["B19","Newtown"],["B20","Handsworth Wood"],["B21","Handsworth"],["B23","Erdington"],["B26","Yardley"],["B28","Hall Green"],["B29","Selly Oak"],["B30","Stirchley"],["B31","Northfield"],["B32","Bartley Green"],["B36","Castle Bromwich"],["B37","Chelmsley Wood"],["B38","Kings Norton"],["B44","Great Barr"],["B45","Rubery"],["B62","Halesowen"],["B63","Halesowen S"],["B66","Smethwick"],["B67","Bearwood"],["B68","Oldbury"],["B72","Sutton Coldfield"],["B73","Wylde Green"],["B74","Four Oaks"],["B75","Mere Green"],["B76","Walmley"],["B90","Shirley"],["B91","Solihull"],["B92","Olton"],["B93","Knowle"],["B94","Hockley Heath"]],
  CV: [["CV1","Coventry C"],["CV2","Wyken"],["CV3","Cheylesmore"],["CV4","Canley"],["CV5","Allesley"],["CV6","Foleshill"],["CV7","Meriden"],["CV8","Kenilworth"],["CV10","Nuneaton W"],["CV11","Nuneaton C"],["CV12","Bedworth"],["CV21","Rugby"],["CV22","Rugby W"],["CV31","Leamington S"],["CV32","Leamington N"],["CV34","Warwick"],["CV37","Stratford-upon-Avon"]],
  WV: [["WV1","Wolverhampton C"],["WV2","Wolverhampton S"],["WV3","Wolverhampton W"],["WV4","Penn"],["WV6","Tettenhall"],["WV10","Wolverhampton N"],["WV11","Wednesfield"],["WV13","Willenhall"],["WV14","Bilston"],["WV16","Bridgnorth"]],
  ST: [["ST1","Hanley"],["ST2","Bucknall"],["ST3","Longton"],["ST4","Stoke"],["ST5","Newcastle-u-Lyme"],["ST6","Burslem"],["ST7","Kidsgrove"],["ST10","Cheadle"],["ST15","Stone"],["ST16","Stafford"],["ST17","Stafford S"],["ST18","Great Haywood"]],
  WR: [["WR1","Worcester C"],["WR2","Worcester W"],["WR3","Worcester N"],["WR5","Worcester S"],["WR9","Droitwich"],["WR10","Pershore"],["WR11","Evesham"],["WR14","Malvern"]],
  HR: [["HR1","Hereford"],["HR2","Hereford S"],["HR4","Hereford W"],["HR6","Leominster"],["HR9","Ross-on-Wye"]],
  TF: [["TF1","Telford C"],["TF2","Donnington"],["TF3","Stirchley"],["TF4","Dawley"],["TF7","Sutton Hill"],["TF10","Newport"],["TF11","Shifnal"]],
  SY: [["SY1","Shrewsbury"],["SY2","Shrewsbury E"],["SY3","Shrewsbury W"],["SY11","Oswestry"],["SY13","Whitchurch"]],
  WS: [["WS1","Walsall C"],["WS2","Walsall W"],["WS3","Bloxwich"],["WS5","Walsall S"],["WS9","Aldridge"],["WS10","Wednesbury"],["WS11","Cannock"]],
  DY: [["DY1","Dudley C"],["DY2","Netherton"],["DY3","Sedgley"],["DY5","Brierley Hill"],["DY8","Stourbridge"],["DY9","Lye"],["DY10","Kidderminster"]],
};

const EAST_MIDLANDS: RegionDistricts = {
  NG: [["NG1","Nottingham C"],["NG2","West Bridgford"],["NG3","Mapperley"],["NG4","Carlton"],["NG5","Sherwood"],["NG6","Bulwell"],["NG7","Lenton"],["NG8","Bilborough"],["NG9","Beeston"],["NG10","Long Eaton"],["NG11","Clifton"],["NG12","Radcliffe"],["NG15","Hucknall"],["NG16","Eastwood"],["NG17","Sutton-in-Ashfield"],["NG18","Mansfield"],["NG19","Mansfield N"],["NG24","Newark"]],
  LE: [["LE1","Leicester C"],["LE2","Leicester S"],["LE3","Leicester W"],["LE4","Leicester N"],["LE5","Leicester E"],["LE7","East Goscote"],["LE8","Wigston"],["LE9","Earl Shilton"],["LE10","Hinckley"],["LE11","Loughborough"],["LE12","Loughborough S"],["LE13","Melton Mowbray"],["LE16","Market Harborough"],["LE17","Lutterworth"],["LE19","Enderby"]],
  DE: [["DE1","Derby C"],["DE3","Mickleover"],["DE21","Derby N"],["DE22","Derby W"],["DE23","Derby S"],["DE24","Derby SE"],["DE45","Bakewell"],["DE55","Alfreton"],["DE56","Belper"],["DE65","Hilton"],["DE73","Melbourne"]],
  LN: [["LN1","Lincoln C"],["LN2","Lincoln NE"],["LN5","Lincoln S"],["LN6","Lincoln W"],["LN9","Horncastle"],["LN11","Louth"],["LN13","Alford"]],
  NN: [["NN1","Northampton C"],["NN2","Kingsthorpe"],["NN3","Northampton E"],["NN4","Far Cotton"],["NN5","Duston"],["NN8","Wellingborough"],["NN10","Rushden"],["NN11","Daventry"],["NN15","Kettering"],["NN16","Kettering N"],["NN17","Corby"],["NN18","Corby S"]],
  S: [["S40","Chesterfield"],["S41","Chesterfield N"],["S42","Clay Cross"],["S43","Staveley"],["S44","Bolsover"],["S45","Wingerworth"]],
};

const YORKS_HUMBER: RegionDistricts = {
  LS: [["LS1","Leeds C"],["LS2","Leeds W"],["LS3","Burley"],["LS4","Kirkstall"],["LS6","Headingley"],["LS7","Chapel Allerton"],["LS8","Roundhay"],["LS9","Leeds E"],["LS10","Hunslet"],["LS11","Beeston"],["LS12","Armley"],["LS14","Seacroft"],["LS15","Cross Gates"],["LS16","Cookridge"],["LS17","Alwoodley"],["LS18","Horsforth"],["LS19","Yeadon"],["LS20","Guiseley"],["LS21","Otley"],["LS22","Wetherby"],["LS25","Garforth"],["LS26","Rothwell"],["LS27","Morley"],["LS28","Pudsey"],["LS29","Ilkley"]],
  S: [["S1","Sheffield C"],["S2","Heeley"],["S3","Kelham"],["S4","Pitsmoor"],["S5","Firth Park"],["S6","Hillsborough"],["S7","Nether Edge"],["S8","Meersbrook"],["S9","Attercliffe"],["S10","Broomhill"],["S11","Ecclesall"],["S12","Frecheville"],["S13","Handsworth"],["S14","Gleadless"],["S17","Dore"],["S18","Dronfield"],["S20","Mosborough"],["S25","Dinnington"],["S26","Aston"],["S60","Rotherham"],["S61","Kimberworth"],["S62","Rawmarsh"],["S63","Wath"],["S64","Mexborough"],["S65","Rotherham E"],["S70","Barnsley"],["S71","Athersley"],["S73","Wombwell"],["S75","Dodworth"]],
  YO: [["YO1","York C"],["YO10","Fulford"],["YO23","Dringhouses"],["YO24","Acomb"],["YO26","Poppleton"],["YO30","Clifton"],["YO31","Heworth"],["YO32","Huntington"],["YO11","Scarborough"],["YO12","Scarborough N"],["YO13","Scalby"],["YO16","Bridlington"],["YO17","Malton"],["YO18","Pickering"],["YO21","Whitby"]],
  HU: [["HU1","Hull C"],["HU2","Hull NW"],["HU3","Hull W"],["HU4","Anlaby Park"],["HU5","Hull NW (W)"],["HU6","Beverley Rd"],["HU7","Bransholme"],["HU8","Hull E"],["HU9","Marfleet"],["HU10","Anlaby"],["HU11","Sproatley"],["HU13","Hessle"],["HU14","North Ferriby"],["HU16","Cottingham"],["HU17","Beverley"]],
  BD: [["BD1","Bradford C"],["BD2","Bolton"],["BD3","Barkerend"],["BD4","Bowling"],["BD5","Bradford S"],["BD6","Wibsey"],["BD7","Great Horton"],["BD8","Manningham"],["BD9","Heaton"],["BD10","Idle"],["BD13","Thornton"],["BD15","Allerton"],["BD16","Bingley"],["BD17","Shipley"],["BD18","Shipley N"],["BD20","Keighley S"],["BD21","Keighley"],["BD22","Haworth"],["BD23","Skipton"]],
  HD: [["HD1","Huddersfield C"],["HD2","Fartown"],["HD3","Huddersfield W"],["HD4","Huddersfield S"],["HD5","Dalton"],["HD7","Slaithwaite"],["HD8","Skelmanthorpe"],["HD9","Holmfirth"]],
  HG: [["HG1","Harrogate C"],["HG2","Harrogate S"],["HG3","Killinghall"],["HG4","Ripon"],["HG5","Knaresborough"]],
  WF: [["WF1","Wakefield C"],["WF2","Wakefield W"],["WF3","Outwood"],["WF4","Crigglestone"],["WF5","Ossett"],["WF6","Normanton"],["WF7","Featherstone"],["WF8","Pontefract"],["WF9","South Elmsall"],["WF10","Castleford"],["WF11","Knottingley"],["WF13","Dewsbury"],["WF14","Mirfield"],["WF15","Liversedge"]],
  DN: [["DN1","Doncaster C"],["DN2","Wheatley"],["DN3","Armthorpe"],["DN4","Balby"],["DN5","Bentley"],["DN6","Adwick"],["DN7","Hatfield"],["DN10","Bawtry"],["DN12","Conisbrough"],["DN14","Goole"],["DN15","Scunthorpe"],["DN16","Scunthorpe S"],["DN17","Scunthorpe W"],["DN18","Barton-upon-Humber"],["DN20","Brigg"],["DN21","Gainsborough"],["DN31","Grimsby C"],["DN32","Grimsby S"],["DN33","Scartho"],["DN34","Grimsby W"],["DN35","Cleethorpes"],["DN40","Immingham"]],
  HX: [["HX1","Halifax C"],["HX2","Halifax W"],["HX3","Halifax E"],["HX4","Greetland"],["HX5","Elland"],["HX6","Sowerby Bridge"],["HX7","Hebden Bridge"]],
};

const NORTH_WEST: RegionDistricts = {
  M: [["M1","Manchester C"],["M2","Manchester W"],["M3","Castlefield"],["M4","Ancoats"],["M5","Salford"],["M6","Pendleton"],["M7","Broughton"],["M8","Cheetham"],["M9","Harpurhey"],["M11","Clayton"],["M12","Longsight"],["M13","Ardwick"],["M14","Fallowfield"],["M15","Hulme"],["M16","Old Trafford"],["M17","Trafford Park"],["M18","Gorton"],["M19","Levenshulme"],["M20","Didsbury"],["M21","Chorlton"],["M22","Wythenshawe"],["M23","Baguley"],["M24","Middleton"],["M25","Prestwich"],["M26","Radcliffe"],["M27","Swinton"],["M28","Worsley"],["M30","Eccles"],["M31","Partington"],["M32","Stretford"],["M33","Sale"],["M34","Denton"],["M35","Failsworth"],["M40","Newton Heath"],["M41","Urmston"],["M43","Droylsden"],["M44","Cadishead"],["M45","Whitefield"],["M46","Atherton"]],
  L: [["L1","Liverpool C"],["L2","Liverpool W"],["L3","Liverpool N"],["L4","Anfield"],["L5","Everton"],["L6","Tuebrook"],["L7","Edge Hill"],["L8","Toxteth"],["L9","Walton"],["L10","Aintree"],["L11","Croxteth"],["L12","West Derby"],["L13","Stoneycroft"],["L14","Knotty Ash"],["L15","Wavertree"],["L16","Childwall"],["L17","Aigburth"],["L18","Mossley Hill"],["L19","Garston"],["L20","Bootle"],["L21","Litherland"],["L22","Waterloo"],["L23","Crosby"],["L24","Speke"],["L25","Woolton"],["L26","Halewood"],["L27","Belle Vale"],["L28","Stockbridge"],["L30","Netherton"],["L31","Maghull"],["L32","Kirkby"],["L33","Kirkby N"],["L34","Prescot"],["L36","Huyton"],["L37","Formby"],["L38","Hightown"],["L39","Ormskirk"]],
  BL: [["BL1","Bolton C"],["BL2","Bolton E"],["BL3","Bolton S"],["BL4","Farnworth"],["BL5","Westhoughton"],["BL6","Horwich"],["BL7","Egerton"],["BL8","Bury W"],["BL9","Bury"]],
  PR: [["PR1","Preston C"],["PR2","Fulwood"],["PR3","Garstang"],["PR4","Kirkham"],["PR5","Bamber Bridge"],["PR6","Chorley"],["PR7","Chorley S"],["PR8","Southport"],["PR9","Southport N"],["PR25","Leyland"]],
  CH: [["CH1","Chester C"],["CH2","Chester N"],["CH3","Chester E"],["CH4","Chester S"],["CH41","Birkenhead"],["CH42","Tranmere"],["CH43","Oxton"],["CH44","Wallasey"],["CH45","New Brighton"],["CH46","Moreton"],["CH47","Hoylake"],["CH48","West Kirby"],["CH49","Greasby"],["CH60","Heswall"],["CH61","Pensby"],["CH62","Bromborough"],["CH63","Bebington"],["CH64","Neston"],["CH65","Ellesmere Port"]],
  WA: [["WA1","Warrington C"],["WA2","Orford"],["WA3","Culcheth"],["WA4","Stockton Heath"],["WA5","Great Sankey"],["WA7","Runcorn"],["WA8","Widnes"],["WA9","St Helens S"],["WA10","St Helens"],["WA11","Rainford"],["WA14","Altrincham"],["WA15","Hale"],["WA16","Knutsford"]],
  SK: [["SK1","Stockport C"],["SK2","Stockport S"],["SK3","Edgeley"],["SK4","Heaton Moor"],["SK5","Reddish"],["SK6","Marple"],["SK7","Bramhall"],["SK8","Cheadle"],["SK9","Wilmslow"],["SK10","Macclesfield N"],["SK11","Macclesfield"],["SK12","Poynton"],["SK13","Glossop"],["SK14","Hyde"],["SK15","Stalybridge"],["SK16","Dukinfield"],["SK17","Buxton"]],
  FY: [["FY1","Blackpool C"],["FY2","Blackpool N"],["FY3","Blackpool E"],["FY4","Blackpool S"],["FY5","Cleveleys"],["FY6","Poulton"],["FY7","Fleetwood"],["FY8","Lytham St Annes"]],
  WN: [["WN1","Wigan C"],["WN2","Hindley"],["WN3","Wigan W"],["WN4","Ashton"],["WN5","Wigan N"],["WN6","Standish"],["WN7","Leigh"],["WN8","Skelmersdale"]],
  OL: [["OL1","Oldham C"],["OL2","Royton"],["OL3","Lees"],["OL4","Lees S"],["OL5","Mossley"],["OL6","Ashton-under-Lyne"],["OL7","Ashton W"],["OL8","Oldham S"],["OL9","Chadderton"],["OL10","Heywood"],["OL11","Rochdale"],["OL12","Rochdale N"],["OL15","Littleborough"],["OL16","Rochdale E"]],
  LA: [["LA1","Lancaster"],["LA2","Halton"],["LA3","Morecambe"],["LA4","Bare"],["LA5","Carnforth"],["LA9","Kendal"]],
  BB: [["BB1","Blackburn"],["BB2","Blackburn W"],["BB3","Darwen"],["BB4","Rawtenstall"],["BB5","Accrington"],["BB6","Great Harwood"],["BB7","Clitheroe"],["BB8","Colne"],["BB9","Nelson"],["BB10","Burnley E"],["BB11","Burnley"],["BB12","Burnley W"],["BB18","Barnoldswick"]],
};

const NORTH_EAST: RegionDistricts = {
  NE: [["NE1","Newcastle C"],["NE2","Jesmond"],["NE3","Gosforth"],["NE4","Fenham"],["NE5","Westerhope"],["NE6","Byker"],["NE7","Heaton"],["NE8","Gateshead"],["NE9","Low Fell"],["NE10","Felling"],["NE11","Team Valley"],["NE12","Forest Hall"],["NE13","Wideopen"],["NE15","Lemington"],["NE16","Whickham"],["NE17","Chopwell"],["NE21","Blaydon"],["NE22","Bedlington"],["NE23","Cramlington"],["NE24","Blyth"],["NE25","Whitley Bay"],["NE26","Whitley Bay N"],["NE27","Shiremoor"],["NE28","Wallsend"],["NE29","North Shields"],["NE30","Tynemouth"],["NE31","Hebburn"],["NE32","Jarrow"],["NE33","South Shields"],["NE34","South Shields S"],["NE35","Boldon"],["NE36","East Boldon"],["NE37","Washington E"],["NE38","Washington C"],["NE39","Rowlands Gill"],["NE40","Ryton"],["NE41","Wylam"],["NE42","Prudhoe"],["NE43","Stocksfield"],["NE44","Riding Mill"],["NE45","Corbridge"],["NE46","Hexham"],["NE61","Morpeth"],["NE63","Ashington"],["NE64","Newbiggin"],["NE65","Rothbury"],["NE66","Alnwick"],["NE67","Chathill"],["NE68","Seahouses"],["NE69","Bamburgh"],["NE70","Belford"],["NE71","Wooler"]],
  SR: [["SR1","Sunderland C"],["SR2","Hendon"],["SR3","Silksworth"],["SR4","Pallion"],["SR5","Castletown"],["SR6","Roker"],["SR7","Seaham"],["SR8","Peterlee"]],
  TS: [["TS1","Middlesbrough C"],["TS2","North Ormesby"],["TS3","Berwick Hills"],["TS4","Linthorpe"],["TS5","Acklam"],["TS6","South Bank"],["TS7","Marton"],["TS8","Coulby Newham"],["TS9","Stokesley"],["TS10","Redcar"],["TS12","Skelton"],["TS13","Loftus"],["TS14","Guisborough"],["TS17","Thornaby"],["TS18","Stockton C"],["TS19","Stockton W"],["TS20","Norton"],["TS21","Sedgefield"],["TS22","Wynyard"],["TS23","Billingham"],["TS24","Hartlepool C"],["TS25","Hartlepool S"],["TS26","Hartlepool W"],["TS27","Blackhall"]],
  DH: [["DH1","Durham C"],["DH2","Pelton"],["DH3","Birtley"],["DH4","Houghton-le-Spring"],["DH5","Hetton"],["DH6","Coxhoe"],["DH7","Bearpark"],["DH8","Consett"],["DH9","Stanley"]],
  DL: [["DL1","Darlington"],["DL2","Hurworth"],["DL3","Darlington W"],["DL4","Shildon"],["DL5","Newton Aycliffe"],["DL6","Northallerton"],["DL10","Richmond"],["DL14","Bishop Auckland"]],
};

const WALES: RegionDistricts = {
  CF: [["CF10","Cardiff C"],["CF11","Riverside"],["CF14","Whitchurch"],["CF15","Tongwynlais"],["CF23","Cyncoed"],["CF24","Cathays"],["CF3","Rumney"],["CF31","Bridgend"],["CF32","Bridgend N"],["CF33","Pyle"],["CF34","Maesteg"],["CF35","Pencoed"],["CF36","Porthcawl"],["CF37","Pontypridd"],["CF38","Beddau"],["CF39","Tonypandy"],["CF40","Tonypandy N"],["CF41","Pentre"],["CF42","Treherbert"],["CF44","Aberdare"],["CF45","Mountain Ash"],["CF46","Treharris"],["CF47","Merthyr Tydfil"],["CF48","Dowlais"],["CF62","Barry"],["CF63","Barry W"],["CF64","Penarth"],["CF71","Cowbridge"],["CF72","Llantrisant"],["CF81","Bargoed"],["CF82","Caerphilly N"],["CF83","Caerphilly"]],
  SA: [["SA1","Swansea C"],["SA2","Sketty"],["SA3","Mumbles"],["SA4","Gorseinon"],["SA5","Fforestfach"],["SA6","Morriston"],["SA7","Llansamlet"],["SA10","Neath"],["SA11","Neath E"],["SA12","Port Talbot"],["SA13","Port Talbot S"],["SA14","Llanelli E"],["SA15","Llanelli"],["SA18","Ammanford"],["SA31","Carmarthen"],["SA61","Haverfordwest"],["SA62","Haverfordwest W"],["SA70","Tenby"],["SA71","Pembroke"],["SA72","Pembroke Dock"]],
  NP: [["NP4","Pontypool"],["NP10","Newport W"],["NP11","Crumlin"],["NP12","Blackwood"],["NP15","Usk"],["NP16","Chepstow"],["NP18","Caerleon"],["NP19","Newport E"],["NP20","Newport C"],["NP22","Tredegar"],["NP23","Ebbw Vale"],["NP25","Monmouth"],["NP26","Caldicot"],["NP44","Cwmbran"]],
  LL: [["LL11","Wrexham"],["LL13","Wrexham E"],["LL14","Ruabon"],["LL18","Rhyl"],["LL19","Prestatyn"],["LL30","Llandudno"],["LL31","Conwy"],["LL55","Caernarfon"],["LL57","Bangor"],["LL65","Holyhead"]],
  SY: [["SY23","Aberystwyth"]],
};

const SCOTLAND: RegionDistricts = {
  EH: [["EH1","Edinburgh Old Town"],["EH2","New Town"],["EH3","Stockbridge"],["EH4","Cramond"],["EH5","Trinity"],["EH6","Leith"],["EH7","Easter Rd"],["EH8","Holyrood"],["EH9","Marchmont"],["EH10","Morningside"],["EH11","Gorgie"],["EH12","Corstorphine"],["EH13","Colinton"],["EH14","Wester Hailes"],["EH15","Portobello"],["EH16","Liberton"],["EH17","Gilmerton"],["EH18","Lasswade"],["EH19","Bonnyrigg"],["EH20","Loanhead"],["EH21","Musselburgh"],["EH22","Dalkeith"],["EH26","Penicuik"],["EH28","Kirkliston"],["EH29","Kirkliston W"],["EH30","South Queensferry"],["EH48","Bathgate"],["EH52","Broxburn"],["EH54","Livingston"]],
  G: [["G1","Glasgow C"],["G2","Glasgow C (W)"],["G3","Charing Cross"],["G4","Cowcaddens"],["G5","Gorbals"],["G11","Partick"],["G12","Hillhead"],["G13","Knightswood"],["G14","Whiteinch"],["G15","Drumchapel"],["G20","Maryhill"],["G21","Springburn"],["G22","Possilpark"],["G23","Summerston"],["G31","Dennistoun"],["G32","Tollcross"],["G33","Cranhill"],["G34","Easterhouse"],["G40","Bridgeton"],["G41","Pollokshields"],["G42","Govanhill"],["G43","Pollokshaws"],["G44","Cathcart"],["G45","Castlemilk"],["G46","Giffnock"],["G51","Govan"],["G52","Cardonald"],["G53","Pollok"],["G61","Bearsden"],["G62","Milngavie"],["G64","Bishopbriggs"],["G66","Kirkintilloch"],["G67","Cumbernauld"],["G69","Baillieston"],["G71","Uddingston"],["G72","Cambuslang"],["G73","Rutherglen"],["G74","East Kilbride"],["G75","East Kilbride S"],["G76","Clarkston"],["G77","Newton Mearns"],["G81","Clydebank"],["G82","Dumbarton"],["G83","Alexandria"]],
  AB: [["AB10","Aberdeen C"],["AB11","Torry"],["AB12","Cove Bay"],["AB15","West End"],["AB16","Northfield"],["AB21","Dyce"],["AB22","Bridge of Don"],["AB24","Old Aberdeen"],["AB25","Aberdeen N"],["AB30","Laurencekirk"],["AB31","Banchory"],["AB35","Ballater"],["AB39","Stonehaven"],["AB41","Ellon"],["AB42","Peterhead"],["AB43","Fraserburgh"],["AB45","Banff"],["AB51","Inverurie"]],
  DD: [["DD1","Dundee C"],["DD2","Lochee"],["DD3","Hilltown"],["DD4","Stobswell"],["DD5","Broughty Ferry"],["DD8","Forfar"],["DD9","Brechin"],["DD10","Montrose"],["DD11","Arbroath"]],
  KY: [["KY1","Kirkcaldy"],["KY2","Kirkcaldy N"],["KY3","Burntisland"],["KY7","Glenrothes"],["KY8","Leven"],["KY10","Anstruther"],["KY11","Dunfermline E"],["KY12","Dunfermline"],["KY15","Cupar"],["KY16","St Andrews"]],
  FK: [["FK1","Falkirk"],["FK2","Falkirk E"],["FK3","Grangemouth"],["FK5","Larbert"],["FK6","Denny"],["FK7","Stirling S"],["FK8","Stirling"],["FK9","Bridge of Allan"],["FK10","Alloa"],["FK15","Dunblane"]],
  PA: [["PA1","Paisley"],["PA2","Paisley S"],["PA3","Paisley N"],["PA4","Renfrew"],["PA5","Johnstone"],["PA6","Houston"],["PA7","Bishopton"],["PA11","Bridge of Weir"],["PA13","Kilmacolm"],["PA15","Greenock"],["PA16","Greenock W"],["PA19","Gourock"]],
  PH: [["PH1","Perth"],["PH2","Perth E"],["PH3","Auchterarder"],["PH7","Crieff"],["PH10","Blairgowrie"],["PH15","Aberfeldy"],["PH16","Pitlochry"]],
  IV: [["IV1","Inverness"],["IV2","Inverness E"],["IV3","Inverness W"],["IV30","Elgin"],["IV36","Forres"]],
};

const NORTHERN_IRELAND: RegionDistricts = {
  BT: [["BT1","Belfast C"],["BT2","Belfast S"],["BT3","Belfast Harbour"],["BT4","Belfast E"],["BT5","Belfast E (S)"],["BT6","Castlereagh"],["BT7","Botanic"],["BT8","Carryduff"],["BT9","Stranmillis"],["BT10","Finaghy"],["BT11","Andersonstown"],["BT12","Falls"],["BT13","Shankill"],["BT14","Belfast N"],["BT15","Belfast N (E)"],["BT16","Dundonald"],["BT17","Dunmurry"],["BT18","Holywood"],["BT19","Bangor E"],["BT20","Bangor"],["BT21","Donaghadee"],["BT22","Newtownards (S)"],["BT23","Newtownards"],["BT24","Saintfield"],["BT25","Dromore"],["BT26","Hillsborough"],["BT27","Lisburn S"],["BT28","Lisburn"],["BT29","Crumlin"],["BT30","Downpatrick"],["BT31","Castlewellan"],["BT32","Banbridge"],["BT33","Newcastle"],["BT34","Newry"],["BT35","Newry S"],["BT36","Newtownabbey C"],["BT37","Newtownabbey"],["BT38","Carrickfergus"],["BT39","Ballyclare"],["BT40","Larne"],["BT41","Antrim"],["BT42","Ballymena S"],["BT43","Ballymena"],["BT44","Ballymena N"],["BT45","Magherafelt"],["BT47","Derry E"],["BT48","Derry"],["BT49","Limavady"],["BT51","Coleraine"],["BT52","Coleraine N"],["BT53","Ballymoney"],["BT54","Ballycastle"],["BT55","Portstewart"],["BT56","Portrush"],["BT60","Armagh"],["BT61","Armagh N"],["BT62","Portadown"],["BT63","Portadown S"],["BT64","Craigavon"],["BT65","Craigavon S"],["BT66","Lurgan"],["BT67","Lurgan W"],["BT70","Dungannon"],["BT71","Dungannon E"],["BT74","Enniskillen"],["BT78","Omagh"],["BT79","Omagh N"],["BT80","Cookstown"],["BT82","Strabane"]],
};

export const UK_DISTRICTS: Record<RegionName, District[]> = {
  "Greater London": [
    ...LONDON_E, ...LONDON_EC, ...LONDON_N, ...LONDON_NW,
    ...LONDON_SE, ...LONDON_SW, ...LONDON_W, ...LONDON_WC,
    ...LONDON_OUTER,
  ],
  "South East": Object.values(SOUTH_EAST).flat(),
  "South West": Object.values(SOUTH_WEST).flat(),
  "East of England": Object.values(EAST_ENGLAND).flat(),
  "West Midlands": Object.values(WEST_MIDLANDS).flat(),
  "East Midlands": Object.values(EAST_MIDLANDS).flat(),
  "Yorkshire & Humber": Object.values(YORKS_HUMBER).flat(),
  "North West": Object.values(NORTH_WEST).flat(),
  "North East": Object.values(NORTH_EAST).flat(),
  "Wales": Object.values(WALES).flat(),
  "Scotland": Object.values(SCOTLAND).flat(),
  "Northern Ireland": Object.values(NORTHERN_IRELAND).flat(),
};
