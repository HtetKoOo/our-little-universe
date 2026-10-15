"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";
import { saveHomeWidgets } from "@/app/space/customize/actions";
import type { HomeWidgetConfig, HomeWidgetId } from "@/lib/home-widgets";

const copy: Record<HomeWidgetId, { title: string; description: string }> = {
  photo: { title: "Our photos", description: "Your shared gallery photos, ready to revisit." },
  jar: { title: "Memory jar", description: "A small thought to save or open later." },
  question: { title: "One Little Question", description: "Your shared daily check-in." },
  memory: { title: "Latest memory", description: "A recent or favorite moment from your story." },
};

export function HomeWidgetCustomizer({ initial }: { initial: HomeWidgetConfig[] }) {
  const [widgets, setWidgets] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const move = (index: number, direction: -1 | 1) => setWidgets((items) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next;
  });
  const update = (id: HomeWidgetId, changes: Partial<HomeWidgetConfig>) => setWidgets((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  const save = () => startTransition(async () => {
    const result = await saveHomeWidgets(widgets);
    setMessage(result.message);
  });
  return <section className="home-customizer" aria-labelledby="customize-home-title">
    <Link href="/space" className="back-circle" aria-label="Back to Home"><ArrowLeft size={18} aria-hidden="true" /></Link>
    <p className="eyebrow">YOUR SHARED HOME</p>
    <h1 id="customize-home-title">Customize your little corner.</h1>
    <p className="home-customizer-intro">Choose which widgets feel useful, their order, and how much room each one takes. These changes appear for both of you.</p>
    <div className="home-customizer-list">
      {widgets.map((widget, index) => <article className="home-customizer-row" key={widget.id}>
        <div className="home-customizer-copy"><h2>{copy[widget.id].title}</h2><p>{copy[widget.id].description}</p></div>
        <div className="home-customizer-controls">
          <button type="button" className="widget-icon-button" onClick={() => update(widget.id, { visible: !widget.visible })} aria-label={widget.visible ? `Hide ${copy[widget.id].title}` : `Show ${copy[widget.id].title}`} title={widget.visible ? "Shown on Home" : "Hidden from Home"}>{widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          <button type="button" className="widget-icon-button" onClick={() => update(widget.id, { size: widget.size === "half" ? "full" : "half" })} aria-label={widget.size === "half" ? `Make ${copy[widget.id].title} full width` : `Make ${copy[widget.id].title} half width`} title={widget.size === "half" ? "Make full width" : "Make half width"}>{widget.size === "half" ? <Maximize2 size={17} /> : <Minimize2 size={17} />}</button>
          <span className="widget-move"><button type="button" className="widget-icon-button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${copy[widget.id].title} up`}><ArrowUp size={17} /></button><button type="button" className="widget-icon-button" disabled={index === widgets.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${copy[widget.id].title} down`}><ArrowDown size={17} /></button></span>
        </div>
      </article>)}
    </div>
    <div className="home-customizer-save"><p role="status">{message}</p><button type="button" className="button" onClick={save} disabled={pending}>{pending ? "Saving…" : <><Check size={18} aria-hidden="true" />Save Home</>}</button></div>
  </section>;
}
