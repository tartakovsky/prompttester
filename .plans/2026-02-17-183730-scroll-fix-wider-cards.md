# Fix scroll behavior and widen model sidebar cards

**Date:** 2026-02-17 18:37
**Task:** Fix bouncy/elastic scroll and widen sidebar list items

## Goal
Normal scroll behavior (no elastic overscroll), wider sidebar cards so model names aren't truncated.

## Approach
1. Add `overscroll-behavior: none` to html/body in globals.css to kill elastic scrolling
2. Widen ItemList from 160px to 200px so model names like "Gemini 2.0 Flash" display fully
