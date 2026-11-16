# MCP Code Website

Product website, setup guides, and release news for [MCP Code](https://github.com/Axz-o/MCPCode).

Built with Next.js (static export), Tailwind CSS, and Motion, deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Static build

```bash
npm run build
```

When deploying under a GitHub Pages subpath:

```bash
NEXT_PUBLIC_BASE_PATH=/MCPCode-site NEXT_PUBLIC_SITE_URL=https://axz-o.github.io/MCPCode-site npm run build
```

## Adding guides or news

- **Guides**: add a `.md` file in `content/guides/`
- **News**: add a `.md` file in `content/news/`

Screenshots used by guides live in `public/screenshots/`.

## License

MIT
