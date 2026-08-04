import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { getProducts ,updateProduct} from "../../api/products";
import { createProduct } from "../../api/products";
import { createInventory } from "../../api/inventory";

export default function ProductsPanel() {
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [showProductModal, setShowProductModal] = useState(false);
const [editingProduct, setEditingProduct] = useState(null);
const [editMode, setEditMode] = useState(false);

const [productForm, setProductForm] = useState({
  title: "",
  category: "",
  description: "",
  image: "",
  badge: "",
  msrp: "",
  track_type: "UNIQUE",
  is_b2b_only: false,
});

const [saving, setSaving] = useState(false);


async function loadProducts() {

    setLoading(true);

    try {

        const data = await getProducts();

        setProducts(data.items || []);

    } catch(err) {

        console.error(err);

    } finally {

        setLoading(false);

    }

}

useEffect(() => {

    loadProducts();

}, []);

const filteredProducts = useMemo(() => {
  return products.filter((product) =>
    (
      product.title ||
      product.name ||
      ""
    )
      .toLowerCase()
      .includes(search.toLowerCase())
  );
}, [products, search]);

function openEditProduct(product) {

  setEditMode(true);

  setEditingProduct(product);

  setProductForm({
    title: product.title,
    category: product.category,
    description: product.description,
    image: product.image,
    badge: product.badge,
    msrp: product.msrp,
    track_type: product.track_type,
    is_b2b_only: product.is_b2b_only,
  });

  setShowProductModal(true);
}

async function handleUpdateProduct() {

    try {

        setSaving(true);

        await updateProduct(
            editingProduct.id,
            {
                title: productForm.title,
                category: productForm.category,
                description: productForm.description,
                image: productForm.image,
                badge: productForm.badge,
                msrp: Number(productForm.msrp),
                track_type: productForm.track_type,
                is_b2b_only: productForm.is_b2b_only,
            }
        );

        await loadProducts();

        setShowProductModal(false);

        setEditMode(false);

        setEditingProduct(null);

    } catch (err) {

        console.error(err);

        alert("Unable to update product");

    } finally {

        setSaving(false);

    }

}

async function handleCreateProduct() {
  try {
    setSaving(true);

    const createdProduct = await createProduct({
    title: productForm.title,
    category: productForm.category,
    description: productForm.description,
    image: productForm.image,
    badge: productForm.badge,
    msrp: Number(productForm.msrp),
    track_type: productForm.track_type,
    is_b2b_only: productForm.is_b2b_only,
});
    await createInventory({
    productId: createdProduct.productId,
    availableQuantity: 0,
    reservedQuantity: 0,
    reorderThreshold: 5
});
    // Reload products
    await loadProducts();

    // Close dialog
    setShowProductModal(false);

    // Reset form
    setProductForm({
      title: "",
      category: "",
      description: "",
      image: "",
      badge: "",
      msrp: "",
      track_type: "UNIQUE",
      is_b2b_only: false,
    });

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Unable to create product");
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-semibold text-white">
            Products
          </h1>

          <p className="mt-1 text-sm text-stone-500">
            Manage all products available in JewelCart.
          </p>
        </div>

      <button
  onClick={() => setShowProductModal(true)}
  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-medium text-stone-900 hover:bg-amber-400"
>
  <Plus size={18} />
  Add Product
</button>



      </div>

      {/* Search */}
      <div className="relative">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500"
        />

        <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        type="text"
        placeholder="Search products..."
        className="w-full rounded-xl border border-stone-800 bg-stone-900 py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500"
        />

      </div>

      {/* Table */}
       <div className="overflow-hidden rounded-2xl border border-stone-800">

        <table className="w-full">

          <thead className="bg-stone-900 text-left text-sm text-stone-400">

            <tr>

              <th className="px-5 py-4">Image</th>

              <th className="px-5 py-4">Product</th>

              <th className="px-5 py-4">Category</th>

              <th className="px-5 py-4">Badge</th>

              <th className="px-5 py-4">Price</th>

              <th className="px-5 py-4">Type</th>

              <th className="px-5 py-4 text-right">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-stone-500"
                >
                  Loading products...
                </td>
              </tr>

            ) : filteredProducts.length === 0 ? (

              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-stone-500"
                >
                  No products found.
                </td>
              </tr>

            ) : (

              filteredProducts.map((product) => (

                <tr
                  key={product.id}
                  className="border-t border-stone-800 hover:bg-stone-900/40"
                >

                  <td className="px-5 py-4">

                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-14 w-14 rounded-xl object-cover"
                    />

                  </td>

                  <td className="px-5 py-4">

                    <div className="font-medium text-white">
                      {product.title}
                    </div>

                    <div className="text-xs text-stone-500">
                      {product.id ? `#${product.id.substring(0, 8).toUpperCase()}` : "N/A"}
                    </div>

                  </td>

                  <td className="px-5 py-4 text-stone-300">
                    {product.category}
                  </td>

                  <td className="px-5 py-4">

                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                      {product.badge}
                    </span>

                  </td>

                  <td className="px-5 py-4 font-medium">
                    ₹{Number(product.msrp).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4">

                    <span className="rounded-full bg-stone-800 px-3 py-1 text-xs">
                      {product.track_type}
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-end gap-3">

                      <button
  onClick={() => openEditProduct(product)}
  className="text-blue-400 hover:text-blue-300"
>
    <Pencil size={18}/>
</button>

                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>
        </div>
{showProductModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

    <div className="w-full max-w-2xl rounded-2xl bg-stone-900 p-8">

      <h2 className="mb-6 text-2xl font-semibold text-white">
        {editMode ? "Edit Product" : "Add Product"}
      </h2>

      <div className="grid gap-5">

        <input
          placeholder="Title"
          value={productForm.title}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              title: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        />

        <input
          placeholder="Category"
          value={productForm.category}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              category: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        />

        <textarea
          placeholder="Description"
          rows={4}
          value={productForm.description}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              description: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        />

        <input
          placeholder="Image URL"
          value={productForm.image}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              image: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        />

        <input
          placeholder="Badge"
          value={productForm.badge}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              badge: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        />

        <input
          type="number"
          placeholder="MSRP"
          value={productForm.msrp}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              msrp: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        />

        <select
          value={productForm.track_type}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              track_type: e.target.value,
            })
          }
          className="rounded-lg bg-stone-800 p-3 text-white"
        >
          <option value="UNIQUE">UNIQUE</option>
          <option value="BULK">BULK</option>
        </select>

        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            checked={productForm.is_b2b_only}
            onChange={(e) =>
              setProductForm({
                ...productForm,
                is_b2b_only: e.target.checked,
              })
            }
          />
          B2B Only
        </label>

      </div>

      <div className="mt-8 flex justify-end gap-3">

        <button
          onClick={() => {

    setShowProductModal(false);

    setEditMode(false);

    setEditingProduct(null);

}}
          className="rounded-lg border border-stone-700 px-5 py-2 text-white"
        >
          Cancel
        </button>

        <button
          disabled={saving}
          onClick={
    editMode
        ? handleUpdateProduct
        : handleCreateProduct
}
          className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-black"
        >
          {saving
    ? "Saving..."
    : editMode
    ? "Update Product"
    : "Create Product"}
        </button>

      </div>

    </div>

  </div>
)}
    </div>
  );
}