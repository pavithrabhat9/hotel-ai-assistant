import { knowledgeBaseRepository, KBEntry } from '../data/knowledgeBase.repository';

class KnowledgeBaseService {
  /**
   * Search the KB for entries relevant to a query.
   * Returns top N entries with topic and content.
   */
  search(query: string, topN: number = 3): KBEntry[] {
    return knowledgeBaseRepository.search(query, topN);
  }

  /**
   * Format KB entries as context for the LLM prompt.
   * Only the retrieved entries are passed — not the whole KB.
   */
  formatAsContext(entries: KBEntry[]): string {
    if (entries.length === 0) return '';

    return entries
      .map((entry, i) => `[Source ${i + 1}: ${entry.topic}]\n${entry.content}`)
      .join('\n\n');
  }

  /**
   * Get quick-start topic suggestions for the frontend.
   */
  getQuickStartTopics(): string[] {
    return knowledgeBaseRepository.getQuickStartTopics();
  }

  /**
   * Get hotel name
   */
  getHotelName(): string {
    return knowledgeBaseRepository.getHotelName();
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
