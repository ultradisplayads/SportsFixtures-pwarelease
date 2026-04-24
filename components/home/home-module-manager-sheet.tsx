"use client";

// components/home/home-module-manager-sheet.tsx
// Section 07.E — Contextual home layout manager, accessible from anywhere.
//
// A bottom sheet that lets users toggle and reorder homepage modules without
// leaving their current screen. Uses useHomeModuleManager so it shares state
// with the settings/home-layout page and the HomeModuleRenderer.
//
// Usage:
//   <HomeModuleManagerSheet trigger={<button>Customise</button>} />

import { useState } from "react";
import {
  GripVertical, Eye, EyeOff, Lock, RotateCcw, LayoutDashboard,
  Calendar, MapPin, Star, Newspaper, Trophy, Tv,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useHomeModuleManager } from "@/hooks/use-home-module-manager";
import { useControlPlane } from "@/hooks/use-control-plane";
import { resolveHomeModuleRuntimeState, getHiddenReasonLabel } from "@/lib/home-module-state";
import { triggerHaptic } from "@/lib/haptic-feedback";
import type { HomeModuleRuntimeState } from "@/types/home-modules";
import type { ReactNode } from "react";

// ── Module metadata (same source of truth as settings/home-layout/page.tsx) ──

const MODULE_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  recommended: { label: "Recommended Matches", icon: Star },
  fixtures:    { label: "Fixtures",            icon: Trophy },
  venues:      { label: "Find Bars",           icon: MapPin },
  calendar:    { label: "My Calendar",         icon: Calendar },
  news:        { label: "News Feed",           icon: Newspaper },
  leaderboard: { label: "Leaderboard",         icon: Trophy },
  live:        { label: "Live Scores",         icon: Tv },
};

// ── Row ───────────────────────────────────────────────────────────────────────

function ModuleRow({
  state,
  onToggle,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  state: HomeModuleRuntimeState;
  onToggle: (key: string) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const meta = MODULE_META[state.key];
  const Icon = meta?.icon ?? Star;
  const isLockedByCP = !state.enabledByControlPlane;

  return (
    <div
      draggable={!isLockedByCP}
      onDragStart={isLockedByCP ? undefined : onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-opacity",
        isDragging ? "opacity-40" : "opacity-100",
        isLockedByCP ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* Drag handle */}
      <div className={isLockedByCP ? "text-muted-foreground/30" : "cursor-grab text-muted-foreground"}>
        <GripVertical className="h-4 w-4 shrink-0" />
      </div>

      {/* Icon */}
      <div className={[
        "shrink-0 rounded-lg p-1.5",
        state.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      ].join(" ")}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Label + reason */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{meta?.label ?? state.key}</p>
        {!state.visible && state.hiddenReason && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {getHiddenReasonLabel(state.hiddenReason ?? null)}
          </p>
        )}
      </div>

      {/* Toggle or lock */}
      {isLockedByCP ? (
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-label="Disabled by operator" />
      ) : (
        <button
          type="button"
          onClick={() => { triggerHaptic("selection"); onToggle(state.key); }}
          className={[
            "shrink-0 rounded-full p-1 transition-colors",
            state.visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-accent",
          ].join(" ")}
          aria-label={state.visible ? `Hide ${meta?.label}` : `Show ${meta?.label}`}
        >
          {state.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

interface HomeModuleManagerSheetProps {
  trigger?: ReactNode;
}

export function HomeModuleManagerSheet({ trigger }: HomeModuleManagerSheetProps) {
  const [open, setOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const { toggle, reorder, resetModules, prefMap, order } = useHomeModuleManager();
  const { data: cpData, enabledModules: cpModules } = useControlPlane();

  // Build full CP module list (all, including disabled)
  const allCpModules = (cpData?.homepageModules ?? cpModules).map((m) => ({
    key: m.key,
    enabled: m.enabled,
    position: m.position ?? 0,
  }));

  // Resolve runtime states
  const runtimeStates = resolveHomeModuleRuntimeState({
    controlPlaneModules: allCpModules,
    userModulePrefs: prefMap,
  });

  // Sort by user order
  const orderedStates = order
    .map((key) => runtimeStates.find((s) => s.key === key))
    .filter((s): s is NonNullable<typeof s> => s != null) as HomeModuleRuntimeState[];

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx == null || dragIdx === i) return;
    reorder(dragIdx, i);
    setDragIdx(i);
  }

  function handleReset() {
    triggerHaptic("medium");
    resetModules();
  }

  const visibleCount = orderedStates.filter((s) => s.visible).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Customise home
          </button>
        )}
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="flex-row items-center justify-between pb-2">
          <SheetTitle className="text-base">Customise home</SheetTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {visibleCount} visible
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </SheetHeader>

        <div className="space-y-2 py-2">
          {orderedStates.map((state, i) => (
            <ModuleRow
              key={state.key}
              state={state}
              onToggle={toggle}
              isDragging={dragIdx === i}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => { triggerHaptic("light"); setDragIdx(null); }}
            />
          ))}
        </div>

        <p className="pb-1 pt-2 text-center text-[11px] text-muted-foreground">
          Drag to reorder. Tap the eye icon to show or hide sections.
        </p>
      </SheetContent>
    </Sheet>
  );
}
