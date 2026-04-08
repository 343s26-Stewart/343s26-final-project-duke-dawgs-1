# Copilot Instructions

This is a client-side web application for a university course project.

## Constraints

- **Vanilla only.** Use plain HTML, CSS, and JavaScript. Do not use frameworks (React, Vue, Svelte, Angular, etc.). Client-side libraries like Chart.js or Grid.js are permitted.
- **No build tools.** No bundlers, transpilers, or package managers (no npm, no Webpack, no Vite). The app must run directly in the browser from static files.
- **Data persistence.** Use `localStorage` (or OPFS) to save and retrieve user data. Do not use a backend database.
- **Data export and import.** Support exporting data as a downloadable JSON file and importing data from a JSON file.
- **Third-party API.** Integrate with at least one public third-party API using `fetch`. Do not use server-side proxies.
- **Responsive design.** The layout must work on screens 320px wide and larger. Use CSS media queries or flexible layouts.
- **Accessibility.** Follow WCAG 2.1 AA guidelines: semantic HTML5 elements, logical heading hierarchy, alt text for images, sufficient color contrast, and keyboard navigability.

## Code Style

- Use semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) instead of generic `<div>` elements where appropriate.
- Separate concerns: HTML for structure, CSS for presentation, JavaScript for behavior. Avoid inline styles and inline event handlers.
- Organize code into separate files: one HTML file per page/view, one shared CSS file, and modular JS files by feature.
- Use `const` and `let` (never `var`). Use descriptive variable and function names.
- When generating code, include brief comments explaining non-obvious logic. Avoid generating large blocks of code all at once—build features incrementally.
- Handle API errors gracefully and display user-friendly messages.
