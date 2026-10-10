import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from '../../src/lib/build/artifacts.ts';
import { withFeatures } from '../helpers/config.ts';

describe('buildSecurityHeaders', () => {
  it('protects static responses while allowing no form submission by default', () => {
    const headers = buildSecurityHeaders(withFeatures({}), [], []);

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Content-Security-Policy']).toContain("form-action 'none'");
    expect(headers['Content-Security-Policy']).not.toContain(
      "script-src 'unsafe-inline'",
    );
  });

  it('permits only the configured form origin', () => {
    const config = withFeatures({});
    const headers = buildSecurityHeaders(
      { ...config, formEndpoint: 'https://forms.example/submit' },
      [],
      [],
    );

    expect(headers['Content-Security-Policy']).toContain(
      'form-action https://forms.example',
    );
    expect(headers['Content-Security-Policy']).not.toContain(
      'forms.example/submit',
    );
  });

  it('uses supplied hashes instead of allowing all inline scripts', () => {
    const headers = buildSecurityHeaders(
      withFeatures({}),
      ["'sha256-scriptHash'"],
      ["'sha256-styleHash'"],
    );

    expect(headers['Content-Security-Policy']).toContain(
      "script-src 'self' 'sha256-scriptHash'",
    );
    expect(headers['Content-Security-Policy']).toContain(
      "style-src 'self' 'unsafe-inline' 'sha256-styleHash'",
    );
  });
});
