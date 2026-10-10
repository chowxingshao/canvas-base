# 0004 — Generated project setup owns only unchanged files

The setup command records a SHA-256 hash for every file it generates in `.canvas/generated.json`. Before a provider switch or language removal, it checks every affected file against that recorded hash. A changed file stops the whole operation before any write, allowing the project owner to keep authored workflow or translation changes. The manifest contains relative paths and hashes only; it contains no project content, credentials, or machine paths.
