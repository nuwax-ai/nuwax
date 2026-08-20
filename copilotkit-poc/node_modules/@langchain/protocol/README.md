# `@langchain/protocol`

TypeScript bindings for the LangChain agent streaming protocol.

This package publishes the generated TypeScript schema bindings from
`protocol.cddl` so TypeScript applications can type protocol commands, events,
results, and content blocks consistently.

## What this package includes

- Generated TypeScript protocol bindings in `protocol.ts`
- Types for top-level messages such as `Command`, `Message`, and protocol events
- Types for protocol modules including run, subscription, agent, input, state,
  and usage

## What this package does not include

This package does not currently ship a runtime client, transport, or helper APIs.
It is intended for typing protocol payloads and generated bindings only.

## Installation

```bash
npm install @langchain/protocol
```

## Usage

Use type-only imports when consuming the protocol schema:

```ts
import type {
  Command,
  Message,
  SubscribeParams,
  MessagesEvent,
} from "@langchain/protocol";
```

You can then use the exported types to model protocol payloads in your own
transport or client implementation:

```ts
import type { Command, SubscribeParams } from "@langchain/protocol";

const params: SubscribeParams = {
  channels: ["messages", "lifecycle"],
};

const subscribeCommand: Command = {
  id: 1,
  method: "subscription.subscribe",
  params,
};
```

## Source of truth

The canonical protocol definition lives at [`protocol.cddl`]([https://](https://github.com/langchain-ai/agent-protocol/blob/main/streaming/protocol.cddl)). The TypeScript
bindings in this package are generated from that schema.
