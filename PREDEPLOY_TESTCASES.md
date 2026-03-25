# Pre-Deployment Test Cases

Use this checklist before every production deployment.

## Automated Checks

| ID | Area | Test Case | Expected Result | Status |
| --- | --- | --- | --- | --- |
| A-01 | Build | Run `npm run build` | Production build completes without errors | Passed |
| A-02 | Release | Run `npm run release:check` | Build, sitemap, robots, and env validation succeed | Passed |
| A-03 | SEO | `dist/robots.txt` exists | File generated successfully | Passed |
| A-04 | SEO | `dist/sitemap.xml` exists | File generated successfully | Passed |
| A-05 | SEO | `dist/sitemap.xml` excludes `/dashboard` | Private route is not indexed | Passed |
| A-06 | Security | Vercel config contains security headers | Headers present in deployment config | Passed |

## Manual Browser Tests

| ID | Area | Test Case | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- | --- |
| M-01 | Home | Landing page loads | Open `/` | Hero, stats, trending, footer load without blank screen | Pending |
| M-02 | Notes | Notes page loads | Open `/notes` | Resources list loads and filter bar works | Pending |
| M-03 | PYQ | PYQ page loads | Open `/pyq` | Papers list loads and page switch works | Pending |
| M-04 | Syllabus | Syllabus page loads | Open `/syllabus` | Syllabus list loads without console errors | Pending |
| M-05 | Filters | Branch filter works | Select a branch on notes page | Results update correctly | Pending |
| M-06 | Search | Search works | Type a subject title in search box | Matching resources appear | Pending |
| M-07 | Pagination | Pagination works | Go to page 2 on any resource list | New page data loads correctly | Pending |
| M-08 | Download | Download works | Click `Download` on a resource with file URL | PDF opens/downloads and no UI crash occurs | Pending |
| M-09 | Preview | Preview works | Click `Preview` on a resource | PDF preview opens in new tab | Pending |
| M-10 | Auth | Sign up works | Create a new account | Registration succeeds and sign-in is available | Pending |
| M-11 | Auth | Sign in works | Log in with valid user | Dashboard/auth state updates correctly | Pending |
| M-12 | Auth | Logout works | Click logout | User session clears and UI updates | Pending |
| M-13 | Comments | Comment submission works | Open resource comments and submit comment | Comment appears in list | Pending |
| M-14 | Ratings | Rating submission works | Rate a resource | Rating updates without duplicate requests or crash | Pending |
| M-15 | Forum | Create question works | Open `/discussions` and post a thread | Thread appears in list | Pending |
| M-16 | Forum | Comment on thread works | Open a thread and comment | Comment is saved and visible | Pending |
| M-17 | SEO | Canonical is correct | Inspect page source on live domain | Canonical uses production domain | Pending |
| M-18 | SEO | Sitemap is live | Open `/sitemap.xml` on live site | XML loads with public routes only | Pending |
| M-19 | SEO | Robots is live | Open `/robots.txt` on live site | File loads and points to live sitemap | Pending |
| M-20 | Ads | Ad slots behave correctly | Open pages with/without AdSense env vars | Real ads load when configured, hidden otherwise | Pending |
| M-21 | Mobile | Mobile layout works | Test in responsive mode | Navbar, cards, buttons remain usable | Pending |
| M-22 | Error Handling | Missing env fallback behaves | Open a broken local build or misconfigured deploy | App shows configuration error instead of blank crash | Pending |

## Recommended Release Flow

1. Run `npm run release:check`
2. Deploy to preview/staging
3. Complete manual cases `M-01` to `M-22`
4. Fix any failure
5. Deploy to production
