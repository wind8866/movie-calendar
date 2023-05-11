// https://github.com/kulshekhar/ts-jest/blob/main/examples/type-module/jest-esm.config.js
import preset from 'ts-jest/presets/index.js'

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  ...preset.defaultsESM,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
        useESM: true,
      },
    ],
  },
}

export default jestConfig
