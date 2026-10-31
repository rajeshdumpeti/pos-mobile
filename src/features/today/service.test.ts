import { createHttpClient } from '@/api';
import { createPlanningService } from './service';
import { itemFixture, todayFixture, itemId } from './testFixtures';
import { contractMetadata } from '@/api/contract/contractMetadata';
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': 'safe-response' },
  });
test('all five operations use reviewed authenticated transport and exact versions', async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce(response(todayFixture()))
    .mockResolvedValueOnce(response(itemFixture(), 201))
    .mockImplementation(async () => response(itemFixture()));
  const service = createPlanningService(
    createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl: fetcher }),
  );
  const body = {
    title: 'Test',
    scheduled_for_date: '2026-10-02',
    timezone: 'America/New_York',
    is_priority: false,
  };
  await service.today('access', 'America/New_York');
  await service.create('access', body, 'plan-test');
  await service.get('access', itemId);
  await service.update('access', itemId, { expected_version: 1, title: 'Updated' });
  await service.complete('access', itemId, 2);
  expect(fetcher.mock.calls[0]?.[0]).toBe(
    'https://api.example.test/api/v1/today?timezone=America%2FNew_York',
  );
  expect(fetcher.mock.calls[1]?.[1].headers).toMatchObject({
    Authorization: 'Bearer access',
    'Idempotency-Key': 'plan-test',
  });
  expect(JSON.parse(fetcher.mock.calls[4]?.[1].body)).toEqual({ expected_version: 2 });
  expect(contractMetadata.backendCommit).toBe('98b9124cb26e179a3a001fab47981d0eeaf581db');
  expect(contractMetadata.todayContractVersion).toBe('1.0');
});
test('successful but invalid body never reaches presentation state', async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValue(response({ ...todayFixture(), score: { percentage: 84 } }));
  const service = createPlanningService(
    createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl: fetcher }),
  );
  await expect(service.today('access', 'UTC')).rejects.toMatchObject({
    category: 'invalidResponse',
  });
});
