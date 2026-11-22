# Azterisk PDF Studio (`pdf.azterisk.net`)

An all-in-one, privacy-first PDF workstation. Merge documents, split pages, visually rearrange, remove pages, and annotate/edit PDFs in a single unified workflow — with **zero signups, zero fees, and 100% client-side processing**.

---

## ✨ Features

- **📑 Merge Documents**: Drag & drop multiple PDF files. Combine invoices, reports, scanned receipts, and slide decks effortlessly.
- **🔀 Visual Drag-and-Drop Reordering**: View rendered high-resolution thumbnails of every page across all documents and reorder them visually in real-time.
- **✂️ Split Documents**:
  - Extract each page into individual standalone PDFs packaged as a ZIP.
  - Split by custom page ranges (e.g. `1-3, 4-7, 8-10`).
  - Extract only checked/selected pages into a new PDF.
  - Split back into original files preserving edits and reorderings.
- **🗑️ Remove & Duplicate Pages**: One-click deletion or duplication of individual or batched pages.
- **🔄 Rotate Pages**: Rotate 90° clockwise/counter-clockwise or 180° per page or in batch across selected pages.
- **✍️ Full Page Editor & Annotations**:
  - **Pen**: Freehand markup with custom stroke width and colors.
  - **Highlighter**: Translucent color highlights for reading and reviewing.
  - **Add Text**: Place movable, editable text boxes with custom font size, weight, and color.
  - **Digital Signatures**: Dedicated smooth signature drawing pad to create, scale, and stamp transparent digital signatures directly onto documents.
  - **Redact & Whiteout**: Solid black or white redaction boxes to cover sensitive numbers, PII, or confidential notes.
  - **Stamps**: One-click preset status stamps (`APPROVED`, `CONFIDENTIAL`, `DRAFT`).
  - **Undo / Redo**: Step back and forth through any edits.
- **🔢 Page Numbering**: Add customized header or footer page numbers (`Page {n} of {total}` or `{n}`) with position and styling controls.
- **🔒 100% Private & Free**: All processing is performed strictly in the user's browser using `pdf-lib` and `pdfjs-dist`. Files never leave the client's machine or touch a remote server.
- **🎨 Authentic Azterisk Gruvbox Palette**: Warm retro-modern design system aligned with Azterisk branding (`#1d2021`, `#282828`, `#fabd2f`, `#ebdbb2`).

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 20+)

### Local Development

```bash
# Clone the repository
cd C:\Users\thera\code\pdf.azterisk.net

# Install dependencies (automatically prepares pdf.worker.min.mjs)
bun install

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
bun start
```

---

## 🌐 Deploying to Vercel

1. Push this repository to your GitHub account (e.g. `github.com/azterisk/pdf.azterisk.net`).
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import the repository:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun run build` (or default `next build`)
   - **Output Directory**: `.next`
4. Go to **Settings > Domains** in your Vercel project dashboard.
5. Add `pdf.azterisk.net` and configure your DNS CNAME record:
   - Type: `CNAME`
   - Name: `pdf`
   - Value: `cname.vercel-dns.com`

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **PDF Manipulation**: `pdf-lib`
- **PDF Rendering**: `pdfjs-dist` (client-side worker)
- **Archive Packaging**: `jszip`
