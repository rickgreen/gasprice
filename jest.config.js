export default {
  testEnvironment: 'jsdom',
  transform: {},
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testMatch: ['**/tests/**/*.test.js'],
};
