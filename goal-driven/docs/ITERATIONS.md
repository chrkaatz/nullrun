# Iterations

Append-only. One block per iteration, written by the driver after the iteration finishes. This is
what `COST.md` counts: iterations to green, which criterion consumed the most of them, and what the
loop thrashed on.

Format:

    ## Iteration N
    - result: P/17 (was Q/17)
    - passing: A1 A5 A6 ...
    - failing: A13 A17
    - changed: <the iteration's own one-line summary>
    - commit: <sha>

---
