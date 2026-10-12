import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { supabase } from "../lib/supabase.js";
import { formatPrice } from "../lib/catalogue.js";
import { Empty, LoadError } from "./bits.jsx";
import CategoryManager from "./CategoryManager.jsx";

export default function ProductsList() {
  const [state, setState] = useState({ status: "loading", products: [], categories: [] });
  const [search, setSearch] = useState("");
  const [problem, setProblem] = useState("");

  const load = useCallback(async () => {
    const [products, categories] = await Promise.all([
      supabase
        .from("products")
        .select("id, slug, name, price, in_stock, is_published, requires_prescription, category_id, updated_at")
        .order("name"),
      supabase.from("product_categories").select("id, slug, name, sort_order").order("sort_order").order("name"),
    ]);
    if (products.error || categories.error) {
      console.error(products.error ?? categories.error);
      setState((current) => ({ ...current, status: "failed" }));
    } else {
      setState({ status: "ready", products: products.data, categories: categories.data });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Quick switches straight from the list, for the things that change daily
  async function toggle(product, field) {
    setProblem("");
    const { error } = await supabase.from("products").update({ [field]: !product[field] }).eq("id", product.id);
    if (error) {
      console.error(error);
      setProblem(`Couldn't update ${product.name}. Try again.`);
    }
    load();
  }

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? state.products.filter((p) => p.name.toLowerCase().includes(q)) : state.products;
  }, [state.products, search]);

  const categoryName = (id) => state.categories.find((c) => c.id === id)?.name ?? "No category";
  const live = state.products.filter((p) => p.is_published).length;

  return (
    <>
      <div className="staff-head">
        <h1>Products</h1>
        <Link to="/staff/products/new" className="staff-btn staff-btn--primary">
          Add a product
        </Link>
      </div>
      {state.status === "ready" && (
        <p className="staff-muted staff-intro">
          {live} of {state.products.length} showing on the website. Only products marked "On website" appear on
          the Products page.
        </p>
      )}

      <div className="staff-toolbar">
        <div className="staff-search">
          <label htmlFor="product-filter" className="visually-hidden">
            Find a product
          </label>
          <input
            id="product-filter"
            type="search"
            placeholder="Find a product"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {problem && (
        <p role="alert" className="staff-error">
          {problem}
        </p>
      )}
      {state.status === "failed" && <LoadError onRetry={load} />}
      {state.status === "loading" && <p className="staff-muted">Loading…</p>}
      {state.status === "ready" && shown.length === 0 && (
        <Empty>
          {search ? "No products match that." : "No products yet. Add your first one and it'll appear here."}
        </Empty>
      )}

      {shown.length > 0 && (
        <div className="staff-table-wrap">
          <table className="staff-table staff-table--cards">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Price</th>
                <th scope="col">In stock</th>
                <th scope="col">On website</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td data-label="Product">
                    <Link to={`/staff/products/${p.id}`} className="staff-table__link">
                      {p.name}
                    </Link>
                    <span className="staff-table__sub">
                      {categoryName(p.category_id)}
                      {p.requires_prescription && " · Prescription only"}
                    </span>
                  </td>
                  <td data-label="Price">{formatPrice(p.price) ?? <span className="staff-muted">Ask for price</span>}</td>
                  <td data-label="In stock">
                    <Switch checked={p.in_stock} label={`${p.name} in stock`} onChange={() => toggle(p, "in_stock")} />
                  </td>
                  <td data-label="On website">
                    {p.requires_prescription ? (
                      <span className="staff-muted" title="Prescription-only medicines can't be advertised to the public">
                        Not allowed
                      </span>
                    ) : (
                      <Switch
                        checked={p.is_published}
                        label={`${p.name} on website`}
                        onChange={() => toggle(p, "is_published")}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.status === "ready" && <CategoryManager categories={state.categories} onChanged={load} />}
    </>
  );
}

function Switch({ checked, label, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={onChange}>
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__text">{checked ? "Yes" : "No"}</span>
    </button>
  );
}
