/**
 * @jest-environment jest-environment-node-single-context
 */
import { EmbeddingService, type ProgressState } from '../embedding.service';

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let progressStates: ProgressState[] = [];

  beforeEach(() => {
    progressStates = [];
  });

  beforeAll(async () => {
    embeddingService = new EmbeddingService((state: ProgressState) => {
      progressStates.push(state);
    });
    await embeddingService.initialize();
  }, 120000);

  describe('Initialization and Progress', () => {
    it('should properly track loading progress', async () => {
      progressStates = [];
      const newService = new EmbeddingService((state: ProgressState) => {
        progressStates.push(state);
      });

      await newService.initialize();

      expect(progressStates.length).toBeGreaterThan(0);

      // Check initial state
      expect(progressStates[0]).toMatchObject({
        status: 'loading',
        message: expect.stringContaining('Loading model'),
        progress: 0,
        done: false,
      });

      // Check final state
      const finalState = progressStates[progressStates.length - 1];
      expect(finalState).toMatchObject({
        status: 'ready',
        message: expect.stringContaining('loaded successfully'),
        progress: 1,
        done: true,
      });

      // Verify progress states are in order
      let lastProgress = -1;
      progressStates.forEach((state) => {
        expect(state.progress).toBeGreaterThanOrEqual(lastProgress);
        lastProgress = state.progress || 0;
      });
    });

    it('should work without progress callback', async () => {
      const serviceWithoutCallback = new EmbeddingService();
      await expect(serviceWithoutCallback.initialize()).resolves.not.toThrow();
    });
  });

  describe('Text Embedding Generation', () => {
    it('should generate normalized embeddings', async () => {
      const embedding = await embeddingService.generateEmbedding('Hello world');

      expect(embedding).toBeInstanceOf(Float32Array);
      expect(embedding.length).toBe(384);

      const magnitude = Math.sqrt(
        embedding.reduce((sum: number, val: number) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should handle batch processing', async () => {
      const texts = ['Hello world', 'How are you?', 'Testing embeddings'];
      const embeddings = await Promise.all(
        texts.map((text) => embeddingService.generateEmbedding(text))
      );

      expect(embeddings.length).toBe(texts.length);
      embeddings.forEach((embedding: Float32Array) => {
        expect(embedding).toBeInstanceOf(Float32Array);
        expect(embedding.length).toBe(384);
      });
    });

    it('should handle edge cases', async () => {
      await expect(embeddingService.generateEmbedding('')).resolves.not.toThrow();
      await expect(
        embeddingService.generateEmbedding('Hello! @#$%^&* 世界')
      ).resolves.not.toThrow();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new EmbeddingService();
      await expect(uninitializedService.generateEmbedding('test')).rejects.toThrow(
        'EmbeddingService not initialized'
      );
    });
  });

  describe('Similarity Calculations', () => {
    it('should calculate semantic similarities correctly', async () => {
      const similar = await Promise.all([
        embeddingService.generateEmbedding('I love programming'),
        embeddingService.generateEmbedding('I enjoy coding'),
      ]);

      const different = await embeddingService.generateEmbedding('The weather is nice today');

      const similarityScore = embeddingService.calculateCosineSimilarity(similar[0], similar[1]);
      const differentScore = embeddingService.calculateCosineSimilarity(similar[0], different);

      expect(similarityScore).toBeGreaterThan(differentScore);
      expect(similarityScore).toBeGreaterThan(0.5);
    });

    it('should validate embedding dimensions', () => {
      expect(() => {
        embeddingService.calculateCosineSimilarity(
          new Float32Array([1, 2, 3]),
          new Float32Array([1, 2])
        );
      }).toThrow('Embeddings must have the same dimensions');
    });
  });
});
