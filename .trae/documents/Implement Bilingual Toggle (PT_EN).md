I will implement a bilingual feature (Portuguese/English) with a toggle switch using flag icons in the navbar.

1.  **Add Language Toggle UI**:
    *   Insert **Brazil** (🇧🇷) and **USA** (🇺🇸) flag icons in the Navbar (top right, accessible on mobile/desktop).
    *   These will serve as buttons to switch the site's language.

2.  **Implement Translation Engine**:
    *   Add a JavaScript system to manage content switching instantly without reloading the page.
    *   Tag all text elements in `index.html` with unique `data-i18n` identifiers (e.g., `hero-title`, `exp-netcracker-role`, `nav-contact`).

3.  **Content Translation**:
    *   **Portuguese (Current)**: Keep the existing optimized content.
    *   **English**: Restore the original English content from your PDF for the "Experience" section (e.g., "E2E test cases scenario execution...") and translate the UI elements (Navbar, Headings, Buttons) back to English.
    *   **Marquee**: Create two versions of the scrolling banner (one with "Automação/Bots Inteligentes" and another with "Automation/Smart Bots") to switch accordingly.

4.  **Preserve Links & Styling**:
    *   Ensure all links (WhatsApp, LinkedIn, CV) remain functional in both languages.
    *   Maintain the Neo-Brutalist design consistency across both language states.