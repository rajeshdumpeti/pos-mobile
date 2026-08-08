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

`ThemeProvider` is composed once in `AppProviders`. The default preference is `system`, resolved
through React Native `useColorScheme`. The provider also accepts explicit `light` or `dark` values so
a future Settings preference can override the system without changing consumers. Preference
persistence is intentionally not implemented in this milestone.

Components access the current typed theme only through `useTheme()`. New code must not call
`useColorScheme` independently to choose POS colors.

## NativeWind's role

NativeWind is the approved utility-class layer for layout and state composition. It consumes POS
decisions; it does not own them. `tailwind.config.js` exposes semantic names such as
`bg-surface-primary`, `text-text-secondary`, `border-border`, `bg-accent`, `p-pos-md`, and
`rounded-pos-md`. Screen-specific names and raw palette utilities are not approved for product UI.

Tailwind scans active `app/` and `src/` code while excluding the preserved prototype and legacy
theme directories. Classes must be present as complete strings so the build can discover them. Do
not construct partial class names dynamically.

NativeWind compiles class rules ahead of time, but the POS values referenced by those rules are CSS
variables. `ThemeProvider` creates those variables from the current typed POS theme and applies them
at the application root. It also synchronizes NativeWind's color-scheme setting from the same
`light | dark | system` preference. This preserves one runtime owner and allows future explicit
preferences without persistence in this milestone.

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

`POSIcon` is the only approved icon-library boundary for new application code. Its controlled names
prevent vendor-specific names from spreading through features and allow the underlying library to
change centrally. The existing frozen prototype may retain historical direct imports until a future
approved screen migration. New direct `@expo/vector-icons` imports are not allowed outside
`src/design-system/icons`.

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
- persisted appearance preference
- feature-specific composite components
- MMKV

The preserved prototype is not migrated wholesale by this milestone. Future feature work should
consume the new system screen by screen, with visual and behavior tests.
