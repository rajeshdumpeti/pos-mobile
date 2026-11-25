import { createFeatureFlagService, featureFlagKeys, parseFeatureFlags } from './featureFlags';

describe('feature flags contract', () => {
  it('accepts exactly the closed contract shape', () => {
    expect(parseFeatureFlags({ contract_version: '1.0', voice_entry: { enabled: true } })).toEqual({
      voiceEntryEnabled: true,
    });
    expect(parseFeatureFlags({ contract_version: '1.0', voice_entry: { enabled: false } })).toEqual(
      { voiceEntryEnabled: false },
    );
  });

  it.each([
    ['unknown version', { contract_version: '2.0', voice_entry: { enabled: true } }],
    ['missing voice_entry', { contract_version: '1.0' }],
    ['extra top-level field', { contract_version: '1.0', voice_entry: { enabled: true }, x: 1 }],
    ['extra nested field', { contract_version: '1.0', voice_entry: { enabled: true, mode: 'on' } }],
    ['string enabled', { contract_version: '1.0', voice_entry: { enabled: 'true' } }],
    ['null enabled', { contract_version: '1.0', voice_entry: { enabled: null } }],
    ['not an object', 'on'],
    ['null', null],
  ])('rejects %s so voice stays off', (_name, value) => {
    expect(() => parseFeatureFlags(value)).toThrow();
  });

  it('requests GET /api/v1/features with the credential', async () => {
    const request = jest.fn().mockResolvedValue({
      contract_version: '1.0',
      voice_entry: { enabled: true },
    });
    const result = await createFeatureFlagService(request as never).get('token');
    expect(result.voiceEntryEnabled).toBe(true);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/features',
        method: 'GET',
        credential: 'token',
        expectedStatuses: [200],
      }),
    );
  });

  it('scopes the query key to the account under the planning root', () => {
    expect(featureFlagKeys.account('a')).toEqual(['daily-planning', 'a', 'features']);
    expect(featureFlagKeys.account('a')).not.toEqual(featureFlagKeys.account('b'));
  });
});
