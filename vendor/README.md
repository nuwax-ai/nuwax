# Vendored packages

`nuwax-ai-chat-kit-0.1.0.tgz` is built from `nuwaclaw/crates/chat-kit` and lets this repository consume the same versioned chat implementation before the package is published to a registry.

Regenerate it after building chat-kit:

```bash
npm pack --pack-destination /path/to/nuwax/vendor
```

After `@nuwax-ai/chat-kit` is published, replace the `file:` dependency with the registry version and remove the tarball.
