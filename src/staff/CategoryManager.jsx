import { useState } from "react";

import { supabase } from "../lib/supabase.js";
import { slugify } from "./slugify.js";

// Rename, reorder or add the shelves products are grouped under.
export default function CategoryManager({ categories, onChanged }) {
  const [newName, setNewName] = useState("");
  const [problem, setProblem] = useState("");

  async function add(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setProblem("");
    const last = categories.at(-1)?.sort_order ?? 0;
    const { error } = await supabase
      .from("product_categories")
      .insert({ name, slug: slugify(name), sort_order: last + 10 });
    if (error) {
      setProblem(error.code === "23505" ? "There's already a category with that name." : "Couldn't add it. Try again.");
      return;
    }
    setNewName("");
    onChanged();
  }

  async function rename(category, name) {
    if (!name.trim() || name.trim() === category.name) return;
    const { error } = await supabase.from("product_categories").update({ name: name.trim() }).eq("id", category.id);
    if (error) setProblem("Couldn't rename it. Try again.");
    onChanged();
  }

  // Swap places with the neighbour above or below
  async function move(index, direction) {
    const a = categories[index];
    const b = categories[index + direction];
    if (!b) return;
    await Promise.all([
      supabase.from("product_categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("product_categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    onChanged();
  }

  return (
    <details className="panel categories">
      <summary>
        <h2>Categories</h2>
        <span className="staff-muted">The groups customers can filter by on the Products page</span>
      </summary>

      <ul className="categories__list">
        {categories.map((category, index) => (
          <li key={category.id}>
            <label className="visually-hidden" htmlFor={`category-${category.id}`}>
              Name of category {index + 1}
            </label>
            <input
              id={`category-${category.id}`}
              defaultValue={category.name}
              maxLength={60}
              onBlur={(event) => rename(category, event.target.value)}
            />
            <button type="button" className="staff-btn staff-btn--small" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${category.name} up`}>
              ↑
            </button>
            <button
              type="button"
              className="staff-btn staff-btn--small"
              onClick={() => move(index, 1)}
              disabled={index === categories.length - 1}
              aria-label={`Move ${category.name} down`}
            >
              ↓
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="categories__add">
        <label htmlFor="new-category" className="visually-hidden">
          New category name
        </label>
        <input
          id="new-category"
          placeholder="New category, e.g. Eye care"
          maxLength={60}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <button type="submit" className="staff-btn">
          Add category
        </button>
      </form>
      {problem && (
        <p role="alert" className="staff-error">
          {problem}
        </p>
      )}
    </details>
  );
}
