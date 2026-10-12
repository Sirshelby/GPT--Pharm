import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { supabase } from "../lib/supabase.js";
import { ConfirmButton, LoadError } from "./bits.jsx";
import { slugify } from "./slugify.js";

const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const BLANK = {
  name: "",
  category_id: "",
  pack_size: "",
  description: "",
  price: "",
  requires_prescription: false,
  in_stock: true,
  is_published: false,
  image_path: null,
};

const imageUrl = (path) =>
  path ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${encodeURI(path)}` : null;

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState(isNew ? "ready" : "loading");
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(BLANK);
  const [original, setOriginal] = useState(null);
  const [image, setImage] = useState(null); // a newly chosen File
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    supabase
      .from("product_categories")
      .select("id, name")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadState(error ? "failed" : "missing");
          return;
        }
        const loaded = {
          ...data,
          category_id: data.category_id ?? "",
          pack_size: data.pack_size ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
        };
        setProduct(loaded);
        setOriginal(loaded);
        setLoadState("ready");
      });
  }, [id, isNew]);

  useEffect(() => {
    if (!image) return setPreview(null);
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    document.title = `${isNew ? "Add product" : "Edit product"} | Staff`;
  }, [isNew]);

  const set = (name, value) => {
    setProduct((current) => {
      const next = { ...current, [name]: value };
      // Prescription-only medicines can't go on the website
      if (name === "requires_prescription" && value) next.is_published = false;
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES[file.type]) {
      setErrors((e) => ({ ...e, image: "Use a JPG, PNG or WebP image." }));
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image: "That image is over 2 MB. Try a smaller one." }));
      event.target.value = "";
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setImage(file);
  }

  function validate() {
    const problems = {};
    const name = product.name.trim();
    if (name.length < 2) problems.name = "Give the product a name.";
    else if (name.length > 120) problems.name = "Keep the name under 120 characters.";
    if (product.price !== "" && (Number.isNaN(Number(product.price)) || Number(product.price) < 0))
      problems.price = "Enter a price in naira, or leave it empty.";
    if (product.description.length > 2000) problems.description = "Keep this under 2,000 characters.";
    if (product.pack_size.length > 60) problems.pack_size = "Keep this under 60 characters.";
    setErrors(problems);
    return Object.keys(problems).length === 0;
  }

  async function save(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setProblem("");

    const row = {
      name: product.name.trim(),
      category_id: product.category_id || null,
      pack_size: product.pack_size.trim() || null,
      description: product.description.trim() || null,
      price: product.price === "" ? null : Number(product.price),
      requires_prescription: product.requires_prescription,
      in_stock: product.in_stock,
      is_published: product.requires_prescription ? false : product.is_published,
    };

    try {
      if (image) {
        const path = `${slugify(row.name) || "product"}-${Date.now()}.${IMAGE_TYPES[image.type]}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, image, { contentType: image.type, cacheControl: "31536000" });
        if (error) throw error;
        row.image_path = path;
      } else if (product.image_path === null && original?.image_path) {
        row.image_path = null; // photo removed
      }

      let savedId = id;
      if (isNew) {
        row.slug = slugify(row.name) || `product-${Date.now()}`;
        let result = await supabase.from("products").insert(row).select("id").single();
        // Two products with the same name: make the second address unique
        if (result.error?.code === "23505") {
          row.slug = `${row.slug.slice(0, 74)}-${Math.random().toString(36).slice(2, 6)}`;
          result = await supabase.from("products").insert(row).select("id").single();
        }
        if (result.error) throw result.error;
        savedId = result.data.id;
      } else {
        const { error } = await supabase.from("products").update(row).eq("id", id);
        if (error) throw error;
      }

      // Tidy up the old photo once the new one is safely saved
      if (original?.image_path && row.image_path !== undefined && row.image_path !== original.image_path) {
        await supabase.storage.from("product-images").remove([original.image_path]);
      }

      navigate("/staff/products", { replace: true, state: { saved: savedId } });
    } catch (error) {
      console.error(error);
      setProblem("Couldn't save the product. Check your connection and try again.");
      setSaving(false);
    }
  }

  async function remove() {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setProblem("Couldn't delete it. Try again.");
      return;
    }
    if (original?.image_path) await supabase.storage.from("product-images").remove([original.image_path]);
    navigate("/staff/products", { replace: true });
  }

  if (loadState === "loading") return <p className="staff-muted">Loading…</p>;
  if (loadState === "failed") return <LoadError onRetry={() => window.location.reload()} />;
  if (loadState === "missing")
    return (
      <div className="staff-empty">
        <p>That product doesn't exist, or it's been deleted.</p>
        <Link to="/staff/products" className="staff-btn">
          Back to products
        </Link>
      </div>
    );

  const shownImage = preview ?? imageUrl(product.image_path);

  return (
    <>
      <p className="staff-back">
        <Link to="/staff/products">← All products</Link>
      </p>
      <div className="staff-head">
        <h1>{isNew ? "Add a product" : product.name || "Edit product"}</h1>
      </div>

      <form className="detail" onSubmit={save} noValidate>
        <div className="detail__main">
          <section className="panel staff-form">
            <Field label="Name" error={errors.name}>
              <input value={product.name} maxLength={120} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <div className="staff-form__row">
              <Field label="Category">
                <select value={product.category_id} onChange={(e) => set("category_id", e.target.value)}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pack size" hint="e.g. Pack of 16" error={errors.pack_size}>
                <input value={product.pack_size} maxLength={60} onChange={(e) => set("pack_size", e.target.value)} />
              </Field>
            </div>
            <Field label="Price in naira" hint="Leave empty to show “Ask for price”." error={errors.price}>
              <input
                inputMode="decimal"
                value={product.price}
                onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="e.g. 1500"
              />
            </Field>
            <Field label="Description" hint="A sentence or two about what it's for." error={errors.description}>
              <textarea
                rows={4}
                maxLength={2000}
                value={product.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel staff-form">
            <h2>Photo</h2>
            <div className="product-photo">
              {shownImage ? <img src={shownImage} alt="" /> : <span className="staff-muted">No photo yet</span>}
            </div>
            <label className="staff-btn staff-file">
              {shownImage ? "Choose a different photo" : "Add a photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
            </label>
            {shownImage && (
              <button
                type="button"
                className="staff-link"
                onClick={() => {
                  setImage(null);
                  set("image_path", null);
                }}
              >
                Remove photo
              </button>
            )}
            {errors.image && <p className="staff-error">{errors.image}</p>}
            <p className="staff-muted">JPG, PNG or WebP, up to 2 MB. A plain background works best.</p>
          </section>

          <section className="panel staff-form">
            <h2>Availability</h2>
            <Check checked={product.in_stock} onChange={(v) => set("in_stock", v)}>
              In stock
            </Check>
            <Check checked={product.requires_prescription} onChange={(v) => set("requires_prescription", v)}>
              Prescription-only medicine
            </Check>
            <Check
              checked={product.is_published}
              disabled={product.requires_prescription}
              onChange={(v) => set("is_published", v)}
            >
              Show on the website
            </Check>
            {product.requires_prescription && (
              <p className="staff-muted">
                Nigerian rules don't allow prescription-only medicines to be advertised to the public, so these
                stay off the website. Customers can still order them through the prescriptions page.
              </p>
            )}
          </section>

          <div className="staff-form__actions">
            <button type="submit" className="staff-btn staff-btn--primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
            </button>
            <Link to="/staff/products" className="staff-btn">
              Cancel
            </Link>
          </div>
          {problem && (
            <p role="alert" className="staff-error">
              {problem}
            </p>
          )}

          {!isNew && (
            <section className="panel panel--danger">
              <h2>Delete</h2>
              <p className="staff-muted">To hide it for a while, switch off “Show on the website” instead.</p>
              <ConfirmButton onConfirm={remove}>Delete this product</ConfirmButton>
            </section>
          )}
        </aside>
      </form>
    </>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className={`staff-field${error ? " is-invalid" : ""}`}>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
      {children}
      {error && <em className="staff-error">{error}</em>}
    </label>
  );
}

function Check({ checked, disabled, onChange, children }) {
  return (
    <label className={`staff-check${disabled ? " is-disabled" : ""}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}
