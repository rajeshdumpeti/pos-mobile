import fs from 'node:fs';
import path from 'node:path';
const root = __dirname;
const source = fs
  .readdirSync(root)
  .filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes('.test.'))
  .map((name) => fs.readFileSync(path.join(root, name), 'utf8'))
  .join('\n');
test('onboarding has no provider, permission, routine, persistence, analytics, logging, or animation capability', () => {
  expect(source).not.toMatch(
    /HealthKit|HealthConnect|requestPermissions|scheduleNotification|Calendar\.request|Reminders|Wearable|RoutineService|AsyncStorage|SecureStore|analytics|console\.(log|info|warn|error)|Animated\.|react-native-reanimated/,
  );
});
test('onboarding route and query identifiers contain no user values', () => {
  expect(source).not.toMatch(
    /useLocalSearchParams|router\.(push|replace)\([^)]*(goal|priority|currency|unit)|queryKey[^\n]*(account|goal|priority|currency|unit)/,
  );
});
