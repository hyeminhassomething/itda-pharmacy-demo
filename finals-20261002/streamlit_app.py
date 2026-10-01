"""Serve the fixed ITDA presentation; no OCR inference or patient data is processed."""
from pathlib import Path
import re

import streamlit as st
import streamlit.components.v1 as components

ROOT = Path(__file__).resolve().parent
st.set_page_config(page_title="테러범 · ITDA 본선 발표", page_icon="📄", layout="wide", initial_sidebar_state="collapsed")


def bundled_presentation() -> str:
    """Inline only the checked-in assets. Never accepts a user-supplied path/HTML."""
    markup = (ROOT / "index.html").read_text(encoding="utf-8")
    # Replace only the JSON data slot, before inserting executable JavaScript.
    # The renderer also contains the placeholder string as a fallback check.
    markup = markup.replace('<script id="slide-data" type="application/json">__SLIDES_JSON__</script>', '<script id="slide-data" type="application/json">' + (ROOT / "slides.json").read_text(encoding="utf-8").replace("</", "<\\/") + '</script>')
    css = (ROOT / "presentation.css").read_text(encoding="utf-8")
    js = (ROOT / "presentation.js").read_text(encoding="utf-8")
    markup = re.sub(r'<link\b[^>]*href=[\"\'](?:\./)?presentation\.css[\"\'][^>]*>', lambda _: "<style>" + css + "</style>", markup)
    markup = re.sub(r'<script\b[^>]*src=[\"\'](?:\./)?presentation\.js[\"\'][^>]*>\s*</script>', lambda _: "<script>" + js + "</script>", markup)
    return markup


st.markdown("""<style>
header[data-testid="stHeader"] {display:none;}
.block-container {padding: .25rem .35rem 0; max-width:100%;}
iframe[title="st.iframe"] {height:calc(100dvh - 18px) !important; width:100%; border:0;}
[data-testid="stAppViewContainer"] {background:#f5f8ff;}
</style>""", unsafe_allow_html=True)

# v1 is intentionally version-pinned: the deck needs an isolated full-document
# iframe with keyboard navigation, unlike a sanitized text-only HTML fragment.
components.html(bundled_presentation(), height=1000, scrolling=False, tab_index=0)
