"""
Export GitHub Copilot Chat sessions from VS Code workspace storage into
well-formatted Markdown files.

This script reconstructs chat sessions in a format similar to VS Code's
"Copy All", but with improved structure, metadata, and timing information.
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

WS_ROOT = Path.cwd()   # The script is run from the workspace root
WS_HASH = Path.cwd()   # Will be found by searching workspaceStorage
DST_DIR = "chat"       # Directory to save exported Markdown files
MAX_LEN = 50           # Max length for title previews and slugs

# ------------------------------------------------
# Workspace Resolution
# ------------------------------------------------

def get_workspace_storage_dir() -> Path:
    """Return the VS Code workspaceStorage directory for the current OS."""
    if os.name == "nt":
        base = Path(os.getenv("APPDATA"))
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = Path.home() / ".config"
    return base / "Code" / "User" / "workspaceStorage"


def find_workspace_hash_dir(storage_dir: Path) -> Path:
    """Find the workspaceStorage directory for the current workspace."""
    cwd_str = str(WS_ROOT.resolve())
    for d in storage_dir.iterdir():
        meta = d / "workspace.json"
        if not meta.exists():
            continue
        data = json.loads(meta.read_text())
        folder = data.get("folder", "")
        if folder.endswith(cwd_str):
            return d
    raise RuntimeError("VS Code workspace not found")


def find_jsonl_files(workspace_dir: Path) -> list[Path]:
    """Return all JSONL files in the workspace storage directory."""
    return list(workspace_dir.glob("chatSessions/*.jsonl"))

# ------------------------------------------------
# Utility Functions
# ------------------------------------------------

def ts_from_ms(ms: object) -> datetime | None:
    """Convert epoch milliseconds to local datetime."""
    if isinstance(ms, (int, float)):
        return datetime.fromtimestamp(ms / 1000)
    return None


def format_ts(dt: datetime | None) -> str:
    """Format datetime for display."""
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else "unknown"


def slugify(text: str) -> str:
    """Create a filesystem-safe slug from text."""
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text[:MAX_LEN].strip("-") or "chat"


def overlap_length(a: str, b: str) -> int:
    """Return the length of the longest overlap between end of a and start of b."""
    max_len = min(len(a), len(b))
    for k in range(max_len, 0, -1):
        if a.endswith(b[:k]):
            return k
    return 0


def make_relative(path: str) -> str:
    """Convert an absolute path to a workspace-relative path if possible."""

    # Determine emoji based on file or folder
    resolved = Path(path).resolve()
    if resolved.exists() and resolved.is_file():
        emoji = "📄"
    else:
        emoji = "📁"

    # Try to make path relative to workspace or hash dir
    rel = "."
    for base in (WS_ROOT.resolve(), WS_HASH.resolve()):
        try:
            rel = str(resolved.relative_to(base))
        except ValueError:
            continue

    # Format and return the path with emoji
    if rel == ".":
        rel = resolved.name
    return f"`{emoji}{rel}`"


def make_paths_relative(msg: str) -> str:
    """Rewrite file URIs inside tool messages to relative paths."""

    def repl(match: re.Match) -> str:
        path = match.group(1).replace("file://", "")
        return make_relative(path)

    # Replace [](file://...) → filename
    msg = re.sub(r"\[\]\(file://([^)]+)\)", repl, msg)
    # Replace (file://...) → filename
    msg = re.sub(r"\(file://([^)]+)\)", repl, msg)
    # Replace raw file://...
    msg = re.sub(r"file://([^\s)]+)", repl, msg)
    return msg


def detect_event_type(msg: str) -> str:
    """Determine emoji label for tool event messages."""
    first_word = msg.split()[0]
    match first_word:
        case "Created":
            return "✨"
        case "Read":
            return "📖"
        case "Applied" | "Edited" | "Updated" | "Wrote":
            return "📝"
        case "Ran" | "Executed":
            return "💻"
    return "🔧"

# ------------------------------------------------
# Parsing JSONL
# ------------------------------------------------

def parse_response(items: list, responses: list, call_ids: set) -> None:
    """Extract and format text responses from response items.

    Args:
        items: List of response items from the session data.
        responses: List to append extracted text responses to.
        call_ids: Set to prevent rendering a previous response.
    """
    kind = None
    for item in items:
        if not isinstance(item, dict):
            continue
        prev = kind
        kind = item.get("kind")

        # Subagent messages
        if kind == "toolInvocationSerialized":

            # skip redundant "Using tool X" messages
            msg = item.get("invocationMessage")
            if isinstance(msg, str) and msg.startswith('Using "'):
                continue

            # Prevent duplicate rendering of tool calls
            call_id = item.get("toolCallId")
            if call_id in call_ids:
                continue
            call_ids.add(call_id)

            # Extract the main message text
            msg = item.get("pastTenseMessage") or item.get("invocationMessage")
            if isinstance(msg, dict):
                msg = msg.get("value", "")
            if not msg:
                data = item.get("toolSpecificData")
                if data and data["kind"] == "terminal":
                    msg = f"Ran `{data['confirmation']['commandLine']}`"
            if msg and isinstance(msg, str):
                emoji = detect_event_type(msg)
                text = make_paths_relative(msg)
                responses.append(f"{emoji} {text}")

        # Progress updates
        elif kind == "progressTaskSerialized":
            text = item["content"]["value"]
            responses.append("⏳ " + text)

        # Interactive questions
        elif kind == "questionCarousel":
            if "data" not in item:
                continue
            data = item["data"]
            for q in item["questions"]:
                qText = q["message"]
                a = data[q["id"]]
                if "selectedValue" in a:
                    aText = a["selectedValue"]
                else:
                    aText = a["selectedValues"]
                responses.append(f"> Q: {qText}<br>\n> **A: {aText}**")

        # Link displayed as filename
        elif kind == "inlineReference":
            ref = item["inlineReference"]
            if "name" in ref:
                name = ref.get("name")
            elif "path" in ref:
                name = make_relative(ref["path"])
            else:
                name = make_relative(ref["uri"]["path"])
            responses[-1] += name

        # General text responses
        else:
            text = item.get("value")
            if not text:
                continue
            if text == "\n```\n":
                continue
            if kind == "thinking":
                text = "🧠 " + text

            # Handle special cases
            if not responses:
                responses.append(text)
            elif prev == "inlineReference":
                responses[-1] += text  # continue previous response
            else:
                # Overwrite incomplete response
                k = overlap_length(responses[-1], text)
                if k >= int(0.75 * len(text)):
                    responses[-1] += text[k:]
                else:
                    responses.append(text)


def parse_session(file_path: Path) -> tuple[list[dict], str | None, dict]:
    """Parse a JSONL session file into structured groups.

    Args:
        file_path: Path to the JSONL session file.

    Returns:
        - groups: List of prompt-response groups with metadata.
        - title: Optional custom title for the session.
        - metadata: Session-level metadata for display.
    """

    # Initialize return values
    groups: list[dict[str, Any]] = [
        # "user_text": str,
        # "timestamp": datetime,
        # "responses": list[str],
        # "timings": dict,
        # "details": dict,
    ]
    title: str | None = None
    metadata: dict[str, Any] = {
        "creationDate": None,
        "sessionId": None,
        "model": None,
        "account": None,
        "workspace": WS_ROOT.name,
    }

    # Read all entries from the JSONL file
    print(f"Parsing session file: {file_path.name}")
    with open(file_path, "r", encoding="utf-8") as f:
        entries = [json.loads(line) for line in f if line.strip()]
    for entry in entries:
        kind = entry.get("kind")
        k = entry.get("k")
        v = entry.get("v")

        # Metadata
        if kind == 0 and isinstance(v, dict):
            metadata["creationDate"] = ts_from_ms(v.get("creationDate"))
            metadata["sessionId"] = v.get("sessionId")
            try:
                metadata["model"] = v["inputState"]["selectedModel"]["identifier"]
            except Exception:
                pass
            try:
                metadata["account"] = v["inputState"]["selectedModel"]["metadata"]["auth"]["accountLabel"]
            except Exception:
                pass

        # Title
        elif kind == 1 and k == ["customTitle"] and isinstance(v, str):
            title = v.strip()

        # Capture result metadata (timings + model details)
        elif kind == 1 and len(k) == 3 and k[0] == "requests" and k[2] == "result":
            groups[-1]["timings"] = v.get("timings", {})
            groups[-1]["details"] = v.get("details", {})

        # Initial request parsing
        elif kind == 2 and k == ["requests"] and isinstance(v, list):
            if len(v) != 1:
                print(f"Warning: unexpected {len(v)} requests")
            for request in v:
                if not isinstance(request, dict):
                    continue

                # Extract the user's prompt
                user_text = request.get("message", {}).get("text", "").strip()
                if not user_text:
                    continue

                # Initialize group object
                group = {
                    "user_text": user_text,
                    "timestamp": ts_from_ms(request.get("timestamp")),
                    "responses": [],
                    "callIds": set(),
                    "timings": {},
                    "details": {},
                }
                groups.append(group)

                # Process the response items
                parse_response(request["response"], group["responses"], group["callIds"])

        # Continue request parsing
        elif kind == 2 and k[0] == "requests" and isinstance(v, list):
            parse_response(v, groups[-1]["responses"], groups[-1]["callIds"])

    return groups, title, metadata


# ------------------------------------------------
# Markdown Rendering
# ------------------------------------------------

def escape_markdown_html(text: str) -> str:
    """Escape HTML-sensitive characters in a Markdown string.

    Behavior:
    - Escapes '<' → '&lt;' and '>' → '&gt;' in normal text.
    - Preserves leading '>' characters used for blockquotes.
    - Does NOT escape content inside inline code spans (`...`).
    - Does NOT escape content inside fenced code blocks (```...```).
    """
    result = []
    i = 0
    in_inline_code = False
    in_fenced_code = False

    while i < len(text):
        # Detect fenced code blocks
        if text.startswith("```", i):
            in_fenced_code = not in_fenced_code
            result.append("```")
            i += 3
            continue

        # Detect inline code
        if not in_fenced_code and text[i] == "`":
            in_inline_code = not in_inline_code
            result.append("`")
            i += 1
            continue

        # Detect line breaks
        if text.startswith("<br>", i):
            result.append("<br>")
            i += 4
            continue

        # Append the next character
        c = text[i]
        if not in_inline_code and not in_fenced_code:
            if c == "<":
                result.append("&lt;")
            elif c == ">":
                # Keep leading blockquote marker
                if i == 0 or text[i-1] == "\n":
                    result.append(">")
                else:
                    result.append("&gt;")
            else:
                result.append(c)
        else:
            result.append(c)
        i += 1

    return "".join(result)


def render_session(
    groups: list[dict],
    title: str | None,
    metadata: dict
) -> tuple[str, str]:
    """Convert parsed session data into Markdown.

    Args:
        groups: List of prompt-response groups with metadata.
        title: Optional custom title for the session.
        metadata: Session-level metadata for display.

    Returns:
        Tuple of (filename, markdown content) ready for export.
    """

    # Determine filename
    first_prompt = groups[0]["user_text"]
    title_text = title or first_prompt[:MAX_LEN]
    slug = slugify(title_text)
    creation = metadata.get("creationDate") or groups[0]["timestamp"]
    filename = f"{creation.strftime('%Y-%m-%d_%H-%M')}_{slug}.md"

    # Title
    lines: list[str] = []
    lines.append(f"# {title_text}\n\n")

    # Metadata
    lines.append("<table>\n")
    lines.append(f"<tr><td>📅 Creation Date:</td><td>{format_ts(creation)}</td></tr>\n")
    lines.append(f"<tr><td>🆔 Session Id:</td><td>{metadata['sessionId']}</td></tr>\n")
    lines.append(f"<tr><td>🤖 Selected Model:</td><td>{metadata['model']}</td></tr>\n")
    lines.append(f"<tr><td>👤 Account Label:</td><td>{metadata['account']}</td></tr>\n")
    lines.append(f"<tr><td>📁 Workspace Name:</td><td>{metadata['workspace']}</td></tr>\n")
    lines.append("</table>\n\n")

    # TOC
    lines.append("## 📚 Table of Contents\n\n")
    for i, g in enumerate(groups, 1):
        preview = g["user_text"].replace("\n", " ")
        if len(preview) > MAX_LEN:
            preview = preview[:MAX_LEN - 3] + "..."
        lines.append(f"{i}. [{preview}](#prompt-{i})\n")
    lines.append("\n")

    # Body
    for i, g in enumerate(groups, 1):

        # Timings
        first = g["timings"].get("firstProgress", 0) // 1000
        total = g["timings"].get("totalElapsed", 0) // 1000

        # Prompt heading and anchor
        lines.append(f"## <a name=\"prompt-{i}\"></a> 💬 Prompt {i}\n\n")
        lines.append(f"🕒 {format_ts(g['timestamp'])}\n\n")
        lines.append("First progress: " + f"{first // 60} min, {first % 60} sec<br>\n")
        lines.append("Total elapsed: " + f"{total // 60} min, {total % 60} sec\n\n")

        lines.append(f"### 👤 User ({metadata['account']})\n\n")
        lines.append(g["user_text"] + "\n\n")
        lines.append(f"### 🤖 Assistant ({g['details']})\n\n")

        for line in g["responses"]:
            line = escape_markdown_html(line)
            lines.append(line + "\n\n")

    # Combine lines into final content
    return filename, "".join(lines)


# ------------------------------------------------
# Main
# ------------------------------------------------

def main() -> None:
    """Main entry point for exporting chat sessions."""

    # Create output directory
    out_dir = WS_ROOT / DST_DIR
    out_dir.mkdir(exist_ok=True)

    # Find chat storage folder
    storage_dir = get_workspace_storage_dir()
    workspace_hash_dir = find_workspace_hash_dir(storage_dir)
    jsonl_files = find_jsonl_files(workspace_hash_dir)

    # Parse each session file
    for file in jsonl_files:
        groups, title, metadata = parse_session(file)
        if not groups:
            continue

        # Render Markdown
        filename, content = render_session(groups, title, metadata)
        out_path = out_dir / filename
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"Exported: {out_path.name}")


if __name__ == "__main__":
    main()
