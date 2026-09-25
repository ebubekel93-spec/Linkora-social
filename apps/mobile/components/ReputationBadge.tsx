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
 * Valid reputation tiers recognized across the Linkora Social protocol.
 */
export type ReputationTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

/**
 * Size variants supported by ReputationBadge.
 */
export type ReputationBadgeSize = "small" | "medium" | "large";

/**
 * Style variants supported by ReputationBadge:
 * - `filled`: Solid tier background color with contrasting text.
 * - `outlined`: Transparent background with tier-colored border and text.
 * - `subtle`: Light tint background with tier-colored text.
 */
export type ReputationBadgeVariant = "filled" | "outlined" | "subtle";

/**
 * Props for the {@link ReputationBadge} component.
 */
export interface ReputationBadgeProps {
  /**
   * Numeric reputation score (e.g. 0 to 1000).
   *
   * @example 750
   */
  score: number;

  /**
   * Explicit reputation tier name. If omitted, the tier is derived automatically
   * from the numeric score using protocol thresholds:
   * - 0–199: `"bronze"`
   * - 200–499: `"silver"`
   * - 500–749: `"gold"`
   * - 750–899: `"platinum"`
   * - 900+: `"diamond"`
   *
   * @default Derived from score
   * @example "gold"
   */
  tier?: ReputationTier;

  /**
   * Whether to display the numeric score value next to the tier label.
   *
   * @default true
   */
  showScore?: boolean;

  /**
   * Size token defining padding, font size, and badge dimensions:
   * - `"small"`: Compact (20px height), suited for avatar badges or list rows.
   * - `"medium"`: Standard (26px height), default for post cards and comments.
   * - `"large"`: Prominent (32px height), suited for profile header hero sections.
   *
   * @default "medium"
   */
  size?: ReputationBadgeSize;

  /**
   * Visual presentation variant:
   * - `"filled"`: Solid tier background with high contrast.
   * - `"outlined"`: Bordered badge with transparent background.
   * - `"subtle"`: Pastel/light background with colored border and text.
   *
   * @default "filled"
   */
  variant?: ReputationBadgeVariant;

  /**
   * Optional callback triggered when the user taps the badge.
   * Typically used to open a bottom sheet showing the user's score breakdown,
   * percentile, and trust signals.
   * When supplied, the badge renders as an interactive touchable with `accessibilityRole="button"`.
   */
  onPress?: () => void;

  /**
   * Unique test identifier for automated tests.
   *
   * @example "user-reputation-badge"
   */
  testID?: string;

  /**
   * Custom accessibility label read by screen readers.
   * Overrides the auto-generated string (e.g., `"Reputation tier: Gold, Score: 750"`).
   *
   * @example "Member reputation is Gold tier with 750 trust points"
   */
  accessibilityLabel?: string;

  /**
   * Additional accessibility hint explaining what action will occur on press.
   *
   * @example "Double tap to view reputation score breakdown and trust signals"
   */
  accessibilityHint?: string;

  /**
   * Custom style overrides applied to the outermost badge container.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Derives a reputation tier string from a raw numeric score.
 *
 * @param score The numeric reputation score.
 * @returns The associated {@link ReputationTier}.
 */
export function deriveReputationTier(score: number): ReputationTier {
  if (score >= 900) return "diamond";
  if (score >= 750) return "platinum";
  if (score >= 500) return "gold";
  if (score >= 200) return "silver";
  return "bronze";
}

/**
 * # ReputationBadge
 *
 * A mobile UI component displaying a user's on-chain trust score and reputation tier
 * on profile headers, feed posts, and user lists.
 *
 * ## Features
 * - Accessibility ready: Implements screen-reader labels, roles, hints, and value objects.
 * - Automatic tier derivation: Calculates tier based on score if tier prop is omitted.
 * - Multi-variant styling: Supports `"filled"`, `"outlined"`, and `"subtle"` designs.
 * - Tap support: Easily integrates with bottom sheets or modal dialogs for score breakdowns.
 *
 * ## Accessibility Attributes
 * - `accessible`: Set to `true` to declare this component as a screen reader accessible unit.
 * - `accessibilityRole`: Defaults to `"button"` when `onPress` is defined, or `"summary"` for static displays.
 * - `accessibilityLabel`: Announces the user's tier and score (e.g. `"Reputation tier: Gold, Score: 750"`).
 * - `accessibilityHint`: Conveys interactive action when pressable (e.g. `"Double tap to view reputation breakdown"`).
 * - `accessibilityValue`: Conveys `{ text: tier, now: score }` to assistive technology engines.
 *
 * ## Usage Examples
 *
 * ### Example 1: Basic Display with Score
 * ```tsx
 * import React from "react";
 * import { ReputationBadge } from "./ReputationBadge";
 *
 * export function UserCard({ score }: { score: number }) {
 *   return (
 *     <ReputationBadge score={score} />
 *   );
 * }
 * ```
 *
 * ### Example 2: Compact Outlined Badge in Post Header
 * ```tsx
 * import React from "react";
 * import { ReputationBadge } from "./ReputationBadge";
 *
 * export function PostAuthorBadge({ score }: { score: number }) {
 *   return (
 *     <ReputationBadge
 *       score={score}
 *       showScore={false}
 *       size="small"
 *       variant="outlined"
 *     />
 *   );
 * }
 * ```
 *
 * ### Example 3: Interactive Badge with Bottom Sheet Action
 * ```tsx
 * import React from "react";
 * import { ReputationBadge } from "./ReputationBadge";
 *
 * export function ProfileHero({ score, onOpenBreakdown }: { score: number; onOpenBreakdown: () => void }) {
 *   return (
 *     <ReputationBadge
 *       score={score}
 *       size="large"
 *       variant="filled"
 *       onPress={onOpenBreakdown}
 *       accessibilityHint="Double tap to open score breakdown and historical trust events"
 *     />
 *   );
 * }
 * ```
 *
 * ### Example 4: Custom Tier Override with Accessibility Label
 * ```tsx
 * import React from "react";
 * import { ReputationBadge } from "./ReputationBadge";
 *
 * export function AmbassadorBadge() {
 *   return (
 *     <ReputationBadge
 *       score={980}
 *       tier="diamond"
 *       accessibilityLabel="Verified community ambassador with diamond tier reputation"
 *     />
 *   );
 * }
 * ```
 */
export function ReputationBadge({
  score,
  tier: propTier,
  showScore = true,
  size = "medium",
  variant = "filled",
  onPress,
  testID = "reputation-badge",
  accessibilityLabel,
  accessibilityHint,
  style,
}: ReputationBadgeProps) {
  const { theme } = useTheme();

  const resolvedTier = propTier ?? deriveReputationTier(score);
  const formattedTier = resolvedTier.charAt(0).toUpperCase() + resolvedTier.slice(1);

  const defaultA11yLabel = showScore
    ? `Reputation tier: ${formattedTier}, Score: ${score}`
    : `Reputation tier: ${formattedTier}`;

  const effectiveA11yLabel = accessibilityLabel ?? defaultA11yLabel;
  const effectiveA11yHint =
    accessibilityHint ?? (onPress ? "Double tap to view reputation breakdown" : undefined);

  const styles = useMemo(
    () => createStyles(theme, resolvedTier, variant, size),
    [theme, resolvedTier, variant, size]
  );

  const badgeContent = (
    <View style={[styles.container, style]}>
      <Text style={styles.tierText} numberOfLines={1}>
        {formattedTier}
      </Text>
      {showScore && (
        <Text style={styles.scoreText} numberOfLines={1}>
          {score}
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
          text: formattedTier,
          now: score,
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
      accessibilityRole="summary"
      accessibilityLabel={effectiveA11yLabel}
      accessibilityHint={effectiveA11yHint}
      accessibilityValue={{
        text: formattedTier,
        now: score,
      }}
    >
      {badgeContent}
    </View>
  );
}

function getTierPalette(tier: ReputationTier, theme: ReturnType<typeof useTheme>["theme"]) {
  switch (tier) {
    case "diamond":
      return {
        main: "#06B6D4",
        light: "#ECFEFF",
        contrastText: "#FFFFFF",
      };
    case "platinum":
      return {
        main: "#8B5CF6",
        light: "#F5F3FF",
        contrastText: "#FFFFFF",
      };
    case "gold":
      return {
        main: theme.colors.brand.accent,
        light: "#FFFBEB",
        contrastText: "#FFFFFF",
      };
    case "silver":
      return {
        main: "#64748B",
        light: "#F8FAFC",
        contrastText: "#FFFFFF",
      };
    case "bronze":
    default:
      return {
        main: "#B45309",
        light: "#FEF3C7",
        contrastText: "#FFFFFF",
      };
  }
}

function createStyles(
  theme: ReturnType<typeof useTheme>["theme"],
  tier: ReputationTier,
  variant: ReputationBadgeVariant,
  size: ReputationBadgeSize
) {
  const palette = getTierPalette(tier, theme);

  const sizeMetrics: Record<
    ReputationBadgeSize,
    { height: number; fontSize: number; paddingHorizontal: number; gap: number }
  > = {
    small: { height: 20, fontSize: 11, paddingHorizontal: 6, gap: 4 },
    medium: { height: 26, fontSize: 13, paddingHorizontal: 10, gap: 6 },
    large: { height: 32, fontSize: 15, paddingHorizontal: 14, gap: 8 },
  };

  const currentSize = sizeMetrics[size];

  let backgroundColor = palette.main;
  let borderColor = palette.main;
  let textColor = palette.contrastText;
  let scoreColor = "rgba(255, 255, 255, 0.85)";

  if (variant === "outlined") {
    backgroundColor = "transparent";
    borderColor = palette.main;
    textColor = palette.main;
    scoreColor = palette.main;
  } else if (variant === "subtle") {
    backgroundColor = palette.light;
    borderColor = palette.main;
    textColor = palette.main;
    scoreColor = palette.main;
  }

  return StyleSheet.create({
    container: {
      height: currentSize.height,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: currentSize.paddingHorizontal,
      borderRadius: currentSize.height / 2,
      backgroundColor,
      borderWidth: 1,
      borderColor,
      gap: currentSize.gap,
      alignSelf: "flex-start",
    },
    tierText: {
      fontSize: currentSize.fontSize,
      fontWeight: "700",
      color: textColor,
      includeFontPadding: false,
    },
    scoreText: {
      fontSize: currentSize.fontSize,
      fontWeight: "600",
      color: scoreColor,
      includeFontPadding: false,
    },
  });
}
