import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import daStyle from 'eslint-config-dicodingacademy';

export default defineConfig([
  // Gunakan style guide dari Dicoding Academy terlebih dahulu
  daStyle,

  // Konfigurasi dasar ESLint untuk semua file JS
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-disable': 'off',
    },
  },

  // Untuk file .js biasa, pakai module type CommonJS
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    }
  },

  // Khusus file test (.test.js atau folder __tests__)
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  }
]);
