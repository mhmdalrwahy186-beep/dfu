#!/usr/bin/env python3
"""Verify the residential design skill set listed in skills-manifest.json.

    python3 -I .claude/skills/residential-design-studio/scripts/verify_skills.py [--json]

Checks each skill's SKILL.md frontmatter, the files its SKILL.md links to, and the syntax of its
Python and JavaScript files (compiled in memory; nothing third-party is executed). Then reports
which local tools are present. Exit code 1 if a skill is missing or broken.
Standard library only.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
SKILLS = HERE.parent
PROJECT = SKILLS.parent.parent


def frontmatter(text: str) -> dict:
    """Minimal YAML frontmatter reader: plain, quoted, and > or | block scalars."""
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end < 0:
        return {}
    meta, key, block = {}, None, []
    for line in text[3:end].splitlines():
        if key and (line.startswith((" ", "\t")) or not line.strip()):
            block.append(line.strip())
            continue
        if key:
            meta[key] = " ".join(b for b in block if b).strip()
            key, block = None, []
        m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip()
        if v in (">", ">-", "|", "|-", ">+", "|+"):
            key = k
        else:
            meta[k] = v.strip("'\"")
    if key:
        meta[key] = " ".join(b for b in block if b).strip()
    return meta


def linked_files(skill_dir: Path, text: str) -> list[str]:
    """Relative files named in Markdown links or as `references/...` paths that do not exist."""
    missing = set()
    candidates = re.findall(r"\]\(([^)#\s]+)\)", text)
    candidates += re.findall(r"`((?:\.\./)?(?:references|assets|scripts|templates)/[A-Za-z0-9_./-]+\.[a-z]{2,5})`", text)
    for c in candidates:
        if "://" in c or c.startswith(("/", "mailto:", "<")):
            continue
        if not (skill_dir / c).exists():
            missing.add(c)
    return sorted(missing)


def syntax(skill_dir: Path, node: str | None) -> list[str]:
    errors = []
    for f in sorted(skill_dir.rglob("*")):
        if "node_modules" in f.parts or not f.is_file():
            continue
        if f.suffix == ".py":
            try:
                compile(f.read_text(encoding="utf-8"), str(f), "exec")
            except (SyntaxError, UnicodeDecodeError) as e:
                errors.append(f"{f.relative_to(skill_dir)}: {e}")
        elif f.suffix in (".mjs", ".js") and node and f.stat().st_size < 400_000:
            r = subprocess.run([node, "--check", str(f)], capture_output=True, text=True)
            if r.returncode:
                errors.append(f"{f.relative_to(skill_dir)}: {r.stderr.strip().splitlines()[-1] if r.stderr else 'node --check failed'}")
    return errors


def tools() -> dict:
    def version(cmd):
        exe = shutil.which(cmd[0])
        if not exe:
            return None
        try:
            r = subprocess.run([exe, *cmd[1:]], capture_output=True, text=True, timeout=20)
            return (r.stdout or r.stderr).strip().splitlines()[0] if (r.stdout or r.stderr) else "present"
        except Exception:
            return "present"

    browser = next((b for b in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser",
                                "microsoft-edge", "msedge") if shutil.which(b)), None)
    for p in (r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        if not browser and Path(p).exists():
            browser = p
    blender = version(["blender", "--version"])
    for p in ("/Applications/Blender.app/Contents/MacOS/Blender",
              r"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"):
        if not blender and Path(p).exists():
            blender = p
    mcp = {}
    for cfg in (PROJECT / ".mcp.json", Path.home() / ".claude.json"):
        try:
            servers = json.loads(cfg.read_text(encoding="utf-8")).get("mcpServers", {})
            mcp.update({k: str(cfg) for k in servers if "blender" in k.lower()})
        except Exception:
            pass
    return {
        "python": sys.version.split()[0],
        "python_packages": {p: importlib.util.find_spec(m) is not None
                            for p, m in (("ezdxf", "ezdxf"), ("PyMuPDF", "fitz"), ("Pillow", "PIL"),
                                         ("opencv-python", "cv2"), ("numpy", "numpy"), ("scipy", "scipy"))},
        "uv": version(["uv", "--version"]),
        "node": version(["node", "--version"]),
        "npm": version(["npm", "--version"]),
        "browser": browser,
        "blender": blender,
        "blender_mcp_servers": mcp,
        "MELTFLEX_API_KEY_set": bool(os.environ.get("MELTFLEX_API_KEY")),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", action="store_true", help="print a JSON report")
    args = ap.parse_args()
    manifest = json.loads((HERE / "skills-manifest.json").read_text(encoding="utf-8"))
    node = shutil.which("node")
    rows, failed = [], 0
    for entry in manifest["skills"]:
        d = SKILLS / entry["name"]
        row = {"name": entry["name"], "status": entry["status"], "problems": [], "warnings": []}
        md = d / "SKILL.md"
        if not md.is_file():
            row["problems"].append("SKILL.md missing")
        else:
            text = md.read_text(encoding="utf-8")
            meta = frontmatter(text)
            if meta.get("name") != entry["name"]:
                row["problems"].append(f"frontmatter name is {meta.get('name')!r}")
            desc = meta.get("description", "")
            if not desc:
                row["problems"].append("no description")
            elif len(desc) > 1024:
                row["warnings"].append(f"description is {len(desc)} chars (over 1024; may be truncated)")
            missing = linked_files(d, text)
            if missing:
                row["warnings"].append("linked files not found: " + ", ".join(missing))
            row["problems"] += syntax(d, node)
        failed += bool(row["problems"])
        rows.append(row)
    for shared in manifest.get("shared_dirs", []):
        if not (SKILLS / shared["name"]).is_dir():
            rows.append({"name": shared["name"], "status": "shared", "problems": ["directory missing"], "warnings": []})
            failed += 1
    report = {"skills": rows, "tools": tools(), "ok": failed == 0}
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        width = max(len(r["name"]) for r in rows)
        for r in rows:
            mark = "FAIL" if r["problems"] else ("warn" if r["warnings"] else " ok ")
            print(f"[{mark}] {r['name']:<{width}}  {r['status']}")
            for p in r["problems"]:
                print(f"         problem: {p}")
            for w in r["warnings"]:
                print(f"         note: {w}")
        t = report["tools"]
        print("\nTools:")
        print(f"  python {t['python']}  packages: " + ", ".join(f"{k}={'yes' if v else 'no'}" for k, v in t["python_packages"].items()))
        for k in ("uv", "node", "npm", "browser", "blender"):
            print(f"  {k}: {t[k] or 'not found'}")
        print(f"  blender MCP servers: {', '.join(t['blender_mcp_servers']) or 'none configured'}")
        print(f"  MELTFLEX_API_KEY set: {'yes' if t['MELTFLEX_API_KEY_set'] else 'no'}")
        print(f"\n{len(rows)} entries, {failed} with problems.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
