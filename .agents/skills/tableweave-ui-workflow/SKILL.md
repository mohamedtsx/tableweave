---
name: tableweave-ui-workflow
description: Build or review authorized Tableweave HeroUI tables, filter controls, selection toolbars, responsive details, accessible reordering surfaces, localization, and Storybook states against product and design contracts.
---

# Compose the intended interface

Read affected [features](../../../product/features.md),
[shared rules](../../../product/shared-rules.md), [rendering](../../../docs/engineering/rendering.md)
and only relevant [design scenes](../../../docs/design/handoff.md).

1. Confirm implementation/design authority and actual installed components. Load
   available HeroUI v3 guidance and official version-matching component docs when
   using that library. For actual Figma operations, follow the connected Figma
   server's session/skill/design-system workflow; this procedure grants no writes.
2. Reuse real components/tokens and native collection semantics. Preserve one
   TanStack processing owner, valid compound table/Drawer anatomy, stable IDs,
   subscribed state and server-safe import boundaries. No v2 provider patterns.
3. Make configured features distinct from user state. Test owner exclusions,
   intact rule wrapping, immediate/confirmed drafts, scoped Clear/Cancel, selection
   replacement without criteria loss, and non-fabricated off-page count/records.
4. Include initial/refresh/error/empty/unknown and local option failures. Retained
   rows show actual provenance; stale targets cannot acquire new selection/moves.
   Buttons use supplied real callbacks, not invented Export/Create/Retry actions.
5. Check 1440/1024/768/390/320, zoom/text expansion, light/dark, Arabic RTL/bidi,
   contained scroll, logical-end/fullscreen details and arbitrary slots. All close
   paths share policy; nested controls do not trigger row actions/details.
6. Provide keyboard and simple pointer move alternatives, names/focus/announcements,
   and meaningful non-color states. Review actual browser rendering and manual
   AT/input boundaries; HeroUI or axe alone does not prove conformance.
7. Add meaningful [stories](../../../docs/design/storybook.md) and interaction/
   browser checks for real gaps, not a Cartesian snapshot explosion. Record scene/
   story/FR mapping, screenshots where useful, actual results and deferred checks.
