#!/usr/bin/env python3
"""
Add 'export const dynamic = "force-dynamic"' to API routes that use cookies or request.url
"""
import os
import re
import subprocess

def find_api_routes_needing_dynamic():
    """Find all API route files that use cookies or request.url"""
    result = subprocess.run(
        ['find', 'app/api', '-name', 'route.ts', '-type', 'f'],
        capture_output=True,
        text=True
    )

    files_needing_fix = []
    for file_path in result.stdout.strip().split('\n'):
        if not file_path:
            continue

        with open(file_path, 'r') as f:
            content = f.read()

        # Check if file uses cookies or request.url
        if 'cookies' in content or 'request.url' in content:
            # Check if it already has dynamic export
            if 'export const dynamic' not in content:
                files_needing_fix.append(file_path)

    return files_needing_fix

def add_dynamic_export(file_path):
    """Add dynamic export to a file"""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    # Find the right place to insert (after imports, before first export/function)
    insert_index = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            insert_index = i + 1
        elif line.strip() and not line.strip().startswith('import '):
            break

    # Skip empty lines after imports
    while insert_index < len(lines) and not lines[insert_index].strip():
        insert_index += 1

    # Insert the dynamic export
    lines.insert(insert_index, "\nexport const dynamic = 'force-dynamic'\n")

    with open(file_path, 'w') as f:
        f.writelines(lines)

    print(f"✅ Added dynamic export to: {file_path}")

def main():
    files = find_api_routes_needing_dynamic()

    if not files:
        print("✅ All API routes already have dynamic export!")
        return

    print(f"Found {len(files)} files needing dynamic export:\n")
    for file_path in files:
        add_dynamic_export(file_path)

    print(f"\n✅ Fixed {len(files)} files!")

if __name__ == '__main__':
    main()
