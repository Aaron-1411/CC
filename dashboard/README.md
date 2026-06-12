# dashboard/ has moved

The Personal Hub / Command Centre (`workspace.html` and everything that was in
this folder) now lives in its own repository, with full git history preserved:

**→ https://github.com/Aaron-1411/cc-hub**

It deploys to the same Cloudflare Pages project (`aaron-projects-hub`,
live at `/workspace`) from that repo's own GitHub Actions workflow. The old
`deploy-dashboard` job has been removed from this monorepo's `deploy.yml`.

Nothing in this folder is built or deployed from the monorepo any more.
