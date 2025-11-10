import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Collection } from '../../types/collection';
import httpClient from "../../utils/HttpClient.ts";

const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      try {
        const response = await httpClient.get<Collection[]>('/collections');
        setCollections(response);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollections();
  }, []);

  if (isLoading) {
    return <div>Đang tải các bộ sưu tập...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">Bộ Sưu Tập</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {collections.map((collection) => {
          return ((
              <Link to={`/collections/${collection.id}`} key={collection.id} className="group relative block bg-black rounded-lg overflow-hidden h-96">
                <img
                    alt={collection.name}
                    src={collection.imageUrl}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                    className="absolute inset-0 z-0 h-full w-full object-cover opacity-75 transition-opacity group-hover:opacity-50"
                />

                <div className="relative p-8 flex flex-col justify-between h-full">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-widest text-pink-500">
                      Bộ sưu tập
                    </p>
                    <p className="text-2xl font-bold text-white">{collection.name}</p>
                  </div>
                  <div className="translate-y-8 transform opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-sm text-white">
                      {collection.description}
                    </p>
                  </div>
                </div>
              </Link>
          ))
        })}
      </div>
    </div>
  );
};

export default CollectionsPage;
