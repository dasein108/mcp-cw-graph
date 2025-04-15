import { pipeline } from '@huggingface/transformers';

export interface ProgressState {
  status: string;
  message: string;
  progress?: number;
  done?: boolean;
}

export class EmbeddingService {
  private pipe: any = null;
  private modelName: string = 'sentence-transformers/all-MiniLM-L6-v2';

  constructor(private progressCallback?: (state: ProgressState) => void) {}

  async initialize(): Promise<void> {
    try {
      this.progressCallback?.({
        status: 'loading',
        message: `Loading model ${this.modelName}`,
        progress: 0,
        done: false,
      });

      // Track download progress
      let downloadProgress = 0;
      const onProgress = (progress: any) => {
        if (progress.status === 'downloading') {
          downloadProgress = progress.loaded / progress.total;
          this.progressCallback?.({
            status: 'downloading',
            message: `Downloading model ${this.modelName} - ${Math.round(downloadProgress * 100)}%`,
            progress: downloadProgress * 0.5, // First half of progress is download
            done: false,
          });
        } else if (progress.status === 'loading') {
          this.progressCallback?.({
            status: 'loading',
            message: `Loading model ${this.modelName} into memory`,
            progress: 0.5 + downloadProgress * 0.5, // Second half is loading
            done: false,
          });
        }
      };

      this.pipe = await pipeline('feature-extraction', this.modelName, {
        progress_callback: onProgress,
      });

      this.progressCallback?.({
        status: 'ready',
        message: `Model ${this.modelName} loaded successfully`,
        progress: 1,
        done: true,
      });
    } catch (error) {
      this.progressCallback?.({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        progress: 0,
        done: true,
      });
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<Float32Array> {
    if (!this.pipe) {
      throw new Error('EmbeddingService not initialized');
    }

    const output = await this.pipe(text, {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = output.data;
    return embedding;
  }

  calculateCosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
