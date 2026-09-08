# POS design system foundation

The POS design system is shared presentation infrastructure. It does not own product behavior or
feature-specific composition.

## Structure and dependency direction

```text
src/design-system/
  tokens/       typed semantic values shared by both themes
  theme/        ThemeProvider, theme resolution, and useTheme()
  nativewind/   runtime token variables and safe class composition
  icons/        the controlled @expo/vector-icons boundary
  illustrations/ semantic artwork selection and accessible framing
  components/   accessible product-agnostic React Native primitives
```

Imports flow in one direction:

```text
tokens → theme → NativeWind adapter → icons and primitives → feature components → routes
```

Tokens and the theme must never import feature code. Shared primitives may consume tokens, theme,
and `POSIcon`, but they must not know about nutrition, money, focus, or any other product domain.

## Token ownership

All reusable components use semantic values such as `surfacePrimary`, `textSecondary`, and
`focusRing`. A token describes purpose rather than a specific screen or raw color. New primitive
values belong in `tokens/index.ts`; feature-specific styling belongs with its first real feature
consumer unless multiple domains demonstrate a shared need.

Reusable components must not introduce arbitrary colors, spacing, radii, type sizes, opacity, touch
targets, or motion durations. Platform-required values and calculated layout values are acceptable
when they are documented by the component's behavior.

## Theme and dark-mode policy

`ThemeProvider` is composed once in `AppProviders` and is the single owner of appearance state.
`ThemePreference` is the stored user choice: `system`, `light`, or `dark`. `ResolvedAppearance` is
the effective `light` or `dark` mode applied to semantic tokens. `system` follows React Native
`useColorScheme` and responds to later device changes; forced light or dark ignores device changes.

On startup, the provider reads the non-sensitive preference from a theme-owned AsyncStorage adapter.
Until that one read completes, it renders an accessible `Restoring appearance` progress state rather
than exposing a screen with provisional tokens. Missing or malformed values and read failures fall
back to `system`, so persistence cannot prevent startup. A preference change updates in-memory theme
state immediately and then writes it once. Write failures leave the new preference active for the
current session and do not crash.

Components access the current typed theme only through `useTheme()`. New code must not call
`useColorScheme` independently to choose POS colors. A future Settings screen will consume
`useThemePreference()` and must not call AsyncStorage or own theme state. Appearance preferences are
local-only and are not synchronized through backend, Authentication, URL, or analytics state.

## Premium violet primary direction

Premium violet is the official global POS primary accent. `tokens/index.ts` is its single source of
truth for both appearances. `accentPrimary` drives primary actions, links, selected controls, and
loading indicators; `accentPressed` drives active primary actions; `accentSoft` provides subtle
primary surfaces; `focusRing` provides primary border and focus treatment; and `onAccent` supplies
readable text and icons on primary actions. Existing background, surface, text, border, success,
warning, danger, and informational roles remain independent.

Feature screens consume those semantic roles through the theme, NativeWind, or shared primitives.
They must not contain direct violet values, visual-color aliases, or screen-specific accent tokens.
Changing the global primary direction requires changing palette values in the token source rather
than editing consumers.

Primary buttons retain full opacity while pressed so the pressed token remains visibly violet and
keeps its tested content contrast. Loading content on a primary action uses `onAccent`. Secondary
and ghost actions use `accentPrimary`; inputs use `focusRing`; and icon tone `accent` resolves to the
same primary role.

Unit checks require at least 4.5:1 contrast for primary action content and 3:1 for focus treatment
against supported opaque surfaces in light and dark appearances. Disabled controls retain their
existing reduced-opacity treatment. Final composed screens still require device and screen-reader
verification.

## NativeWind's role

NativeWind is the approved utility-class layer for layout and state composition. It consumes POS
decisions; it does not own them. `tailwind.config.js` exposes semantic names such as
`bg-surface-primary`, `text-text-secondary`, `border-border`, `bg-accent`, `p-pos-md`, and
`rounded-pos-md`. The primary mappings include `bg-accent`, `bg-accent-pressed`, `bg-accent-soft`,
`text-accent-content`, and `border-border-focus`. Screen-specific names and raw palette utilities are
not approved for product UI.

Tailwind scans active `app/` and `src/` code. Classes must be present as complete strings so the
build can discover them. Do not construct partial class names dynamically.

NativeWind compiles class rules ahead of time, but the POS values referenced by those rules are CSS
variables. `ThemeProvider` creates those variables from the current typed POS theme and applies them
at the application root. It also synchronizes NativeWind's color-scheme setting from the hydrated
`light | dark | system` preference. A preference or system-appearance change resolves a complete
semantic theme first, then updates NativeWind and all shared primitives from that same value.

This variable adapter is the safest maintainable bridge for NativeWind v4: build-time Tailwind
configuration cannot import the TypeScript runtime theme directly, and static light/dark copies in
configuration would create a second token source. CSS-variable support is strongest for ordinary
React Native style values; platform-specific shadows and stateful calculations remain inline styles.

## Choosing className, component props, or StyleSheet

- Use primitive props first for POS semantics: `surface`, `padding`, `radius`, text variants, button
  variants, and accessibility behavior.
- Use `className` for local layout composition and supported interaction utilities when a primitive
  prop does not already express the intent.
- Use `style` or `StyleSheet` for calculated values, safe-area measurements, platform behavior,
  dynamic press/focus/error styles, shadows, and third-party native APIs.
- Caller classes must not override accessibility requirements such as the 44-point target or create
  unapproved visual variants. Shared reusable rules belong in the primitive rather than repeated
  feature strings.

## Components

Feature code should import primitives through `@/design-system` or the narrow
`@/design-system/components` barrel. Primitives own reusable visual and accessibility behavior;
features own copy, data, validation rules, and domain state.

Example:

```tsx
import { AppText, Button, Card, Screen, Stack } from '@/design-system';

export function ExampleScreen() {
  return (
    <Screen>
      <Stack gap="lg" className="w-full">
        <AppText variant="heading">Example</AppText>
        <Card>
          <AppText>Feature-owned content</AppText>
          <Button label="Continue" onPress={() => undefined} />
        </Card>
      </Stack>
    </Screen>
  );
}
```

## Icon rule

`POSIcon` is the only approved icon-library boundary for application code. Its controlled names
prevent vendor-specific names from spreading through features and allow the underlying library to
change centrally. Direct `@expo/vector-icons` imports are not allowed outside
`src/design-system/icons`.

## Replaceable illustrations

`src/design-system/illustrations` provides `IllustrationFrame` and a centralized semantic registry.
Future screens request `welcome`, `emailVerification`, `passwordReset`, `success`, `offline`, or
`securityState`; they do not import arbitrary artwork assets directly. The six original POS-owned
Authentication PNG assets live in `illustrations/assets/auth/`, and each registry entry is their
only selection boundary. Replace artwork by changing that entry and its local asset, never screen
consumers.

The transparent assets use the frame's `accentSoft` semantic surface and therefore work across the
current light and dark themes. Unknown and missing runtime roles still safely resolve to the
code-native information-icon fallback. Meaningful artwork requires an `accessibilityLabel`;
decorative artwork requires `decorative` and is hidden from assistive technology. The frame owns
meaningful image semantics so its child artwork is not announced twice. Authentication UI may add
restrained entrance or success motion later; artwork files contain no embedded motion.

```tsx
<IllustrationFrame
  role="emailVerification"
  accessibilityLabel="Check your email to verify your account"
/>
<IllustrationFrame role="welcome" decorative />
```

Final Authentication illustrations and exact Authentication UI are deferred to the dedicated
Authentication UI rebuild milestone.

## Accessibility baseline

- Interactive controls meet the 44-point minimum touch target.
- Buttons and icon buttons expose roles, labels, disabled state, and loading/busy state.
- Inputs have a visible label plus accessible hint or error text.
- Errors include text and an icon; color is never the only signal.
- Text uses system fonts and supports font scaling.
- Screens respect safe-area insets and optionally support keyboard-aware scrolling.
- Loading and skeleton states expose progress semantics.

## Deferred work

The following remain deliberately deferred until an approved consumer requires them:

- custom font loading and typography migration
- feature-specific composite components
- MMKV

Future approved feature work should consume the design system with visual and behavior tests.
The provider's explicit appearance prop remains available for deterministic tests and controlled
composition. No user-facing appearance settings are implemented in this foundation milestone.
