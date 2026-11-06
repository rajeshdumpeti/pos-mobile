import { Button, ButtonProps } from '@/design-system/components';

// An absent callback is an unavailable presentation boundary, never a mock mutation.
export function AuthAction({ onPress, loading, ...props }: ButtonProps) {
  return (
    <Button {...props} onPress={onPress} loading={loading} disabled={props.disabled || !onPress} />
  );
}
