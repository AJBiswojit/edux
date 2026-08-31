"""Filesystem object storage for generated files (PDFs, uploads)."""

from __future__ import annotations

from pathlib import Path


def storage_root() -> Path:
    root = Path(__file__).resolve().parents[2] / "var" / "storage"
    root.mkdir(parents=True, exist_ok=True)
    return root


def write_bytes(object_key: str, data: bytes) -> Path:
    path = storage_root() / object_key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def read_bytes(object_key: str) -> bytes | None:
    path = storage_root() / object_key
    if not path.is_file():
        return None
    return path.read_bytes()


def write_simple_pdf(*, title: str, lines: list[str]) -> bytes:
    """Minimal PDF 1.4 bytes — real file, not a fake success flag."""

    def _esc(value: str) -> str:
        return (value or "").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")[:140]

    ops = ["BT", "/F1 16 Tf", "50 780 Td", f"({_esc(title)}) Tj", "/F1 11 Tf"]
    for line in (lines or [])[:42]:
        ops.append(f"0 -16 Td ({_esc(line)}) Tj")
    ops.append("ET")
    stream = "\n".join(ops).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{index} 0 obj\n".encode())
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return bytes(out)


def write_paper_pdf(
    *,
    title: str,
    subtitle: str = "",
    meta_items: list[tuple[str, str]] | None = None,
    instructions: list[str] | None = None,
    questions: list[dict] | None = None,
) -> bytes:
    """Generate a clean, multi-page PDF 1.4 for a question paper with real questions."""
    import textwrap

    def _esc(value: str) -> str:
        return str(value or "").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    pages_ops: list[list[str]] = []
    current_ops: list[str] = []
    y = 740

    def start_page():
        nonlocal current_ops, y
        current_ops = []
        pages_ops.append(current_ops)
        y = 740

    def check_space(needed_lines: int = 1, line_height: int = 14):
        nonlocal y
        if y - (needed_lines * line_height) < 60:
            start_page()

    def add_text(text: str, font: str = "/F1", size: int = 10, dy: int = 14, x: int = 50):
        nonlocal y
        check_space(1, dy)
        y -= dy
        current_ops.append(f"BT {font} {size} Tf 1 0 0 1 {x} {y} Tm ({_esc(text)}) Tj ET")

    start_page()

    # Title & Header
    add_text(title, font="/F2", size=15, dy=20, x=50)
    if subtitle:
        add_text(subtitle, font="/F1", size=11, dy=16, x=50)

    # Metadata banner
    if meta_items:
        meta_str = "   |   ".join(f"{k}: {v}" for k, v in meta_items if v)
        add_text(meta_str, font="/F2", size=9, dy=14, x=50)

    # Divider
    check_space(1, 10)
    y -= 10
    current_ops.append(f"0.5 w 50 {y} m 562 {y} l S")

    # Instructions
    if instructions:
        add_text("Instructions:", font="/F2", size=10, dy=14, x=50)
        for inst in instructions:
            wrapped = textwrap.wrap(f"• {inst}", width=88)
            for w in wrapped:
                add_text(w, font="/F1", size=9, dy=12, x=55)
        check_space(1, 8)
        y -= 8
        current_ops.append(f"0.3 w 50 {y} m 562 {y} l S")

    # Questions
    q_list = questions or []
    for idx, q in enumerate(q_list, start=1):
        marks_str = f"[{q.get('marks', 1)} Marks"
        if q.get("negativeMarks") or q.get("negative_marks"):
            neg = q.get("negativeMarks") or q.get("negative_marks")
            marks_str += f", -{neg} Neg"
        marks_str += "]"
        q_type = q.get("type") or q.get("questionType") or "MCQ"
        diff = q.get("difficulty") or ""

        # Question header
        check_space(3, 14)
        add_text(
            f"Question {idx}   ({q_type}{f' · {diff}' if diff else ''})   {marks_str}",
            font="/F2",
            size=10,
            dy=16,
            x=50,
        )

        # Question stem
        stem = q.get("text") or q.get("question") or q.get("stem") or ""
        for line in stem.split("\n"):
            for w in textwrap.wrap(line, width=85) or [""]:
                add_text(w, font="/F1", size=10, dy=13, x=50)

        # Options
        options = q.get("options") or []
        for oi, opt in enumerate(options):
            label = opt.get("text") if isinstance(opt, dict) else str(opt)
            key = opt.get("key") if isinstance(opt, dict) and opt.get("key") else chr(65 + oi)
            for wi, w in enumerate(textwrap.wrap(f"({key})  {label}", width=82)):
                add_text(w, font="/F1", size=9, dy=12, x=65 if wi > 0 else 60)

        # Spacing after question
        y -= 6

    total_pages = len(pages_ops)
    for p_idx, p_ops in enumerate(pages_ops, start=1):
        footer_text = f"Page {p_idx} of {total_pages}   ·   EduX Question Paper Studio"
        p_ops.append(f"BT /F1 8 Tf 1 0 0 1 200 30 Tm ({_esc(footer_text)}) Tj ET")

    num_pages = len(pages_ops)
    font_f1_num = 3 + (2 * num_pages)
    font_f2_num = font_f1_num + 1

    page_obj_nums = [3 + (2 * i) for i in range(num_pages)]
    contents_obj_nums = [4 + (2 * i) for i in range(num_pages)]

    objects: list[bytes] = []

    # 1 0 obj: Catalog
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")

    # 2 0 obj: Pages
    kids_str = " ".join(f"{num} 0 R" for num in page_obj_nums)
    objects.append(f"<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>".encode("latin-1"))

    # Page and Contents objects
    for i in range(num_pages):
        c_num = contents_obj_nums[i]
        stream_bytes = "\n".join(pages_ops[i]).encode("latin-1", errors="replace")
        page_dict = f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {c_num} 0 R /Resources << /Font << /F1 {font_f1_num} 0 R /F2 {font_f2_num} 0 R >> >> >>".encode("latin-1")
        objects.append(page_dict)
        content_dict = f"<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1") + stream_bytes + b"\nendstream"
        objects.append(content_dict)

    # Fonts
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{index} 0 obj\n".encode("latin-1"))
        out.extend(obj)
        out.extend(b"\nendobj\n")

    xref = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode("latin-1"))

    out.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("latin-1"))
    return bytes(out)

