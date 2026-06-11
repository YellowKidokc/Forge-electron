# FORGE UI Refinements — June 10, 2026
## Feedback from Kimi v1 prototype review

### 1. Theme: Neutral Black Frame
The v1 prototype uses MDA-specific styling (red accent, ember theme). This is
wrong for the shell — the shell is the frame, not the painting.

**Rule:** The React shell frame (topbar, sidebar, footer, layer toggle buttons)
is all-black / dark gray. Neutral. No series-specific accent colors in the frame.

The CONTENT inside brings its own accent color:
- MDA articles → red (#dc2626) + amber (#f59e0b)
- Isomorphism articles → their own palette
- GTQ articles → their own palette
- Bible content → their own palette

The frame is always:
```
--frame-bg:      #050505
--frame-surface: #0a0a0a
--frame-border:  rgba(255,255,255,0.06)
--frame-text:    #999
--frame-text-active: #fff
```

Content accent colors come from the loaded article's CSS, not from the shell.

### 2. Claims Layer: Inline Expansion (NOT tab switching)
The claims layer does NOT replace the article content with a "claims view."
It overlays on top of the original text.

**How it works:**
1. User activates "Claims" layer toggle
2. Sentences that contain claims get a subtle left border or faint background
3. User clicks a highlighted sentence
4. Underneath that sentence, a panel expands showing:
   - **Claim type:** core / support / consequence / thesis
   - **Evidence:** what backs this claim (citations, data references)
   - **Kill condition:** what would falsify this claim
   - **Revision history:** what was changed from earlier drafts, what was rewritten
   - **Status:** accepted / candidate / killed
5. Click again or click another sentence → panel collapses
6. Multiple panels can be open simultaneously
7. Original text NEVER moves — annotations grow underneath

**The interaction pattern:**
```
Original sentence sits here as normal text.
  ┌─────────────────────────────────────────────┐
  │ CLAIM: core                                  │
  │ This sentence asserts X is true because Y.   │
  │                                              │
  │ EVIDENCE: SESHAT dataset r=0.69, ρ=0.82      │
  │ KILL: Find 3 civilizations that recovered     │
  │       without external moral intervention     │
  │ CHANGED: v2 softened "proves" to "indicates"  │
  │ STATUS: accepted                              │
  └─────────────────────────────────────────────┘
Next sentence continues normally.
```

This is fundamentally different from Easy/Academic tab switching (which swaps
the whole section). Claims mode is additive — it adds depth underneath specific
sentences without replacing anything.

### 3. Both patterns coexist
- **Section-level toggles** (Easy / Academic) → swap reading depth of whole section
- **Inline expansion** (Claims / Math Translation) → add depth under specific sentences

These are two zoom levels of the same system. The shell supports both.