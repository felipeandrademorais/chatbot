# API Deprecation Policy

This policy applies to all versioned endpoints under `/api/v{major}`.

## Compatibility Rules

- Minor releases (`v1.x`) are backward compatible.
- Breaking changes require a new major path (`/api/v2`) and updated OpenAPI file.
- Existing fields are never removed in the same major version.
- New required request fields are forbidden in the same major version.

## Deprecation Process

1. Mark the endpoint or field as deprecated in OpenAPI.
2. Keep behavior unchanged for at least one full minor release.
3. Document migration guidance in release notes and PR description.
4. Remove only in the next major version.
