# Hooks — declared, not implemented

No hook execution engine exists in this MVP. This directory exists so the
plugin manifest's `hooks` concept has a real location to point to once a
lifecycle-hook runtime is built (e.g. `on_install`, `on_run_completed`).

Do not add hook files here until a hook runtime exists to run them —
an undispatchable hook file would be a placeholder, which this foundation
intentionally avoids.
