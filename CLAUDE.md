# teachercolin.com — working notes

Static site: plain HTML, CSS and JS, deployed by Netlify from `main`.

## Device priorities

Different kinds of page are used on different devices. Design and test for the
right ones.

**Station pages and other in-class activities** (the `*-stations/` folders and
similar): students use these in class on **laptops first, tablets second, and
never phones.**

- Design for laptop widths (about 1280–1440px) first.
- Make sure they still work on tablets (768–1024px, portrait and landscape),
  including touch for any drag, tap or matching interactions.
- Phone width is not a target. Don't simplify a layout, or hold back a richer
  laptop design, to make it fit a phone, and don't treat phone-only overflow
  as a bug.

**Class pages and assignment pages** (`8-athens.html`, `9-zurich.html`,
`10-edmonton.html`, `assignments/`) are different: students and parents open
these at home, often on phones. Keep them responsive down to phone width.

## Student materials

The answer key is always a separate file, never inside a student-facing page.
