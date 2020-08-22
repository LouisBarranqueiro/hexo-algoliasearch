module.exports = {
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: ['src/algolia.js'],
  coverageDirectory: 'tests_coverage',
  testEnvironment: 'node',
}
