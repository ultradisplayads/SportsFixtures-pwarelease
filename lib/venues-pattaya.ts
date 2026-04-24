/**
 * lib/venues-pattaya.ts
 *
 * Live venue data for Pattaya, Thailand.
 * Mapped from pattaya_master_venues_single_source_v8_enriched.csv
 *
 * Field mapping (CSV → VenueCard):
 *   venue_id (PTY-XXXX)         → id
 *   normalized_name / slug      → slug
 *   venue_name                  → name
 *   address_or_location         → address
 *   area                        → area
 *   city                        → city
 *   country_code                → country
 *   latitude / longitude        → latitude / longitude
 *   google_maps_url             → mapUrl
 *   phone_primary               → phoneHref (tel:)
 *   whatsapp_url                → whatsappHref
 *   line_url                    → lineHref
 *   website_primary_url         → website
 *   menu_url                    → menuUrl
 *   booking_url                 → bookNowUrl
 *   tripadvisor_rating          → tripadvisorRating
 *   tripadvisor_review_count    → tripadvisorReviewCount
 *   google_rating               → googleRating
 *   google_review_count         → googleReviewCount
 *   price_band                  → priceBand
 *   opening_hours_raw           → openingHours
 *   happy_hour_hours            → happyHour
 *   kitchen_hours               → kitchenHours
 *   screen_count_band           → screenCount
 *   sports_supported            → sports
 *   cuisine_tags                → cuisine + facilities (cuisine:)
 *   outdoor_seating             → facilities includes "outdoor_seating"
 *   reservable                  → facilities includes "reservable"
 *   family_friendly             → facilities includes "family_friendly"
 *   live_music                  → facilities includes "live_music"
 *   primary_category            → venueType
 *   sports_bar_signal Strong    → showingNow = true
 *   facebook_url                → facebookUrl
 *   instagram_url               → instagramUrl
 *   source_url_1 (tripadvisor)  → tripadvisorUrl
 */

import type { VenueCard, VenueType } from "@/types/venues"

function tel(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  return `tel:${phone.replace(/\s+/g, "")}`
}

function screenCount(band: string | null | undefined): number | undefined {
  if (!band) return undefined
  const m = band.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : undefined
}

function splitTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(";").map((s) => s.trim()).filter(Boolean)
}

function buildFacilities(row: {
  outdoor_seating?: string
  reservable?: string
  family_friendly?: string
  live_music?: string
  cuisine_tags?: string
  commentary_available?: string
  projector_present?: string
  food?: string
}): string[] {
  const f: string[] = []
  if (row.outdoor_seating === "yes") f.push("outdoor_seating")
  if (row.reservable === "yes") f.push("reservable")
  if (row.family_friendly === "yes") f.push("family_friendly")
  if (row.live_music === "yes") f.push("live_music")
  if (row.commentary_available === "yes") f.push("commentary")
  if (row.projector_present === "yes") f.push("projector")
  if (row.food === "yes") f.push("food")
  splitTags(row.cuisine_tags).forEach((t) => f.push(`cuisine:${t}`))
  return f
}

/** Curated Unsplash photos keyed by venue type — consistent per-category imagery */
const TYPE_PHOTOS: Record<string, string[]> = {
  sports_bar: [
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80",
    "https://images.unsplash.com/photo-1571047616855-82a89cd09daf?w=800&q=80",
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  ],
  pub: [
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=800&q=80",
  ],
  bar: [
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  ],
  cafe: [
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",
  ],
  rooftop_bar: [
    "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80",
  ],
  bistro: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  ],
  fine_dining: [
    "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
  ],
}

let photoCounters: Record<string, number> = {}
function assignPhoto(id: string, type: string | undefined): string {
  const key = type ?? "default"
  const pool = TYPE_PHOTOS[key] ?? TYPE_PHOTOS.default
  const idx = (photoCounters[key] ?? 0) % pool.length
  photoCounters[key] = idx + 1
  // Vary by using id hash to avoid same image appearing consecutively
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return pool[(idx + hash) % pool.length]
}

function mapVenueType(primary: string): VenueType | undefined {
  const p = primary.toLowerCase()
  if (p.includes("sports_bar") || p.includes("sports bar")) return "sports_bar"
  if (p.includes("rooftop")) return "rooftop_bar"
  if (p.includes("fine dining")) return "fine_dining"
  if (p.includes("bistro") || p.includes("lounge")) return "bistro"
  if (p.includes("cafe")) return "cafe"
  if (p.includes("restaurant")) return "restaurant"
  if (p.includes("club")) return "club"
  if (p.includes("pub")) return "pub"
  if (p.includes("bar")) return "bar"
  return "bar"
}

export const VENUES_PATTAYA: VenueCard[] = [
  {
    id: "PTY-0001",
    slug: "the-pattaya-sports-hub",
    name: "The Pattaya Sports Hub",
    venueType: "sports_bar",
    address: "420/142 Moo 2, Nong Prue, Pattaya 20150",
    area: "Nong Prue / Central Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://pattayasportsbar.com/",
    menuUrl: "https://pattayasportsbar.com/food-and-drink/",
    facebookUrl: "https://www.facebook.com/pattayasportshub/",
    phoneHref: tel("0647247578"),
    tripadvisorRating: 5.0,
    tripadvisorReviewCount: 6,
    tripadvisorUrl: "https://www.tripadvisor.com/Hotel_Review-g11891445-d27990234-Reviews-The_Pattaya_Sports_Hub-Nong_Prue_Pattaya_Chonburi_Province.html",
    photoUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    sponsored: true,
    ppcBid: 100,
    ppcRadiusKm: 10,
    score: 99,
    showingNow: true,
    sports: ["live sports", "golf", "darts", "pool"],
    facilities: buildFacilities({ cuisine_tags: "" }),
    reasons: ["showing_this_sport", "sponsored"],
  },
  {
    id: "PTY-0002",
    slug: "fraser-s-sports-bar-and-pub",
    name: "Fraser's Sports Bar and Pub",
    venueType: "sports_bar",
    address: "Thappraya Road, next to Gian's above the News Cafe, Jomtien Beach",
    area: "Jomtien / Thappraya Road",
    city: "Pattaya",
    country: "TH",
    website: "https://www.fraserspattaya.com/",
    menuUrl: "https://www.fraserspattaya.com/restaurant",
    facebookUrl: "https://www.facebook.com/FrasersSportsBar/",
    phoneHref: tel("+66 38 251 560"),
    tripadvisorRating: 3.9,
    tripadvisorReviewCount: 457,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g3366878-d7093157-Reviews-Fraser_s_Sports_Bar_and_Pub-Jomtien_Beach_Pattaya_Chonburi_Province.html",
    photoUrl: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80",
    sponsored: true,
    ppcBid: 90,
    ppcRadiusKm: 15,
    screenCount: 12,
    score: 98,
    showingNow: true,
    sports: ["sports bar", "golf society"],
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", cuisine_tags: "bar; pub; australian; thai; western" }),
    reasons: ["showing_this_sport", "near_you", "sponsored"],
  },
  {
    id: "PTY-0003",
    slug: "hemingway-s-jomtien",
    name: "Hemingway's Jomtien",
    venueType: "sports_bar",
    address: "414/16 Jomtien Complex Condotel Lobby, Moo 12, Nong Prue",
    area: "Jomtien",
    city: "Pattaya",
    country: "TH",
    website: "https://hemingwaysjomtien.com/",
    menuUrl: "https://hemingwaysjomtien.com/menu",
    photoUrl: "https://images.unsplash.com/photo-1571047616855-82a89cd09daf?w=800&q=80",
    sponsored: true,
    ppcBid: 80,
    ppcRadiusKm: 8,
    score: 97,
    showingNow: true,
    sports: ["live sports", "premier league", "boxing"],
    facilities: buildFacilities({ cuisine_tags: "major expat sports bar" }),
    reasons: ["showing_this_sport", "sponsored"],
  },
  {
    id: "PTY-0004",
    slug: "hemingway-s-pattaya",
    name: "Hemingway's Pattaya",
    venueType: "sports_bar",
    address: "Bottom of Soi Honey, Pattaya",
    area: "Bottom of Soi Honey",
    city: "Pattaya",
    country: "TH",
    website: "https://hemingwayspattaya.com/",
    menuUrl: "https://hemingwayspattaya.com/menu",
    photoUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80",
    score: 96,
    showingNow: true,
    sports: ["live sports"],
    facilities: buildFacilities({ cuisine_tags: "sports pub; pub food" }),
    reasons: ["showing_this_sport"],
  },
  {
    id: "PTY-0005",
    slug: "anytime-cafe-pattaya",
    name: "Anytime Cafe, Pattaya",
    venueType: "cafe",
    address: "172/1 Moo 10, Nong Prue, Bang Lamung",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://anytime-cafe.com/th/",
    menuUrl: "https://anytime-cafe.com/th/menu",
    phoneHref: tel("038710271"),
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 804,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d10783708-Reviews-Anytime_Cafe_Pattaya-Pattaya_Chonburi_Province.html",
    photoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    priceBand: "฿฿฿",
    openingHours: "Open until 22:00",
    cuisine: ["cafe", "international", "bakery"],
    score: 95,
    facilities: buildFacilities({ cuisine_tags: "cafe; international; bakery" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0006",
    slug: "the-collective-pattaya",
    name: "The Collective Pattaya",
    venueType: "restaurant",
    address: "Pattaya Beach Road, in front of Holiday Inn Pattaya",
    area: "Beach Road",
    city: "Pattaya",
    country: "TH",
    website: "https://pattaya.holidayinn.com/th/bars-and-restaurants/the-collective",
    bookNowUrl: "https://www.tablecheck.com/en/ihg-holiday-inn-pattaya-the-collective/reserve/message",
    menuUrl: "https://qrco.de/thecollectivemenu",
    facebookUrl: "https://www.facebook.com/thecollective.pattaya/",
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 710,
    openingHours: "Noon - 1:00 am",
    happyHour: "Daily from 17:00",
    priceBand: "฿฿฿",
    cuisine: ["pizza", "cocktails"],
    score: 94,
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", cuisine_tags: "pizza; cocktails; bar; restaurant" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0007",
    slug: "skybar-summer-club",
    name: "Skybar Summer Club",
    venueType: "rooftop_bar",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.skybarsummerclub.com/",
    instagramUrl: "https://www.instagram.com/skybarsummerclub/",
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 508,
    cuisine: ["rooftop bar", "comfort food", "cocktails"],
    score: 93,
    facilities: buildFacilities({ outdoor_seating: "yes", cuisine_tags: "rooftop bar; comfort food; cocktails" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0008",
    slug: "t55-new-york-grill-room",
    name: "T55 New York Grill Room",
    venueType: "fine_dining",
    address: "55 Moo 2 Sukhumvit Road, Na Jomtien, Sattahip",
    area: "Na Jomtien",
    city: "Pattaya",
    country: "TH",
    website: "https://movenpick.accor.com/en/asia/thailand/pattaya/moevenpick-siam-hotel-na-jomtien-pattaya/restaurants/t55newyorkgrillroom.html",
    bookNowUrl: "https://www.tablecheck.com/en/movenpick-siam-na-jomtien-pattaya-t55/reserve",
    facebookUrl: "https://www.facebook.com/t55newyorkgrill.pty/",
    phoneHref: tel("+66 33 078 888"),
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 388,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d",
    priceBand: "฿฿฿฿",
    openingHours: "Daily 18:00-23:00",
    cuisine: ["steakhouse", "grill", "seafood"],
    score: 92,
    facilities: buildFacilities({ reservable: "yes", cuisine_tags: "steakhouse; grill; seafood" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0009",
    slug: "moonwhale-pattaya",
    name: "Moonwhale Pattaya",
    venueType: "rooftop_bar",
    address: "3rd Floor, Rooftop, Royal Garden Plaza, Pattaya",
    area: "Central Pattaya",
    city: "Pattaya",
    country: "TH",
    facebookUrl: "https://www.facebook.com/moonwhale.pattaya/",
    instagramUrl: "https://www.instagram.com/moonwhale_pattaya/",
    phoneHref: tel("0659745883"),
    whatsappHref: "https://wa.me/660659745883",
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 272,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d28640595-Reviews-Moonwhale_Pattaya-Pattaya_Chonburi_Province.html",
    cuisine: ["rooftop bar", "cocktails", "sea view"],
    score: 91,
    facilities: buildFacilities({ cuisine_tags: "rooftop bar; cocktails; dining; sea view" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0010",
    slug: "maha-thai-cuisine",
    name: "Maha Thai Cuisine",
    venueType: "restaurant",
    address: "3rd floor, Royal Garden Plaza, Pattaya",
    area: "Central Pattaya",
    city: "Pattaya",
    country: "TH",
    facebookUrl: "https://www.facebook.com/61572522773768/",
    instagramUrl: "https://www.instagram.com/mahathaipattaya/",
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 136,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d33061953-Reviews-Maha_Thai_Cuisine-Pattaya_Chonburi_Province.html",
    cuisine: ["thai", "rooftop dining", "sunset view"],
    score: 90,
    facilities: buildFacilities({ cuisine_tags: "thai; rooftop dining; sunset view" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0011",
    slug: "the-view-pattaya-restaurant",
    name: "The View Pattaya Restaurant",
    venueType: "restaurant",
    address: "Phratamnak Soi 5, Pattaya",
    area: "Phratamnak",
    city: "Pattaya",
    country: "TH",
    website: "https://theviewpattaya.com/",
    facebookUrl: "https://www.facebook.com/p/The-View-Pattaya-61573066525580/",
    instagramUrl: "https://www.instagram.com/theviewrestaurantpattaya/",
    phoneHref: tel("0943519399"),
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 136,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d32995155-Reviews-The_View_Pattaya_Restaurant-Pattaya_Chonburi_Province.html",
    cuisine: ["thai", "western", "seafood"],
    score: 89,
    facilities: buildFacilities({ outdoor_seating: "yes", cuisine_tags: "thai; western; seafood; seaside dining" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0012",
    slug: "playa-bistro-lounge",
    name: "Playa Bistro & Lounge",
    venueType: "bistro",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.playa-bistro.com/",
    facebookUrl: "https://www.facebook.com/PlayaBistroLounge/",
    instagramUrl: "https://www.instagram.com/playabistro_pattaya/",
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 59,
    openingHours: "Daily 14:30-00:00",
    cuisine: ["european", "thai", "beachside"],
    score: 88,
    facilities: buildFacilities({ outdoor_seating: "yes", cuisine_tags: "european; thai; beachside; sunset dining" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0013",
    slug: "the-car-bar",
    name: "The Car Bar",
    venueType: "bar",
    address: "Siam@Siam Design Hotel (GF), 390 Moo 9, Pattaya 2nd Rd, Nong Prue",
    area: "Pattaya 2nd Road",
    city: "Pattaya",
    country: "TH",
    website: "https://siamatpattaya.com/",
    phoneHref: tel("038930600"),
    tripadvisorRating: 4.9,
    tripadvisorReviewCount: 55,
    tripadvisorUrl: "https://th.tripadvisor.com/Restaurant_Review-g293919-d15662736-Reviews-The_Car_Bar-Pattaya_Chonburi_Province.html",
    openingHours: "Daily 07:00-02:00",
    cuisine: ["bar", "international", "thai"],
    score: 87,
    facilities: buildFacilities({ cuisine_tags: "bar; international; thai" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0014",
    slug: "cafe-des-amis-fine-dining",
    name: "Cafe Des Amis Fine Dining",
    venueType: "fine_dining",
    address: "391/6 Thanon Thap Phraya, Muang Pattaya, Bang Lamung",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    latitude: 12.9138,
    longitude: 100.87074,
    website: "https://cafe-des-amis.com/",
    menuUrl: "https://cafe-des-amis.com/",
    facebookUrl: "https://www.facebook.com/CafeDesAmisPattaya/",
    phoneHref: tel("084 026 4989"),
    tripadvisorRating: 4.8,
    tripadvisorReviewCount: 1811,
    priceBand: "฿฿฿฿",
    openingHours: "Opens 17:00",
    cuisine: ["fine dining", "seafood", "steaks"],
    score: 86,
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", cuisine_tags: "fine dining; seafood; steaks" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0015",
    slug: "maharani",
    name: "Maharani",
    venueType: "restaurant",
    address: "Royal Cliff Beach Hotel, Pattaya",
    area: "Royal Cliff",
    city: "Pattaya",
    country: "TH",
    website: "https://www.royalcliff.com/restaurant/maharani/",
    tripadvisorRating: 4.8,
    tripadvisorReviewCount: 325,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d1628784-Reviews-Maharani-Pattaya_Chonburi_Province.html",
    priceBand: "฿฿",
    openingHours: "11:00-14:30 & 18:00-22:30; Closed Mon",
    cuisine: ["indian", "halal", "ocean view"],
    score: 85,
    facilities: buildFacilities({ cuisine_tags: "indian; halal; ocean view" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0016",
    slug: "tarka-house-restaurant",
    name: "Tarka House Restaurant",
    venueType: "restaurant",
    address: "325/82 Beach Road Soi 13/4, Na Kluea, Bang Lamung",
    area: "Na Kluea",
    city: "Pattaya",
    country: "TH",
    instagramUrl: "https://www.instagram.com/tarka.house/",
    phoneHref: tel("0816393280"),
    tripadvisorRating: 4.8,
    tripadvisorReviewCount: 294,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d12416771-Reviews-Tarka_House_Restaurant-Pattaya_Chonburi_Province.html",
    openingHours: "Opens 09:00",
    cuisine: ["indian"],
    score: 84,
    facilities: buildFacilities({ cuisine_tags: "indian; delivery" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0017",
    slug: "jack-tar-bar",
    name: "Jack Tar Bar",
    venueType: "pub",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    facebookUrl: "https://www.facebook.com/p/Jack-Tar-Bar-100070160110734/",
    tripadvisorRating: 4.8,
    tripadvisorReviewCount: 6,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d15321319-Reviews-Jack_Tar_Bar-Pattaya_Chonburi_Province.html",
    cuisine: ["pub", "bar"],
    score: 83,
    facilities: buildFacilities({ live_music: "yes", cuisine_tags: "pub; bar" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0018",
    slug: "horizon-rooftop-restaurant-bar",
    name: "Horizon Rooftop Restaurant & Bar",
    venueType: "rooftop_bar",
    address: "333/101 Moo 9, Hilton Pattaya, Level 34",
    area: "Central Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.hilton.com/en/hotels/bkkhphi-hilton-pattaya/dining/horizon/",
    facebookUrl: "https://www.facebook.com/Horizonrooftoprestaurantandbar/",
    phoneHref: tel("038 253 000"),
    tripadvisorRating: 4.7,
    tripadvisorReviewCount: 1594,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d3339905-Reviews-Horizon_Rooftop_Restaurant_Bar-Pattaya_Chonburi_Province.html",
    openingHours: "Daily 16:00-01:00",
    cuisine: ["international", "european", "rooftop bar"],
    score: 82,
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", cuisine_tags: "international; european; rooftop bar" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0019",
    slug: "benihana-at-avani-pattaya",
    name: "Benihana at Avani Pattaya",
    venueType: "restaurant",
    address: "Avani Pattaya Resort, Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.avanihotels.com/en/pattaya/restaurants/benihana",
    bookNowUrl: "https://www.avanihotels.com/en/pattaya/restaurants/benihana",
    facebookUrl: "https://www.facebook.com/benihanapty/",
    phoneHref: tel("+66 3841 2120"),
    tripadvisorRating: 4.7,
    tripadvisorReviewCount: 879,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d1148609-Reviews-Benihana_at_Avani_Pattaya-Pattaya_Chonburi_Province.html",
    openingHours: "Daily 12:00-23:00",
    cuisine: ["japanese", "teppanyaki", "steakhouse"],
    score: 81,
    facilities: buildFacilities({ reservable: "yes", family_friendly: "yes", cuisine_tags: "japanese; teppanyaki; steakhouse" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0020",
    slug: "drift",
    name: "Drift",
    venueType: "bar",
    address: "Level 16, Hilton Pattaya",
    area: "Central Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.hilton.com/en/hotels/bkkhphi-hilton-pattaya/dining/",
    tripadvisorRating: 4.7,
    tripadvisorReviewCount: 373,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d3949363-Reviews-Drift-Pattaya_Chonburi_Province.html",
    cuisine: ["cocktails", "afternoon tea", "international"],
    score: 80,
    facilities: buildFacilities({ cuisine_tags: "lobby lounge; international; cocktails; afternoon tea" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0021",
    slug: "caprice-restaurant-bar",
    name: "Caprice Restaurant & Bar",
    venueType: "fine_dining",
    address: "Royal Wing Suites & Spa, 353 Phra Tamnuk Road, Pattaya 20150",
    area: "Phratamnak",
    city: "Pattaya",
    country: "TH",
    website: "https://www.royalcliff.com/restaurants/caprice/",
    phoneHref: tel("038250421"),
    tripadvisorRating: 4.7,
    tripadvisorReviewCount: 215,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d1636753-Reviews-Caprice_Restaurant_Bar-Pattaya_Chonburi_Province.html",
    openingHours: "Daily 18:30-22:30",
    cuisine: ["french", "seafood", "european"],
    score: 79,
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", cuisine_tags: "french; seafood; international; european" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0022",
    slug: "indian-by-nature",
    name: "Indian By Nature",
    venueType: "restaurant",
    address: "306/64-68 Thappraya Road, Chateau Dale Plaza",
    area: "Thappraya Road",
    city: "Pattaya",
    country: "TH",
    website: "https://www.indian-by-nature.com/",
    menuUrl: "https://www.indian-by-nature.com/our-menu.html",
    bookNowUrl: "https://www.indian-by-nature.com/get-in-touch.html",
    facebookUrl: "https://www.facebook.com/indianbynature/",
    phoneHref: tel("+66 38 364 656"),
    tripadvisorRating: 4.6,
    tripadvisorReviewCount: 1156,
    priceBand: "฿฿",
    openingHours: "Mon-Sun 17:00-23:00",
    cuisine: ["indian"],
    score: 78,
    facilities: buildFacilities({ reservable: "yes", cuisine_tags: "indian" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0023",
    slug: "salt-pattaya-restaurant",
    name: "Salt Pattaya Restaurant",
    venueType: "restaurant",
    address: "101 Jomtiensaineung Rd, Muang Pattaya, Sattahip District",
    area: "Jomtien",
    city: "Pattaya",
    country: "TH",
    phoneHref: tel("+66 33 128 028"),
    tripadvisorRating: 4.6,
    tripadvisorReviewCount: 91,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g3366878-d16699617-Reviews-Salt_Pattaya_Restaurant-Jomtien_Beach_Pattaya_Chonburi_Province.html",
    openingHours: "06:30-23:00",
    cuisine: ["restaurant", "beach view"],
    score: 77,
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", cuisine_tags: "restaurant; beach view" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0024",
    slug: "bentley-s-bar-restaurant",
    name: "Bentley's Bar & Restaurant",
    venueType: "sports_bar",
    address: "359/203 Soi 5 Pratumnak, Laguna Bay Pattaya City",
    area: "Pratumnak",
    city: "Pattaya",
    country: "TH",
    facebookUrl: "https://www.facebook.com/100086017222428/",
    instagramUrl: "https://www.instagram.com/bentleyspattaya/",
    phoneHref: tel("+66 93 776 6624"),
    tripadvisorRating: 4.6,
    tripadvisorReviewCount: 9,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g11891445-d28105400-Reviews-Bentley_s_Bar_Restaurant-Nong_Prue_Pattaya_Chonburi_Province.html",
    score: 76,
    showingNow: true,
    sports: ["sports bar", "televised sport"],
    cuisine: ["bar", "restaurant"],
    facilities: buildFacilities({ cuisine_tags: "bar & restaurant" }),
    reasons: ["showing_this_sport"],
  },
  {
    id: "PTY-0025",
    slug: "la-bocca-italian-restaurant-and-pizzeria",
    name: "La Bocca Italian Restaurant and Pizzeria",
    venueType: "restaurant",
    address: "315/172 Thappraya Road, Jomtien Beach",
    area: "Jomtien",
    city: "Pattaya",
    country: "TH",
    phoneHref: tel("+66 38 303 530"),
    tripadvisorRating: 4.5,
    tripadvisorReviewCount: 1368,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g3366878-d3171984-Reviews-La_Bocca_Italian_Restaurant_and_Pizzeria-Jomtien_Beach_Pattaya_Chonburi_Province.html",
    openingHours: "14:00-23:30",
    priceBand: "฿฿",
    cuisine: ["italian", "pizzeria"],
    score: 75,
    facilities: buildFacilities({ cuisine_tags: "italian; pizzeria" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0026",
    slug: "casa-pascal-restaurant",
    name: "Casa Pascal Restaurant",
    venueType: "restaurant",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.restaurant-in-pattaya.com/",
    facebookUrl: "https://www.facebook.com/casapascalrestaurant2023/",
    tripadvisorRating: 4.5,
    tripadvisorReviewCount: 1284,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d969140-Reviews-Casa_Pascal_Restaurant-Pattaya_Chonburi_Province.html",
    cuisine: ["international"],
    score: 74,
    facilities: buildFacilities({ cuisine_tags: "international" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0027",
    slug: "jasmin-s-cafe-pattaya",
    name: "Jasmin's Cafe Pattaya",
    venueType: "cafe",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://sites.google.com/view/jasminscafe/accueil",
    facebookUrl: "https://www.facebook.com/jasminspattaya/",
    instagramUrl: "https://www.instagram.com/jasmins_cafe/",
    phoneHref: tel("0814298409"),
    tripadvisorRating: 4.5,
    tripadvisorReviewCount: 803,
    openingHours: "Daily 10:00-22:00",
    cuisine: ["thai", "cafe", "breakfast", "coffee"],
    score: 73,
    facilities: buildFacilities({ cuisine_tags: "thai food; urban cafe; breakfast; lunch; dinner; coffee" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0028",
    slug: "gian-s-italian-restaurant",
    name: "Gian's Italian Restaurant",
    venueType: "restaurant",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    tripadvisorRating: 4.5,
    tripadvisorReviewCount: 503,
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g293919-d1148739-Reviews-Gian_s_Italian_Restaurant-Pattaya_Chonburi_Province.html",
    cuisine: ["italian", "steak", "western"],
    score: 72,
    facilities: buildFacilities({ cuisine_tags: "italian; steak; western" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0029",
    slug: "buono",
    name: "Buono!",
    venueType: "restaurant",
    address: "144/28 Moo 12 Soi 4 Jomtien Beach Rd, Jomtien Beach",
    area: "Jomtien",
    city: "Pattaya",
    country: "TH",
    phoneHref: tel("+66 98 662 2504"),
    tripadvisorRating: 4.5,
    cuisine: ["italian", "pizza", "pasta"],
    score: 71,
    facilities: buildFacilities({ cuisine_tags: "italian; pizza; pasta" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0030",
    slug: "pelmeni-club-pattaya",
    name: "Pelmeni Club Pattaya",
    venueType: "restaurant",
    address: "157/35 M.5 Naklua 16/2, Banglamung, Chonburi",
    area: "Na Kluea",
    city: "Pattaya",
    country: "TH",
    website: "https://pelmeni-club.com/",
    phoneHref: tel("+66 95 550 1499"),
    tripadvisorRating: 4.4,
    cuisine: ["eastern european", "western", "dumplings", "seafood"],
    score: 70,
    facilities: buildFacilities({ outdoor_seating: "yes", live_music: "yes", cuisine_tags: "eastern european; western; dumplings; seafood" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0031",
    slug: "blue-sky-iii",
    name: "Blue Sky III",
    venueType: "bar",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    tripadvisorRating: 4.3,
    cuisine: ["bar", "pub"],
    score: 69,
    facilities: buildFacilities({ cuisine_tags: "bar; pub" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0032",
    slug: "cabbages-and-condoms",
    name: "Cabbages and Condoms",
    venueType: "restaurant",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    website: "https://www.cabbagesandcondoms.com/restaurant",
    bookNowUrl: "https://www.cabbagesandcondoms.com/reservation",
    phoneHref: tel("0861005826"),
    tripadvisorRating: 4.1,
    cuisine: ["international", "seafood", "family dining"],
    score: 68,
    facilities: buildFacilities({ outdoor_seating: "yes", reservable: "yes", family_friendly: "yes", cuisine_tags: "international; seafood; family dining" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0033",
    slug: "sandbar-by-the-sea",
    name: "Sandbar By The Sea",
    venueType: "restaurant",
    address: "45/16 Moo 12, Jomtien Beach",
    area: "Jomtien",
    city: "Pattaya",
    country: "TH",
    phoneHref: tel("+66 81 583 7269"),
    tripadvisorRating: 4.1,
    cuisine: ["thai", "western", "all-day dining"],
    score: 67,
    facilities: buildFacilities({ outdoor_seating: "yes", family_friendly: "yes", cuisine_tags: "thai; western; all-day dining" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0034",
    slug: "i-rovers-sports-bar-restaurant",
    name: "I-Rovers Sports Bar & Restaurant",
    venueType: "sports_bar",
    address: "Soi LK Metro, Central Pattaya",
    area: "Soi LK Metro",
    city: "Pattaya",
    country: "TH",
    tripadvisorRating: 4.0,
    score: 66,
    showingNow: true,
    sports: ["live sports"],
    cuisine: ["sports bar"],
    facilities: buildFacilities({ cuisine_tags: "" }),
    reasons: ["showing_this_sport"],
  },
  {
    id: "PTY-0035",
    slug: "la-taverna-bistro-italiano",
    name: "La Taverna Bistro Italiano",
    venueType: "bistro",
    address: "Jomtien, Pattaya",
    area: "Jomtien",
    city: "Pattaya",
    country: "TH",
    tripadvisorRating: 4.0,
    cuisine: ["italian"],
    score: 65,
    facilities: buildFacilities({ cuisine_tags: "italian" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0036",
    slug: "fra-pattaya",
    name: "Fra Pattaya",
    venueType: "restaurant",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    tripadvisorRating: 3.9,
    cuisine: ["restaurant"],
    score: 64,
    facilities: buildFacilities({ cuisine_tags: "restaurant" }),
    reasons: ["near_you"],
  },
  {
    id: "PTY-0037",
    slug: "triangle-bar",
    name: "Triangle Bar",
    venueType: "sports_bar",
    address: "Pattaya",
    area: "Pattaya",
    city: "Pattaya",
    country: "TH",
    score: 63,
    showingNow: true,
    sports: ["live sports", "football"],
    cuisine: ["sports bar"],
    facilities: buildFacilities({ cuisine_tags: "sports bar" }),
    reasons: ["showing_this_sport"],
  },
]

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getVenueBySlug(slugOrId: string): VenueCard | undefined {
  return VENUES_PATTAYA.find(
    (v) => v.slug === slugOrId || v.id === slugOrId,
  )
}

export function getPattayaVenues(): VenueCard[] {
  // Reset counters each call so photo rotation is deterministic
  photoCounters = {}
  return VENUES_PATTAYA.map((v) => ({
    ...v,
    photoUrl: v.photoUrl ?? assignPhoto(v.id, v.venueType),
  }))
}

// Expose mapping utilities for use in normaliseVenue
export { buildFacilities, splitTags, mapVenueType }

// Legacy aliases — Turbopack static analysis requires real named exports, not re-export chains
export const getDemoVenuesPattaya = getPattayaVenues
export const getDemoVenues = getPattayaVenues
export const getDemoVenueBySlug = getVenueBySlug
