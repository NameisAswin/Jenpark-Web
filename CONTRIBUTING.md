# Contributing to JenPark Web

## Branch Naming

| Type      | Pattern              | Example                    |
| --------- | -------------------- | -------------------------- |
| Feature   | `feature/<module>`   | `feature/vehicle-list`     |
| Bugfix    | `bugfix/<module>`    | `bugfix/login-redirect`    |
| Hotfix    | `hotfix/<issue>`     | `hotfix/cors-preview`      |
| Docs      | `docs/<topic>`       | `docs/setup`               |
| Refactor  | `refactor/<module>`  | `refactor/auth-slice`      |

## Commit Convention (Conventional Commits)

```
<type>(<scope>): <short summary>
```

| Type        | Use for                          |
| ----------- | -------------------------------- |
| `feat:`     | New feature                      |
| `fix:`      | Bug fix                          |
| `docs:`     | Documentation                    |
| `refactor:` | Code restructuring               |
| `test:`     | Tests                            |
| `chore:`    | Tooling/deps                     |

## Pull Request Process

1. Rebase your branch on the latest `main`.
2. `npm run lint` and `npm run build` must pass.
3. Update README for any new env var or route.
4. Open PR against `main`. Title follows Conventional Commits.
5. Attach screenshots/GIFs for UI changes.
6. At least one approval required. Squash-merge. Delete branch.

## Code Review Expectations

- Pages remain routed components; reuse goes into `components/`.
- API access only via `services/`.
- No new global state without a Redux slice.
- Theme tokens over hard-coded colors.
