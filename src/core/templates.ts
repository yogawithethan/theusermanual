import type { TemplateName } from "./types.js";

export const templateNames: TemplateName[] = [
  "pill-card",
  "lesson-pill",
  "lesson-page",
  "preview-frame",
];

export const templateMetadata: Record<
  TemplateName,
  {
    title: string;
    description: string;
  }
> = {
  "pill-card": {
    title: "Pill Card",
    description: "Rounded card for layered navigation items.",
  },
  "lesson-pill": {
    title: "Lesson Pill",
    description: "Compact lesson entry card for deeper layers.",
  },
  "lesson-page": {
    title: "Lesson Page",
    description: "Leaf page template for content previews.",
  },
  "preview-frame": {
    title: "Preview Frame",
    description: "Template intended for device-style preview shells.",
  },
};
