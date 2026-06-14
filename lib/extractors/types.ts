export interface ExtractorResult {
  buffer: Buffer;
  ext: string;
}

export interface MediaExtractor {
  canHandle(url: string): boolean;
  extract(url: string, jobId: string): Promise<ExtractorResult>;
}
