/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '..',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        '<rootDir>/src/azureConnectors/**/*.ts',
    ],
    coverageThreshold: {
        global: {
            statements: 95,
            branches: 95,
            functions: 95,
            lines: 95,
        },
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
    },

};
