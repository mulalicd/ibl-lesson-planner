# Commander v1.8.0 — ready to apply (IBL Lesson Planner KRAJ, approved "odobri" 2026-11-14)

`0001-feat-Commander-v1.8.0-IBL-Lesson-Planner-end-of-proj.patch` is the complete, approved update of
https://github.com/IDSS123a/commander (13 files: E-22…E-25, C-13, C-12 → 🔴, DL-020…DL-024, Learned-From additions,
CHANGELOG, AUDIT-009, version stamps 1.8.0). Source of the content: `COMMANDER_UPDATE_PROPOSAL.md` (project root).

It was prepared here because this session's GitHub account had no push access to IDSS123a/commander.
Verified: the patch applies cleanly to commander `main` at 28eb278 (v1.7.0).

Apply (an account with push access, or an ACA session that has it):

    git clone https://github.com/IDSS123a/commander.git && cd commander
    git am path/to/0001-feat-Commander-v1.8.0-IBL-Lesson-Planner-end-of-proj.patch
    git push origin main
    git tag v1.8.0 && git push origin v1.8.0

Then tick the last line of AUDIT-009 ("Pushed to main and tagged v1.8.0") in a follow-up commit.

## Status (2026-11-14)
Applied and pushed to IDSS123a/commander `main` (895a203: the v1.8.0 commit + the AUDIT-009 checklist tick).
The tag `v1.8.0` could not be pushed from the session (branch pushes only); it is created in GitHub's web UI.
