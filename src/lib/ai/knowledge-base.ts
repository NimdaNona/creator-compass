import { generateEmbedding } from './openai-service';
import fs from 'fs/promises';
import path from 'path';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  chunks: DocumentChunk[];
  metadata: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    section?: string;
    subsection?: string;
    platform?: string;
    niche?: string;
    difficulty?: string;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: KnowledgeDocument;
}

class KnowledgeBase {
  private documents: Map<string, KnowledgeDocument> = new Map();
  private chunks: DocumentChunk[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('Initializing knowledge base...');
    await this.loadDocuments();
    this.initialized = true;
    console.log(`Knowledge base initialized with ${this.documents.size} documents and ${this.chunks.length} chunks`);
  }

  private async loadDocuments() {
    // Try multiple possible document locations
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'lib', 'ai', 'knowledge-base'),
      path.join(process.cwd(), '..', 'Docs'),
      path.join(process.cwd(), 'knowledge-base'),
    ];
    
    let docsPath = '';
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        docsPath = possiblePath;
        console.log(`Found knowledge base documents at: ${docsPath}`);
        break;
      } catch {
        // Path doesn't exist, try next
      }
    }

    // If no external docs found, use built-in guides
    if (!docsPath) {
      console.log('Using built-in knowledge base guides');
      docsPath = path.join(process.cwd(), 'src', 'lib', 'ai', 'knowledge-base');
    }
    
    // Use built-in guides if external documents not found
    const documentFiles = [
      { filename: 'youtube-guide.md', category: 'youtube' },
      { filename: 'tiktok-guide.md', category: 'tiktok' },
      { filename: 'twitch-guide.md', category: 'twitch' },
    ];

    // Try to load external documents first
    const externalDocs = [
      { filename: 'Technical Setup Guides.md', category: 'setup' },
      { filename: 'Bio and Channel Optimization.md', category: 'optimization' },
      { filename: 'Content Idea Generators.md', category: 'content-ideas' },
      { filename: 'YouTube Playbook.md', category: 'youtube' },
      { filename: 'TikTok Playbook.md', category: 'tiktok' },
      { filename: 'Twitch Playbook.md', category: 'twitch' },
      { filename: 'Analytics and Performance.md', category: 'analytics' },
      { filename: 'Monetization Strategies.md', category: 'monetization' },
      { filename: 'Community Engagement.md', category: 'engagement' },
      { filename: 'Cross-Platform Growth.md', category: 'cross-platform' },
      { filename: 'Content Calendar Templates.md', category: 'planning' },
      { filename: 'Trending Topics Analysis.md', category: 'trends' },
    ];

    // Load built-in guides first
    for (const { filename, category } of documentFiles) {
      try {
        const filePath = path.join(docsPath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        
        const doc: KnowledgeDocument = {
          id: filename.replace('.md', '').toLowerCase().replace(/\s+/g, '-'),
          title: filename.replace('.md', ''),
          content,
          category,
          chunks: [],
          metadata: { filename, category },
        };

        // Process and chunk the document
        doc.chunks = await this.chunkDocument(doc);
        this.documents.set(doc.id, doc);
        this.chunks.push(...doc.chunks);
      } catch (error) {
        console.error(`Failed to load document ${filename}:`, error);
      }
    }

    // Try to load external documents if they exist
    for (const { filename, category } of externalDocs) {
      try {
        const filePath = path.join(docsPath.replace('knowledge-base', ''), '..', 'Docs', filename);
        const content = await fs.readFile(filePath, 'utf-8');
        
        const doc: KnowledgeDocument = {
          id: filename.replace('.md', '').toLowerCase().replace(/\s+/g, '-'),
          title: filename.replace('.md', ''),
          content,
          category,
          chunks: [],
          metadata: { filename, category },
        };

        // Process and chunk the document
        doc.chunks = await this.chunkDocument(doc);
        this.documents.set(doc.id, doc);
        this.chunks.push(...doc.chunks);
      } catch (error) {
        // External documents are optional, so we don't log errors
      }
    }
  }

  private async chunkDocument(doc: KnowledgeDocument): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const sections = doc.content.split(/^#{1,3}\s+/m);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;

      // Extract section title and content
      const lines = section.split('\n');
      const sectionTitle = lines[0]?.trim() || '';
      const sectionContent = lines.slice(1).join('\n').trim();

      // Further chunk by paragraphs if section is too large
      const paragraphs = sectionContent.split('\n\n');
      const maxChunkSize = 1000; // characters
      
      let currentChunk = '';
      let chunkIndex = 0;

      for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk) {
          // Save current chunk
          chunks.push({
            id: `${doc.id}-${i}-${chunkIndex}`,
            documentId: doc.id,
            content: currentChunk.trim(),
            metadata: {
              section: sectionTitle,
              platform: this.extractPlatform(currentChunk),
              niche: this.extractNiche(currentChunk),
              difficulty: this.extractDifficulty(currentChunk),
            },
          });
          currentChunk = paragraph;
          chunkIndex++;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
      }

      // Save last chunk
      if (currentChunk) {
        chunks.push({
          id: `${doc.id}-${i}-${chunkIndex}`,
          documentId: doc.id,
          content: currentChunk.trim(),
          metadata: {
            section: sectionTitle,
            platform: this.extractPlatform(currentChunk),
            niche: this.extractNiche(currentChunk),
            difficulty: this.extractDifficulty(currentChunk),
          },
        });
      }
    }

    return chunks;
  }

  private extractPlatform(content: string): string | undefined {
    const platforms = ['youtube', 'tiktok', 'twitch'];
    const lowercaseContent = content.toLowerCase();
    
    for (const platform of platforms) {
      if (lowercaseContent.includes(platform)) {
        return platform;
      }
    }
    return undefined;
  }

  private extractNiche(content: string): string | undefined {
    const niches = ['gaming', 'beauty', 'tech', 'education', 'entertainment', 'lifestyle', 'fitness', 'cooking'];
    const lowercaseContent = content.toLowerCase();
    
    for (const niche of niches) {
      if (lowercaseContent.includes(niche)) {
        return niche;
      }
    }
    return undefined;
  }

  private extractDifficulty(content: string): string | undefined {
    const difficulties = ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'];
    const lowercaseContent = content.toLowerCase();
    
    for (const difficulty of difficulties) {
      if (lowercaseContent.includes(difficulty)) {
        return difficulty;
      }
    }
    return undefined;
  }

  async searchSemantic(query: string, options?: {
    category?: string;
    platform?: string;
    niche?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    await this.initialize();

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Filter chunks based on options
    let relevantChunks = this.chunks;
    
    if (options?.category) {
      relevantChunks = relevantChunks.filter(chunk => {
        const doc = this.documents.get(chunk.documentId);
        return doc?.category === options.category;
      });
    }

    if (options?.platform) {
      relevantChunks = relevantChunks.filter(chunk => 
        chunk.metadata.platform === options.platform
      );
    }

    if (options?.niche) {
      relevantChunks = relevantChunks.filter(chunk => 
        chunk.metadata.niche === options.niche
      );
    }

    // Calculate similarity scores
    const results: SearchResult[] = [];
    
    for (const chunk of relevantChunks) {
      // Generate embedding if not cached
      if (!chunk.embedding) {
        chunk.embedding = await generateEmbedding(chunk.content);
      }

      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      const document = this.documents.get(chunk.documentId)!;
      
      results.push({ chunk, score, document });
    }

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options?.limit || 10);
  }

  async searchKeyword(query: string, options?: {
    category?: string;
    platform?: string;
    niche?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    await this.initialize();

    const keywords = query.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    // Filter chunks based on options
    let relevantChunks = this.chunks;
    
    if (options?.category) {
      relevantChunks = relevantChunks.filter(chunk => {
        const doc = this.documents.get(chunk.documentId);
        return doc?.category === options.category;
      });
    }

    if (options?.platform) {
      relevantChunks = relevantChunks.filter(chunk => 
        chunk.metadata.platform === options.platform
      );
    }

    if (options?.niche) {
      relevantChunks = relevantChunks.filter(chunk => 
        chunk.metadata.niche === options.niche
      );
    }

    // Score chunks based on keyword matches
    for (const chunk of relevantChunks) {
      const content = chunk.content.toLowerCase();
      let score = 0;

      for (const keyword of keywords) {
        const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
        score += matches;
      }

      if (score > 0) {
        const document = this.documents.get(chunk.documentId)!;
        results.push({ chunk, score, document });
      }
    }

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options?.limit || 10);
  }

  async getRelevantContext(query: string, options?: {
    category?: string;
    platform?: string;
    niche?: string;
    maxTokens?: number;
  }): Promise<string> {
    const searchResults = await this.searchSemantic(query, {
      ...options,
      limit: 5,
    });

    let context = '';
    const maxTokens = options?.maxTokens || 2000;
    const estimatedTokensPerChar = 0.25; // Rough estimate

    for (const result of searchResults) {
      const chunk = result.chunk;
      const doc = result.document;
      
      const chunkContext = `\n\n## From: ${doc.title}\n${chunk.metadata.section ? `### ${chunk.metadata.section}\n` : ''}${chunk.content}`;
      
      const estimatedTokens = chunkContext.length * estimatedTokensPerChar;
      if (context.length * estimatedTokensPerChar + estimatedTokens > maxTokens) {
        break;
      }

      context += chunkContext;
    }

    return context.trim();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  getDocument(documentId: string): KnowledgeDocument | undefined {
    return this.documents.get(documentId);
  }

  getAllDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values());
  }

  getDocumentsByCategory(category: string): KnowledgeDocument[] {
    return Array.from(this.documents.values()).filter(doc => doc.category === category);
  }
}

// Export singleton instance
export const knowledgeBase = new KnowledgeBase();