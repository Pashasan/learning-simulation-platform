# References

This is the canonical home for **source material that's been (or will be) converted into interactive content** on the platform — lecture notes, slides, papers, notebooks, raw datasets, anything else.

Treating reference material as a first-class part of the repo has a few benefits:

- **Reviewers can see the source-to-game mapping** — when a PR adds a new quiz volume or simulation, the reference material in the same PR makes it possible to evaluate whether the game faithfully covers the source.
- **Future contributors can extend or correct content** — if a paper update changes a result, the relevant game can be revised by anyone who has access to both.
- **Reproducibility** — anyone running their own copy of the platform can see exactly what each interactive artifact was built from.

## Conventions

```
references/
├── README.md                       # This file
├── <topic-or-source-id>/           # One folder per source bundle
│   ├── README.md                   #   What this is, where it came from, license
│   ├── slides/                     #   PDFs, PPTX
│   ├── notes/                      #   Markdown, plain text
│   ├── notebooks/                  #   .ipynb
│   ├── papers/                     #   PDFs (only if redistributable)
│   ├── data/                       #   CSV, JSON
│   └── mapping.md                  #   Which sections → which game/volume/lab
```

A few rules of thumb:

1. **Only commit material you have the right to redistribute.** If a paper is paywalled or a slide deck is copyrighted, link to it from the source folder's README instead of committing the file. The mapping document (`mapping.md`) can reference unredistributable sources by citation.
2. **Use stable folder names** — `regression-multiple/` is better than `2024-fall-session-3/` because the game built from it will outlive any particular semester.
3. **Each folder should have its own `README.md`** explaining what's inside, where it came from, who authored it, and what license/attribution applies.
4. **Don't put private student data here.** Anonymize datasets first; if anonymization isn't sufficient, keep the data out of the repo entirely and document the workflow without it.

## What lives here today

This folder starts essentially empty — the games currently in the repo were built from materials that aren't yet redistributable. As contributors add new content, the source material gets bundled here alongside the generated artifact.

## See also

- **[../docs/GAME_DESIGN_GUIDE.md](../docs/GAME_DESIGN_GUIDE.md)** — the 7-phase methodology for going from source to interactive artifact
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** — how to open a PR that adds new content
