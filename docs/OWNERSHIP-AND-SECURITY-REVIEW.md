# Ownership, licensing, and repository hygiene review

Review date: 2026-10-28. Scope: this working tree and locally available Git refs.
This is a technical review of custom legal documentation, not a legal opinion or an
assurance that the project has no ownership, licensing, or security defects.

## Owner instructions

- Copyright holder: **Htet Ko Oo**, confirmed by the owner.
- The owner states they are the sole developer and original author.
- Omit a governing-law/country and forum-selection clause, as requested.
- Keep the repository public, permit use of the hosted app and controlled PRs,
  and restrict independent source reuse and commercialization.
- No application behavior, dependencies, architecture, Git history, deployment,
  or remote repository settings are changed by this documentation work.

## Licensing findings

1. Before this update, `package.json` declared ISC, and all seven historical revisions of
   that file in the available refs also declare ISC, starting with the setup
   commit `a751b10` (2026-09-07). No historical LICENSE, NOTICE, or CONTRIBUTING
   file was found by the filename/path checks. The declaration is an important
   potential prior-permission conflict, even if it was a setup default. Absence
   of a full license file does not establish that no rights were granted.
2. After the finding was explained, the owner explicitly approved changing the
   current project to a proprietary license. Package metadata now declares
   `SEE LICENSE IN LICENSE`, pointing to the custom terms. The new documents
   preserve any valid earlier grants; no historical metadata was edited.
3. Git authorship lists one name using two email identities. This is consistent
   with the owner's statement; commit metadata cannot prove originality or
   exclude employer, contractor, asset-owner, or other third-party interests.
4. Direct runtime dependency metadata inspected locally declares MIT, Apache-2.0,
   and ISC licenses. These licenses remain separate from the proprietary license.
   For example, Lucide's ISC declaration is a third-party license and must not be
   replaced just because the root project's metadata changes. No incompatible
   license was identified in this limited direct-dependency review. Transitive
   packages, complete notice obligations, external services' terms, artwork,
   screenshots, and videos have not received a comprehensive legal clearance.
5. No other original-source license notices were found by the focused text
   search. This is not a provenance audit of every file or historical publication.

## License design and consistency

LICENSE, CONTRIBUTING.md, and the appended README section use the same owner and
proprietary/source-available classification. They allow viewing, portfolio review,
limited local evaluation and contribution work, and use of the offered hosted app.
They prohibit independent deployments/products and unrestricted redistribution or
commercial reuse, subject to earlier valid grants, third-party rights, applicable
law, and hosting-platform permissions. Evaluation instructions in the existing
README remain intact but are explicitly subject to the limited license grant.

GitHub's public-repository viewing and in-service forking permissions are expressly
preserved. Keeping a repository public cannot technically prevent copying. Source
availability is not an OSI-approved open-source license or permission for an
independent product. The license does not authorize access to private user data.

PR submission does not assign copyright. Copyrightable outside contributions
require a separate signed rights agreement before merging/releasing them. A future
ICLA should retain contributor ownership while granting adequate commercial and
relicensing rights to the owner. Employer-owned contributions may need a corporate
agreement. No actual CLA, signature workflow, branch protection, or automated merge
gate is implemented here.

## Security and sensitive-file findings

### Checks performed

- Inspected `.gitignore`, tracked filenames, `.env.example` variable population,
  package metadata, local author history, and license-related history paths.
- Scanned tracked text files for private-key headers, common provider-token
  formats, credential-bearing URLs, and selected secret assignments. Secret
  values were never printed in the review output.
- Scanned **626 historical text blobs** reachable from locally available refs
  using private-key, selected provider-token, and database-URL patterns. Binary
  blobs and blobs larger than 2 MB were not content-scanned by that pass.
- Inspected the reported test paths: the matches were dummy database/credential
  fixtures, not apparent live credentials. No apparent live secrets were found
  by these checks. No remote refs were fetched and no credentials were tested.

### Current findings and changes

- `.env*` is ignored except `.env.example`. `.env.local` exists locally and is
  ignored, not tracked. No real environment file, private-key file, or database
  dump was identified among the checked tracked filenames or historical paths.
- `.env.example` has empty credential fields and example origin/sender settings.
  It remains tracked intentionally.
- Added ignore rules for `.DS_Store`, `.vercel/`, `.wrangler/`, `.dev.vars` and its
  variants, and common private-key/certificate container extensions.
- **`.DS_Store` is already tracked.** The new ignore rule prevents new untracked
  copies from being added normally; it does not untrack the existing file or
  remove historical copies. Its binary contents were not cleared as non-sensitive.
  Review it and remove it from future tracking in a separate authorized change.
  No index removal, deletion, or history rewrite was performed here.
- Public media includes the demo screenshot, app icons, and portfolio video assets.
  Review their content and provenance before publishing: text-pattern scanning
  cannot determine whether images/video contain private material or cleared rights.
- `.gitignore` is prevention only, not a security boundary; tracked files, forced
  additions, and previously exposed credentials are not protected by it. If a real
  credential is discovered later, rotate/revoke it at its provider first. Any
  history remediation must be a separate explicit decision.

## Professional legal review still needed

- Determine the scope and effect of the historical ISC declaration and any prior
  distributions, copies, forks, or releases. A new notice cannot simply erase
  valid earlier permissions. Whether setup-default intent changes the legal
  analysis is a matter for counsel.
- Review enforceability and acceptance of the custom terms, including evaluation
  exceptions, termination, warranty/liability limitations, mandatory statutory
  exceptions, and remedies. No country, forum, or governing law has been selected;
  applicable conflict-of-law rules still exist, and enforcement may be less
  predictable without a chosen forum.
- Review third-party notices and asset provenance, actual copyright ownership,
  employer obligations, patents, and the proposed contributor agreement before
  accepting outside work. Do not assume ownership merely from an author field.
- Branding rights are reserved without claiming trademark registration. Copyright
  does not itself monopolize a general app idea or guarantee protection of every
  name, short phrase, or generated element.
- A code license is not a complete hosted-service Terms of Use or Privacy Policy.
  Public hosting and personal-data processing need their own appropriate review.

## Files prepared

- `LICENSE`: custom source-available proprietary license.
- `CONTRIBUTING.md`: issues, PR workflow, owner approval, retained contributor
  copyright, and separate agreement requirements.
- `README.md`: appended Copyright & License section; the prior bytes and formatting
  are preserved unchanged.
- `package.json`: license metadata now reads `SEE LICENSE IN LICENSE`; runtime
  settings, scripts, dependencies, and application behavior are unchanged.
- `.gitignore`: added local credential/provider/OS ignore rules.
- `docs/OWNERSHIP-AND-SECURITY-REVIEW.md`: this findings and limitations report.

No application source was edited. No dependencies were installed. No automatic
commit, push, deploy, secret rotation, data deletion, or Git-history change occurred.

## References checked

- [GitHub licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [GitHub Terms of Service, user-generated content](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#d-user-generated-content)
- [ISC license text](https://opensource.org/license/isc)
- [npm license metadata](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#license)
- [Apache contributor agreements overview](https://www.apache.org/licenses/contributor-agreements.html)
