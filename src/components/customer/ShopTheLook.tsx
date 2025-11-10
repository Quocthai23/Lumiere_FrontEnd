// src/components/shop/ShopTheLook.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import httpClient from "../../utils/HttpClient";
import type {Product, ProductVariant} from "../../types/product";
import type {Collection} from "../../types/collection.ts";

type Props = { collection: Collection };

// ===== Helpers =====
const PLACEHOLDER = (w: number, h: number, text = "IMG") =>
    `https://placehold.co/${w}x${h}/EFEFEF/333333?text=${encodeURIComponent(text)}`;

const formatVND = (n?: number) =>
    typeof n === "number" ? n.toLocaleString("vi-VN") + " VND" : "—";

const pickDefaultVariant = (p: Product): ProductVariant | undefined =>
    p.variants?.find(v => v.isDefault) ?? p.variants?.[0];

// ===== Component =====
const ShopTheLook: React.FC<Props> = ({ collection }) => {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState<string>("");
  const [variantsByProduct, setVariantsByProduct] = useState<Record<number, ProductVariant[]>>(
      {}
  );

  const toastTimeoutRef = useRef<number | undefined>(undefined);

  // Cleanup toast timeout
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Tải product + batch variants theo productIds
  useEffect(() => {
    const list = collection?.products ?? [];
    if (!list.length) {
      setProducts([]);
      setVariantsByProduct({});
      setIsLoading(false);
      return;
    }

    let aborted = false;
    const abort = new AbortController();

    (async () => {
      setIsLoading(true);
      setError("");
      try {
        // render nhanh danh sách product hiện có
        setProducts(list);

        // lấy id cần fetch variants (nếu product chưa có variants)
        const idsToFetch = Array.from(
            new Set(
                list
                    .filter(p => !p.variants || p.variants.length === 0)
                    .map(p => p.id)
            )
        );
        if (!idsToFetch.length) return;

        // GỌI API: /api/product-variants/by-product-ids?productIds=1,2,3
        const res = await httpClient.get<ProductVariant[]>(
            `/product-variants/by-product-ids?productIds=${idsToFetch}`
        );

        // Gom variant theo productId
        const map = (res || []).reduce<Record<number, ProductVariant[]>>((acc, v) => {
          if (!v?.product?.id) return acc;
          (acc[v.product?.id] ||= []).push(v);
          return acc;
        }, {});

        if (!aborted) setVariantsByProduct(prev => ({ ...prev, ...map }));
      } catch (e: any) {
        if (e?.name !== "CanceledError") setError("Không tải được biến thể sản phẩm.");
      } finally {
        if (!aborted) setIsLoading(false);
      }
    })();

    return () => {
      aborted = true;
      abort.abort();
    };
  }, [collection?.id]);

  // Hợp nhất variants: ưu tiên data từ API, fallback variants có sẵn trong product
  const enrichedProducts = useMemo(() => {
    return (products || []).map(p => {
      const apiVariants = variantsByProduct[p.id];
      const merged = apiVariants && apiVariants.length ? apiVariants : p.variants || [];
      return { ...p, variants: merged };
    });
  }, [products, variantsByProduct]);

  // Thêm tất cả vào giỏ
  const handleAddAllToCart = () => {
    let added = 0;
    enrichedProducts.forEach(product => {
      const def = pickDefaultVariant(product);
      if (def && (def.stockQuantity ?? 0) > 0) {
        addToCart(product as any, def, 1);
        added++;
      }
    });

    setNotification(added > 0 ? `Đã thêm ${added} sản phẩm vào giỏ hàng!` : "Không có sản phẩm khả dụng để thêm.");
    toastTimeoutRef.current = window.setTimeout(() => setNotification(""), 2500);
  };

  const allUnavailable = useMemo(
      () =>
          enrichedProducts.every(p => {
            const v = pickDefaultVariant(p);
            return !v || (v.stockQuantity ?? 0) <= 0;
          }),
      [enrichedProducts]
  );

  // ===== UI =====
  if (isLoading) {
    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-80 w-full bg-gray-200 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-5 w-48 bg-gray-200 rounded" />
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
              ))}
              <div className="h-11 w-full bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="bg-white p-8 rounded-lg shadow-sm border relative">
        {/* Toast */}
        {notification && (
            <div className="fixed top-5 right-5 bg-black text-white py-2 px-4 rounded-lg shadow-lg z-50">
              {notification}
            </div>
        )}

        {/* Error */}
        {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Shop The Look</h3>
            {collection.imageUrl ? (
                <img
                    src={collection.imageUrl}
                    alt={collection.name || "Shop the look"}
                    className="w-full rounded-lg shadow-md object-cover max-h-[480px]"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = PLACEHOLDER(600, 800, "Look");
                    }}
                />
            ) : (
                <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm border">
                  Không có ảnh look
                </div>
            )}
          </div>

          {/* Right */}
          <div className="flex flex-col">
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-1">
              {enrichedProducts.map(p => {
                const def = pickDefaultVariant(p);

                return (
                    <div key={p.id} className="flex items-start gap-4 border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <img
                            src={def?.urlImage}
                            alt={p.name}
                            className="w-20 h-20 object-cover rounded-md border bg-white"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER(80, 80);
                            }}
                        />
                      </div>

                      <div className="flex-grow min-w-0">
                        <Link to={`/products/${p.slug}`} className="font-semibold text-gray-800 hover:underline block truncate">
                          {p.name}
                        </Link>

                        <p className={ "text-indigo-600" }>
                          {formatVND(def?.price)}
                        </p>
                      </div>
                    </div>
                );
              })}
            </div>

            <button
                onClick={handleAddAllToCart}
                disabled={allUnavailable || enrichedProducts.length === 0}
                className={`mt-6 w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors
              ${
                    allUnavailable || enrichedProducts.length === 0
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
            >
              <ShoppingCart size={20} />
              Thêm tất cả vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
  );
};

export default ShopTheLook;
