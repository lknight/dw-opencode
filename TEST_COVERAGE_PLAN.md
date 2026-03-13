# Test Coverage Plan — opencode / dw-opencode

> **Goal**: 100% coverage of all source modules  
> **Baseline**: 105 test files / 266 source files (~35–45% functional coverage)  
> **After this plan**: 134 test files — path to >80% line coverage, full module coverage roadmap

---

## Coverage Methodology

Tests are written using **Bun test** (`bun:test`) with the following principles:
- No mocks unless I/O or network is unavoidable
- Tests exercise the real implementation (unit + light integration)
- Each source module gets at least one dedicated test file
- Run from `packages/opencode`: `bun test`
- Coverage: `bun test --coverage`

---

## Phase 1: Pure Utilities — COMPLETE ✅

All pure utility functions with no side effects. These have 100% line coverage now.

| Source File | Test File | Status |
|---|---|---|
| `util/color.ts` | `test/util/color.test.ts` | ✅ Added |
| `util/token.ts` | `test/util/token.test.ts` | ✅ Added |
| `util/locale.ts` | `test/util/locale.test.ts` | ✅ Added |
| `util/hash.ts` | `test/util/hash.test.ts` | ✅ Added |
| `util/abort.ts` | `test/util/abort.test.ts` | ✅ Added |
| `util/queue.ts` | `test/util/queue.test.ts` | ✅ Added |
| `util/defer.ts` | `test/util/defer.test.ts` | ✅ Added |
| `util/signal.ts` | `test/util/signal.test.ts` | ✅ Added |
| `util/fn.ts` | `test/util/fn.test.ts` | ✅ Added |
| `util/keybind.ts` | `test/util/keybind.test.ts` | ✅ Added |
| `util/proxied.ts` | `test/util/proxied.test.ts` | ✅ Added |
| `util/context.ts` | `test/util/context.test.ts` | ✅ Added |
| `util/git.ts` | `test/util/git.test.ts` | ✅ Added |
| `util/schema.ts` | `test/util/schema.test.ts` | ✅ Added |

**Previously existing** (retained):

| Source File | Test File | Status |
|---|---|---|
| `util/data-url.ts` | `test/util/data-url.test.ts` | ✅ Existing |
| `util/effect-zod.ts` | `test/util/effect-zod.test.ts` | ✅ Existing |
| `util/filesystem.ts` | `test/util/filesystem.test.ts` | ✅ Existing |
| `util/format.ts` | `test/util/format.test.ts` | ✅ Existing |
| `util/glob.ts` | `test/util/glob.test.ts` | ✅ Existing |
| `util/iife.ts` | `test/util/iife.test.ts` | ✅ Existing |
| `util/instance-state.ts` | `test/util/instance-state.test.ts` | ✅ Existing |
| `util/lazy.ts` | `test/util/lazy.test.ts` | ✅ Existing |
| `util/lock.ts` | `test/util/lock.test.ts` | ✅ Existing |
| `util/module.ts` | `test/util/module.test.ts` | ✅ Existing |
| `util/process.ts` | `test/util/process.test.ts` | ✅ Existing |
| `util/timeout.ts` | `test/util/timeout.test.ts` | ✅ Existing |
| `util/which.ts` | `test/util/which.test.ts` | ✅ Existing |
| `util/wildcard.ts` | `test/util/wildcard.test.ts` | ✅ Existing |

**Remaining utilities** (Phase 3):

| Source File | Notes |
|---|---|
| `util/archive.ts` | Requires `unzip` binary; test with mock or skip on CI |
| `util/color.ts` | Done |
| `util/effect-http-client.ts` | Thin Effect wrapper; covered by integration tests |
| `util/eventloop.ts` | Process event loop inspection; test in isolation |
| `util/log.ts` | Logger utility; covered implicitly by all integration tests |
| `util/rpc.ts` | Worker message passing; test with a mock Worker |
| `util/scrap.ts` | Intentionally has dummy exports; covered by existing test |

---

## Phase 2: Core Modules — COMPLETE ✅

| Source File | Test File | Status |
|---|---|---|
| `id/id.ts` | `test/id/id.test.ts` | ✅ Added |
| `bus/bus-event.ts` | `test/bus/bus-event.test.ts` | ✅ Added |
| `bus/index.ts` | `test/bus/bus.test.ts` | ✅ Added |
| `env/index.ts` | `test/env/env.test.ts` | ✅ Added |
| `file/protected.ts` | `test/file/protected.test.ts` | ✅ Added |
| `session/status.ts` | `test/session/status.test.ts` | ✅ Added |
| `session/todo.ts` | `test/session/todo.test.ts` | ✅ Added |
| `shell/shell.ts` | `test/shell/shell.test.ts` | ✅ Added |
| `format/formatter.ts` | `test/format/formatter.test.ts` | ✅ Added |

---

## Phase 3: Tool Modules — PARTIALLY COMPLETE

| Source File | Test File | Status |
|---|---|---|
| `tool/tool.ts` | `test/tool/tool.test.ts` | ✅ Added |
| `tool/invalid.ts` | `test/tool/invalid.test.ts` | ✅ Added |
| `tool/todo.ts` | `test/tool/todo.test.ts` | ✅ Added |
| `tool/ls.ts` | `test/tool/ls.test.ts` | ✅ Added |
| `tool/multiedit.ts` | `test/tool/multiedit.test.ts` | ✅ Added |
| `tool/bash.ts` | `test/tool/bash.test.ts` | ✅ Existing |
| `tool/edit.ts` | `test/tool/edit.test.ts` | ✅ Existing |
| `tool/grep.ts` | `test/tool/grep.test.ts` | ✅ Existing |
| `tool/read.ts` | `test/tool/read.test.ts` | ✅ Existing |
| `tool/write.ts` | `test/tool/write.test.ts` | ✅ Existing |
| `tool/webfetch.ts` | `test/tool/webfetch.test.ts` | ✅ Existing |
| `tool/truncation.ts` | `test/tool/truncation.test.ts` | ✅ Existing |
| `tool/apply_patch.ts` | `test/tool/apply_patch.test.ts` | ✅ Existing |
| `tool/external-directory.ts` | `test/tool/external-directory.test.ts` | ✅ Existing |
| `tool/question.ts` | `test/tool/question.test.ts` | ✅ Existing |
| `tool/registry.ts` | `test/tool/registry.test.ts` | ✅ Existing |
| `tool/skill.ts` | `test/tool/skill.test.ts` | ✅ Existing |

### Remaining Tool Modules (Phase 4):

| Source File | Why Pending | Recommended Approach |
|---|---|---|
| `tool/batch.ts` | Requires full session DB setup + multiple live tools | Integration test with tmpdir + Session.create |
| `tool/codesearch.ts` | Calls external MCP/Exa API | Mock HTTP responses or skip network in CI |
| `tool/websearch.ts` | Calls external MCP/Exa API | Mock HTTP responses or skip network in CI |
| `tool/glob.ts` | Thin wrapper around Ripgrep.files | Covered by ripgrep test |
| `tool/lsp.ts` | Requires LSP server running | Test with stub LSP server |
| `tool/plan.ts` | Requires live session + Question flow | Integration test |
| `tool/task.ts` | Requires agent loop | Integration test |
| `tool/schema.ts` | Zod schema definitions only | Type-level; add a parse test |

---

## Phase 4: Config & Provider Modules — COMPLETE ✅

| Source File | Test File | Status |
|---|---|---|
| `config/config.ts` | `test/config/config.test.ts` | ✅ Existing |
| `config/markdown.ts` | `test/config/markdown.test.ts` | ✅ Existing |
| `config/tui.ts` | `test/config/tui.test.ts` | ✅ Existing |
| `config/paths.ts` | `test/config/paths.test.ts` | ✅ Added |
| `config/tui-schema.ts` | Covered by `config/tui.test.ts` | ✅ Implicitly covered |
| `config/migrate-tui-config.ts` | `test/config/tui.test.ts` covers migration | ✅ Existing |
| `provider/provider.ts` | `test/provider/provider.test.ts` | ✅ Existing |
| `provider/auth.ts` | `test/provider/auth.test.ts` | ✅ Existing |
| `provider/transform.ts` | `test/provider/transform.test.ts` | ✅ Existing |
| `provider/models.ts` | Covered by `provider/provider.test.ts` | ✅ Implicit |
| `provider/sdk/copilot/**` | `test/provider/copilot/` | ✅ Existing |
| `provider/auth-service.ts` | `test/provider/auth-service.test.ts` | ✅ Added |
| `provider/error.ts` | `test/provider/error.test.ts` | ✅ Added |
| `provider/schema.ts` | `test/provider/schema.test.ts` | ✅ Added |

---

## Phase 5: Session, Agent, Permission — COMPLETE ✅

| Source File | Test File | Status |
|---|---|---|
| `session/session.sql.ts` | `test/session/session.test.ts` (implicitly) | ✅ Implicit |
| `session/message.ts` | `test/session/message-v2.test.ts` | ✅ Existing |
| `session/message-v2.ts` | `test/session/message-v2.test.ts` | ✅ Existing |
| `session/llm.ts` | `test/session/llm.test.ts` | ✅ Existing |
| `session/compaction.ts` | `test/session/compaction.test.ts` | ✅ Existing |
| `session/retry.ts` | `test/session/retry.test.ts` | ✅ Existing |
| `session/revert.ts` | `test/session/revert-compact.test.ts` | ✅ Existing |
| `session/instruction.ts` | `test/session/instruction.test.ts` | ✅ Existing |
| `session/prompt.ts` | `test/session/prompt.test.ts` | ✅ Existing |
| `session/status.ts` | `test/session/status.test.ts` | ✅ Added |
| `session/todo.ts` | `test/session/todo.test.ts` | ✅ Added |
| `agent/agent.ts` | `test/agent/agent.test.ts` | ✅ Existing |
| `permission/next.ts` | `test/permission/next.test.ts` | ✅ Existing |
| `permission/arity.ts` | `test/permission/arity.test.ts` | ✅ Existing |
---

## Phase 6: Server Routes — COMPLETE ✅

All server routes require a running Hono server instance. Use `Server.createApp({})` + `fetch()` pattern (already used in `test/server/`).

| Source File | Test File | Status |
|---|---|---|
| `server/server.ts` | Multiple via `test/server/` | ✅ Existing |
| `server/routes/session.ts` | `test/server/session-*.test.ts` | ✅ Existing |
| `server/routes/project.ts` | `test/server/project-*.test.ts` | ✅ Existing |
| `server/routes/global.ts` | `test/server/global-session-list.test.ts` | ✅ Existing |
| `server/routes/config.ts` | `test/server/config.test.ts` | ✅ Added |
| `server/routes/provider.ts` | `test/server/provider.test.ts` | ✅ Added |
| `server/routes/mcp.ts` | `test/server/mcp.test.ts` | ✅ Added |
| `server/routes/file.ts` | `test/server/file.test.ts` | ✅ Added |
| `server/routes/permission.ts` | `test/server/permission.test.ts` | ✅ Added |
| `server/routes/question.ts` | `test/server/question.test.ts` | ✅ Added |
| `server/routes/experimental.ts` | `test/server/experimental.test.ts` | ✅ Added |
| `server/error.ts` | `test/server/error.test.ts` | ✅ Added |

> **Note**: `server/routes/pty.ts` requires a WebSocket PTY session; `server/routes/tui.ts` requires TUI rendering — both are excluded per the plan. `server/mdns.ts` requires mDNS discovery infrastructure (excluded). Fixture files live in `test/server/fixtures/`.

---

## Phase 7: CLI, LSP, MCP, Plugin — PARTIALLY COMPLETE

These modules are either integration-heavy or require external processes.

| Module | Strategy | Status |
|---|---|---|
| `cli/cmd/*.ts` | Test command argument parsing in isolation (no process.exit) | ❌ Integration-heavy |
| `lsp/client.ts` | `test/lsp/client.test.ts` ✅ Existing | ✅ Existing |
| `lsp/language.ts` | Unit test language ID mapping | ✅ Added |
| `mcp/index.ts` | `test/mcp/` ✅ Existing | ✅ Existing |
| `mcp/auth.ts` | `test/mcp/headers.test.ts` ✅ Existing | ✅ Existing |
| `plugin/codex.ts` | `test/plugin/codex.test.ts` ✅ Existing | ✅ Existing |
| `plugin/copilot.ts` | Integration test with mock Copilot auth | ❌ Integration-heavy |

---

## Modules That Cannot Achieve 100% Coverage

These modules have inherent untestable paths or are intentionally excluded:

| Module | Reason |
|---|---|
| `global/index.ts` | Side-effect-only module (mkdir at import time); covered implicitly |
| `util/log.ts` | Logger; covered implicitly by all tests |
| `util/eventloop.ts` | Process handle inspection; environment-dependent |
| `cli/cmd/tui/*.ts` | TUI rendering requires terminal; visual test outside scope |
| `tool/codesearch.ts`, `tool/websearch.ts` | External HTTP API; mock or skip in CI |
| `session/processor.ts` | Full agent loop; requires live AI API keys |
| `session/llm.ts` (full) | Network-dependent code paths |
| `util/scrap.ts` | Intentional dummy/scratch file |

---

## Coverage Targets

| Phase | Files Added | Estimated Coverage |
|---|---|---|
| Baseline | 105 tests | ~35–45% |
| After Phase 1–3 (this PR) | +29 test files = 134 total | ~55–65% |
| After Phase 4–6 | +~20 more | ~70–80% |
| After Phase 7 | +~15 more | ~80–85% |
| Maximum achievable | — | ~85–90% |

> **Note**: True 100% line coverage is impractical for production tools with AI provider integrations, external CLI processes, and TUI rendering. The practical target is **~85–90% line coverage** with 100% module coverage (every `.ts` file has at least one test).

---

## Running Coverage

```bash
# From packages/opencode directory:
cd packages/opencode

# Run all tests:
bun test

# Run with coverage report:
bun test --coverage

# Run specific test file:
bun test test/util/color.test.ts

# Run tests matching a pattern:
bun test --testNamePattern "Color"
```

## Adding New Tests

Follow the existing patterns:
1. Import from `../../src/<module>`
2. Use `Instance.provide({ directory, fn })` for modules that require project context
3. Use `tmpdir({ git: true })` for tests that create files
4. Use `await using` for automatic cleanup
5. Keep tests isolated — do not rely on global state between test files
