/**
 * Targets that keep their own press: native controls, interactive ARIA roles,
 * and the `data-ramka-no-pull` opt-out authors use to mark custom chrome.
 * Shared by pull-to-dismiss (a touch pull never starts here) and
 * `closeOnEmptyClick` (a click here never closes) — both lazy chunks.
 */
const INTERACTIVE_TARGET_SELECTORS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[data-ramka-no-pull]',
] as const;

export { INTERACTIVE_TARGET_SELECTORS };
