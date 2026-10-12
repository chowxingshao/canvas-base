# 0004 — Generated project setup owns only unchanged files

The setup command records a SHA-256 hash for every file it generates in `.canvas/generated.json`. Before a provider switch or language removal, it checks every affected file against that recorded hash. A changed file stops the whole operation before any write, allowing the project owner to keep authored workflow or translation changes. The manifest contains relative paths and hashes only; it contains no project content, credentials, or machine paths.

Setup rejects existing unowned deployment workflows and checks the manifest, inputs, and complete change set for containment, non-directory collisions, and symbolic links before creating or removing anything. `lstat` detects dangling links as well as existing targets. Preflight failures leave files unchanged; this does not provide rollback for hardware failures or concurrent changes after preflight.
