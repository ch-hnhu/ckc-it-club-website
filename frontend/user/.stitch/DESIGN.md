# CKC IT Club — Design System

## 1. Brand Identity
- **Name**: CKC IT CLUB
- **Tagline**: Học IT dễ hơn khi bạn không học một mình
- **Target**: Gen Z sinh viên IT, Việt Nam

## 2. Color Palette
| Token | Hex | Usage |
|---|---|---|
| Primary | `#A3E635` | CTA buttons, active states, highlights |
| Secondary | `#35D399` | Secondary accents, success states |
| Background | `#FFFFFF` | Page background |
| Surface | `#F9FAFB` | Card backgrounds |
| Border | `#111111` | All card/button borders |
| Text Primary | `#111111` | Headings, body text |
| Text Secondary | `#6B7280` | Subtext, captions |
| Accent Green Light | `#D2FAE5` | Card fills, pastel accents |
| Accent Blue Light | `#BFD9FE` | Card fills, pastel accents |
| Accent Pink Light | `#FFDEDE` | Card fills, pastel accents |
| Accent Yellow Light | `#FEF3C8` | Card fills, pastel accents |
| Accent Amber | `#FBBF25` | Badge, warning states |
| Accent Purple Light | `#FAE9FF` | Card fills, pastel accents |
| Accent Purple | `#F5D1FE` | Gradient accents |

## 3. Typography
| Role | Font | Weight | Size |
|---|---|---|---|
| Display Heading | Be Vietnam Pro | 800 | 60–72px |
| Section Heading | Be Vietnam Pro | 700 | 32–40px |
| Card Title | Be Vietnam Pro | 600 | 20–24px |
| Body | Inter | 400 | 16px |
| Caption/Label | Inter | 500 | 12–14px |

## 4. Soft Neobrutalism Specification
```
Cards:
  border: 2px solid #111111
  border-radius: 12–16px
  box-shadow: 4px 4px 0px #111111
  background: pastel accent (e.g. #D2FAE5, #BFD9FE, #FFDEDE)
  padding: 24px

Buttons (Primary):
  background: #A3E635
  color: #111111
  border: 2px solid #111111
  border-radius: 12px
  box-shadow: 3px 3px 0px #111111
  font-weight: 700

Buttons (Secondary/Outline):
  background: transparent
  color: #111111
  border: 2px solid #111111
  border-radius: 12px

Hover effects:
  transform: scale(1.03) translateY(-2px)
  box-shadow intensify: 5px 5px 0px #111111
  transition: all 200ms ease
```

## 5. Spacing & Layout
- Max content width: `1280px`
- Section padding: `80px 0`
- Grid gap: `24px`
- Card internal padding: `24px`

## 6. Design System Notes for Stitch Generation

**ALWAYS USE THIS BLOCK IN EVERY STITCH PROMPT:**

This is a Soft Neobrutalism landing page for CKC IT CLUB, a Vietnamese student IT club.

**Visual Style:**
- White (#FFFFFF) background with generous whitespace
- Cards with: 2px solid black border, 12-16px border-radius, 4px 4px 0px black box-shadow, pastel backgrounds
- Primary CTA button: #A3E635 lime-green background, black border, black text, bold
- Secondary button: white background, black border, black text
- Font: Be Vietnam Pro for headings (bold), Inter for body text
- Hover: scale(1.03), deeper shadow
- Layout: clean, playful, Gen Z friendly, well-spaced

**Color accents for cards (rotate through):** #D2FAE5, #BFD9FE, #FFDEDE, #FEF3C8, #FAE9FF, #F5D1FE

**Dark mode:** #111111 background, white text, card backgrounds #1e1e1e, same border style

**DO NOT USE:** dark navy, glowing blue effects, glassmorphism, cyberpunk aesthetics.
