# NULLRUN

One small game, built three times by an AI coding agent (Claude Code), each time with a
different method, so the methods can be compared. The game is NULLRUN, a short turn-based
deckbuilder. The experiment is the method, not the game.

| arm | method | where the authority lives | play it |
|---|---|---|---|
| [`ephemeral/`](ephemeral/) | spec-driven, code disposable | a written spec; the build is a throwaway render of it | open `ephemeral/nullrun.html` |
| [`traditional/`](traditional/) | plan-driven, code durable | a design and a task-by-task plan, with review | `cd traditional && pnpm install && pnpm bundle`, then open `dist/nullrun.html` |
| [`goal-driven/`](goal-driven/) | check-driven | an executable suite of 17 criteria; an unattended loop builds until it passes | open `goal-driven/nullrun.html` |

All three builds are single self-contained HTML files that make no network requests.

## The results

**[`COST.md`](COST.md) is the write-up.** It records what each arm cost (artifact sizes, token
counts, where the effort went) and, more usefully, what each method failed to catch.
The finding all three agree on: every arm shipped defects that its own checks could not see.

Read it with these limits in mind:

- **One run per method**, by one person, with one agent. These are case studies, not statistics.
- **The arms ran in order and learned from each other.** Each later arm inherited the earlier
  arms' lessons as criteria. `COST.md` states this in each arm's "handover caveat".
- **Token counts are not dollars.** Most of every total is cache reads, and the arms used
  different model mixes. No billing figures are published.
- **The agent wrote most of the prose**, including `COST.md`, under the direction of the person
  running the experiment. Where it says "I", that is the agent.

## Layout

    COST.md          the ledger comparing the three arms
    CLAUDE.md        repository guidance for the agent; each arm has its own
    .githooks/       pre-commit hook running each arm's spec linter on staged content
    ephemeral/       docs/NULLRUN-SPEC.md, conformance records, the build, the art
    traditional/     Vite + React + TypeScript, with engine and UI tests (vitest)
    goal-driven/     checks/ (criteria, mutants, kill matrix), oracle.mjs, the build

To enable the hook: `git config core.hooksPath .githooks`.

## Glossary

The docs use each arm's internal labels. The common ones:

- **§K / K1–K19**: the `ephemeral` spec's conformance checks. **FR / NFR / I**: its functional
  requirements, non-functional requirements and invariants.
- **A1–A17**: the acceptance criteria the `traditional` and `goal-driven` arms inherited from it.
- **Oracle**: `goal-driven`'s headless model of the rules, which most criteria test against.
- **Mutant / kill matrix / lethal**: deliberately broken oracles. The matrix is "lethal" when
  every mutant fails at least one criterion and every criterion fails at least one mutant. That
  is evidence the checks can fail at all.

## Art

The card art in `ephemeral/art/src/` was generated with Google Gemini, then cut, resized and
colour-matched by hand. See [`ephemeral/art/README.md`](ephemeral/art/README.md). All three
builds embed it. AI-generated images may not be protected by copyright, so the MIT licence
applies to them only as far as any rights exist.

## Licence

[MIT](LICENSE).
