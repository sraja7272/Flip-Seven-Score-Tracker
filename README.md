# Flip Seven Score Tracker

A browser-based score tracker for the **Flip Seven** card game. No server required — everything runs in your browser and persists in `localStorage`.

## Features

- Landing page with quick-rules overview (only shown on first visit)
- Add 2–10 players before a game starts
- Enter each player's round score after every round
- Live leaderboard with this-round and cumulative scores
- Automatic winner detection when any player hits 200+ (highest score above 200 wins if multiple players cross in the same round)
- Confetti celebration on game over
- State survives page refresh / browser close via `localStorage`
- "New Game" button resets everything and goes straight to player setup

## How to Play

- Draw cards and collect points — duplicate number cards bust you to 0 for the round
- Collect 7 unique number cards in one round for a +15 bonus (and the round ends for everyone)
- First player to reach **200+ points** wins — if multiple players cross 200 in the same round, the highest total score wins

---

## Hosting on GitHub Pages

### One-time Setup (required)

GitHub Pages must be enabled manually in the repository settings:

1. Go to **Settings → Pages** in this repository
2. Under **Source**, select **Deploy from a branch**
3. Set the branch to **`gh-pages`** and folder to **`/ (root)`**
4. Click **Save**

After the first GitHub Actions deployment runs (triggered by any push to `main`), the site will be live at:

```
https://sraja7272.github.io/Flip-Seven-Score-Tracker/
```

### Automated Deployments (via GitHub Actions)

| Trigger | Deploys to | URL |
|---|---|---|
| Push to `main` | `gh-pages` root | https://sraja7272.github.io/Flip-Seven-Score-Tracker/ |
| Pull request opened or updated | `gh-pages/dev/` | https://sraja7272.github.io/Flip-Seven-Score-Tracker/dev/ |

The PR workflow also posts a comment on the pull request with the preview URL.

> **Note:** The `GITHUB_TOKEN` permissions required for these workflows are `contents: write` and `pull-requests: write`. These are standard GitHub-provided tokens — no extra secrets needed.
