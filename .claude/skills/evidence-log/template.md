# <yyyy-mm-dd> · <area> · <step: plan | generate | heal | review | triage | loop>

- **Asked**: the prompt or command used (e.g. `/qa-loop checkout`)
- **Agents**: which agents ran (manager, planner, generator, healer, reviewer, triager) and the model
- **Seed / inputs**: seed test, plan, failing run

## What the agents did
- …

## Result
| Item | Count | Where |
|---|---|---|
| Plan sections | | `specs/<area>.md` |
| Tests generated | | `tests/...` |
| Tests healed | | diff / commit |
| Marked `fixme` (product findings) | | `specs/coverage.md` |
| Review verdict | | `evidence/reviews/...` |

Run: `npx playwright test ...` → passed / failed / flaky (paste the summary line).

## Human decisions
- Approved / edited by hand / rejected, and why.

## Notes for next time
- …
