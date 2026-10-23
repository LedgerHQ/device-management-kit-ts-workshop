import { useEffect, useRef, useState, type PointerEvent } from "react";

/**
 * Shows the Speculos screen and lets you use it with the mouse.
 * - Touch models (Stax, Flex, Nano Gen5): click to tap. Keep the mouse down
 *   to "hold to sign".
 * - Button models (Nano X, Nano S Plus): use the 3 buttons under the screen.
 * Speculos's own page (127.0.0.1:5000) has only the buttons.
 *
 * Speculos doesn't say which model it runs, so the screen's shape tells:
 * button models have a landscape screen (128×64), touch models a portrait one.
 */
export function SpeculosScreen({ url }: { url: string }) {
  const base = url.replace(/\/+$/, "");
  const [src, setSrc] = useState<string>();
  const [hasButtons, setHasButtons] = useState(false);
  const pressed = useRef<{ x: number; y: number } | undefined>(undefined);

  // Speculos sends an event each time the screen changes: reload the screenshot.
  useEffect(() => {
    const refresh = () => setSrc(`${base}/screenshot?t=${Date.now()}`);
    refresh();
    const events = new EventSource(`${base}/events?stream=true`);
    events.onmessage = refresh;
    events.onopen = refresh;
    return () => events.close();
  }, [base]);

  const post = (path: string, body: object) =>
    fetch(`${base}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});

  const onPointerDown = (e: PointerEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) * img.naturalWidth) / rect.width);
    const y = Math.round(((e.clientY - rect.top) * img.naturalHeight) / rect.height);
    img.setPointerCapture(e.pointerId);
    pressed.current = { x, y };
    post("finger", { action: "press", x, y });
  };

  const onPointerUp = () => {
    if (!pressed.current) return;
    post("finger", { action: "release", ...pressed.current });
    pressed.current = undefined;
  };

  const button = (name: "left" | "both" | "right") =>
    post(`button/${name}`, { action: "press-and-release" });

  return (
    <div className="speculos">
      {src && (
        <p className="hint">
          {hasButtons
            ? "Use the buttons under the screen."
            : "Click to tap. Keep the mouse down to hold."}
        </p>
      )}
      {src ? (
        <img
          src={src}
          alt="Speculos screen"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onLoad={(e) =>
            setHasButtons(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)
          }
          onError={() => setSrc(undefined)}
        />
      ) : (
        <p className="hint">
          Speculos isn't running at {base}. Start it with{" "}
          <code>./run-speculos.sh</code>.
        </p>
      )}
      {src && hasButtons && (
        <div className="row center">
          <button onClick={() => button("left")}>◀ Left</button>
          <button onClick={() => button("both")}>Both</button>
          <button onClick={() => button("right")}>Right ▶</button>
        </div>
      )}
    </div>
  );
}
