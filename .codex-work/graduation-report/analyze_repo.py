#!/usr/bin/env python3
"""Extract reproducible evidence for the Spechub graduation report."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".codex-work/graduation-report/analysis/spechub-evidence.json"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def package_versions() -> dict[str, str]:
    keys = {
        "next",
        "react",
        "@nestjs/core",
        "fastify",
        "@prisma/client",
        "prisma",
        "redis",
        "meilisearch",
        "zod",
        "@tanstack/react-query",
        "tailwindcss",
        "turbo",
        "typescript",
    }
    result: dict[str, str] = {}
    for path in [ROOT / "package.json", *sorted((ROOT / "apps").glob("*/package.json")), *sorted((ROOT / "packages").glob("*/package.json"))]:
        if not path.exists():
            continue
        data = json.loads(read(path))
        for section in ("dependencies", "devDependencies"):
            for name, version in data.get(section, {}).items():
                if name in keys and name not in result:
                    result[name] = version
    root_pkg = json.loads(read(ROOT / "package.json"))
    result["node"] = root_pkg.get("engines", {}).get("node", "")
    result["packageManager"] = root_pkg.get("packageManager", "")
    return result


def web_routes() -> list[str]:
    routes: list[str] = []
    app = ROOT / "apps/web/src/app"
    for path in app.rglob("page.tsx"):
        rel = path.parent.relative_to(app)
        parts = [p for p in rel.parts if not (p.startswith("(") and p.endswith(")"))]
        routes.append("/" + "/".join(parts) if parts else "/")
    return sorted(routes)


def controller_inventory() -> dict:
    verb_re = re.compile(r"@(Get|Post|Put|Patch|Delete)\s*\(\s*([^)]*)\)")
    ctl_re = re.compile(r"@Controller\s*\(\s*([^)]*)\)")
    roles_re = re.compile(r"@Roles\s*\(([^)]*)\)")
    public_re = re.compile(r"@Public\s*\(")
    controllers = []
    role_counter: Counter[str] = Counter()
    verb_counter: Counter[str] = Counter()
    total_endpoints = 0
    for path in sorted((ROOT / "apps/api/src").rglob("*.controller.ts")):
        text = read(path)
        ctl = ctl_re.search(text)
        prefix = ctl.group(1).strip().strip("'\"`") if ctl else ""
        endpoints = []
        lines = text.splitlines()
        pending_roles: list[str] = []
        pending_public = False
        for idx, line in enumerate(lines):
            rm = roles_re.search(line)
            if rm:
                pending_roles = re.findall(r"['\"]([A-Za-z_]+)['\"]|USER_ROLES\.([A-Z_]+)|UserRole\.([A-Z_]+)", rm.group(1))
                pending_roles = [a or b or c for a, b, c in pending_roles]
            if public_re.search(line):
                pending_public = True
            vm = verb_re.search(line)
            if vm:
                verb, arg = vm.groups()
                route = arg.strip().strip("'\"`")
                full = "/".join(part.strip("/") for part in (prefix, route) if part.strip("/"))
                roles = list(pending_roles)
                for role in roles:
                    role_counter[role] += 1
                endpoints.append(
                    {
                        "verb": verb.upper(),
                        "path": "/api/v1/" + full,
                        "public": pending_public,
                        "roles": roles,
                        "line": idx + 1,
                    }
                )
                verb_counter[verb.upper()] += 1
                total_endpoints += 1
                pending_roles = []
                pending_public = False
        controllers.append(
            {
                "file": str(path.relative_to(ROOT)),
                "prefix": prefix,
                "endpoint_count": len(endpoints),
                "endpoints": endpoints,
            }
        )
    return {
        "controller_count": len(controllers),
        "endpoint_count": total_endpoints,
        "verbs": dict(sorted(verb_counter.items())),
        "roles": dict(sorted(role_counter.items())),
        "controllers": controllers,
    }


def parse_prisma() -> dict:
    path = ROOT / "packages/database/prisma/schema.prisma"
    text = read(path)
    block_re = re.compile(r"^(model|enum)\s+(\w+)\s*\{(.*?)^\}", re.M | re.S)
    field_re = re.compile(r"^\s*(\w+)\s+([^\s]+)(?:\s+(.*))?$", re.M)
    models: dict[str, dict] = {}
    enums: dict[str, list[str]] = {}
    for kind, name, body in block_re.findall(text):
        if kind == "enum":
            enums[name] = [ln.strip().split()[0] for ln in body.splitlines() if ln.strip() and not ln.lstrip().startswith("//")]
            continue
        fields = []
        for fname, ftype, attrs in field_re.findall(body):
            if fname.startswith("@@") or fname.startswith("//"):
                continue
            attrs = attrs or ""
            fields.append(
                {
                    "name": fname,
                    "type": ftype,
                    "primary": "@id" in attrs,
                    "unique": "@unique" in attrs,
                    "relation": "@relation" in attrs or ftype.rstrip("?[]") in models,
                    "attributes": attrs,
                }
            )
        table_match = re.search(r"@@map\(\"([^\"]+)\"\)", body)
        models[name] = {
            "table": table_match.group(1) if table_match else name,
            "field_count": len(fields),
            "fields": fields,
        }

    model_names = set(models)
    relation_edges = []
    for source, model in models.items():
        for field in model["fields"]:
            target = field["type"].rstrip("?[]")
            if target in model_names:
                field["relation"] = True
                relation_edges.append({"source": source, "field": field["name"], "target": target})

    groups = {
        "catalog_core": [
            "organizations", "device_categories", "product_families", "device_models", "device_variants",
            "device_model_aliases", "media_assets", "currencies", "release_statuses",
        ],
        "hardware_scoring": [
            "chipsets", "cpus", "gpus", "npus", "display_units", "battery_units", "camera_modules",
            "memory_standards", "storage_standards", "operating_systems", "variant_chipsets",
            "variant_cpus", "variant_gpus", "variant_npus", "variant_displays", "variant_batteries",
            "scoring_profiles", "scoring_profile_metrics", "variant_scorecards", "benchmarks", "benchmark_runs",
        ],
        "content_ai": [
            "sources", "citations", "data_sources", "raw_pages", "wiki_articles", "wiki_revisions",
            "wiki_article_citations", "comments", "embeddings", "ai_query_cache", "search_logs",
        ],
        "user_commerce": [
            "users", "wishlists", "wishlist_items", "price_alerts", "notifications",
            "notification_deliveries", "subscription_plans", "subscriptions", "billing_audit_logs",
            "billing_webhook_events", "api_keys", "api_key_usage", "affiliate_partners",
            "affiliate_links", "affiliate_price_history", "affiliate_clicks",
        ],
    }
    # Resolve fuzzy names because the schema uses detailed names in several modules.
    resolved_groups: dict[str, list[str]] = {}
    for group, wanted in groups.items():
        resolved = []
        for name in wanted:
            if name in models:
                resolved.append(name)
        resolved_groups[group] = list(dict.fromkeys(resolved))

    return {
        "schema_file": str(path.relative_to(ROOT)),
        "line_count": len(text.splitlines()),
        "model_count": len(models),
        "enum_count": len(enums),
        "relation_edge_count": len(relation_edges),
        "models": models,
        "enums": enums,
        "relation_edges": relation_edges,
        "functional_groups": resolved_groups,
    }


def source_inventory() -> dict:
    suffixes = {".ts", ".tsx", ".py", ".prisma"}
    counts: Counter[str] = Counter()
    line_counts: Counter[str] = Counter()
    for base in (ROOT / "apps", ROOT / "packages"):
        for path in base.rglob("*"):
            if (
                not path.is_file()
                or path.suffix not in suffixes
                or any(part in {"node_modules", "dist", "generated", ".next", "coverage"} for part in path.parts)
            ):
                continue
            rel = path.relative_to(ROOT)
            bucket = "/".join(rel.parts[:2])
            counts[bucket] += 1
            try:
                line_counts[bucket] += len(read(path).splitlines())
            except UnicodeDecodeError:
                pass
    return {
        "file_counts": dict(sorted(counts.items())),
        "line_counts": dict(sorted(line_counts.items())),
        "total_files": sum(counts.values()),
        "total_lines": sum(line_counts.values()),
    }


def main() -> None:
    evidence = {
        "generated_from": str(ROOT),
        "versions": package_versions(),
        "web_routes": web_routes(),
        "api": controller_inventory(),
        "database": parse_prisma(),
        "source_inventory": source_inventory(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "output": str(OUT),
        "web_routes": len(evidence["web_routes"]),
        "controllers": evidence["api"]["controller_count"],
        "endpoints": evidence["api"]["endpoint_count"],
        "models": evidence["database"]["model_count"],
        "enums": evidence["database"]["enum_count"],
        "source_files": evidence["source_inventory"]["total_files"],
        "source_lines": evidence["source_inventory"]["total_lines"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
