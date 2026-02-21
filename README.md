# Car Cost Comparison Calculator

A Canadian car cost comparison tool that lets you evaluate vehicles side-by-side with financing scenarios, provincial taxes, and lifetime ownership costs.

**Live:** [noahwc.github.io/integra-interest](https://noahwc.github.io/integra-interest/)

## Features

- **Multi-car comparison** -- add, duplicate, and compare vehicles side-by-side with collapsible cards
- **Financing scenarios** -- multiple scenarios per car with configurable interest rates, loan terms, down payments, and payment frequencies (monthly, biweekly, semi-monthly, weekly)
- **Canadian tax support** -- all 13 provinces and territories with accurate combined tax rates
- **Lifetime cost analysis** -- projects total ownership cost factoring in vehicle age limits, mileage caps, and optional fuel costs
- **Detailed cost breakdown** -- vehicle price, dealership fees (freight/PDI, A/C tax, tire levy, dealer fee), taxes, interest, and totals
- **Shareable links** -- copy a URL to share your comparison with others
- **Auto-save** -- all data persists in the browser via localStorage
- **Undo delete** -- toast notification with undo when removing a car
- **Responsive** -- works on desktop and mobile with adaptive navbar

## Tech Stack

- [Astro](https://astro.build) -- static site framework
- [SolidJS](https://www.solidjs.com) -- reactive UI library
- [Tailwind CSS v4](https://tailwindcss.com) -- utility-first CSS
- [DaisyUI v5](https://daisyui.com) -- Tailwind component library
- [TypeScript](https://www.typescriptlang.org) -- type-safe JavaScript

## Development

```sh
npm install          # install dependencies
npm run dev          # start dev server at localhost:4321
npm run build        # build static site to ./dist/
npm run preview      # preview production build locally
npm run lint         # run ESLint
```

## Deployment

Pushes and merges to `main` automatically deploy to GitHub Pages via the workflow in `.github/workflows/deploy.yml`.
