# BLOCKED: requestless remote identity admission

This is a static contract/path conflict, not an executed red-before result.
Do not intake the current runtime drafts as implementation-ready.

## Required distinction

The active lease requires both:

- a genuine, active, same-context initial-idle resource with no request/snapshot
  can produce source-only metadata;
- fabricated/copy resource objects cannot obtain admission merely by returning
  alleged matching metadata from their own `getSnapshot` function.

The sole existing writable runtime file is `presentation/criteria-frame.ts`.
`resource/adapter.ts`, resource types, binding, authority and exports are frozen.
No caller proof registration, request beginning, or fake native frame is allowed.

## Actual available APIs

- `packages/react/src/resource/adapter.ts:102–120` constructs an initial idle view
  with null request and null snapshot. Its adapter is returned frozen at line 471.
  There is no factory-issued identity registry/lookup. The `WeakMap` at line 28
  caches input descriptors; it is not an adapter identity registry.
- `packages/react/src/resource/types.ts:123–141` exposes structural adapter ports,
  not an opaque factory identity. A frozen object with own function properties can
  satisfy this interface without being the actual resource factory result.
- `packages/react/src/presentation/binding.ts:239–265` can look up an existing
  token binding and authenticate its definition/controller/resource tuple. With
  no token, it cannot authenticate a requestless resource. Creating a token merely
  to obtain admission would violate the no-begin/transport constraint.
- Genuine C/CD/P/criteria identity authenticates the criteria owner, not an
  arbitrary newly supplied R. A private registry populated only by this consumer
  would authenticate its own first assertion, not the resource producer.

For example, copying a genuine idle view and returning it from two own-data
functions on a different frozen object can satisfy context/access/active/view
equality checks. No available consumer-only check distinguishes that object from
a genuine newly supplied idle adapter. Inspecting function text, freezing, or
calling more alleged functions would not establish producer identity.

## Draft state

The existing-file draft introduces the distinct source brand/cell, metadata
admission and a private commit-phase capture route. The new hook draft implements
layout-only source/frame actions and local subscriptions/cleanup. They remain
unfinished and unverified. In particular, current requestless admission relies
on getter equality and therefore does **not** satisfy the required distinction.
No compile, runtime, React, negative, dual-compiler, emitted, browser, SSR, packed
or independent pass is claimed for these drafts. No wider path was edited.

## Decision needed

Authorize an identity-only, factory-issued resource lookup in the actual resource
producer (with explicitly allocated paths and a new protection baseline), or
specify another already-existing trusted admission route for requestless resources.
The lookup must not register caller assertions, begin requests, acquire lifetimes,
copy rows, or change resource hydration behavior. No such API is assumed here.

Denying every initial-idle resource instead would contradict the current required
outcome; silently trusting structural getters would contradict the identity rule.
Implementation stops pending the maintainer's decision. Other hook/metadata test
authoring and the permitted light compiles remain incomplete, not passed.
