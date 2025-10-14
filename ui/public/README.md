# 📁 Public Assets Folder

## 🎯 Place Your Logo Here

### **Main Logo**
```
📄 logo.png  ← Place your transparent PNG logo here
```

**This file will appear in:**
- Premium header (56×56px with gold glow)
- Any other place you add it

**Requirements:**
- Format: PNG with transparency
- Size: 512×512px or larger (recommended)
- Background: Transparent
- File size: < 200KB

---

## 📋 Recommended Files

```
public/
├── logo.png              ← Main logo (REQUIRED)
├── logo-white.png        ← White version (optional)
├── logo-large.png        ← High-res version (optional)
├── favicon.ico           ← Browser tab icon (recommended)
├── apple-touch-icon.png  ← iOS icon (recommended)
├── robots.txt            ← SEO (optional)
└── sitemap.xml           ← SEO (optional)
```

---

## 🚀 Quick Start

1. **Add your logo**:
   ```bash
   cp /path/to/your/logo.png ./logo.png
   ```

2. **Restart dev server** (if running):
   ```bash
   npm run dev
   ```

3. **View your logo** at `http://localhost:3000`

---

## 🎨 Logo Specifications

### **Optimal Settings**
- **Dimensions**: 512×512px to 1024×1024px
- **Format**: PNG-24 or PNG-32
- **Transparency**: Yes (alpha channel)
- **Color Mode**: RGB + Alpha
- **File Size**: < 200KB
- **DPI**: 72 or higher

### **Design Tips**
✅ Simple, bold shapes
✅ Clear at small sizes
✅ High contrast
✅ Works on gold background
❌ Avoid thin lines
❌ Avoid too much detail

---

## 🌐 How Next.js Serves These Files

Files in `/public` are served from the root URL:

```
/public/logo.png          → http://localhost:3000/logo.png
/public/favicon.ico       → http://localhost:3000/favicon.ico
/public/images/hero.jpg   → http://localhost:3000/images/hero.jpg
```

In your components, reference them with `/`:

```tsx
<img src="/logo.png" alt="Logo" />
<link rel="icon" href="/favicon.ico" />
```

---

## 📖 Full Documentation

See `/LOGO_GUIDE.md` in the project root for complete instructions.

---

## ⚠️ Important Notes

1. **No Code Changes Needed**: Just drop `logo.png` here and restart the server
2. **Case Sensitive**: Ensure filename is exactly `logo.png` (lowercase)
3. **No Gitignore**: Files here are typically committed to version control
4. **Cache**: Browser might cache old logo, use hard refresh (Ctrl+Shift+R)

---

**Ready!** Just add your `logo.png` file here and it will automatically appear in the premium header! ✨
