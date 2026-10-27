# FlowForge — interactive 7×7 prototype

An HTML/JavaScript playtest of the opposite-edge water-vs-fire pipe game. Blue starts on the bottom, Orange on the top. Each side has six generators and must connect to the opponent's central jar to win.

## Play
Open [index.html](index.html) in a browser.

## Source layout
- `src/index.html`: board, rules, controls and match history.
- `src/flow.js`: water/fire flow, source connectivity, and spilling.
- `src/report.js`: turn snapshots, match review export, and optional GitHub issue sharing.
- `src/ai.js`: AI V5 strategy, independent of the game UI.
- `build.py`: creates a self-contained root `index.html` by inlining AI code.

To modify gameplay, edit `src/index.html`. To change water flow, edit `src/flow.js`. To tune AI, edit `src/ai.js`. Then run `python build.py` and commit the resulting `index.html` alongside the source changes.

## Match logs
The game has a Match Log panel with export and copy options. Up to 30 sessions are saved in browser local storage when available. Browser logs are *not* automatically shared with ChatGPT.

## GitHub Pages
Settings → Pages → Deploy from a branch → `main` → `/ (root)`. The repository is currently private; GitHub Pages availability on private repositories depends on the GitHub plan and repository settings.

## Flow rules
Water and fire spread one connected tile per owning turn. Disconnected wet pipes spill immediately; repaired networks must refill gradually before scoring resumes.

## Sharing playtest logs
The browser stores recent matches locally, including a post-turn snapshot of the pipes, wet flow, score, generator positions and AI diagnostics. After a match, click **Copy match report** and paste it in ChatGPT, or **Download match JSON** and attach it. The **Share via GitHub issue** control opens a prefilled public issue draft; submit it on GitHub and then ask ChatGPT to check the latest FlowForge issue. Leaving a browser tab open does not automatically share local match data.

## Capture-on-kill combat
Attacking an adjacent Gen1 destroys that generator and its pipe, advances the attacker into the vacated tile, and converts the tile to the attacker's pipe (initially dry). A supporting enemy generator can counterattack on the following turn. Gen2 survives one hit, downgrading to Gen1 without attacker movement. Empty enemy pipes are destroyed without attacker movement. The progressive flow and scoring rules are unchanged.

### Occupying destroyed empty pipes
Attacking and destroying an unoccupied enemy pipe now moves the attacker onto that tile and changes it to an initially dry friendly pipe. The original tile remains. Nearby enemy generators can recapture it on their next turn. Gen1 kills already work this way; a surviving Gen2 blocks advancement. Fluid movement and scoring rules are otherwise unchanged.
