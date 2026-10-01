import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/useTheme";

/**
 * Props for the {@link NotificationBadge} component.
 */
export interface NotificationBadgeProps {
  /**
   * The number of unread notifications to display inside the badge.
   *
   * - When `0` or a negative value, the badge is hidden entirely.
   * - Values greater than `99` are capped and displayed as `"99+"`.
   */
  count: number;

  /**
   * Maximum numeric value to show before displaying an overflow label.
   *
   * Defaults to `99`. Once `count` exceeds this value the badge shows
   * `"<maxCount>+"` instead of the raw number.
   *
   * @default 99
   */
  maxCount?: number;

  /**
   * Accessible label read by screen-readers in place of the numeric badge
   * text. Defaults to `"<count> unread notifications"`.
   *
   * Provide a more specific string when the badge appears next to a named
   * action (e.g. `"3 unread messages"`).
   */
  accessibilityLabel?: string;

  /**
   * Optional test identifier used in unit / integration tests to locate the
   * badge element. Defaults to `"notification-badge"`.
   *
   * @default "notification-badge"
   */
  testID?: string;
}

/**
 * `NotificationBadge` renders a small pill-shaped indicator showing an unread
 * notification count, following the Linkora design-system colour tokens.
 *
 * **Behaviour**
 * - Hidden (`null`) when `count <= 0`.
 * - Displays the raw numeric count for values ≤ `maxCount` (default 99).
 * - Displays `"<maxCount>+"` for values above `maxCount`.
 *
 * **Accessibility**
 * - Marked `accessibilityRole="text"` so assistive technologies announce the
 *   count as readable content rather than a generic unlabelled element.
 * - The wrapping `View` carries `accessibilityLabel` so VoiceOver / TalkBack
 *   announces a human-readable description (e.g. `"5 unread notifications"`).
 * - `importantForAccessibility="yes"` ensures the badge is not skipped by
 *   Android's accessibility tree when nested inside a `Pressable`.
 *
 * @example
 * ```tsx
 * // Basic usage — shows "3"
 * <NotificationBadge count={3} />
 *
 * // Hidden when count is zero
 * <NotificationBadge count={0} />
 *
 * // Overflow cap — shows "99+"
 * <NotificationBadge count={150} />
 *
 * // Custom cap — shows "9+"
 * <NotificationBadge count={12} maxCount={9} />
 *
 * // Custom accessibility label
 * <NotificationBadge count={2} accessibilityLabel="2 unread messages" />
 * ```
 */
export function NotificationBadge({
  count,
  maxCount = 99,
  accessibilityLabel,
  testID = "notification-badge",
}: NotificationBadgeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (count <= 0) {
    return null;
  }

  const label = count > maxCount ? `${maxCount}+` : String(count);
  const a11yLabel =
    accessibilityLabel ??
    `${count > maxCount ? `${maxCount}+` : count} unread notification${count === 1 ? "" : "s"}`;

  return (
    <View
      style={styles.badge}
      accessibilityLabel={a11yLabel}
      importantForAccessibility="yes"
      testID={testID}
    >
      <Text style={styles.text} accessibilityRole="text" accessibilityElementsHidden>
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.semantic.error,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    text: {
      color: theme.colors.text.onBrand,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
      textAlign: "center",
    },
  });
}
