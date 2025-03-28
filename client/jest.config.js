module.exports = {
  // The root directory that Jest should scan for tests and modules
  rootDir: '.',
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  
  // An array of regexp pattern strings that are matched against all source file paths
  // before re-running tests in watch mode
  watchPathIgnorePatterns: ['/node_modules/', '/build/'],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    'index.js',
    'reportWebVitals.js',
    'setupTests.js'
  ],
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  
  // The threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/context/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/utils/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // A map from regular expressions to module names or to arrays of module names
  // that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '\\.(css|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // A list of paths to modules that run some code to configure or set up the testing framework
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // An array of regexp pattern strings that are matched against all modules
  // before the module loader will automatically return a mock for them
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library|leaflet|react-leaflet)/)'
  ],
  
  // Generate a badge for the coverage
  reporters: [
    'default',
    [
      'jest-coverage-badges',
      {
        coverage: {
          global: {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
          }
        }
      }
    ]
  ]
};
