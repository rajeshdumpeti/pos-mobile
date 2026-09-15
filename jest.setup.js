jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

process.env.EXPO_PUBLIC_API_BASE_URL ??= 'http://127.0.0.1:8000';
