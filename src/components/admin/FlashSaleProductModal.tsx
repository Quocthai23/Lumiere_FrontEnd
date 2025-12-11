import React, { useState, useEffect } from 'react';
import { flashSaleApi } from '../../api/flashSaleApi';
import httpClient from '../../utils/HttpClient';
import type { FlashSale, FlashSaleProduct } from '../../types/flashSale';
import type { Product, ProductVariant } from '../../types/product';
import { PlusCircle, Edit, Trash2, Search, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface FlashSaleProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashSale: FlashSale;
  onUpdate: () => void;
}

const FlashSaleProductModal: React.FC<FlashSaleProductModalProps> = ({ 
  isOpen, 
  onClose, 
  flashSale, 
  onUpdate 
}) => {
  const [flashSaleProducts, setFlashSaleProducts] = useState<FlashSaleProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FlashSaleProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: number }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    productVariantId: '',
    salePrice: '',
    quantity: '',
    sold: '0',
  });

  useEffect(() => {
    if (isOpen && flashSale.id) {
      fetchFlashSaleProducts();
      fetchProducts();
    }
  }, [isOpen, flashSale.id]);

  const fetchFlashSaleProducts = async () => {
    if (!flashSale.id) return;
    setIsLoading(true);
    try {
      const response = await flashSaleApi.getFlashSaleProductsByFlashSaleId(flashSale.id);
      setFlashSaleProducts(response || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm Flash Sale:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await httpClient.get<Product[]>('/products?sort=id,asc');
      setProducts(response || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
    }
  };

  const fetchVariants = async (productId: number) => {
    try {
      const response = await httpClient.get<ProductVariant[]>(
        `/product-variants?productId.equals=${productId}&sort=id,asc`
      );
      setVariants(response || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách biến thể:', err);
      setVariants([]);
    }
  };

  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    fetchVariants(productId);
    setFormData(prev => ({ ...prev, productVariantId: '' }));
  };

  const handleOpenFormForCreate = () => {
    setEditingProduct(null);
    setFormData({ productVariantId: '', salePrice: '', quantity: '', sold: '0' });
    setSelectedProductId(null);
    setVariants([]);
    setIsProductFormOpen(true);
  };

  const handleOpenFormForEdit = (product: FlashSaleProduct) => {
    setEditingProduct(product);
    if (product.productVariant?.product?.id) {
      setSelectedProductId(product.productVariant.product.id);
      fetchVariants(product.productVariant.product.id);
    }
    setFormData({
      productVariantId: product.productVariant?.id?.toString() || '',
      salePrice: product.salePrice.toString(),
      quantity: product.quantity.toString(),
      sold: product.sold.toString(),
    });
    setIsProductFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
    setFormData({ productVariantId: '', salePrice: '', quantity: '', sold: '0' });
    setSelectedProductId(null);
    setVariants([]);
  };

  const handleSaveProduct = async () => {
    if (!flashSale.id || !formData.productVariantId || !formData.salePrice || !formData.quantity) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      const payload: Omit<FlashSaleProduct, 'id'> = {
        salePrice: parseFloat(formData.salePrice),
        quantity: parseInt(formData.quantity),
        sold: parseInt(formData.sold) || 0,
        flashSale: { id: flashSale.id, name: flashSale.name, startTime: flashSale.startTime, endTime: flashSale.endTime },
        productVariant: { id: parseInt(formData.productVariantId) } as ProductVariant,
      };

      if (editingProduct?.id) {
        await flashSaleApi.updateFlashSaleProduct(editingProduct.id, payload);
      } else {
        await flashSaleApi.createFlashSaleProduct(payload);
      }

      handleCloseForm();
      fetchFlashSaleProducts();
      onUpdate();
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm Flash Sale:', err);
      alert('Đã có lỗi xảy ra khi lưu sản phẩm.');
    }
  };

  const requestDeleteProduct = (id: number) => {
    setConfirmState({ open: true, id });
  };

  const handleDeleteProduct = async () => {
    if (!confirmState.id) return;
    try {
      setDeleting(true);
      await flashSaleApi.deleteFlashSaleProduct(confirmState.id);
      setFlashSaleProducts(prev => prev.filter(p => p.id !== confirmState.id));
      setConfirmState({ open: false, id: undefined });
      onUpdate();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm Flash Sale:', err);
      alert('Xóa thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Quản lý Sản phẩm Flash Sale</h2>
            <p className="text-sm text-gray-500 mt-1">{flashSale.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="search"
                placeholder="Tìm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2 py-2 w-full border rounded-md"
              />
            </div>
            <button
              onClick={handleOpenFormForCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4" />
              Thêm sản phẩm
            </button>
          </div>

          {isLoading ? (
            <div className="text-center p-8">Đang tải...</div>
          ) : flashSaleProducts.length === 0 ? (
            <div className="text-center p-8 text-gray-500">Chưa có sản phẩm nào trong Flash Sale này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Biến thể</th>
                    <th className="px-4 py-3">Giá sale</th>
                    <th className="px-4 py-3">Số lượng</th>
                    <th className="px-4 py-3">Đã bán</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {flashSaleProducts.map((fsp) => (
                    <tr key={fsp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {fsp.productVariant?.product?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {fsp.productVariant?.name || fsp.productVariant?.sku || 'N/A'}
                        {fsp.productVariant?.color && (
                          <span className="ml-2 text-gray-500">({fsp.productVariant.color})</span>
                        )}
                        {fsp.productVariant?.size && (
                          <span className="ml-2 text-gray-500">Size: {fsp.productVariant.size}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {fsp.salePrice.toLocaleString('vi-VN')} VND
                      </td>
                      <td className="px-4 py-3">{fsp.quantity}</td>
                      <td className="px-4 py-3">{fsp.sold}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleOpenFormForEdit(fsp)}
                            className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50"
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => fsp.id && requestDeleteProduct(fsp.id)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Product Form Modal */}
        {isProductFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">
                {editingProduct ? 'Chỉnh sửa' : 'Thêm'} Sản phẩm
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => handleProductChange(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Chọn sản phẩm...</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProductId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Biến thể sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.productVariantId}
                      onChange={(e) => setFormData(prev => ({ ...prev, productVariantId: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="">Chọn biến thể...</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name || v.sku} - {v.price.toLocaleString('vi-VN')} VND
                          {v.color && ` (${v.color})`}
                          {v.size && ` Size: ${v.size}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá sale (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    required
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đã bán
                    </label>
                    <input
                      type="number"
                      value={formData.sold}
                      onChange={(e) => setFormData(prev => ({ ...prev, sold: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProduct}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    {editingProduct ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={confirmState.open}
          title="Xóa sản phẩm Flash Sale?"
          message="Bạn có chắc muốn xóa sản phẩm này khỏi Flash Sale?"
          confirmText="Xóa"
          cancelText="Hủy"
          loading={deleting}
          onConfirm={handleDeleteProduct}
          onClose={() => !deleting && setConfirmState({ open: false })}
        />
      </div>
    </div>
  );
};

export default FlashSaleProductModal;

