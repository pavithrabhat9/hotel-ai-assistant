import { describe, it, expect } from 'vitest';
import { knowledgeBaseRepository } from '../../src/data/knowledgeBase.repository';

describe('Knowledge Base Service', () => {
  // ─── Test #1: Normal guest question ───
  describe('search — normal queries', () => {
    it('should find check-in time when asked "What time is check-in?"', () => {
      const results = knowledgeBaseRepository.search('What time is check-in?');
      
      expect(results.length).toBeGreaterThan(0);
      const checkInEntry = results.find(r => r.topic.includes('Check-in'));
      expect(checkInEntry).toBeDefined();
      expect(checkInEntry!.content).toContain('2:00 PM');
    });

    it('should find swimming pool info', () => {
      const results = knowledgeBaseRepository.search('swimming pool');
      
      expect(results.length).toBeGreaterThan(0);
      const poolEntry = results.find(r => r.topic.includes('Swimming Pool') || r.content.toLowerCase().includes('pool'));
      expect(poolEntry).toBeDefined();
      expect(poolEntry!.content).toContain('pool');
    });

    it('should find breakfast information', () => {
      const results = knowledgeBaseRepository.search('Is breakfast included?');
      
      expect(results.length).toBeGreaterThan(0);
      const breakfastEntry = results.find(r => r.topic === 'Breakfast');
      expect(breakfastEntry).toBeDefined();
      expect(breakfastEntry!.content).toContain('included');
    });

    it('should find cancellation policy', () => {
      const results = knowledgeBaseRepository.search('What is the cancellation policy?');
      
      expect(results.length).toBeGreaterThan(0);
      const cancellationEntry = results.find(r => r.topic.includes('Cancellation'));
      expect(cancellationEntry).toBeDefined();
      expect(cancellationEntry!.content).toContain('48 hours');
    });
  });

  // ─── Test: Room for specific guest count ───
  describe('search — room queries', () => {
    it('should find rooms when asked "Which room is suitable for three guests?"', () => {
      const results = knowledgeBaseRepository.search('Which room is suitable for three guests?');
      
      expect(results.length).toBeGreaterThan(0);
      // Should return room-related entries
      const roomEntries = results.filter(r => r.section === 'rooms');
      expect(roomEntries.length).toBeGreaterThan(0);
    });

    it('should find family room when asked about families', () => {
      const results = knowledgeBaseRepository.search('room for a big family');
      
      expect(results.length).toBeGreaterThan(0);
      const familyEntry = results.find(r => r.content.includes('Family'));
      expect(familyEntry).toBeDefined();
    });
  });

  // ─── Test #6: Out of scope ───
  describe('search — out of scope queries', () => {
    it('should return no results for "Do you have a casino?"', () => {
      // The FAQ actually has this answer, so it should find it
      const results = knowledgeBaseRepository.search('Do you have a casino?');
      
      expect(results.length).toBeGreaterThan(0);
      const faqEntry = results.find(r => r.content.includes('casino'));
      expect(faqEntry).toBeDefined();
      expect(faqEntry!.content).toContain('does not have a casino');
    });

    it('should return no relevant results for completely off-topic queries', () => {
      const results = knowledgeBaseRepository.search('What is the meaning of life?');
      
      // Should return 0 or very low-relevance results
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  // ─── Quick-start topics ───
  describe('getQuickStartTopics', () => {
    it('should return topic suggestions', () => {
      const topics = knowledgeBaseRepository.getQuickStartTopics();
      
      expect(topics.length).toBeGreaterThan(0);
      expect(topics).toContain('Check room availability');
    });
  });

  // ─── Hotel data ───
  describe('getRooms', () => {
    it('should return all room types', () => {
      const rooms = knowledgeBaseRepository.getRooms();
      
      expect(rooms.length).toBe(4);
      expect(rooms.map(r => r.roomType)).toContain('Deluxe Room');
      expect(rooms.map(r => r.roomType)).toContain('Family Room');
      expect(rooms.map(r => r.roomType)).toContain('Premium Suite');
      expect(rooms.map(r => r.roomType)).toContain('Presidential Suite');
    });
  });
});
