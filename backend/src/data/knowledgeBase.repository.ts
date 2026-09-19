import hotelData from '../data/hotel-knowledge-base.json';

export interface KBEntry {
  topic: string;
  content: string;
  section: string;
  keywords: string[];
}

class KnowledgeBaseRepository {
  private entries: KBEntry[] = [];
  private rawData: typeof hotelData = hotelData;

  constructor() {
    this.indexKnowledgeBase();
  }

  /**
   * Flattens the nested JSON KB into searchable entries,
   * each tagged with topic, section, and keywords.
   */
  private indexKnowledgeBase(): void {
    const data = this.rawData;

    // Hotel info
    this.entries.push({
      topic: 'Hotel Information',
      content: `${data.hotel.name} is a ${data.hotel.starRating}-star hotel located at ${data.hotel.location.address}, ${data.hotel.location.city}, ${data.hotel.location.state}, ${data.hotel.location.country}. Nearby landmarks: ${data.hotel.location.nearbyLandmarks.join(', ')}. Contact: ${data.hotel.contact.phone}, ${data.hotel.contact.email}.`,
      section: 'hotel',
      keywords: ['hotel', 'location', 'address', 'contact', 'phone', 'email', 'where', 'landmark', 'near', 'star'],
    });

    // Policies
    for (const [key, policy] of Object.entries(data.policies)) {
      const policyObj = policy as Record<string, string>;
      const content = Object.entries(policyObj)
        .filter(([k]) => k !== 'topic')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      
      this.entries.push({
        topic: policyObj.topic || key,
        content,
        section: 'policies',
        keywords: this.generateKeywords(key, policyObj.topic || key, content),
      });
    }

    // Rooms
    for (const room of data.rooms) {
      this.entries.push({
        topic: `Room: ${room.roomType}`,
        content: `${room.roomType} — ${room.description} Capacity: ${room.capacity} guests. Price: ₹${room.pricePerNight.toLocaleString('en-IN')}/night. Bed: ${room.bedType}. Size: ${room.size}. View: ${room.view}. Amenities: ${room.amenities.join(', ')}.`,
        section: 'rooms',
        keywords: ['room', 'rooms', 'stay', 'bed', 'price', 'cost', 'rate', 'capacity', 'guest', 'guests', room.roomType.toLowerCase(), room.bedType.toLowerCase(), room.view.toLowerCase()],
      });
    }

    // All rooms summary
    this.entries.push({
      topic: 'Room Types Overview',
      content: data.rooms.map(r => `${r.roomType}: ${r.description} Capacity: ${r.capacity}, ₹${r.pricePerNight.toLocaleString('en-IN')}/night`).join('\n'),
      section: 'rooms',
      keywords: ['room', 'rooms', 'types', 'which', 'options', 'choose', 'compare', 'suitable', 'fit', 'accommodate', 'people', 'guests', 'family', 'group'],
    });

    // Amenities
    for (const [key, amenity] of Object.entries(data.amenities)) {
      const amenityObj = amenity as Record<string, string>;
      const content = Object.entries(amenityObj)
        .filter(([k]) => k !== 'topic')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      
      this.entries.push({
        topic: amenityObj.topic || key,
        content,
        section: 'amenities',
        keywords: this.generateKeywords(key, amenityObj.topic || key, content),
      });
    }

    // Dining
    const breakfast = data.dining.breakfast;
    this.entries.push({
      topic: breakfast.topic,
      content: `Breakfast included: ${breakfast.included} Type: ${breakfast.type} Location: ${breakfast.restaurant} Hours: ${breakfast.hours} Room service: ${breakfast.roomService}`,
      section: 'dining',
      keywords: ['breakfast', 'morning', 'meal', 'food', 'included', 'free', 'buffet', 'dining'],
    });

    for (const restaurant of data.dining.restaurants) {
      this.entries.push({
        topic: `Restaurant: ${restaurant.name}`,
        content: `${restaurant.name} — ${restaurant.cuisine}. ${restaurant.type}. Hours: ${restaurant.hours}.`,
        section: 'dining',
        keywords: ['restaurant', 'dining', 'food', 'eat', 'lunch', 'dinner', restaurant.name.toLowerCase(), ...restaurant.cuisine.toLowerCase().split(/[,&\s]+/)],
      });
    }

    const roomService = data.dining.roomService;
    this.entries.push({
      topic: roomService.topic,
      content: `Room service hours: ${roomService.hours}. ${roomService.details}`,
      section: 'dining',
      keywords: ['room service', 'order', 'food', 'late', 'night', 'menu'],
    });

    // Transport
    for (const [key, transport] of Object.entries(data.transport)) {
      const transportObj = transport as Record<string, string>;
      const content = Object.entries(transportObj)
        .filter(([k]) => k !== 'topic')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      
      this.entries.push({
        topic: transportObj.topic || key,
        content,
        section: 'transport',
        keywords: this.generateKeywords(key, transportObj.topic || key, content),
      });
    }

    // FAQ
    for (const faq of data.faq) {
      this.entries.push({
        topic: 'FAQ',
        content: `Q: ${faq.question}\nA: ${faq.answer}`,
        section: 'faq',
        keywords: this.generateKeywords('faq', faq.question, faq.answer),
      });
    }
  }

  private generateKeywords(key: string, topic: string, content: string): string[] {
    const text = `${key} ${topic} ${content}`.toLowerCase();
    // Extract meaningful words (4+ chars), deduplicate
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    return [...new Set(words)];
  }

  /**
   * Search the KB by keyword matching. Returns top N entries ranked by relevance.
   */
  search(query: string, topN: number = 3): KBEntry[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 2);

    const scored = this.entries.map(entry => {
      let score = 0;

      // Exact phrase match in content (highest signal)
      if (entry.content.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Topic match
      if (entry.topic.toLowerCase().includes(queryLower)) {
        score += 8;
      }

      // Keyword matches
      for (const word of queryWords) {
        if (entry.keywords.some(kw => kw.includes(word))) {
          score += 3;
        }
        if (entry.topic.toLowerCase().includes(word)) {
          score += 2;
        }
        if (entry.content.toLowerCase().includes(word)) {
          score += 1;
        }
      }

      return { entry, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(s => s.entry);
  }

  /**
   * Get all entries (for system context)
   */
  getAll(): KBEntry[] {
    return [...this.entries];
  }

  /**
   * Get raw hotel data
   */
  getRawData(): typeof hotelData {
    return this.rawData;
  }

  /**
   * Get quick-start topics for the frontend
   */
  getQuickStartTopics(): string[] {
    return this.rawData.quickStartTopics;
  }

  /**
   * Get all room types for availability matching
   */
  getRooms() {
    return this.rawData.rooms;
  }

  /**
   * Get hotel name
   */
  getHotelName(): string {
    return this.rawData.hotel.name;
  }
}

// Singleton
export const knowledgeBaseRepository = new KnowledgeBaseRepository();
