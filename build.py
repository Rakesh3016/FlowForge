from pathlib import Path
root = Path(__file__).resolve().parent
game = (root / "src" / "index.html").read_text(encoding="utf-8")
ai = (root / "src" / "ai.js").read_text(encoding="utf-8")
flow = (root / "src" / "flow.js").read_text(encoding="utf-8")
flow_tag = '<script src="flow.js"></script>'
assert flow_tag in game, "Missing flow module"
game = game.replace(flow_tag, '<script>\n' + flow + '\n</script>', 1)
tag = '<script src="ai.js"></script>'
assert tag in game, "AI script tag is missing from src/index.html"
(root / "index.html").write_text(game.replace(tag, '<script>\n' + ai + '\n</script>', 1), encoding="utf-8")
print("Built root index.html for GitHub Pages")
