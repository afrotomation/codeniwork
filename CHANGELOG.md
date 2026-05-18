## [1.8.1](https://git.afrotomation.com/afrotomation/codeniwork/compare/v1.8.0...v1.8.1) (2026-05-18)

### Bug Fixes

* **docker:** add migrate-Job support to runner stage ([49d0d0b](https://git.afrotomation.com/afrotomation/codeniwork/commit/49d0d0b784a2367d1bfd91926f25e56003d7b033)), closes [#37](https://git.afrotomation.com/afrotomation/codeniwork/issues/37)
* **docker:** migrate base images from public.ecr.aws to mirror.gcr.io ([b67e788](https://git.afrotomation.com/afrotomation/codeniwork/commit/b67e7886dfc139236e19ed59ca1c84cc07d7f097))
* **docker:** Switch base images to public.ecr.aws (no Docker Hub rate limit) ([4c0e986](https://git.afrotomation.com/afrotomation/codeniwork/commit/4c0e9863e8f251046ae340bb9c480f89ef93fba3))

## [1.8.0](https://github.com/codenificient/codeniwork/compare/v1.7.0...v1.8.0) (2026-04-25)

### Features

* **migrate:** add standalone migration script for ArgoCD PreSync Job ([2d6a899](https://github.com/codenificient/codeniwork/commit/2d6a89923c2d8b67af6ce824a21140565bfffe4b))

### Bug Fixes

* **db:** switch from Neon HTTP driver to pg (node-postgres) for CNPG ([b3fe67a](https://github.com/codenificient/codeniwork/commit/b3fe67ab5c0d66c639765001ba2bace0d6a9ceff))

## [1.7.0](https://github.com/codenificient/codeniwork/compare/v1.6.0...v1.7.0) (2026-04-15)

### Features

* Coolify deployment setup ([1704d1b](https://github.com/codenificient/codeniwork/commit/1704d1bdf9ce2c0e39f0615603f3a50e68671b9b))

## [1.6.0](https://github.com/codenificient/codeniwork/compare/v1.5.0...v1.6.0) (2026-04-03)

### Features

* add AI resume parser, job scoring, cover letter generator ([3ecded7](https://github.com/codenificient/codeniwork/commit/3ecded774942d35a0c97aec441cc2bb05d2ef4f0))

### Bug Fixes

* remove openai package (using ada Ollama proxy instead) ([3f1605e](https://github.com/codenificient/codeniwork/commit/3f1605ebfd7e2b46af6d6fc088ad31ed289b7588))
* replace OpenAI with Ada Ollama proxy (ingest.afrotomation.com/ai/chat) ([2c7d30b](https://github.com/codenificient/codeniwork/commit/2c7d30b35125f35ddb51465216e74d91b7232b3b))

## [1.5.0](https://github.com/codenificient/codeniwork/compare/v1.4.0...v1.5.0) (2026-04-03)

### Features

* add job board API integration with discover page ([d0e52ea](https://github.com/codenificient/codeniwork/commit/d0e52ea4a8ecf6b5f0acb69b02bd158f987fbf82))
* upgrade analytics SDK v2.0 — ClickHouse + Web Vitals + error tracking ([1316768](https://github.com/codenificient/codeniwork/commit/1316768ff7bcd6a4b240d88f8eedb673ed2cddd0))

### Bug Fixes

* proxy Umami analytics through app domain to bypass adblockers ([2b78c07](https://github.com/codenificient/codeniwork/commit/2b78c07b87f4b1c36c11957af0e58a105b90a5b2))
* set per-project analytics API key for codenalytics telemetry ([52c73a8](https://github.com/codenificient/codeniwork/commit/52c73a84f654753c857802f522d3889f0e8f4d2f))
* stabilize app with error boundaries, auth scoping, and build fixes ([569cf8b](https://github.com/codenificient/codeniwork/commit/569cf8bf3d0b28820447aaedb91717fa6bd1df5d))
* update analytics endpoint to codenalytics.vercel.app ([6e554f1](https://github.com/codenificient/codeniwork/commit/6e554f1325037196a81f510ac6cd310a62931c5b))

## [1.4.0](https://github.com/codenificient/codeniwork/compare/v1.3.1...v1.4.0) (2026-03-16)

### Features

* add Umami analytics tracking ([0cfe25f](https://github.com/codenificient/codeniwork/commit/0cfe25f3c94d5deb11c77780884af967af52efce))

## [1.3.1](https://github.com/codenificient/codeniwork/compare/v1.3.0...v1.3.1) (2026-02-09)

### Bug Fixes

* correct microlink screenshot URL params for reliable preview ([9b8c69d](https://github.com/codenificient/codeniwork/commit/9b8c69da4eb79f7f21ca6f4089f353f314fce95d))

## [1.3.0](https://github.com/codenificient/codeniwork/compare/v1.2.1...v1.3.0) (2026-02-08)

### Features

* upgrade 12 dependencies including Tailwind 4, Zod 4, ESLint 10 ([7c8fbec](https://github.com/codenificient/codeniwork/commit/7c8fbec1d5868aed35cebf89cbc6a6d28b2d3213))

## [1.2.1](https://github.com/codenificient/codeniwork/compare/v1.2.0...v1.2.1) (2026-02-08)

### Bug Fixes

* patch lodash vulnerability, migrate middleware to proxy, update browserslist ([27b220a](https://github.com/codenificient/codeniwork/commit/27b220a4f3eaf84a9fd85be85410c879486f5c0a))

## [1.2.0](https://github.com/codenificient/codeniwork/compare/v1.1.0...v1.2.0) (2026-02-08)

### Features

* complete glass-morphism visual overhaul across 34 files ([701e30f](https://github.com/codenificient/codeniwork/commit/701e30fc2a7d77c791aafc559026d5b9f8570e6f))

## [1.1.0](https://github.com/codenificient/codeniwork/compare/v1.0.0...v1.1.0) (2026-02-08)

### Features

* upgrade to Next.js 16, React 19, and ESLint flat config ([0b92f17](https://github.com/codenificient/codeniwork/commit/0b92f17d07b6007d0d8b12285f68bf58e3393b68))

## 1.0.0 (2026-02-08)

### Features

* Add automatic rejection for job applications older than 21 days ([91cb1c7](https://github.com/codenificient/codeniwork/commit/91cb1c7f64a21aa1b7bab4e6cb13a1fd6d7680c8))
* add telemetry SDK and semantic-release automation ([e630cde](https://github.com/codenificient/codeniwork/commit/e630cde78c29887d95112b0d0aaf0328dc4a9f73))

# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
