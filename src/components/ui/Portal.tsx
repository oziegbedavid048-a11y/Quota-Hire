import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children directly under <body>.
 *
 * A fixed overlay drawn inside the dashboard layout inherits that layout's
 * stacking context, so however high its z-index it cannot rise above anything
 * rendered at the root of the page, such as toasts or the cookie banner. Moving
 * the overlay to the document root takes it out of that context entirely.
 */
export const Portal = ({ children }: { children: ReactNode }) =>
  typeof document === 'undefined' ? null : createPortal(children, document.body);
