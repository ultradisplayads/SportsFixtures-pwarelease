export type VenueDiscoveryReason =
  | "near_you"
  | "showing_this_match"
  | "showing_this_sport"
  | "showing_this_competition"
  | "you_follow_this_venue"
  | "has_live_offer"
  | "editorial_boost"
  | "sponsored"

export type VenueActionType =
  | "directions"
  | "call"
  | "whatsapp"
  | "reserve"
  | "website"
  | "menu"
  | "book_now"
  | "line"

export type VenueOffer = {
  id: string
  title: string
  description?: string
  validUntil?: string
  sponsored?: boolean
}

export type VenueType = "sports_bar" | "bar" | "pub" | "restaurant" | "cafe" | "club" | "rooftop_bar" | "bistro" | "fine_dining" | "hotel_restaurant"

export type VenueCard = {
  id: string
  name: string
  slug?: string
  address?: string
  city?: string
  area?: string
  country?: string
  distanceKm?: number
  screenCount?: number
  capacity?: number
  rating?: number
  // Rich ratings breakdown
  tripadvisorRating?: number
  tripadvisorReviewCount?: number
  googleRating?: number
  googleReviewCount?: number
  // Venue classification
  venueType?: VenueType
  priceBand?: string          // e.g. "฿", "฿฿", "฿฿฿", "฿฿฿฿"
  cuisine?: string[]          // top-level cuisine list (from cuisine_tags)
  // Opening info
  openingHours?: string       // raw string e.g. "Daily 12:00-01:00"
  happyHour?: string          // e.g. "Daily 17:00-19:00"
  kitchenHours?: string
  // Facilities & sports
  facilities?: string[]
  sports?: string[]
  offers?: VenueOffer[]
  offerCount?: number
  showingNow?: boolean
  showingEventIds?: string[]
  reasons?: VenueDiscoveryReason[]
  sponsored?: boolean
  /** Geo-targeted PPC: how far from user this sponsored listing shows (km) */
  ppcRadiusKm?: number
  /** PPC bid tier — used for ordering sponsored results; higher = shown first */
  ppcBid?: number
  /** Cover / hero photo URL shown in the list card */
  photoUrl?: string
  score?: number
  // Social + review links
  tripadvisorUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  // Action links — only present when data exists
  mapUrl?: string
  phoneHref?: string
  whatsappHref?: string
  lineHref?: string
  reserveUrl?: string
  website?: string
  menuUrl?: string
  bookNowUrl?: string
  // Raw coords for map generation
  latitude?: number
  longitude?: number
  // Media
  image?: string
  coverImage?: string
  // Contact
  phone?: string
  // SEO content delivered by Strapi CMS
  seo?: {
    faq_items?: Array<{ question: string; answer: string }>
    author_name?: string
    reviewed_by?: string
    published_at?: string
    updated_at?: string
  }
}

export type VenueDiscoveryResponse = {
  items: VenueCard[]
  filters: {
    sports?: string[]
    competitions?: string[]
    facilities?: string[]
    offerTypes?: string[]
  }
  locationUsed?: boolean
  eventContext?: {
    eventId?: string
    eventName?: string
    competitionId?: string
    sport?: string
  }
}
