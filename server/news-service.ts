import { storage } from './storage';
import type { InsertNewsArticle } from '@shared/schema';

interface NewsApiArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface ReliefWebArticle {
  fields: {
    title: string;
    body?: string;
    url: string;
    date: {
      created: string;
    };
    source: Array<{
      name: string;
    }>;
  };
}

export class NaturalDisasterNewsService {
  private readonly disasterKeywords = [
    'earthquake', 'tsunami', 'flood', 'hurricane', 'tornado', 'wildfire', 
    'volcano', 'landslide', 'drought', 'cyclone', 'typhoon', 'blizzard',
    'avalanche', 'mudslide', 'forest fire', 'natural disaster'
  ];

  async fetchDisasterNews(): Promise<InsertNewsArticle[]> {
    const articles: InsertNewsArticle[] = [];
    
    try {
      // Fetch from ReliefWeb API (Free humanitarian news)
      const reliefWebArticles = await this.fetchReliefWebNews();
      articles.push(...reliefWebArticles);
      
      // Fetch from GDACS (Global Disaster Alert Coordination System)
      const gdacsArticles = await this.fetchGDACSNews();
      articles.push(...gdacsArticles);
      
      console.log(`Fetched ${articles.length} disaster news articles`);
      return articles;
    } catch (error) {
      console.error('Error fetching disaster news:', error);
      return [];
    }
  }

  private async fetchReliefWebNews(): Promise<InsertNewsArticle[]> {
    try {
      const response = await fetch(
        'https://api.reliefweb.int/v1/reports?appname=axiom-sentinel&query[value]=disaster%20OR%20earthquake%20OR%20flood%20OR%20hurricane&sort[]=date:desc&limit=20&fields[include][]=title&fields[include][]=body&fields[include][]=url&fields[include][]=date&fields[include][]=source'
      );

      if (!response.ok) {
        throw new Error(`ReliefWeb API error: ${response.status}`);
      }

      const data = await response.json();
      const articles: InsertNewsArticle[] = [];

      for (const item of data.data || []) {
        const article = item.fields as ReliefWebArticle['fields'];
        
        if (!article || !article.title || !article.url) continue;

        const disasterType = this.extractDisasterType(article.title + ' ' + (article.body || ''));
        const location = this.extractLocation(article.title);

        articles.push({
          title: article.title,
          description: article.body ? article.body.substring(0, 300) + '...' : '',
          content: article.body || '',
          url: article.url,
          source: article.source?.[0]?.name || 'ReliefWeb',
          category: 'natural-disaster',
          publishedAt: new Date(article.date.created),
          imageUrl: null,
          relevanceScore: this.calculateRelevanceScore(article.title, article.body || ''),
          disasterType,
          location,
        });
      }

      console.log(`ReliefWeb: ${articles.length} articles fetched`);
      return articles;
    } catch (error) {
      console.error('ReliefWeb fetch error:', error);
      return [];
    }
  }

  private async fetchGDACSNews(): Promise<InsertNewsArticle[]> {
    try {
      // GDACS RSS feed - parse XML to get disaster alerts
      const response = await fetch('https://www.gdacs.org/xml/rss.xml');
      
      if (!response.ok) {
        throw new Error(`GDACS API error: ${response.status}`);
      }

      const xmlText = await response.text();
      const articles: InsertNewsArticle[] = [];
      
      // Simple XML parsing for RSS items
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of items.slice(0, 10)) {
        const title = this.extractXMLValue(item, 'title') || '';
        const description = this.extractXMLValue(item, 'description') || '';
        const link = this.extractXMLValue(item, 'link') || '';
        const pubDate = this.extractXMLValue(item, 'pubDate') || '';
        
        if (!title || !link) continue;
        
        const disasterType = this.extractDisasterType(title + ' ' + description);
        const location = this.extractLocation(title);

        articles.push({
          title: title,
          description: description.substring(0, 300),
          content: description,
          url: link,
          source: 'GDACS',
          category: 'natural-disaster',
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
          imageUrl: null,
          relevanceScore: this.calculateRelevanceScore(title, description),
          disasterType,
          location,
        });
      }

      console.log(`GDACS: ${articles.length} articles fetched`);
      return articles;
    } catch (error) {
      console.error('GDACS fetch error:', error);
      return [];
    }
  }

  private extractXMLValue(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractDisasterType(text: string): string | null {
    const lowercaseText = text.toLowerCase();
    
    for (const keyword of this.disasterKeywords) {
      if (lowercaseText.includes(keyword)) {
        return keyword;
      }
    }
    
    return null;
  }

  private extractLocation(text: string): string | null {
    // Simple location extraction - look for country names, states, etc.
    const locationPatterns = [
      /in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:hit|struck|affected)/g
    ];
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].replace(/^in\s+|,$/g, '').trim();
      }
    }
    
    return null;
  }

  private calculateRelevanceScore(title: string, content: string): number {
    const text = (title + ' ' + content).toLowerCase();
    let score = 0;
    
    // Higher scores for more specific disaster keywords
    const highPriorityKeywords = ['earthquake', 'tsunami', 'hurricane', 'tornado', 'volcano'];
    const mediumPriorityKeywords = ['flood', 'wildfire', 'landslide', 'drought', 'cyclone'];
    
    for (const keyword of highPriorityKeywords) {
      if (text.includes(keyword)) score += 3;
    }
    
    for (const keyword of mediumPriorityKeywords) {
      if (text.includes(keyword)) score += 2;
    }
    
    // Additional scoring for urgency words
    const urgencyWords = ['emergency', 'alert', 'warning', 'urgent', 'breaking', 'severe'];
    for (const word of urgencyWords) {
      if (text.includes(word)) score += 1;
    }
    
    return Math.min(score, 10); // Cap at 10
  }

  async storeNewsArticles(articles: InsertNewsArticle[]): Promise<void> {
    try {
      for (const article of articles) {
        // Check if article already exists by URL
        const existing = await storage.getNewsArticleByUrl(article.url);
        if (!existing) {
          await storage.createNewsArticle(article);
        }
      }
      console.log(`Stored ${articles.length} news articles in database`);
    } catch (error) {
      console.error('Error storing news articles:', error);
    }
  }

  async refreshNews(): Promise<{ count: number; articles: InsertNewsArticle[] }> {
    try {
      const articles = await this.fetchDisasterNews();
      await this.storeNewsArticles(articles);
      
      return {
        count: articles.length,
        articles
      };
    } catch (error) {
      console.error('Error refreshing news:', error);
      return { count: 0, articles: [] };
    }
  }
}

export const disasterNewsService = new NaturalDisasterNewsService();