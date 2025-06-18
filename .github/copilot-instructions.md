---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## HEADERS

## TECH STACK

## PROJECT DOCUMENTATION & CONTEXT SYSTEM

## CODING STANDARDS

## WORKFLOW & RELEASE RULES

## DEBUGGING

**Dependency Conflicts:**

When encountering npm dependency conflicts, especially `ERESOLVE` errors, follow these steps:

1.  **Identify Conflicting Packages:** Analyze the error message to understand which packages have conflicting peer dependencies.
2.  **Update Packages:** Update the identified packages to compatible versions. Ensure that the versions of ESLint and `@typescript-eslint` packages are compatible. For example, `@typescript-eslint/eslint-plugin@6.x` supports ESLint v7 or v8, while newer versions might be required for ESLint v9. Consider updating TypeScript ESLint packages to v8.x versions that support ESLint v9.
3.  **Remove Conflicting Versions:** Remove any older or conflicting versions of packages.
4.  **Update Parser:** Ensure the parser version matches the plugin version to avoid compatibility issues.
5.  **Install:** Run `npm install` after making changes to `package.json`.
6.  **Further Troubleshooting:** If issues persist, consider using `--force` or `--legacy-peer-deps` as a last resort, but be aware of potential breakage.

## REFERENCES
