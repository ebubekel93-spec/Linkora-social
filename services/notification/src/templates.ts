export const NOTIFICATION_TYPES = ["follow", "like", "tip", "mention", "governance", "reward"] as const;
export type NotificationTemplateType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationTemplateContext {
  username?: string;
  amount?: string | number;
  postTitle?: string;
  proposalTitle?: string;
}

export interface RenderedNotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

type TemplateDefinition = {
  subject: (context: NotificationTemplateContext) => string;
  body: (context: NotificationTemplateContext) => string;
};

const value = (input: string | number | undefined, fallback: string): string =>
  input === undefined || String(input).trim() === ""
    ? fallback
    : String(input).replace(/[\r\n]/g, " ");

const definitions: Record<NotificationTemplateType, TemplateDefinition> = {
  follow: {
    subject: ({ username }) => `${value(username, "Someone")} followed you`,
    body: ({ username }) => `${value(username, "Someone")} is now following you.`,
  },
  like: {
    subject: ({ username }) => `${value(username, "Someone")} liked your post`,
    body: ({ username, postTitle }) => `${value(username, "Someone")} liked “${value(postTitle, "your post")}”.`,
  },
  tip: {
    subject: ({ username }) => `${value(username, "Someone")} sent you a tip`,
    body: ({ username, amount, postTitle }) =>
      `${value(username, "Someone")} tipped ${value(amount, "an amount")} on “${value(postTitle, "your post") }”.`,
  },
  mention: {
    subject: ({ username }) => `${value(username, "Someone")} mentioned you`,
    body: ({ username, postTitle }) => `${value(username, "Someone")} mentioned you in “${value(postTitle, "a post") }”.`,
  },
  governance: {
    subject: ({ proposalTitle }) => `Governance update: ${value(proposalTitle, "a proposal")}`,
    body: ({ proposalTitle }) => `There is a new update for “${value(proposalTitle, "a proposal") }”.`,
  },
  reward: {
    subject: () => "Creator reward received",
    body: ({ amount }) => `You received a creator reward of ${value(amount, "an amount")}.`,
  },
};

function escapeHtml(input: string): string {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (character) => replacements[character]!);
}

/** Render plain-text and HTML variants from the same escaped template data. */
export function renderNotificationTemplate(
  type: NotificationTemplateType,
  context: NotificationTemplateContext = {},
): RenderedNotificationTemplate {
  const definition = definitions[type];
  if (!definition) throw new TypeError(`Unsupported notification template: ${String(type)}`);
  const subject = definition.subject(context);
  const text = definition.body(context);
  return {
    subject,
    text,
    html: `<p>${escapeHtml(text)}</p>`,
  };
}
