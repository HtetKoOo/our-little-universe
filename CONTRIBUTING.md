# Contributing to Our Little Universe

Read [LICENSE](LICENSE) before copying, running, or changing project materials.

Our Little Universe is a publicly viewable proprietary portfolio project maintained
by Htet Ko Oo. Public visibility does not make it unrestricted open-source software.
Issues and proposed pull requests are welcome. The owner controls acceptance,
branding, official releases, and commercial licensing of owner-owned work.

## Report an issue

Search existing issues first. For an ordinary bug, provide the expected and actual
behavior, minimal reproduction steps, browser/device details, and the relevant
version or commit. Use fictional sample data and redact screenshots and logs.
For a feature request, explain the user problem and proposed scope before coding.

Do not post credentials, environment files, session cookies, private photos,
relationship content, email addresses, or real database records. Do not publish
an exploitable vulnerability in a public issue. Use GitHub private vulnerability
reporting if it is enabled; otherwise ask the owner for a private reporting channel
without posting the vulnerability details. No private contact address is assumed.

## Propose a pull request

1. Discuss substantial features, dependency changes, or architectural work in an
   issue and wait for scope approval. Approval to work is not approval to merge.
2. Read [LICENSE](LICENSE), [AGENTS.md](AGENTS.md), the architecture and security
   documentation, and the installed Next.js documentation where applicable.
3. Use a branch or a GitHub fork. The license permits a local working copy and
   modifications only for evaluation, issue reproduction, and contributing back.
   It does not permit an independent product or general-purpose self-hosting.
4. Follow the existing code style and architecture. Keep changes focused, preserve
   couple-scoped authorization and privacy boundaries, and disclose dependencies,
   copied code, generated assets, and their provenance and license obligations.
5. Use only disposable local/test services and fictional content. Never run
   destructive scripts, migrations, real uploads, or email sends against the
   owner's production systems as part of a contribution.
6. Follow the setup commands in README.md, within the license's limited purposes.
   Run `pnpm typecheck`, `pnpm lint`, relevant tests (`pnpm test`), and a production
   build (`pnpm build`) as appropriate. Explain any failures or skipped checks.
   Add meaningful tests for behavior changes and sanitized screenshots for UI work.
7. Open a PR explaining the problem, change, validation, risks, and linked issue.
   Do not commit local environment files, credentials, personal media, or build output.

## Review and merging

The owner must review and explicitly approve every merge. Review includes behavior,
security, privacy, accessibility, responsive UI, tests, dependency provenance, and
license compatibility. Resolve review comments and obtain any required contributor
agreement before merging. A submitted PR, successful checks, or technical approval
does not automatically authorize merging, publishing, deployment, or a release.
The owner may decline or close a contribution. Repository branch-protection and
approval rules must be configured separately; this document does not enforce them.

## Copyright and contributor agreements

You retain copyright in your original contributions unless a separate signed
agreement expressly transfers it. Do not submit work owned by an employer or other
party without their authorization. Submission grants permission to review and test
the proposal for acceptance; it is not a copyright assignment or an automatic
commercial license. GitHub's applicable platform permissions also continue to apply.

Before any copyrightable contribution is merged or released, the owner and the
necessary rights holders must execute a separate written contributor agreement.
No CLA is currently provided or deemed signed by submitting a PR. Until one is
in place, such submissions remain review-only and must not be incorporated into
a release. An alternative adequate written rights agreement may be negotiated.

For future contributions, use a lawyer-reviewed **Individual Contributor License
Agreement (ICLA)** tailored to a proprietary, source-available project. It should
preserve contributor ownership while granting the owner a perpetual, irrevocable,
worldwide, royalty-free, non-exclusive license to use, reproduce, modify, distribute,
sublicense, and relicense the contribution, including commercially. Have counsel
address patent rights, authority to contribute, third-party material, representations,
and applicable formalities. Employer-owned work may also require a **Corporate CLA**.
A developer sign-off/DCO alone should not be assumed to supply those commercial
relicensing permissions. Apache's [contributor agreement overview](https://www.apache.org/licenses/contributor-agreements.html)
is a useful example of the distinction between ownership and a contribution license;
its agreement should not be copied unchanged for this proprietary project.

A contribution agreement does not automatically give a contributor rights to reuse
other project code. Separately licensed third-party materials retain their own terms.

## Permissions outside contributions

For commercial use, independent reuse, or redistribution, request prior written
permission through a licensing issue if enabled, or a contact channel the owner has
published on their GitHub profile. Describe the intended scope. An unanswered
request is not authorization. See [LICENSE](LICENSE) for the full terms.
