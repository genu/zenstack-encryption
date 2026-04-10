# Changelog

## [0.2.2](https://github.com/genu/zenstack-encryption/compare/v0.2.1...v0.2.2) (2026-04-09)


### Bug Fixes

* **ci:** update prepare-release workflow for PR-based flow ([#49](https://github.com/genu/zenstack-encryption/issues/49)) ([9e3a6a9](https://github.com/genu/zenstack-encryption/commit/9e3a6a9ebe1957deafeeb29fddfcc44c839f57b1)), closes [#48](https://github.com/genu/zenstack-encryption/issues/48)

## [0.2.1](https://github.com/genu/zenstack-encryption/compare/v0.2.0...v0.2.1) (2026-03-06)


### Features

* add manual prepare-release workflow using reusable action ([#28](https://github.com/genu/zenstack-encryption/issues/28)) ([ced9c71](https://github.com/genu/zenstack-encryption/commit/ced9c7129da7a7ce26dcddd67df79fc4448504d2))


### Bug Fixes

* remove skip condition for release-please branches in CI ([#30](https://github.com/genu/zenstack-encryption/issues/30)) ([08beb55](https://github.com/genu/zenstack-encryption/commit/08beb553179cf188be7c01192d4ce12bdadf2b56))
* use PAT for release-please to trigger CI on release PRs ([#31](https://github.com/genu/zenstack-encryption/issues/31)) ([5e114bc](https://github.com/genu/zenstack-encryption/commit/5e114bca401bc5be3be4d4e41a2d3decd6a706fe))

## [0.2.0](https://github.com/genu/zenstack-encryption/compare/v0.1.3...v0.2.0) (2026-02-08)


### ⚠ BREAKING CHANGES

* rename API to encryption() with key/previousKeys

### Features

* rename API to encryption() with key/previousKeys ([5a8309f](https://github.com/genu/zenstack-encryption/commit/5a8309fb9c38ae7586c1b833fdbd7b71204fbe0c))

## [0.1.3](https://github.com/genu/zenstack-encryption/compare/v0.1.2...v0.1.3) (2026-02-08)


### Bug Fixes

* improve error handling in _decrypt function ([c7aa95f](https://github.com/genu/zenstack-encryption/commit/c7aa95f3bde0a4811d88ba93ea81b8db8d6e0684))
* update ESLint config and improve type handling in encryption tests ([5a87cdc](https://github.com/genu/zenstack-encryption/commit/5a87cdc709fb1025682d10d9db627edd3dc0cf18))

## [0.1.1](https://github.com/genu/zenstack-encryption/compare/v0.1.0...v0.1.1) (2026-02-08)


### Bug Fixes

* correct branch name from 'masters' to 'master' in CI workflow ([08310f4](https://github.com/genu/zenstack-encryption/commit/08310f4f394f44ccf20d3e323b8a8a5351a8a454))
* downgrade typescript version to 5.8.3 ([b5b887d](https://github.com/genu/zenstack-encryption/commit/b5b887d3f2a96b8cbcfed41e414e51e5102d6479))
* remove conditional check for release-please branches in CI workflow ([10e774a](https://github.com/genu/zenstack-encryption/commit/10e774ac2b75a89de71d0a2a4d444a3cff6a3a18))
* update branch names in CI and release workflows from 'main' to 'master' ([c76dd1e](https://github.com/genu/zenstack-encryption/commit/c76dd1e11c8ebf91f870230e91d0147e112ab867))
* update semantic commit type to chore in renovate configuration ([c89be76](https://github.com/genu/zenstack-encryption/commit/c89be7657ccf001c66240adfcdc04d3ac242cafe))


### Dependencies

* **deps:** update dependency @zenstackhq/orm to v3.3.3 ([#1](https://github.com/genu/zenstack-encryption/issues/1)) ([0b3a5ff](https://github.com/genu/zenstack-encryption/commit/0b3a5fffc84a7b7edd38355d8bcca7870231aabe))
* **deps:** update dependency eslint to v10 ([#6](https://github.com/genu/zenstack-encryption/issues/6)) ([0f7013e](https://github.com/genu/zenstack-encryption/commit/0f7013e199f63bba26218a02d2c759c4f24fd66c))
* **deps:** update dependency vitest to v4 ([#7](https://github.com/genu/zenstack-encryption/issues/7)) ([b00b101](https://github.com/genu/zenstack-encryption/commit/b00b10162954688a5e7f864d7216cbc0f09dc85e))
