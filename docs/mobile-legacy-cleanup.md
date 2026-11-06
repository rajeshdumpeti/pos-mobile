# Mobile legacy UI cleanup

The obsolete mobile demo presentation was removed during the **Mobile Legacy UI Cleanup and
Roadmap Reset** milestone. It must not be used as a product or visual reference.

## Removed

- The Today/dashboard, Plan, Log, Focus, Review, nutrition, workout, weight, money, timeline,
  notifications, search, profile, settings, and Quick Add demo routes and screens.
- The fake launch and Authentication flow, old tab/navigation implementation, prototype route
  adapter, hard-coded personal/sample data, mock dashboard store, and shared demo types.
- Legacy presentation components and theme, plus tests that existed only to verify removed demo
  behavior.
- Legacy tab-specific icon aliases and the old default empty-state illustration choice.

## Preserved infrastructure

- Expo Router root and not-found routing, because they remain the application navigation boundary.
- App-wide safe-area, error-boundary, ThemeProvider, and React Query composition.
- The typed semantic design system and its generic accessible primitives.
- Environment/API configuration boundaries, Metro, TypeScript, NativeWind, formatting, linting,
  testing, Expo configuration, and repository operational documentation.

## Temporary entry behavior

The root route renders a clearly labelled `POS foundation` state. It contains no personal data,
tasks, health or financial metrics, recommendations, navigation claims, or simulated product
behavior. The screen exists only to keep the app bootable and accessible until an approved product
screen replaces it.

## Roadmap handoff

The next implementation milestone is the first screen explicitly authorized by the locked POS
roadmap and approved screen-level specification. The Master PRD, UX specification, screen flow,
Design System direction, and high-fidelity screen specifications must be available to that work;
the deleted demo must not fill gaps in those sources.

Known follow-up work includes implementing the approved entry flow, adding its real route hierarchy
and screen tests, and removing dependencies only after a separately approved dependency audit. At
cleanup time, the governance document register still marked the Master PRD, UX specification,
screen specification, and technical architecture as pending inputs in this workspace.
