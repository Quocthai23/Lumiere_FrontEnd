import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Collection } from '../../types/collection';
import ShopTheLook from '../../components/customer/ShopTheLook';

const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!slug) return;
      window.scrollTo(0, 0);
      setIsLoading(true);
      try {
        const response = await axiosClient.get(`/collections?slug.equals=${slug}`);
        if (response.data && response.data.length > 0) {
          setCollection(response.data[0]);
        } else {
          setError('Không tìm thấy bộ sưu tập.');
        }
      } catch (err) {
        setError('Không thể tải bộ sưu tập.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollection();
  }, [slug]);

  if (isLoading) return <div className="text-center py-20">Đang tải...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!collection) return <div className="text-center py-20">Không tìm thấy bộ sưu tập.</div>;

  return (
    <div>
      <section
        className="relative h-96 bg-cover bg-center text-white flex items-center justify-center rounded-lg overflow-hidden mb-12"
        style={{ backgroundImage: `url(${collection.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{collection.name}</h1>
          <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">
            {collection.description}
          </p>
        </div>
      </section>

      <ShopTheLook look={collection.look} />
      
       <div className="text-center mt-12">
            <Link to="/collections" className="text-indigo-600 font-semibold hover:underline">
                &larr; Quay lại tất cả bộ sưu tập
            </Link>
        </div>
    </div>
  );
};

export default CollectionDetailPage;
