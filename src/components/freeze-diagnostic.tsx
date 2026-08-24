'use client';

/**
 * FREEZE DIAGNOSTIC — DEV ONLY
 * Injected automatically in development mode via layout.tsx.
 *
 * Installs ALL of the following simultaneously:
 *   1. MutationObserver on document.body style attribute
 *   2. MutationObserver on document.body children (Radix portals)
 *   3. CSSStyleDeclaration.prototype.setProperty monkey-patch (stack trace)
 *   4. Object.defineProperty setter trap on body.style.pointerEvents (stack trace)
 *   5. 50ms polling fallback (catches browser-extension or native mutations)
 *   6. window-level capture-phase click listener
 *   7. window.__freezeSnap() — call from DevTools after freeze
 *
 * Remove this file and its <FreezeDiagnostic /> import in layout.tsx when done.
 */

import { useEffect } from 'react';

export function FreezeDiagnostic() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('%c[FREEZE-DIAG] Installing diagnostic suite (v2)…', 'color:cyan;font-weight:bold');

    // ── 1. MutationObserver: body style attribute ─────────────────────────────
    const bodyStyleObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const pe  = document.body.style.pointerEvents;
          const ov  = document.body.style.overflow;
          const mr  = document.body.style.marginRight;
          console.warn(
            `%c[FREEZE-DIAG][body.style CHANGED via DOM]`,
            'color:orange;font-weight:bold',
            `pe:"${pe}" overflow:"${ov}" marginRight:"${mr}"`,
          );
        }
      });
    });
    bodyStyleObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    // ── 2. MutationObserver: Radix portals added/removed ─────────────────────
    const portalObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        const check = (node: Node, verb: string) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          const attrs = el.getAttributeNames?.() ?? [];
          if (attrs.some((a) => a.startsWith('data-radix')) || el.id?.startsWith('radix-')) {
            console.warn(
              `%c[FREEZE-DIAG][Radix portal ${verb}]`,
              verb === 'ADDED' ? 'color:lime;font-weight:bold' : 'color:red;font-weight:bold',
              el.tagName, attrs.join(','),
              `body.pe:"${document.body.style.pointerEvents}"`,
            );
          }
        };
        m.addedNodes.forEach((n) => check(n, 'ADDED'));
        m.removedNodes.forEach((n) => check(n, 'REMOVED'));
      });
    });
    portalObserver.observe(document.body, { childList: true });

    // ── 3. Monkey-patch: CSSStyleDeclaration.prototype.setProperty ────────────
    // Catches:  element.style.setProperty('pointer-events', 'none')
    const origSetProperty = CSSStyleDeclaration.prototype.setProperty;
    try {
      CSSStyleDeclaration.prototype.setProperty = function(
        prop: string, val: string, priority?: string,
      ) {
        if (
          this === document.body.style &&
          (prop === 'pointer-events' || prop === 'pointerEvents')
        ) {
          console.groupCollapsed(
            `%c[FREEZE-DIAG][setProperty TRAP] body.style["${prop}"] = "${val}"`,
            val === 'none' ? 'color:red;font-weight:bold' : 'color:lime;font-weight:bold',
          );
          console.trace('▶ FULL CALL STACK:');
          console.groupEnd();
        }
        return origSetProperty.call(this, prop, val, priority);
      };
      console.log('[FREEZE-DIAG] ✓ setProperty trap installed.');
    } catch (e) {
      console.warn('[FREEZE-DIAG] setProperty trap failed:', e);
    }

    // ── 4. Object.defineProperty setter trap on body.style.pointerEvents ──────
    // Catches:  element.style.pointerEvents = 'none'  (direct camelCase assignment)
    try {
      const styleProto = Object.getPrototypeOf(document.body.style) as any;
      const origDescriptor = Object.getOwnPropertyDescriptor(styleProto, 'pointerEvents');
      if (origDescriptor?.set) {
        const origSetter = origDescriptor.set;
        Object.defineProperty(document.body.style, 'pointerEvents', {
          configurable: true,
          get() {
            return origDescriptor.get
              ? origDescriptor.get.call(this)
              : this.getPropertyValue('pointer-events');
          },
          set(val: string) {
            console.groupCollapsed(
              `%c[FREEZE-DIAG][setter TRAP] body.style.pointerEvents = "${val}"`,
              val === 'none' ? 'color:red;font-weight:bold' : 'color:lime;font-weight:bold',
            );
            console.trace('▶ FULL CALL STACK:');
            console.groupEnd();
            origSetter.call(this, val);
          },
        });
        console.log('[FREEZE-DIAG] ✓ Direct setter trap installed on body.style.');
      } else {
        console.warn('[FREEZE-DIAG] No setter descriptor found for body.style.pointerEvents. Skipping.');
      }
    } catch (e) {
      console.warn('[FREEZE-DIAG] Direct setter trap failed:', e);
    }

    // ── 5. 50ms polling fallback ──────────────────────────────────────────────
    // Catches mutations from browser extensions or native-level style changes
    // that bypass the JS prototype traps.
    let lastPe = document.body.style.pointerEvents;
    (window as any).__lastPointerEvents = lastPe;
    const pollInterval = setInterval(() => {
      const current = document.body.style.pointerEvents;
      if (current !== lastPe) {
        console.groupCollapsed(
          `%c[FREEZE-DIAG][POLL DETECTED] body.pointerEvents: "${lastPe}" → "${current}"`,
          current === 'none' ? 'color:red;font-weight:bold' : 'color:lime;font-weight:bold',
        );
        console.warn(
          current === 'none'
            ? '⚠️  POINTER EVENTS LOCKED — If no setter-trap fired above, a browser EXTENSION set this.'
            : '✓  pointer-events restored.',
        );
        console.trace('Polling detected at:');
        console.groupEnd();
        lastPe = current;
        (window as any).__lastPointerEvents = current;
      }
    }, 50);
    console.log('[FREEZE-DIAG] ✓ 50ms poll active.');

    // ── 6. Capture-phase window click listener ────────────────────────────────
    let clickCount = 0;
    const onWindowClick = () => {
      clickCount++;
      console.log(
        `%c[FREEZE-DIAG][window click #${clickCount}]`,
        'color:yellow',
        `body.pe:"${document.body.style.pointerEvents}"`,
        `computed:"${getComputedStyle(document.body).pointerEvents}"`,
      );
    };
    window.addEventListener('click', onWindowClick, true);

    // ── 7. window.__freezeSnap() ─────────────────────────────────────────────
    (window as any).__freezeSnap = () => {
      console.group('%c[FREEZE-DIAG] ══ POST-FREEZE SNAPSHOT ══', 'color:cyan;font-weight:bold;font-size:14px');

      console.log('body.style.pointerEvents     :', `"${document.body.style.pointerEvents}"`);
      console.log('body.style (full attr)        :', document.body.getAttribute('style'));
      console.log('body computed pointer-events  :', getComputedStyle(document.body).pointerEvents);
      console.log('body computed overflow        :', getComputedStyle(document.body).overflow);

      // body.className — check for block-interactivity-N (react-remove-scroll inert mode)
      console.group('body.classList:');
      Array.from(document.body.classList).forEach((c) => {
        if (c.startsWith('block-interactivity') || c.startsWith('allow-interactivity')) {
          console.warn('⚠️ react-remove-scroll class:', c);
        } else {
          console.log(c);
        }
      });
      console.groupEnd();

      const cx = Math.round(window.innerWidth / 2);
      const cy = Math.round(window.innerHeight / 2);
      const topEl = document.elementFromPoint(cx, cy);
      console.group(`elementFromPoint(${cx}, ${cy}):`);
      console.log('tagName:', topEl?.tagName, '| id:', topEl?.id || '(none)');
      console.log('computed pe:', topEl ? getComputedStyle(topEl).pointerEvents : 'N/A');
      console.log('className:', topEl?.className?.toString().slice(0, 120));
      console.groupEnd();

      console.group('[data-state] elements:');
      const dsEls = document.querySelectorAll('[data-state]');
      if (dsEls.length === 0) { console.log('(none)'); }
      dsEls.forEach((e) => console.log(e.tagName, `data-state="${(e as HTMLElement).dataset.state}"`, e.className?.toString().slice(0, 60)));
      console.groupEnd();

      console.group('Radix portals / focus guards:');
      const rEls = document.querySelectorAll('[data-radix-popper-content-wrapper],[data-radix-portal],[data-radix-focus-guard],[data-radix-scroll-lock-wrapper]');
      if (rEls.length === 0) { console.log('(none — Radix fully cleaned up ✓)'); }
      rEls.forEach((e) => console.warn('⚠️', e.tagName, e.getAttributeNames().join(' '), getComputedStyle(e).pointerEvents));
      console.groupEnd();

      console.group('[aria-hidden="true"] elements:');
      const ahEls = document.querySelectorAll('[aria-hidden="true"]');
      if (ahEls.length === 0) { console.log('(none)'); }
      ahEls.forEach((e) => console.log(e.tagName, e.id ? `#${e.id}` : '', e.className?.toString().slice(0, 80)));
      console.groupEnd();

      console.group('[inert] elements:');
      const iEls = document.querySelectorAll('[inert]');
      if (iEls.length === 0) { console.log('(none)'); }
      iEls.forEach((e) => console.warn('⚠️ inert:', e.tagName, e.id || '', e.className?.toString().slice(0, 80)));
      console.groupEnd();

      console.group('Fixed/absolute elements with non-auto pointer-events:');
      let found = 0;
      document.querySelectorAll('*').forEach((e) => {
        const cs = getComputedStyle(e);
        if ((cs.position === 'fixed' || cs.position === 'absolute') && cs.pointerEvents !== 'auto' && cs.display !== 'none') {
          const r = e.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            found++;
            console.warn(e.tagName, e.id ? `#${e.id}` : '', `pe:"${cs.pointerEvents}" z:${cs.zIndex}`, `${Math.round(r.width)}×${Math.round(r.height)}`, e.className?.toString().slice(0, 80));
          }
        }
      });
      if (found === 0) console.log('(none ✓)');
      console.groupEnd();

      console.log('─── window click count since install:', clickCount);
      console.groupEnd();
    };

    console.log(
      '%c[FREEZE-DIAG] ✓ ALL TRAPS ACTIVE.',
      'color:lime;font-weight:bold',
      '\n  • setProperty trap: catches body.style.setProperty("pointer-events", ...)',
      '\n  • Direct setter trap: catches body.style.pointerEvents = ...',
      '\n  • 50ms poll: catches browser extensions or native mutations',
      '\n  • After freeze → run: window.__freezeSnap()',
    );

    return () => {
      bodyStyleObserver.disconnect();
      portalObserver.disconnect();
      window.removeEventListener('click', onWindowClick, true);
      clearInterval(pollInterval);
      delete (window as any).__freezeSnap;
      delete (window as any).__lastPointerEvents;
    };
  }, []);

  return null;
}
