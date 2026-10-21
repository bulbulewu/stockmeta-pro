import { describe, it, expect } from 'vitest';
import { SEOConfig } from '../types/stock';

describe('Multi-Key Pool and Multi-Provider Logic', () => {
  it('correctly parses multiple keys separated by newlines, commas, and semicolons', () => {
    const rawInput = 'AIzaSyKey1_123456789\nAIzaSyKey2_987654321, AIzaSyKey3_abcdefghi; AIzaSyKey4_jklmnopqr';
    const keys = rawInput
      .split(/[\r\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);

    expect(keys).toHaveLength(4);
    expect(keys[0]).toBe('AIzaSyKey1_123456789');
    expect(keys[1]).toBe('AIzaSyKey2_987654321');
    expect(keys[2]).toBe('AIzaSyKey3_abcdefghi');
    expect(keys[3]).toBe('AIzaSyKey4_jklmnopqr');
  });

  it('filters out empty or too-short keys', () => {
    const rawInput = 'key1_123456789\n\n  \n,;123';
    const keys = rawInput
      .split(/[\r\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);

    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe('key1_123456789');
  });

  it('supports Groq and OpenRouter in SEOConfig', () => {
    const groqConfig: SEOConfig = {
      orderKeywordsByWeight: true,
      autoAppendFormatTags: true,
      negativeKeywordsFilter: true,
      customNegativeKeywords: [],
      keywordTargetCount: 40,
      titleStyle: 'commercial',
      temperature: 0.2,
      selectedModel: 'llama-3.2-11b-vision-preview',
      aiProvider: 'groq',
    };

    expect(groqConfig.aiProvider).toBe('groq');
    expect(groqConfig.selectedModel).toBe('llama-3.2-11b-vision-preview');

    const openRouterConfig: SEOConfig = {
      ...groqConfig,
      aiProvider: 'openrouter',
      selectedModel: 'google/gemini-2.0-flash-exp:free',
    };

    expect(openRouterConfig.aiProvider).toBe('openrouter');
  });

  it('correctly auto-detects and classifies mixed provider keys', () => {
    const mixedInput = `
      AIzaSyD_ExampleGeminiKey123456789
      AQ.ExampleMockGeminiKeyToken1234567890abc
      gsk_fHcBEkr7ExampleGroqKey123456789
      sk-or-v1-dfa5ExampleOpenRouterKey123456789
    `;

    const tokens = mixedInput
      .split(/[\r\n,\s;]+/)
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter((t) => t.length > 5);

    const gemini: string[] = [];
    const groq: string[] = [];
    const openrouter: string[] = [];

    for (const token of tokens) {
      if (token.startsWith('gsk_')) {
        groq.push(token);
      } else if (token.startsWith('sk-or-')) {
        openrouter.push(token);
      } else if (token.startsWith('AIzaSy') || token.startsWith('AQ.')) {
        gemini.push(token);
      }
    }

    expect(gemini).toHaveLength(2);
    expect(gemini[0]).toBe('AIzaSyD_ExampleGeminiKey123456789');
    expect(gemini[1]).toBe('AQ.ExampleMockGeminiKeyToken1234567890abc');
    expect(groq).toHaveLength(1);
    expect(groq[0]).toBe('gsk_fHcBEkr7ExampleGroqKey123456789');
    expect(openrouter).toHaveLength(1);
    expect(openrouter[0]).toBe('sk-or-v1-dfa5ExampleOpenRouterKey123456789');
  });
});
