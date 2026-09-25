import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme/useTheme";

/**
 * Size variants supported by NotificationBadge.
 */
export type NotificationBadgeSize = "small" | "medium" | "large";

/**
 * Style variants supported by NotificationBadge.
 * - `standard`: Displays the count inside a filled circular badge.
 * - `dot`: Displays a compact indicator dot without numbers.
 * - `subtle`: Uses a subdued surface color with accented text.
 */
export type NotificationBadgeVariant = "standard" | "dot" | "subtle";

/**
 * Props for the {@link NotificationBadge} component.
 */
export interface NotificationBadgeProps {
  /**
   * The number of unread notifications to display.
   * If `0` and `showZero` is false, the badge is not rendered.
   *
   * @example 5
   */
  count: number;

  /**
   * Maximum count displayed before truncating with a '+' suffix.
   * For example, if `maxCount` is `99` and `count` is `120`, the badge renders `"99+"`.
   *
   * @default 99
   * @example 99
   */
  maxCount?: number;

  /**
   * Visual style variant for the badge:
   * - `"standard"`: Full primary/accent colored badge with counter text.
   * - `"dot"`: Minimalist dot for unobtrusive unread indicators.
   * - `"subtle"`: Subdued background with colored text for lower visual weight.
   *
   * @default "standard"
   */
  variant?: NotificationBadgeVariant;

  /**
   * Size token defining padding, font size, and dimensions:
   * - `"small"`: Compact (16px height), ideal for tabs or tight headers.
   * - `"medium"`: Standard (20px height), default for most UI elements.
   * - `"large"`: Prominent (24px height), suited for standalone cards.
   *
   * @default "medium"
   */
  size?: NotificationBadgeSize;

  /**
   * Whether to display the badge when {@link count} is 0.
   * When false (default), the component returns `null` if count <= 0.
   *
   * @default false
   */
  showZero?: boolean;

  /**
   * Optional callback invoked when the user taps or activates the badge.
   * When provided, the component renders as an interactive touchable with
   * `accessibilityRole="button"`.
   */
  onPress?: () => void;

  /**
   * Unique test identifier for end-to-end and unit testing frameworks.
   *
   * @example "nav-notification-badge"
   */
  testID?: string;

  /**
   * Explicit accessibility label read by screen readers (TalkBack / VoiceOver).
   * Overrides the auto-generated string (e.g., `"3 unread notifications"`).
   *
   * @example "You have 3 new activity alerts"
   */
  accessibilityLabel?: string;

  /**
   * Additional accessibility hint explaining what action will occur on press.
   *
   * @example "Double tap to open your notifications list"
   */
  accessibilityHint?: string;

  /**
   * Custom style overrides applied to the outermost container view.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * # NotificationBadge
 *
 * A versatile badge component designed for displaying unread notifications,
 * activity counts, or alert status across the Linkora mobile app.
 *
 * ## Features
 * - Fully accessible: Implements WCAG / React Native accessibility guidelines with
 *   customizable roles, labels, hints, and value ranges.
 * - Adaptive layout: Expands into an oval pill for counts > 9 or truncated counts (e.g. `"99+"`).
 * - Theme-aware: Automatically picks up primary and semantic brand tokens from {@link useTheme}.
 * - Interactive support: Supports touch interactions with accessible button roles when `onPress` is provided.
 *
 * ## Accessibility Attributes
 * - `accessible`: Always `true` to ensure the badge is recognized as an accessibility element.
 * - `accessibilityRole`: Set to `"button"` when interactive (`onPress` provided), or `"text"` for static badges.
 * - `accessibilityLabel`: Automatically announces `"${count} unread notification(s)"` or custom override.
 * - `accessibilityHint`: Guides screen reader users when interactive (e.g., `"Double tap to open notifications"`).
 * - `accessibilityValue`: Supplies `{ min: 0, max: maxCount, now: count }` metadata to assistive tech.
 *
 * ## Usage Examples
 *
 * ### Example 1: Basic Unread Count
 * ```tsx
 * import React from "react";
 * import { NotificationBadge } from "./NotificationBadge";
 *
 * export function HeaderBell({ unreadCount }: { unreadCount: number }) {
 *   return (
 *     <NotificationBadge count={unreadCount} />
 *   );
 * }
 * ```
 *
 * ### Example 2: Large Count with Truncation
 * ```tsx
 * import React from "react";
 * import { NotificationBadge } from "./NotificationBadge";
 *
 * export function ActivityTab({ totalCount }: { totalCount: number }) {
 *   return (
 *     <NotificationBadge
 *       count={totalCount}
 *       maxCount={99}
 *       size="small"
 *     />
 *   );
 * }
 * ```
 *
 * ### Example 3: Minimalist Dot Indicator
 * ```tsx
 * import React from "react";
 * import { NotificationBadge } from "./NotificationBadge";
 *
 * export function UnreadDotIndicator({ hasUnread }: { hasUnread: boolean }) {
 *   return (
 *     <NotificationBadge
 *       count={hasUnread ? 1 : 0}
 *       variant="dot"
 *     />
 *   );
 * }
 * ```
 *
 * ### Example 4: Interactive Badge with Custom Accessibility
 * ```tsx
 * import React from "react";
 * import { useRouter } from "expo-router";
 * import { NotificationBadge } from "./NotificationBadge";
 *
 * export function NavNotificationIcon({ count }: { count: number }) {
 *   const router = useRouter();
 *   return (
 *     <NotificationBadge
 *       count={count}
 *       onPress={() => router.push("/notifications")}
 *       accessibilityLabel={`${count} new notifications waiting`}
 *       accessibilityHint="Navigates to the notifications inbox screen"
 *     />
 *   );
 * }
 * ```
 */
export function NotificationBadge({
  count,
  maxCount = 99,
  variant = "standard",
  size = "medium",
  showZero = false,
  onPress,
  testID = "notification-badge",
  accessibilityLabel,
  accessibilityHint,
  style,
}: NotificationBadgeProps) {
  const { theme } = useTheme();

  // Hide badge if count is zero or negative and showZero is not enabled
  if (count <= 0 && !showZero) {
    return null;
  }

  const isDot = variant === "dot";
  const displayCount = count > maxCount ? `${maxCount}+` : `${count}`;

  const defaultA11yLabel = isDot
    ? "New notifications available"
    : count === 1
      ? "1 unread notification"
      : `${count} unread notifications`;

  const effectiveA11yLabel = accessibilityLabel ?? defaultA11yLabel;
  const effectiveA11yHint =
    accessibilityHint ?? (onPress ? "Double tap to open notifications" : undefined);

  const styles = useMemo(() => createStyles(theme, variant, size), [theme, variant, size]);

  const badgeContent = (
    <View style={[styles.container, style]}>
      {!isDot && (
        <Text
          style={styles.text}
          numberOfLines={1}
          accessible={false} // Label is read on the container
        >
          {displayCount}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={effectiveA11yLabel}
        accessibilityHint={effectiveA11yHint}
        accessibilityValue={{
          min: 0,
          max: maxCount,
          now: Math.max(0, count),
        }}
      >
        {badgeContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={effectiveA11yLabel}
      accessibilityHint={effectiveA11yHint}
      accessibilityValue={{
        min: 0,
        max: maxCount,
        now: Math.max(0, count),
      }}
    >
      {badgeContent}
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>["theme"],
  variant: NotificationBadgeVariant,
  size: NotificationBadgeSize
) {
  const sizeMap: Record<
    NotificationBadgeSize,
    { height: number; minWidth: number; fontSize: number; paddingHorizontal: number }
  > = {
    small: { height: 16, minWidth: 16, fontSize: 10, paddingHorizontal: 3 },
    medium: { height: 20, minWidth: 20, fontSize: 12, paddingHorizontal: 5 },
    large: { height: 24, minWidth: 24, fontSize: 14, paddingHorizontal: 7 },
  };

  const currentSize = sizeMap[size];

  if (variant === "dot") {
    const dotDimension = size === "small" ? 8 : size === "large" ? 12 : 10;
    return StyleSheet.create({
      container: {
        width: dotDimension,
        height: dotDimension,
        borderRadius: dotDimension / 2,
        backgroundColor: theme.colors.semantic.error,
      },
      text: {
        display: "none",
      },
    });
  }

  const isSubtle = variant === "subtle";
  const backgroundColor = isSubtle ? theme.colors.semantic.errorLight : theme.colors.semantic.error;
  const textColor = isSubtle ? theme.colors.semantic.error : theme.colors.text.onBrand;

  return StyleSheet.create({
    container: {
      height: currentSize.height,
      minWidth: currentSize.minWidth,
      paddingHorizontal: currentSize.paddingHorizontal,
      borderRadius: currentSize.height / 2,
      backgroundColor,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    text: {
      color: textColor,
      fontSize: currentSize.fontSize,
      fontWeight: "700",
      textAlign: "center",
      includeFontPadding: false,
    },
  });
}
