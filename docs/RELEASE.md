# WorthBook release process

## Locked release: v1.0.0

| Item | Value |
|------|--------|
| Git tag | `v1.0.0` |
| Hotfix branch | `release/1.0` |
| App Store marketing version | `1.0` |
| npm / in-app label | `1.0.0` / `v1.0` |

**Do not rewrite history on `v1.0.0`.** That tag is the frozen App Store 1.0 source snapshot.

### Restore the 1.0 source anytime

```bash
git fetch --tags
git checkout v1.0.0
```

### Hotfix 1.0 only (bugfix, no redesign)

```bash
git checkout release/1.0
# …fix …
# bump iOS CURRENT_PROJECT_VERSION (build) → 1.0.1 if needed
git tag -a v1.0.1 -m "WorthBook 1.0.1"
git push origin release/1.0 v1.0.1
```

Cherry-pick critical fixes into `main` when useful.

### Big redesigns / 2.0

Work on `main` (or feature branches). Ship as **2.0** (new marketing version + new App Store version). Never merge breaking redesigns into `release/1.0`.

### App Store reality

Uploading 2.0 does **not** change the already-approved 1.0 binary in Connect history. New installs/updates get the latest approved version only after you release it.
