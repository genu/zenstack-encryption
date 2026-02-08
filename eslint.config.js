import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { ignores: ['dist/'] },
    ...tseslint.configs.recommended,
];
