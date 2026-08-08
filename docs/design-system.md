# POS design system foundation

The POS design system is shared presentation infrastructure. It does not own product behavior or
feature-specific composition.

## Structure and dependency direction

```text
src/design-system/
  tokens/       typed semantic values shared by both themes
  theme/        ThemeProvider, theme resolution, and useTheme()
  icons/        the controlled @expo/vector-icons boundary
  components/   accessible product-agnostic React Native primitives
```

Imports flow in one direction:

```text
tokens → theme → icons and primitives → feature components → route composition
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
      <Stack gap="lg">
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
- NativeWind
- MMKV

The preserved prototype is not migrated wholesale by this milestone. Future feature work should
consume the new system screen by screen, with visual and behavior tests.
