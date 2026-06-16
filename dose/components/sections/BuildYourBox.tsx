"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, Sparkles } from "lucide-react";
import type { BoxSize, Product } from "@/lib/types";
import { useBox, type PurchaseMode } from "@/components/providers/BoxProvider";
import { useAgeGate } from "@/components/providers/AgeGateProvider";
import { PackFront } from "@/components/brand/PackFront";
import { Gummy, type GummyShape } from "@/components/brand/Gummy";
import { LinkButton } from "@/components/ui/Button";
import {
  BOX_SIZES,
  SUBSCRIBE_RATE,
  everydayProducts,
  fuelProducts,
  productsById,
} from "@/data/products";

const SHAPE_BY_COLOR: Record<Product["color"], GummyShape> = {
  raspberry: "bear",
  sun: "bottle",
  pine: "worm",
  mint: "bean",
};

const money = (n: number) => `£${n.toFixed(2)}`;

export function BuildYourBox() {
  const reduce = useReducedMotion();
  const box = useBox();
  const { requireAge } = useAgeGate();

  // Add a FUEL pack only once 16+ is confirmed; EVERYDAY adds immediately.
  function addPack(product: Product) {
    if (product.line === "FUEL") {
      requireAge(() => box.add(product.id));
    } else {
      box.add(product.id);
    }
  }

  return (
    <section id="build" className="relative overflow-hidden bg-mint-light py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.04]"
        style={{ color: "#1B3A2F" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-pill bg-raspberry/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-raspberry">
            <Sparkles size={14} strokeWidth={2.5} />
            Build your box
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.05] text-pine sm:text-4xl lg:text-5xl">
            Pick your flavours.
            <br />
            <span className="text-raspberry">Fill the box.</span>
          </h2>
          <p className="mt-4 max-w-md text-base text-ink/70 sm:text-lg">
            Mix and match across the range. Bigger box, bigger saving — and
            subscribe to knock off even more. No commitment you can&apos;t cancel.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* SKU picker */}
          <div>
            <LineGroup
              title="EVERYDAY"
              caption="All ages. Eat the whole pack."
              products={everydayProducts}
              items={box.items}
              onAdd={addPack}
              onRemove={box.decrement}
              reduce={reduce}
            />
            <LineGroup
              title="FUEL"
              caption="16+ · caffeine + L-theanine"
              products={fuelProducts}
              items={box.items}
              onAdd={addPack}
              onRemove={box.decrement}
              reduce={reduce}
              accentFuel
            />
          </div>

          {/* configurator */}
          <Configurator box={box} reduce={reduce} />
        </div>
      </div>

      {/* sticky mobile summary */}
      <StickyBar box={box} />
    </section>
  );
}

// ---------------------------------------------------------------------------

function LineGroup({
  title,
  caption,
  products,
  items,
  onAdd,
  onRemove,
  reduce,
  accentFuel,
}: {
  title: string;
  caption: string;
  products: Product[];
  items: Record<string, number>;
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
  reduce: boolean | null;
  accentFuel?: boolean;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-3 flex items-baseline gap-3">
        <h3
          className={[
            "font-display text-lg font-extrabold",
            accentFuel ? "text-pine" : "text-pine",
          ].join(" ")}
        >
          {title}
        </h3>
        <span
          className={[
            "text-xs font-semibold",
            accentFuel ? "text-raspberry" : "text-ink/50",
          ].join(" ")}
        >
          {caption}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <SkuCard
            key={p.id}
            product={p}
            qty={items[p.id] ?? 0}
            onAdd={() => onAdd(p)}
            onRemove={() => onRemove(p.id)}
            reduce={reduce}
          />
        ))}
      </div>
    </div>
  );
}

function SkuCard({
  product,
  qty,
  onAdd,
  onRemove,
  reduce,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  reduce: boolean | null;
}) {
  const inBox = qty > 0;
  return (
    <div
      className={[
        "group relative flex flex-col rounded-gummy bg-white p-2.5 shadow-soft transition-shadow",
        inBox ? "ring-2 ring-raspberry" : "ring-1 ring-black/[0.04]",
      ].join(" ")}
    >
      {inBox && (
        <span className="absolute -right-2 -top-2 z-10 grid h-6 min-w-6 place-items-center rounded-full bg-raspberry px-1.5 text-xs font-extrabold text-white shadow-soft">
          {qty}
        </span>
      )}
      <PackFront product={product} variant="tile" />
      <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
        <span className="text-sm font-bold text-pine">{money(product.price)}</span>
        {inBox ? (
          <div className="flex items-center gap-1.5">
            <ControlBtn label={`Remove one ${product.name}`} onClick={onRemove}>
              <Minus size={15} strokeWidth={3} />
            </ControlBtn>
            <span className="min-w-4 text-center text-sm font-bold tabular-nums text-ink">
              {qty}
            </span>
            <ControlBtn label={`Add one ${product.name}`} onClick={onAdd} primary>
              <Plus size={15} strokeWidth={3} />
            </ControlBtn>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={onAdd}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            className="inline-flex items-center gap-1 rounded-pill bg-pine px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-pine/90"
          >
            <Plus size={14} strokeWidth={3} />
            Add
          </motion.button>
        )}
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  label,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "grid h-7 w-7 place-items-center rounded-full transition-transform active:scale-90",
        primary
          ? "bg-raspberry text-white hover:-translate-y-0.5"
          : "bg-mint text-pine hover:bg-mint/70",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------

function Configurator({
  box,
  reduce,
}: {
  box: ReturnType<typeof useBox>;
  reduce: boolean | null;
}) {
  const [nudge, setNudge] = useState(false);

  // Pulse a "box is full" nudge whenever an add is rejected at capacity.
  useEffect(() => {
    if (!box.blockedAt) return;
    setNudge(true);
    const t = setTimeout(() => setNudge(false), 1400);
    return () => clearTimeout(t);
  }, [box.blockedAt]);

  return (
    <div className="lg:sticky lg:top-6">
      <div className="rounded-gummy bg-pine p-5 text-white shadow-lift sm:p-6">
        {/* size selector */}
        <SegMenu
          legend="Box size"
          value={box.size}
          options={(Object.keys(BOX_SIZES) as BoxSize[]).map((s) => ({
            value: s,
            label: BOX_SIZES[s].label,
            sub: `${BOX_SIZES[s].capacity} packs`,
          }))}
          onChange={(v) => box.setSize(v as BoxSize)}
        />

        {/* the filling box */}
        <BoxGraphic box={box} nudge={nudge} reduce={reduce} />

        {/* mode toggle */}
        <SegMenu
          legend="How often?"
          className="mt-5"
          value={box.mode}
          options={[
            { value: "once", label: "One time", sub: "Just this box" },
            {
              value: "subscribe",
              label: "Subscribe",
              sub: `Save ${Math.round(SUBSCRIBE_RATE * 100)}%`,
              highlight: true,
            },
          ]}
          onChange={(v) => box.setMode(v as PurchaseMode)}
        />

        {/* totals */}
        <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
          <Row label={`Subtotal (${box.count} ${box.count === 1 ? "pack" : "packs"})`}>
            {money(box.subtotal)}
          </Row>
          {box.savings > 0.005 && (
            <Row label="You save" accent>
              −{money(box.savings)}
            </Row>
          )}
          <div className="flex items-end justify-between pt-1">
            <dt className="font-display text-base font-bold">Total</dt>
            <dd className="font-display text-2xl font-extrabold text-sun">
              {money(box.total)}
            </dd>
          </div>
        </dl>

        <LinkButton
          href="#waitlist"
          variant={box.count > 0 ? "sun" : "outline"}
          size="lg"
          className="mt-5 w-full justify-center"
          aria-disabled={box.count === 0}
        >
          {box.count > 0 ? "Reserve this box" : "Add a pack to start"}
        </LinkButton>
        <p className="mt-2 text-center text-xs text-white/55">
          Not live yet — reserving joins the waitlist for the first drop.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  accent: isAccent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={isAccent ? "text-sun" : "text-white/70"}>{label}</dt>
      <dd className={isAccent ? "font-bold text-sun" : "font-semibold tabular-nums"}>
        {children}
      </dd>
    </div>
  );
}

function SegMenu<T extends string>({
  legend,
  value,
  options,
  onChange,
  className,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string; sub?: string; highlight?: boolean }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={[
                "relative rounded-2xl px-3 py-2.5 text-left transition-colors",
                active
                  ? "bg-white text-pine shadow-soft"
                  : "bg-white/10 text-white/80 hover:bg-white/15",
              ].join(" ")}
            >
              <span className="block text-sm font-bold">{opt.label}</span>
              {opt.sub && (
                <span
                  className={[
                    "block text-xs",
                    active
                      ? opt.highlight
                        ? "font-semibold text-raspberry"
                        : "text-ink/55"
                      : "text-white/55",
                  ].join(" ")}
                >
                  {opt.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function BoxGraphic({
  box,
  nudge,
  reduce,
}: {
  box: ReturnType<typeof useBox>;
  nudge: boolean;
  reduce: boolean | null;
}) {
  const cols = box.capacity <= 6 ? 3 : 4;
  const cells = Array.from({ length: box.capacity });

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span className="text-white/70">
          {box.count} / {box.capacity} filled
        </span>
        <AnimatePresence>
          {nudge && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-pill bg-sun px-2 py-0.5 font-bold text-ink"
              role="status"
            >
              Box is full!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        animate={
          nudge && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
        }
        transition={{ duration: 0.4 }}
        className="rounded-2xl border-2 border-dashed border-white/25 bg-black/15 p-2.5"
      >
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cells.map((_, i) => {
            const slot = box.slots[i];
            return (
              <div
                key={i}
                className="relative grid aspect-square place-items-center rounded-xl"
                style={{
                  background: slot ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                  boxShadow: slot ? "inset 0 0 0 1px rgba(255,255,255,0.18)" : "none",
                }}
              >
                <AnimatePresence mode="popLayout">
                  {slot && (
                    <motion.div
                      key={slot.productId + i}
                      initial={reduce ? false : { scale: 0, rotate: -25, y: -10 }}
                      animate={{ scale: 1, rotate: 0, y: 0 }}
                      exit={reduce ? undefined : { scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Gummy
                        shape={SHAPE_BY_COLOR[productsById[slot.productId]?.color ?? "raspberry"]}
                        color={productsById[slot.productId]?.color ?? "raspberry"}
                        size={30}
                        className="drop-shadow"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      <p className="mt-2 text-center text-xs text-white/55">
        {box.remaining > 0
          ? `Room for ${box.remaining} more ${box.remaining === 1 ? "pack" : "packs"}.`
          : "Packed to the brim. Nice work."}
      </p>

      {/* live region for screen readers */}
      <span className="sr-only" role="status" aria-live="polite">
        {box.count} of {box.capacity} packs in your {box.size} box,
        {" "}
        {money(box.total)} total.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StickyBar({ box }: { box: ReturnType<typeof useBox> }) {
  if (box.count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-xs font-semibold text-ink/55">
            {box.count}/{box.capacity} packs · {BOX_SIZES[box.size].label}
          </p>
          <p className="font-display text-lg font-extrabold text-pine">
            {money(box.total)}
            {box.savings > 0.005 && (
              <span className="ml-1.5 text-xs font-bold text-raspberry">
                save {money(box.savings)}
              </span>
            )}
          </p>
        </div>
        <LinkButton href="#waitlist" variant="primary" size="md">
          Reserve box
        </LinkButton>
      </div>
    </div>
  );
}
