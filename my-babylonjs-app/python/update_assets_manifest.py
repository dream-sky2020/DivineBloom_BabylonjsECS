#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path
import xml.etree.ElementTree as ET


def indent_xml(elem: ET.Element, level: int = 0) -> None:
    indentation = "\n" + "  " * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indentation + "  "
        for child in elem:
            indent_xml(child, level + 1)
        if not elem[-1].tail or not elem[-1].tail.strip():
            elem[-1].tail = indentation
    if level and (not elem.tail or not elem.tail.strip()):
        elem.tail = indentation


def make_asset_id(relative_svg_path: str) -> str:
    no_suffix = str(Path(relative_svg_path).with_suffix(""))
    normalized = no_suffix.replace("\\", "/")
    tokenized = re.sub(r"[^a-zA-Z0-9]+", ".", normalized).strip(".").lower()
    return f"tex.{tokenized}"


def collect_svg_paths(svg_root: Path) -> list[str]:
    files = [p for p in svg_root.rglob("*.svg") if p.is_file()]
    files.sort(key=lambda p: p.as_posix().lower())
    return [p.relative_to(svg_root).as_posix() for p in files]


def update_manifest(manifest_path: Path, svg_root: Path) -> int:
    tree = ET.parse(manifest_path)
    root = tree.getroot()
    assets = root.find("Assets")
    if assets is None:
        raise ValueError(f"Manifest missing <Assets>: {manifest_path}")

    existing_svg_src_to_id: dict[str, str] = {}
    retained_assets: list[ET.Element] = []

    for child in list(assets):
        if child.tag != "Asset":
            retained_assets.append(child)
            continue

        src = child.attrib.get("src", "")
        asset_type = child.attrib.get("type", "")
        if asset_type == "texture" and src.startswith("/svg/"):
            if src and child.attrib.get("id"):
                existing_svg_src_to_id[src] = child.attrib["id"]
            continue

        retained_assets.append(child)

    svg_rel_paths = collect_svg_paths(svg_root)
    generated_assets: list[ET.Element] = []
    for rel_path in svg_rel_paths:
        src = f"/svg/{rel_path}"
        asset_id = existing_svg_src_to_id.get(src, make_asset_id(rel_path))
        generated_assets.append(
            ET.Element(
                "Asset",
                {
                    "id": asset_id,
                    "type": "texture",
                    "src": src,
                },
            )
        )

    assets.clear()
    assets.extend(retained_assets)
    assets.extend(generated_assets)

    indent_xml(root)
    tree.write(manifest_path, encoding="utf-8", xml_declaration=False)
    return len(generated_assets)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Update assets.manifest.xml with all SVG files."
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("public/manifests/assets.manifest.xml"),
        help="Path to assets manifest XML.",
    )
    parser.add_argument(
        "--svg-dir",
        type=Path,
        default=Path("public/svg"),
        help="Path to SVG directory.",
    )
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    svg_root = args.svg_dir.resolve()

    if not manifest_path.is_file():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    if not svg_root.is_dir():
        raise FileNotFoundError(f"SVG directory not found: {svg_root}")

    count = update_manifest(manifest_path, svg_root)
    print(f"Updated {manifest_path} with {count} SVG assets.")


if __name__ == "__main__":
    main()
