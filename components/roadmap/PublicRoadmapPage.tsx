"use client";

import { type ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp, LogOut } from "lucide-react";
import type { RoadmapDraftJson, RoadmapMetaResponse } from "@/lib/roadmap-types";

const ROADMAP_PAGE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --brand: #00a243;
    --brand-hover: #00b849;
    --brand-dark: #007a32;
    --brand-deeper: #005122;
    --accent: #34d67b;
    --glow: rgba(0,162,67,0.28);
    --glow-strong: rgba(0,162,67,0.45);
    --dark: #0f1119;
    --dark-surface: #181b25;
    --dark-elevated: #1e2130;
    --on-dark-primary: #ffffff;
    --on-dark-secondary: rgba(255,255,255,0.75);
    --on-dark-tertiary: rgba(255,255,255,0.55);
    --light-bg: #f7f5ee;
    --light-card: #ffffff;
    --light-text: #0f1119;
    --light-sub: #4a5568;
    --light-border: rgba(0,0,0,0.08);
    --border: rgba(255,255,255,0.07);
    --border-light: rgba(255,255,255,0.12);
    --red: #ef4444;
    --amber: #d69e2e;
    --green: #00a243;
    --m1: #00a243;
    --m2: #007a32;
    --m3: #005122;
  }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--dark); color: var(--on-dark-primary); }
  .roadmap-page {
    font-family: var(--font-sans), Inter, -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--dark);
    color: var(--on-dark-primary);
    line-height: 1.65;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }
  .site-logo { height: 22px; width: auto; display: block; }
  .site-footer-logo { height: 20px; width: auto; display: block; opacity: 0.9; }
  .pw-logo { height: 26px; width: auto; display: block; margin: 0 auto 22px; }
  .site-nav {
    background: var(--dark);
    border-bottom: 1px solid var(--border);
    padding: 18px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-session {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .nav-right { text-align: right; }
  .nav-meta { text-align: right; }
  .nav-client { font-size: 13px; font-weight: 700; color: var(--accent); letter-spacing: 0.02em; }
  .nav-date { font-size: 11px; color: var(--on-dark-secondary); margin-top: 2px; }
  .logout-form { margin: 0; }
  .logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.04);
    color: var(--on-dark-primary);
    border-radius: 999px;
    padding: 9px 12px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    transition: background .2s, border-color .2s, transform .15s, color .2s;
  }
  .logout-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(0,162,67,0.34);
    color: var(--accent);
    transform: translateY(-1px);
  }
  .logout-btn svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
  .scroll-top-wrap {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 120;
  }
  .scroll-top-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(52,214,123,0.28);
    background: linear-gradient(180deg, rgba(24,27,37,0.94), rgba(15,17,25,0.98));
    color: var(--on-dark-primary);
    border-radius: 999px;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 18px 38px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.04) inset;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: transform .18s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease;
  }
  .scroll-top-btn:hover {
    transform: translateY(-2px);
    color: var(--accent);
    border-color: rgba(52,214,123,0.42);
    background: linear-gradient(180deg, rgba(30,33,48,0.98), rgba(15,17,25,1));
    box-shadow: 0 22px 44px rgba(0,0,0,0.4), 0 0 0 1px rgba(52,214,123,0.12) inset;
  }
  .scroll-top-btn:focus-visible {
    outline: 2px solid rgba(52,214,123,0.52);
    outline-offset: 3px;
  }
  .scroll-top-icon {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(0,162,67,0.95), rgba(52,214,123,0.86));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 10px 20px rgba(0,162,67,0.26);
    flex-shrink: 0;
  }
  .scroll-top-icon svg {
    width: 16px;
    height: 16px;
  }
  .scroll-top-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .scroll-top-label {
    color: var(--on-dark-secondary);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .scroll-top-value {
    color: var(--on-dark-primary);
    font-size: 12px;
    font-weight: 800;
  }
  .hero {
    background: var(--dark-surface);
    padding: 64px 40px 56px;
    text-align: center;
    border-bottom: 1px solid var(--border);
  }
  .eyebrow, .gate-eyebrow {
    display: inline-block;
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 7px 16px;
    background: rgba(0,162,67,0.1);
    border: 1px solid rgba(0,162,67,0.3);
    border-radius: 999px;
    margin-bottom: 24px;
  }
  .hero h1 {
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin: 0 0 10px;
    color: var(--on-dark-primary);
  }
  .hero h1 em, .stories-h2 em, .sec-h2 em { color: var(--accent); font-style: italic; }
  .hero-sub { font-size: 1rem; color: var(--on-dark-secondary); margin-bottom: 48px; }
  .hero-metrics {
    display: grid;
    grid-template-columns: repeat(6,1fr);
    gap: 12px;
    max-width: 960px;
    margin: 0 auto;
  }
  .hm {
    background: var(--dark-elevated);
    border: 1px solid var(--border-light);
    border-radius: 10px;
    padding: 18px 14px;
  }
  .hm-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--on-dark-secondary);
    margin-bottom: 8px;
  }
  .hm-value { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; color: var(--on-dark-primary); }
  .hm-value.green { color: var(--accent); }
  .hm-value.warn { color: #fc8181; }
  .hm-value.amber { color: #fbd38d; }
  .proof-strip {
    background: var(--dark-elevated);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 28px 40px;
  }
  .proof-strip-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 32px;
    flex-wrap: wrap;
  }
  .proof-strip-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--on-dark-secondary);
    white-space: nowrap;
  }
  .proof-quotes { flex: 1; display: flex; gap: 24px; flex-wrap: wrap; }
  .proof-quote-item { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 220px; }
  .pq-avatar, .t-avatar {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: linear-gradient(135deg,var(--brand),var(--accent));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .pq-text { font-size: 13px; color: var(--on-dark-secondary); font-style: italic; line-height: 1.5; }
  .pq-name { display: block; font-style: normal; font-size: 11px; font-weight: 700; color: var(--on-dark-secondary); margin-top: 4px; }
  .proof-strip-btn, .btn-sm {
    display: inline-block;
    background: var(--brand);
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    padding: 10px 20px;
    border-radius: 6px;
    text-decoration: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px var(--glow);
    transition: background .2s, transform .15s;
  }
  .proof-strip-btn:hover, .btn-sm:hover, .pw-button:hover {
    background: var(--brand-hover);
    transform: translateY(-1px);
  }
  .health-wrap {
    background: var(--light-bg);
    color: var(--light-text);
    padding: 64px 40px 0;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  .health-inner, .stories-container-wide, .proof-strip-inner, .val-inner, .rm-inner, .cat-grid {
    max-width: 1100px;
    margin: 0 auto;
  }
  .sec-eyebrow, .stories-eyebrow {
    display: block;
    color: var(--brand);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .sec-h2, .stories-h2 {
    font-size: clamp(1.6rem,3.5vw,2.4rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.025em;
    color: var(--light-text);
    margin: 0 0 8px;
  }
  .sec-h2 em, .stories-light .stories-h2 em { color: var(--brand); }
  .sec-lead {
    font-size: 1rem;
    color: var(--light-sub);
    margin-bottom: 36px;
    max-width: 640px;
  }
  .overview-card {
    background: var(--light-card);
    border: 1px solid var(--light-border);
    border-radius: 16px;
    padding: 36px;
    display: flex;
    gap: 48px;
    align-items: flex-start;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }
  .score-block { flex-shrink: 0; width: 164px; }
  .score-circle {
    background: var(--dark);
    border-radius: 12px;
    padding: 22px;
    text-align: center;
    margin-bottom: 14px;
  }
  .score-big { font-size: 52px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -2px; }
  .score-sub { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 6px; }
  .score-meta { font-size: 12px; color: var(--light-sub); line-height: 1.9; }
  .score-meta strong { color: var(--light-text); font-weight: 700; }
  .bars-col { flex: 1; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .bar-label { width: 108px; font-size: 13px; font-weight: 600; color: var(--light-text); flex-shrink: 0; }
  .bar-track { flex: 1; height: 8px; background: #e3e8ef; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; }
  .f-red { background: #ef4444; }
  .f-amber { background: #d69e2e; }
  .f-green { background: #00a243; }
  .bar-pct { width: 48px; font-size: 13px; font-weight: 700; text-align: right; flex-shrink: 0; }
  .c-red { color: #c53030; }
  .c-amber { color: #975a0a; }
  .c-green { color: #007a32; }
  .bar-legend {
    display: flex;
    gap: 20px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #e3e8ef;
    flex-wrap: wrap;
  }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--light-sub); }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
  .val-wrap {
    background: var(--light-bg);
    padding: 28px 40px 52px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  .val-inner {
    background: var(--light-card);
    border-radius: 12px;
    padding: 24px 32px;
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 24px;
    border-left: 4px solid var(--brand);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .val-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--light-sub); margin-bottom: 6px; }
  .val-value { font-size: 22px; font-weight: 800; color: var(--light-text); letter-spacing: -0.03em; }
  .val-value.g { color: var(--brand-dark); }
  .val-value.r { color: #c53030; }
  .val-note { font-size: 11px; color: var(--light-sub); margin-top: 3px; }
  .rm-banner {
    background: var(--dark-surface);
    padding: 52px 40px;
    border-top: 1px solid var(--border);
  }
  .rm-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 32px;
    flex-wrap: wrap;
  }
  .rm-eyebrow { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 10px; }
  .rm-title { font-size: clamp(1.8rem,3.5vw,2.8rem); font-weight: 900; letter-spacing: -0.03em; color: var(--on-dark-primary); }
  .rm-sub { font-size: 15px; color: var(--on-dark-secondary); margin-top: 10px; max-width: 520px; line-height: 1.6; }
  .rm-legend { display: flex; gap: 14px; flex-wrap: wrap; }
  .rl-chip { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--on-dark-secondary); }
  .rl-dot {
    width: 32px;
    height: 22px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #fff;
  }
  .m1-dot, .m1 { background: var(--m1); }
  .m2-dot, .m2 { background: var(--m2); }
  .m3-dot, .m3 { background: var(--m3); }
  .cat-outer { background: var(--light-bg); }
  .cat-grid {
    padding: 44px 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .cat-full { grid-column: 1 / -1; }
  .cat-card {
    background: var(--light-card);
    border: 1px solid var(--light-border);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
  }
  .cc-head {
    padding: 22px 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--light-border);
    background: #fff;
  }
  .cc-head-left { display: flex; align-items: center; gap: 12px; }
  .cc-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: rgba(0,162,67,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .cc-name { font-size: 16px; font-weight: 800; color: var(--light-text); letter-spacing: -0.02em; }
  .cc-tag { font-size: 12px; color: var(--light-sub); margin-top: 1px; }
  .cc-score-block { text-align: right; }
  .cc-score-num { font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; }
  .cc-score-pts { font-size: 11px; color: var(--light-sub); margin-top: 2px; }
  .cc-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    margin-top: 5px;
  }
  .badge-crit { background: rgba(239,68,68,0.08); color: #c53030; }
  .badge-defer { background: #f1f5f9; color: #475569; }
  .badge-green { background: rgba(0,162,67,0.12); color: var(--brand-deeper); }
  .cc-inds {
    padding: 16px 26px;
    background: #f9fafb;
    border-bottom: 1px solid var(--light-border);
  }
  .ind-head, .act-head {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--light-sub);
    margin-bottom: 12px;
  }
  .ind-row, .act-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
  .ind-score {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .is-1 { background: #fff0f0; color: #c53030; }
  .is-2, .is-3 { background: #fffaed; color: #975a0a; }
  .is-4 { background: rgba(0,162,67,0.08); color: var(--brand-dark); }
  .is-5 { background: rgba(0,162,67,0.14); color: var(--brand-deeper); }
  .ind-text { font-size: 12px; color: #4a5568; line-height: 1.55; padding-top: 4px; }
  .cc-acts { padding: 20px 26px; flex: 1; }
  .session-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(0,162,67,0.07);
    border: 1px solid rgba(0,162,67,0.22);
    color: var(--brand-dark);
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  .defer-notice {
    background: #f8fafc;
    border: 1px solid #e3e8ef;
    border-radius: 8px;
    padding: 14px 16px;
    font-size: 13px;
    color: var(--light-sub);
    line-height: 1.6;
  }
  .defer-notice strong { color: var(--light-text); }
  .defer-next-steps { margin: 14px 0 0; padding-left: 18px; }
  .defer-next-steps li { margin-bottom: 8px; }
  .act-chip {
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 4px;
    flex-shrink: 0;
    margin-top: 1px;
    color: #fff;
  }
  .act-text { font-size: 13px; color: #374151; line-height: 1.6; }
  .act-text strong { color: var(--light-text); font-weight: 700; }
  .mid-int {
    background: var(--dark-surface);
    border-radius: 16px;
    padding: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    border: 1px solid var(--border-light);
  }
  .mi-qmark {
    font-size: 80px;
    line-height: 0.8;
    color: rgba(0,162,67,0.22);
    font-family: Georgia, serif;
    font-weight: 800;
    margin-bottom: 10px;
  }
  .mi-quote {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--on-dark-secondary);
    line-height: 1.6;
    max-width: 540px;
    font-style: italic;
  }
  .mi-quote em { color: var(--accent); font-weight: 700; font-style: normal; }
  .mi-author { font-size: 13px; font-weight: 700; color: var(--on-dark-secondary); margin-top: 14px; font-style: normal; }
  .mi-cta { text-align: center; flex-shrink: 0; }
  .mi-cta p { font-size: 13px; color: var(--on-dark-secondary); margin-bottom: 14px; max-width: 200px; line-height: 1.5; }
  .stories-section { padding: 72px 0; background: var(--dark); }
  .stories-section.stories-light {
    background: var(--light-bg);
    color: var(--light-text);
    border-top: 1px solid rgba(0,0,0,0.06);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  .stories-section.stories-cta {
    background: var(--dark-elevated);
    text-align: center;
    border-top: 1px solid var(--border);
  }
  .stories-container { max-width: 880px; margin: 0 auto; padding: 0 24px; }
  .stories-container-wide { padding: 0 40px; }
  .stories-h2 {
    font-size: clamp(1.7rem,4vw,2.6rem);
    line-height: 1.2;
    text-align: center;
    margin-bottom: 1rem;
    color: var(--on-dark-primary);
  }
  .stories-light .stories-h2 { color: var(--light-text); }
  .stories-lead {
    text-align: center;
    font-size: 1.1rem;
    color: var(--on-dark-secondary);
    max-width: 720px;
    margin: 0 auto 3rem;
    line-height: 1.6;
  }
  .stories-light .stories-lead { color: var(--light-sub); }
  .video-grid {
    display: grid;
    grid-template-columns: repeat(6,1fr);
    gap: 28px;
    max-width: 1100px;
    margin: 0 auto 56px;
    padding: 0 40px;
  }
  .video-grid > .v-card { grid-column: span 2; }
  .v-card { display: flex; flex-direction: column; gap: 12px; }
  .v-embed {
    position: relative;
    padding-top: 56.25%;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 6px 22px rgba(0,0,0,0.18);
    border: 1px solid rgba(0,0,0,0.08);
    margin-bottom: 6px;
  }
  .v-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .v-name { font-size: 1.1rem; font-weight: 800; color: var(--light-text); letter-spacing: -0.01em; line-height: 1.2; }
  .v-company { font-size: 0.9rem; color: var(--light-sub); line-height: 1.3; margin-top: -3px; }
  .v-quote { font-size: 0.95rem; font-style: italic; color: #2d3748; line-height: 1.55; margin-top: 6px; }
  .text-grid {
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 24px;
    max-width: 1000px;
    margin: 0 auto;
  }
  .text-grid > .t-card:last-child:nth-child(odd) {
    grid-column: 1 / -1;
    max-width: 488px;
    justify-self: center;
    width: 100%;
  }
  .t-card {
    background: #fff;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    padding: 32px 32px 28px;
    position: relative;
    box-shadow: 0 4px 18px rgba(0,0,0,0.04);
  }
  .t-qmark {
    position: absolute;
    top: 14px;
    right: 22px;
    font-size: 72px;
    line-height: 1;
    color: rgba(0,162,67,0.22);
    font-family: Georgia, serif;
    font-weight: 800;
  }
  .t-stars { display: flex; gap: 4px; margin-bottom: 14px; color: var(--brand); }
  .t-stars svg { width: 16px; height: 16px; fill: currentColor; }
  .t-quote { font-size: 1.05rem; color: var(--light-text); line-height: 1.55; margin-bottom: 22px; font-weight: 500; }
  .t-quote em { color: var(--brand); font-style: normal; font-weight: 700; }
  .t-author { display: flex; align-items: center; gap: 14px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 16px; }
  .t-avatar { width: 44px; height: 44px; font-size: 16px; }
  .t-name { font-size: 0.95rem; font-weight: 700; color: var(--light-text); line-height: 1.2; }
  .t-title { font-size: 0.82rem; color: var(--light-sub); font-weight: 500; margin-top: 2px; }
  .next-section, .stories-cta { background: var(--dark-elevated); padding: 64px 40px; }
  .site-footer {
    background: var(--dark);
    border-top: 1px solid var(--border);
    padding: 36px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .footer-note { font-size: 12px; color: var(--on-dark-secondary); }
  .pw-shell {
    min-height: 100vh;
    background: var(--dark);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .pw-card {
    width: min(100%, 360px);
    padding: 0 24px;
    text-align: center;
  }
  .pw-title {
    margin: 0;
    font-size: clamp(2rem, 5vw, 2.5rem);
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .pw-meta {
    margin: 10px 0 24px;
    color: var(--on-dark-secondary);
    font-size: 0.92rem;
  }
  .pw-form { display: grid; gap: 12px; text-align: left; }
  .pw-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    color: #fff;
    border-radius: 12px;
    padding: 15px 16px;
    font-size: 1rem;
  }
  .pw-input::placeholder { color: rgba(255,255,255,0.38); }
  .pw-button {
    width: 100%;
    border: 0;
    border-radius: 12px;
    padding: 14px 18px;
    background: var(--brand);
    color: #fff;
    font-weight: 800;
    font-size: 0.98rem;
    cursor: pointer;
    box-shadow: 0 10px 24px var(--glow);
    transition: background .2s, transform .15s;
  }
  .pw-error {
    margin: 4px 0 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.22);
    color: #fecaca;
    font-size: 0.9rem;
    text-align: left;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 960px) {
    .hero-metrics { grid-template-columns: repeat(3,1fr); }
    .cat-grid { grid-template-columns: 1fr; padding: 32px 24px; }
    .val-inner { grid-template-columns: repeat(2,1fr); }
    .overview-card, .mid-int { flex-direction: column; }
    .proof-quotes { flex-direction: column; }
    .mi-cta { text-align: left; }
    .text-grid { grid-template-columns: 1fr; }
    .text-grid > .t-card:last-child:nth-child(odd) { max-width: none; }
    .video-grid { grid-template-columns: repeat(2,1fr); gap: 22px; padding: 0 24px; }
    .video-grid > .v-card { grid-column: auto; }
    .hero, .health-wrap, .val-wrap, .rm-banner, .next-section, .stories-cta { padding-left: 24px; padding-right: 24px; }
    .proof-strip, .site-nav, .site-footer { padding-left: 24px; padding-right: 24px; }
    .stories-container-wide { padding: 0 24px; }
    .rm-inner { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 600px) {
    .hero-metrics { grid-template-columns: repeat(2,1fr); }
    .val-inner { grid-template-columns: 1fr; }
    .video-grid { grid-template-columns: 1fr; }
    .cc-head, .site-nav { flex-direction: column; align-items: flex-start; }
    .nav-session { width: 100%; justify-content: space-between; }
    .nav-meta { text-align: left; }
    .nav-right { text-align: left; }
    .cc-score-block { text-align: left; }
    .pw-card { padding: 0 8px; }
    .scroll-top-wrap {
      right: 16px;
      bottom: 16px;
    }
    .scroll-top-btn {
      padding: 10px;
      border-radius: 999px;
    }
    .scroll-top-copy {
      display: none;
    }
  }
`;

const PROOF_QUOTES = [
  {
    initials: "CL",
    quote: "My business has nearly 10x'd since we started working together.",
    name: "Cole Lyon, Lyon SEO",
  },
  {
    initials: "BG",
    quote: "We went from unpredictable revenue to something reliable, and saw a 100% increase month over month.",
    name: "Brennan Gilbert, CounterWeight Studios",
  },
  {
    initials: "CJ",
    quote: "We scaled nearly 6x in recurring revenue within six months. That growth was completely intentional.",
    name: "Carey James, Brand Alchemy",
  },
];

const VIDEO_STORIES = [
  {
    name: "Bob Heid",
    company: "We Are Kymera",
    quote: "The company is going to be worth a lot more than I thought it was going to be.",
    src: "https://player.vimeo.com/video/1183145709?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Bob Heid, We Are Kymera",
  },
  {
    name: "Gregory Perrine",
    company: "Pholio",
    quote: "Seeing the rapid growth we've had out of the sessions with Volare, it is worth every single penny.",
    src: "https://player.vimeo.com/video/1183145823?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Gregory Perrine, Pholio",
  },
  {
    name: "Rocio Aldana",
    company: "Pholio",
    quote: "I didn't know how much we needed it until we had it. And now I don't think that we could exist without it.",
    src: "https://player.vimeo.com/video/1183145619?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Rocio Aldana, Pholio",
  },
  {
    name: "Brennan Gilbert",
    company: "CounterWeight Studios",
    quote: "We went from unpredictable MRR to something reliable, and saw a solid 100% increase month over month.",
    src: "https://player.vimeo.com/video/1188661947?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Brennan Gilbert, CounterWeight Studios",
  },
  {
    name: "Carey James",
    company: "Brand Alchemy",
    quote: "We scaled nearly 6x in recurring revenue within six months. That growth was completely intentional.",
    src: "https://player.vimeo.com/video/1189187059?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Carey James, Brand Alchemy",
  },
  {
    name: "Co-Founders",
    company: "Elevated Tahoe Properties",
    quote: "If your business relies on you heavily, talk to Volare. Highly recommend. Five stars.",
    src: "https://player.vimeo.com/video/1195763906?badge=0&autopause=0&player_id=0&app_id=58479",
    title: "Co-Founders, Elevated Tahoe Properties",
  },
];

const TEXT_TESTIMONIALS = [
  {
    initials: "CL",
    quote: "My business has nearly 10x'd since we started working together.",
    emphasized: "nearly 10x'd",
    name: "Cole Lyon",
    title: "Owner, Lyon SEO",
  },
  {
    initials: "MB",
    quote: "With their coaching and accountability, I 4x'd my monthly revenue. I can't recommend Volare enough.",
    emphasized: "4x'd my monthly revenue",
    name: "Maggie Burns",
    title: "CEO, Flow & Glow MedSpa",
  },
  {
    initials: "MG",
    quote: "Partnering with Volare AI was one of the best decisions we've made for our company's growth.",
    emphasized: "one of the best decisions we've made",
    name: "Mark Grubbs",
    title: "Co-Founder, Belong Designs",
  },
  {
    initials: "ES",
    quote: "Their ability to distill complex concepts into actionable strategies was impressive.",
    emphasized: "actionable strategies",
    name: "Elijah Szasz",
    title: "Co-Founder, SPARK6",
  },
  {
    initials: "SE",
    quote: "This has been one of the best decisions that I could have made.",
    emphasized: "one of the best decisions",
    name: "Shaggy Eells",
    title: "Owner, SLC Events",
  },
  {
    initials: "NH",
    quote: "They've given us clarity, direction, and accountability that helped us scale faster.",
    emphasized: "clarity, direction, and accountability",
    name: "Nolan Harper",
    title: "CMO Brand Alchemy · CEO AgentStack",
  },
  {
    initials: "JK",
    quote: "They gave me great ideas to scale the property to make exponential growth.",
    emphasized: "scale the property",
    name: "Jordan Korczak",
    title: "Owner, Tahoe Mountain Inn",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  financials: "📈",
  sales: "🚀",
  marketing: "📣",
  leadership: "🧵",
  recruiting: "👥",
  productivity: "⚙️",
};

type PublicRoadmapPageProps = {
  meta: RoadmapMetaResponse;
  snapshot: RoadmapDraftJson;
};

type RoadmapPasswordGateProps = {
  slug: string;
  meta: RoadmapMetaResponse;
  errorMessage?: string | null;
};

function scoreToneClass(scorePct: number | null | undefined) {
  if (scorePct == null) {
    return {
      percent: "c-amber",
      fill: "f-amber",
      badge: "badge-defer",
    };
  }
  if (scorePct < 60) {
    return {
      percent: "c-red",
      fill: "f-red",
      badge: "badge-crit",
    };
  }
  if (scorePct < 80) {
    return {
      percent: "c-amber",
      fill: "f-amber",
      badge: "badge-defer",
    };
  }
  return {
    percent: "c-green",
    fill: "f-green",
    badge: "badge-green",
  };
}

function formatPercent(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }
  return `${Math.round(value)}%`;
}

function formatPointsLabel(pointsEarned: number | null | undefined, pointsTotal: number | null | undefined) {
  if (pointsEarned == null || pointsTotal == null) {
    return "Score unavailable";
  }
  return `${pointsEarned} out of ${pointsTotal} points`;
}

function categoryBadgeLabel(category: RoadmapDraftJson["categories"][number]) {
  if (category.focusMode === "deferred") {
    return (category.scorePct ?? 0) >= 80 ? "Well Built" : "Not a Month 1 Priority";
  }
  return "Immediate Action";
}

function indicatorToneClass(score: number | null | undefined) {
  if (score == null) {
    return "is-3";
  }
  const clamped = Math.max(1, Math.min(5, Math.round(score)));
  return `is-${clamped}`;
}

function emphasisText(text: string, emphasized: string) {
  const index = text.indexOf(emphasized);
  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const after = text.slice(index + emphasized.length);
  return (
    <>
      {before}
      <em>{emphasized}</em>
      {after}
    </>
  );
}

function StarRow() {
  return (
    <div className="t-stars" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 24 24">
          <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" />
        </svg>
      ))}
    </div>
  );
}

function MonthChip({ month }: { month: "M1" | "M2" | "M3" }) {
  return <div className={`act-chip ${month.toLowerCase()}`}>{month}</div>;
}

function RevealBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function CategoryCard({
  category,
}: {
  category: RoadmapDraftJson["categories"][number];
}) {
  const tone = scoreToneClass(category.scorePct);
  const badgeClass = category.focusMode === "actions" ? "badge-crit" : tone.badge;

  return (
    <div className="cat-card">
      <div className="cc-head">
        <div className="cc-head-left">
          <div className="cc-icon" aria-hidden="true">
            {CATEGORY_ICONS[category.key] || "•"}
          </div>
          <div>
            <div className="cc-name">{category.label}</div>
            <div className="cc-tag">{category.subtitle}</div>
          </div>
        </div>
        <div className="cc-score-block">
          <div className={`cc-score-num ${tone.percent}`}>{formatPercent(category.scorePct)}</div>
          <div className="cc-score-pts">{formatPointsLabel(category.pointsEarned, category.pointsTotal)}</div>
          <div className={`cc-badge ${badgeClass}`}>{categoryBadgeLabel(category)}</div>
        </div>
      </div>
      <div className="cc-inds">
        <div className="ind-head">Health Assessment Indicators</div>
        {category.indicators.map((indicator, index) => (
          <div key={`${category.key}-indicator-${index}`} className="ind-row">
            <div className={`ind-score ${indicatorToneClass(indicator.score)}`}>{indicator.score ?? "—"}</div>
            <div className="ind-text">{indicator.text}</div>
          </div>
        ))}
      </div>
      <div className="cc-acts">
        <div className="act-head">{category.focusMode === "actions" ? "90-Day Actions" : "This Quarter's Focus"}</div>
        {category.focusMode === "actions" ? (
          <>
            <div className="session-tag">✓ Session Agreed</div>
            {category.actions.length > 0 ? (
              category.actions.map((action, index) => (
                <div key={`${category.key}-action-${index}`} className="act-item">
                  <MonthChip month={action.month} />
                  <div className="act-text">
                    {action.headline ? (
                      <>
                        <strong>{action.headline}</strong>
                        {action.detail ? ` ${action.detail}` : ""}
                      </>
                    ) : (
                      action.detail
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="defer-notice">No advisor-approved 90-day actions are available for this category yet.</div>
            )}
          </>
        ) : (
          <div className="defer-notice">
            <strong>{category.deferredSummary || `${category.label} was not selected as a 90-day priority in this session.`}</strong>
            {category.deferredNextSteps.length > 0 ? (
              <ul className="defer-next-steps">
                {category.deferredNextSteps.map((step, index) => (
                  <li key={`${category.key}-next-step-${index}`}>{step}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function RoadmapPasswordGate({ slug, meta, errorMessage }: RoadmapPasswordGateProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ROADMAP_PAGE_CSS }} />
      <motion.main
        className="pw-shell"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <motion.section
          className="pw-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Image
            src="/volare-logo.png"
            alt="Volare"
            width={160}
            height={42}
            priority
            className="pw-logo"
          />
          <h1 className="pw-title">{meta.companyName}</h1>
          <p className="pw-meta">90-Day Growth Roadmap | {meta.reportDateLabel}</p>
          <form className="pw-form" method="POST" action={`/${slug}/unlock`}>
            <label className="sr-only" htmlFor="roadmap-password">
              Roadmap password
            </label>
            <input
              id="roadmap-password"
              className="pw-input"
              type="password"
              name="password"
              placeholder="Enter Password"
              autoComplete="current-password"
              required
            />
            {errorMessage ? <div className="pw-error">{errorMessage}</div> : null}
            <button className="pw-button" type="submit">
              View Roadmap
            </button>
          </form>
        </motion.section>
      </motion.main>
    </>
  );
}

export function PublicRoadmapPage({ meta, snapshot }: PublicRoadmapPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 480);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ROADMAP_PAGE_CSS }} />
      <motion.main
        className="roadmap-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.nav className="site-nav" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
          <Image
            src="/volare-logo.png"
            alt="Volare"
            width={104}
            height={28}
            priority
            className="site-logo"
          />
          <div className="nav-session">
            <div className="nav-meta">
              <div className="nav-client">{meta.companyName}</div>
              <div className="nav-date">90-Day Growth Roadmap | {snapshot.company.reportDateLabel}</div>
            </div>
            <form className="logout-form" method="POST" action={`/${meta.slug}/logout`}>
              <button className="logout-btn" type="submit" aria-label="Log out of roadmap">
                <LogOut aria-hidden="true" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </motion.nav>

        <RevealBlock>
        <section className="hero">
          <span className="eyebrow">{snapshot.reportMeta.sourceLabel || "Business Health and Value Report"}</span>
          <h1>
            {snapshot.company.companyName}.
            <br />
            <em>Your 90-Day Roadmap.</em>
          </h1>
          <p className="hero-sub">
            {snapshot.company.industry} | {snapshot.company.owners} | {snapshot.company.teamSizeLabel} | {snapshot.company.reportDateLabel}
          </p>
          <div className="hero-metrics">
            <div className="hm">
              <div className="hm-label">Revenue</div>
              <div className="hm-value">{snapshot.heroMetrics.revenueDisplay}</div>
            </div>
            <div className="hm">
              <div className="hm-label">Annual Profit</div>
              <div className="hm-value amber">{snapshot.heroMetrics.annualProfitDisplay}</div>
            </div>
            <div className="hm">
              <div className="hm-label">Growth Rate</div>
              <div className="hm-value">{snapshot.heroMetrics.growthRateDisplay}</div>
            </div>
            <div className="hm">
              <div className="hm-label">Health Score</div>
              <div className="hm-value green">{snapshot.heroMetrics.healthScoreDisplay}</div>
            </div>
            <div className="hm">
              <div className="hm-label">Current Value</div>
              <div className="hm-value warn">{snapshot.heroMetrics.currentValueDisplay}</div>
            </div>
            <div className="hm">
              <div className="hm-label">Value Target</div>
              <div className="hm-value">{snapshot.heroMetrics.valueTargetDisplay}</div>
            </div>
          </div>
        </section>
        </RevealBlock>

        <RevealBlock delay={0.04}>
        <div className="proof-strip">
          <div className="proof-strip-inner">
            <div className="proof-strip-label">What founders say</div>
            <div className="proof-quotes">
              {PROOF_QUOTES.map((item) => (
                <div key={item.name} className="proof-quote-item">
                  <div className="pq-avatar">{item.initials}</div>
                  <div className="pq-text">
                    “{item.quote}”
                    <span className="pq-name">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="https://stories.volare.ai/" target="_blank" rel="noopener noreferrer" className="proof-strip-btn">
              Read All Stories
            </a>
          </div>
        </div>
        </RevealBlock>

        <RevealBlock delay={0.04}>
        <div className="health-wrap">
          <div className="health-inner">
            <span className="sec-eyebrow">{snapshot.reportMeta.assessmentLabel || "Propeller Health Assessment"}</span>
            <h2 className="sec-h2">
              Your business health, <em>scored.</em>
            </h2>
            <p className="sec-lead">{snapshot.healthSummary.lead || snapshot.reportMeta.summaryLead}</p>
            <div className="overview-card">
              <div className="score-block">
                <div className="score-circle">
                  <div className="score-big">{formatPercent(snapshot.healthSummary.overallScorePct)}</div>
                  <div className="score-sub">{formatPointsLabel(snapshot.healthSummary.pointsEarned, snapshot.healthSummary.pointsTotal)}</div>
                </div>
                <div className="score-meta">
                  <strong>Industry:</strong> {snapshot.company.industry}
                  <br />
                  <strong>Profit Multiple:</strong> {snapshot.reportMeta.profitMultipleDisplay} (avg {snapshot.reportMeta.industryAverageMultipleDisplay})
                  <br />
                  <strong>Exit Timeline:</strong> {snapshot.reportMeta.exitTimeline}
                  <br />
                  <strong>Exit Goal:</strong> {snapshot.reportMeta.exitGoalDisplay}
                </div>
              </div>
              <div className="bars-col">
                {snapshot.healthSummary.pillars.map((pillar) => {
                  const tone = scoreToneClass(pillar.scorePct);
                  return (
                    <div key={pillar.key} className="bar-row">
                      <div className="bar-label">{pillar.label}</div>
                      <div className="bar-track">
                        <div className={`bar-fill ${tone.fill}`} style={{ width: `${Math.max(0, Math.min(100, pillar.scorePct ?? 0))}%` }} />
                      </div>
                      <div className={`bar-pct ${tone.percent}`}>{formatPercent(pillar.scorePct)}</div>
                    </div>
                  );
                })}
                <div className="bar-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#ef4444" }} />
                    Below 60% - Act Now
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#d69e2e" }} />
                    60 to 80% - Right Direction
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#00a243" }} />
                    Above 80% - Well Built
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </RevealBlock>

        <RevealBlock delay={0.05}>
        <div className="val-wrap">
          <div className="val-inner">
            <div>
              <div className="val-label">Current Value (Profit-Based)</div>
              <div className="val-value r">{snapshot.valuationSummary.currentValueDisplay}</div>
              <div className="val-note">{snapshot.valuationSummary.currentValueNote}</div>
            </div>
            <div>
              <div className="val-label">Value at Industry Average</div>
              <div className="val-value">{snapshot.valuationSummary.industryAverageValueDisplay}</div>
              <div className="val-note">{snapshot.valuationSummary.industryAverageValueNote}</div>
            </div>
            <div>
              <div className="val-label">Value at Industry High</div>
              <div className="val-value g">{snapshot.valuationSummary.industryHighValueDisplay}</div>
              <div className="val-note">{snapshot.valuationSummary.industryHighValueNote}</div>
            </div>
            <div>
              <div className="val-label">Your Identified Gap</div>
              <div className="val-value">{snapshot.valuationSummary.valueGapDisplay}</div>
              <div className="val-note">{snapshot.valuationSummary.valueGapNote}</div>
            </div>
          </div>
        </div>
        </RevealBlock>

        <RevealBlock delay={0.06}>
        <div className="rm-banner">
          <div className="rm-inner">
            <div>
              <div className="rm-eyebrow">Your 90-Day Plan</div>
              <div className="rm-title">Prioritized Action Roadmap</div>
              <p className="rm-sub">
                Actions are sequenced across three months to maximize leverage on your health score and enterprise value. Start with Month 1 items first.
              </p>
            </div>
            <div className="rm-legend">
              <div className="rl-chip">
                <div className="rl-dot m1-dot">M1</div>
                Month 1
              </div>
              <div className="rl-chip">
                <div className="rl-dot m2-dot">M2</div>
                Month 2
              </div>
              <div className="rl-chip">
                <div className="rl-dot m3-dot">M3</div>
                Month 3
              </div>
            </div>
          </div>
        </div>
        </RevealBlock>

        <RevealBlock delay={0.06}>
        <div className="cat-outer">
          <div className="cat-grid">
            {snapshot.categories.flatMap((category, index) => {
              const card = <CategoryCard key={category.key} category={category} />;

              if (index !== 2) {
                return card;
              }

              return [
                <div key="mid-interstitial" className="cat-full">
                  <div className="mid-int">
                    <div>
                      <div className="mi-qmark">“</div>
                      <p className="mi-quote">
                        Partnering with Volare was <em>one of the best decisions we’ve made</em> for our company’s growth. Their finance-first approach blends actionable strategies with the operational discipline we needed to scale.
                      </p>
                      <p className="mi-author">Mark Grubbs, Co-Founder | Belong Designs</p>
                    </div>
                    <div className="mi-cta">
                      <p>See what founders across industries have built with Volare.</p>
                      <a href="https://stories.volare.ai/" target="_blank" rel="noopener noreferrer" className="btn-sm">
                        Read Founder Stories
                      </a>
                    </div>
                  </div>
                </div>,
                card,
              ];
            })}
          </div>
        </div>
        </RevealBlock>

        <RevealBlock delay={0.08}>
        <section className="stories-section" style={{ padding: "56px 0 40px", background: "var(--dark-surface)", textAlign: "center", borderTop: "1px solid var(--border)" }}>
          <div className="stories-container">
            <span className="eyebrow">Founder Stories</span>
            <h2 className="stories-h2">
              Real founders. <em>Real numbers.</em>
            </h2>
            <p className="stories-lead">
              A look at what owners of founder-led companies have said about working with Volare on growth, valuation, and exit readiness.
            </p>
          </div>
        </section>
        </RevealBlock>

        <RevealBlock delay={0.08}>
        <section className="stories-section stories-light">
          <div className="stories-container-wide">
            <span className="stories-eyebrow">In Their Own Words</span>
            <h2 className="stories-h2">
              The change, told by the founders <em>who lived it.</em>
            </h2>
            <p className="stories-lead">
              Short videos from Volare advisory clients on what shifted in their business, their numbers, and their day-to-day.
            </p>

            <div className="video-grid">
              {VIDEO_STORIES.map((story) => (
                <div key={story.title} className="v-card">
                  <div className="v-embed">
                    <iframe
                      src={story.src}
                      title={story.title}
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                  <div className="v-name">{story.name}</div>
                  <div className="v-company">{story.company}</div>
                  <p className="v-quote">“{story.quote}”</p>
                </div>
              ))}
            </div>

            <div className="text-grid">
              {TEXT_TESTIMONIALS.map((item) => (
                <div key={item.name} className="t-card">
                  <span className="t-qmark">“</span>
                  <StarRow />
                  <p className="t-quote">“{emphasisText(item.quote, item.emphasized)}”</p>
                  <div className="t-author">
                    <span className="t-avatar">{item.initials}</span>
                    <div>
                      <div className="t-name">{item.name}</div>
                      <div className="t-title">{item.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </RevealBlock>

        <RevealBlock delay={0.1}>
        <section className="stories-section stories-cta">
          <div className="stories-container">
            <h2 className="stories-h2">
              Ready to propel your business <em>beyond expectations?</em>
            </h2>
            <p style={{ color: "var(--on-dark-secondary)", maxWidth: "640px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
              Your 90-day roadmap is built. Use this plan to start closing the gap between {snapshot.valuationSummary.currentValueDisplay} and {snapshot.reportMeta.exitGoalDisplay}.
            </p>
            <p style={{ color: "var(--on-dark-secondary)", fontSize: "14px", marginTop: "8px" }}>
              Volare Advisory | {snapshot.company.reportDateLabel}
            </p>
          </div>
        </section>
        </RevealBlock>

        <motion.footer className="site-footer" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.35, ease: "easeOut" }}>
          <Image
            src="/volare-logo.png"
            alt="Volare"
            width={96}
            height={24}
            className="site-footer-logo"
          />
          <div className="footer-note">
            Prepared for {snapshot.company.companyName} | {snapshot.company.reportDateLabel} | Confidential | Volare works with founder-led companies between $1M and $15M in revenue.
          </div>
        </motion.footer>

        <AnimatePresence>
          {showScrollTop ? (
            <motion.div
              key="scroll-top"
              className="scroll-top-wrap"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <button className="scroll-top-btn" type="button" onClick={handleScrollToTop} aria-label="Scroll to top">
                <span className="scroll-top-icon" aria-hidden="true">
                  <ChevronUp />
                </span>
                <span className="scroll-top-copy">
                  <span className="scroll-top-label">Back to</span>
                  <span className="scroll-top-value">Top</span>
                </span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.main>
    </>
  );
}
