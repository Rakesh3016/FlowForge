# FlowForge — interactive 7×7 prototype

An HTML/JavaScript playtest of the opposite-edge water-vs-fire pipe game. Blue starts on the bottom, Orange on the top. Each side has six generators and must connect to the opponent's central jar to win.

## Play
Open [index.html](index.html) in a browser.

## Source layout
- `src/index.html`: board, rules, controls and match history.
- `src/ai.js`: AI V4 strategy, independent of the game UI.
- `build.py`: creates a self-contained root `index.html` by inlining AI code.

To modify gameplay, edit `src/index.html`. To tune AI, edit `src/ai.js`. Then run `python build.py` and commit the resulting `index.html` alongside the source changes.

## Match logs
The game has a Match Log panel with export and copy options. Up to 30 sessions are saved in browser local storage when available. Browser logs are *not* automatically shared with ChatGPT.

## GitHub Pages
Settings → Pages → Deploy from a branch → `main` → `/ (root)`. The repository is currently private; GitHub Pages availability on private repositories depends on the GitHub plan and repository settings.
