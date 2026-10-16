"""Harvexa MCP server: GitHub deploy status, website files, and WHMCS domain info."""
import os
import re
import subprocess
from pathlib import Path

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

ROOT = Path(__file__).resolve().parent.parent
SITE_DIR = (ROOT / "src").resolve()
load_dotenv(Path(__file__).resolve().parent / ".env")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "Sunderaj753/harvexa-website")
SITE_URL = os.getenv("SITE_URL", "https://sunderaj753.github.io/harvexa-website/")
WHMCS_URL = os.getenv("WHMCS_URL", "").rstrip("/")
WHMCS_IDENTIFIER = os.getenv("WHMCS_IDENTIFIER", "")
WHMCS_SECRET = os.getenv("WHMCS_SECRET", "")
DOMAIN = os.getenv("DOMAIN", "harvexatech.co.za")

mcp = FastMCP("harvexa")


def _gh_headers() -> dict:
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN is not set in mcp-server/.env")
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _safe_path(rel: str) -> Path:
    p = (SITE_DIR / rel).resolve()
    if p != SITE_DIR and SITE_DIR not in p.parents:
        raise ValueError("Path must stay inside the src/ folder")
    return p


def _whmcs(action: str, **params) -> dict:
    if not (WHMCS_URL and WHMCS_IDENTIFIER and WHMCS_SECRET):
        raise RuntimeError("WHMCS_URL, WHMCS_IDENTIFIER and WHMCS_SECRET must be set in mcp-server/.env")
    data = {
        "action": action,
        "identifier": WHMCS_IDENTIFIER,
        "secret": WHMCS_SECRET,
        "responsetype": "json",
        **params,
    }
    r = httpx.post(f"{WHMCS_URL}/includes/api.php", data=data, timeout=30)
    r.raise_for_status()
    return r.json()


# ---------- GitHub ----------

@mcp.tool()
def github_latest_runs(limit: int = 5) -> list[dict]:
    """List the latest GitHub Actions runs (deploy status) for the website repo."""
    r = httpx.get(
        f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs",
        headers=_gh_headers(), params={"per_page": limit}, timeout=30,
    )
    r.raise_for_status()
    return [
        {
            "id": x["id"], "title": x["display_title"], "status": x["status"],
            "conclusion": x["conclusion"], "sha": x["head_sha"][:7],
            "created": x["created_at"], "url": x["html_url"],
        }
        for x in r.json()["workflow_runs"]
    ]


@mcp.tool()
def github_pages_status() -> dict:
    """Show GitHub Pages settings: URL, custom domain, HTTPS enforcement and build status."""
    r = httpx.get(f"https://api.github.com/repos/{GITHUB_REPO}/pages", headers=_gh_headers(), timeout=30)
    r.raise_for_status()
    d = r.json()
    return {k: d.get(k) for k in ("html_url", "status", "cname", "https_enforced", "build_type")}


@mcp.tool()
def github_set_custom_domain(domain: str, enforce_https: bool = False) -> str:
    """Set the Pages custom domain (e.g. www.harvexatech.co.za). Enable HTTPS only after the DNS check passes."""
    body: dict = {"cname": domain}
    if enforce_https:
        body["https_enforced"] = True
    r = httpx.put(f"https://api.github.com/repos/{GITHUB_REPO}/pages", headers=_gh_headers(), json=body, timeout=30)
    if r.status_code >= 400:
        return f"GitHub returned {r.status_code}: {r.text}"
    return f"Custom domain set to {domain}"


@mcp.tool()
def github_rerun_deploy() -> str:
    """Trigger the Pages deploy workflow manually."""
    r = httpx.post(
        f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/pages.yml/dispatches",
        headers=_gh_headers(), json={"ref": "main"}, timeout=30,
    )
    return "Deploy triggered" if r.status_code == 204 else f"GitHub returned {r.status_code}: {r.text}"


# ---------- Website ----------

@mcp.tool()
def site_list_files() -> list[str]:
    """List all files in the website src/ folder."""
    return sorted(str(p.relative_to(SITE_DIR)).replace("\\", "/") for p in SITE_DIR.rglob("*") if p.is_file())


@mcp.tool()
def site_read_file(path: str) -> str:
    """Read a text file inside src/ (e.g. index.html)."""
    return _safe_path(path).read_text(encoding="utf-8")


@mcp.tool()
def site_write_file(path: str, content: str) -> str:
    """Overwrite a text file inside src/. Review changes with git diff before publishing."""
    p = _safe_path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return f"Wrote {path} ({len(content)} chars)"


@mcp.tool()
def site_publish(message: str) -> str:
    """Commit all changes and push to GitHub, which redeploys the live site."""
    def git(*args: str) -> str:
        res = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
        return (res.stdout + res.stderr).strip()

    out = [git("add", "."), git("commit", "-m", message), git("push")]
    return "\n".join(o for o in out if o)


@mcp.tool()
def site_check(url: str = "") -> dict:
    """Fetch the live site (bypassing cache) and report status and asset links."""
    target = url or SITE_URL
    r = httpx.get(target, headers={"Cache-Control": "no-cache"}, follow_redirects=True, timeout=30)
    assets = re.findall(r'(?:href|src)="([^"]*(?:assets|manifest)[^"]*)"', r.text)
    broken = []
    for a in assets:
        full = str(httpx.URL(str(r.url)).join(a))
        if httpx.get(full, timeout=30).status_code >= 400:
            broken.append(full)
    return {
        "url": str(r.url), "status": r.status_code,
        "last_modified": r.headers.get("last-modified"),
        "assets_checked": len(assets), "broken_assets": broken,
    }


# ---------- WHMCS (Okuhle Digital) ----------

@mcp.tool()
def whmcs_domain_info() -> dict:
    """Get the registration details for the company domain from WHMCS."""
    return _whmcs("GetClientsDomains", domain=DOMAIN)


@mcp.tool()
def whmcs_get_nameservers() -> dict:
    """Get the current nameservers for the company domain."""
    domains = _whmcs("GetClientsDomains", domain=DOMAIN)
    domain_id = domains["domains"]["domain"][0]["id"]
    return _whmcs("DomainGetNameservers", domainid=domain_id)


if __name__ == "__main__":
    mcp.run()
