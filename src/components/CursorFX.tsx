import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * CursorFX — a 3D-feeling custom cursor with:
 *  - a soft glowing core dot that follows the pointer instantly
 *  - a magnetic ring that lags and rotates in 3D toward velocity
 *  - hover scale on interactive elements
 *  - a fading trail of particles
 * Auto-disables on touch / coarse-pointer devices.
 */
export const CursorFX = () => {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([]);

  // raw pointer
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // ring follows with spring lag → 3D tilt feel
  const ringX = useSpring(x, { stiffness: 220, damping: 22, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 220, damping: 22, mass: 0.6 });

  // tilt derived from delta between raw and lagged ring
  const rotateY = useTransform([x, ringX], ([rx, lx]) =>
    Math.max(-22, Math.min(22, ((rx as number) - (lx as number)) * 0.6))
  );
  const rotateX = useTransform([y, ringY], ([ry, ly]) =>
    Math.max(-22, Math.min(22, -((ry as number) - (ly as number)) * 0.6))
  );

  const lastTrailRef = useRef(0);
  const trailIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setEnabled(canHover);
    if (!canHover) return;

    document.body.classList.add("cursor-fx-active");

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      // throttle trail particles
      const now = performance.now();
      if (now - lastTrailRef.current > 35) {
        lastTrailRef.current = now;
        const id = ++trailIdRef.current;
        setTrail((t) => [...t.slice(-10), { id, x: e.clientX, y: e.clientY }]);
        setTimeout(() => {
          setTrail((t) => t.filter((p) => p.id !== id));
        }, 500);
      }

      // detect interactive hover
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest(
        'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="hover"]'
      );
      setHovering(interactive);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => {
      x.set(-100);
      y.set(-100);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerleave", onLeave);

    return () => {
      document.body.classList.remove("cursor-fx-active");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] [perspective:800px]">
      {/* fading particle trail */}
      {trail.map((p, i) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: p.x - 4,
            top: p.y - 4,
            width: 8,
            height: 8,
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, hsl(var(--primary-glow) / 0.9) 0%, hsl(var(--primary) / 0.4) 60%, transparent 70%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* outer 3D ring */}
      <motion.div
        style={{
          translateX: ringX,
          translateY: ringY,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: clicking ? 0.7 : hovering ? 2.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="fixed left-0 top-0 -ml-5 -mt-5 h-10 w-10 rounded-full"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(var(--primary)/0.0), hsl(var(--primary)/0.8), hsl(var(--accent)/0.9), hsl(var(--primary-glow)/0.9), hsl(var(--primary)/0.0))",
            mask: "radial-gradient(circle, transparent 58%, black 60%, black 100%)",
            WebkitMask:
              "radial-gradient(circle, transparent 58%, black 60%, black 100%)",
            boxShadow:
              "0 0 18px hsl(var(--primary) / 0.55), 0 0 40px hsl(var(--accent) / 0.35)",
            filter: hovering ? "blur(0.4px)" : "blur(0px)",
          }}
        />
      </motion.div>

      {/* inner glow dot */}
      <motion.div
        style={{ translateX: x, translateY: y }}
        animate={{ scale: clicking ? 1.6 : hovering ? 0.4 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="fixed left-0 top-0 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary-foreground)) 0%, hsl(var(--primary-glow)) 55%, hsl(var(--primary)/0) 75%)",
            boxShadow:
              "0 0 12px hsl(var(--primary-glow) / 0.95), 0 0 26px hsl(var(--accent) / 0.7)",
          }}
        />
      </motion.div>
    </div>
  );
};

export default CursorFX;
