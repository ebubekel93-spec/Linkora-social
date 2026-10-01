import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/useTheme";

/**
 * Reputation tier identifiers used by the Linkora protocol.
 *
 * Each tier maps to a distinct colour and label in the badge UI:
 *
 * | Tier         | Meaning                                      |
 * |--------------|----------------------------------------------|
 * | `"bronze"`   | Entry-level on-chain reputation              |
 * | `"silver"`   | Established creator with notable activity    |
 * | `"gold"`     | High-reputation creator, top-tier engagement |
 * | `"verified"` | Platform-verified identity or account        |
 */
export type ReputationTier = "bronze" | "silver" | "gold" | "verified";

/**
 * Props for the {@link ReputationBadge} component.
 */
export interface ReputationBadgeProps {
  /**
   * The reputation tier determines the badge colour and default label text.
   *
   * - `"bronze"` — warm amber background.
   * - `"silver"` — muted grey background.
   * - `"gold"` — golden accent background.
   * - `"verified"` — brand primary (purple) background with a check-mark prefix.
   */
  tier: ReputationTier;

  /**
   * Optional override for the displayed badge label. When omitted the
   * component uses a capitalised version of the `tier` value (e.g. `"Gold"`).
   * For `"verified"` the default label is `"✓ Verified"`.
   */
  label?: string;

  /**
   * Accessible label announced by screen-readers. Defaults to
   * `"<tier> reputation badge"` (e.g. `"gold reputation badge"`).
   *
   * Override when the badge appears in a context where a more descriptive
   * announcement adds value (e.g. `"Creator verified by Linkora"`).
   */
  accessibilityLabel?: string;

  /**
   * Optional test identifier used in unit / integration tests to locate the
   * badge element. Defaults to `"reputation-badge"`.
   *
   * @default "reputation-badge"
   */
  testID?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type TierConfig = {
  backgroundColor: string;
  textColor: string;
  defaultLabel: string;
};

/**
 * Resolves per-tier visual and label configuration from the design-system
 * colour tokens. Called inside the component render so it always picks up the
 * current colour scheme.
 */
function resolveTierConfig(
  tier: ReputationTier,
  theme: ReturnType<typeof useTheme>["theme"],
): TierConfig {
  switch (tier) {
    case "bronze":
      return {
        backgroundColor: "#92400E", // warm amber-brown
        textColor: "#FEF3C7",
        defaultLabel: "Bronze",
      };
    case "silver":
      return {
        backgroundColor: theme.colors.surface.surface2,
        textColor: theme.colors.text.primary,
        defaultLabel: "Silver",
      };
    case "gold":
      return {
        backgroundColor: theme.colors.brand.accent,
        textColor: "#1C1917",
        defaultLabel: "Gold",
      };
    case "verified":
      return {
        backgroundColor: theme.colors.brand.primary,
        textColor: theme.colors.text.onBrand,
        defaultLabel: "✓ Verified",
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `ReputationBadge` renders a compact pill that communicates a user's
 * on-chain reputation tier, following the Linkora design-system colour tokens.
 *
 * **Tiers**
 *
 * | Tier         | Colour                         |
 * |--------------|--------------------------------|
 * | `"bronze"`   | Amber-brown pill               |
 * | `"silver"`   | Neutral surface pill           |
 * | `"gold"`     | Golden accent pill             |
 * | `"verified"` | Brand-purple pill + checkmark  |
 *
 * **Accessibility**
 * - The outer `View` carries an `accessibilityLabel` announced by
 *   VoiceOver / TalkBack (e.g. `"gold reputation badge"`).
 * - `accessibilityRole="text"` on the inner `Text` so screen-readers treat
 *   the badge as readable content.
 * - `importantForAccessibility="yes"` prevents Android's accessibility tree
 *   from skipping the element when it is nested inside a `Pressable`.
 *
 * @example
 * ```tsx
 * // Basic tier badges
 * <ReputationBadge tier="bronze" />
 * <ReputationBadge tier="silver" />
 * <ReputationBadge tier="gold" />
 * <ReputationBadge tier="verified" />
 *
 * // Custom label override
 * <ReputationBadge tier="gold" label="Top Creator" />
 *
 * // Custom accessibility description
 * <ReputationBadge
 *   tier="verified"
 *   accessibilityLabel="Creator verified by Linkora"
 * />
 *
 * // Embedding inside a profile row
 * <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
 *   <Text>{username}</Text>
 *   <ReputationBadge tier={user.reputationTier} />
 * </View>
 * ```
 */
export function ReputationBadge({
  tier,
  label,
  accessibilityLabel,
  testID = "reputation-badge",
}: ReputationBadgeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const config = useMemo(() => resolveTierConfig(tier, theme), [tier, theme]);

  const displayLabel = label ?? config.defaultLabel;
  const a11yLabel = accessibilityLabel ?? `${tier} reputation badge`;

  return (
    <View
      style={[styles.badge, { backgroundColor: config.backgroundColor }]}
      accessibilityLabel={a11yLabel}
      importantForAccessibility="yes"
      testID={testID}
    >
      <Text
        style={[styles.text, { color: config.textColor }]}
        accessibilityRole="text"
        accessibilityElementsHidden
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    badge: {
      borderRadius: theme.radius.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: "flex-start",
    },
    text: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
  });
}
