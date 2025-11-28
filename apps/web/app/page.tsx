'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { productService, categoryService } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { ProductFilters } from '@/components/ProductFilters';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
  }>({});

  // Query para categorías
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  // Query para productos con filtros
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['products', user?.id, searchQuery, filters],
    queryFn: () => productService.getAll({
      userId: isAuthenticated ? user?.id : undefined,
      search: searchQuery || undefined,
      ...filters,
    }),
  });

  // Query para todos los productos (sin filtros) para calcular rango de precios
  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => productService.getAll({}),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleProductUpdate = (productId: number, quantityAdded: number) => {
    refetch();
  };

  const hasActiveFilters = filters.categoryId || filters.minPrice !== undefined || filters.maxPrice !== undefined;
  const resultsCount = products.length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Productos Disponibles</h1>
            <p className="text-gray-600 mb-6">Explora nuestro catálogo</p>
            
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Buscar productos por nombre o descripción..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar con filtros */}
            <div className="lg:col-span-1">
              <ProductFilters 
                categories={categories}
                products={allProducts}
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* Productos */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando productos...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {searchQuery || hasActiveFilters
                      ? 'No se encontraron productos con estos criterios'
                      : 'No hay productos disponibles'
                    }
                  </p>
                  {(searchQuery || hasActiveFilters) && (
                    <p className="text-gray-400 mt-2">Intenta ajustar los filtros o la búsqueda</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-gray-600">
                      {resultsCount} {resultsCount === 1 ? 'producto encontrado' : 'productos encontrados'}
                    </p>
                    {(searchQuery || hasActiveFilters) && (
                      <p className="text-sm text-gray-500">
                        Filtrando resultados
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product: any) => (
                      <ProductCard 
                        key={product.id} 
                        product={product}
                        onAddedToCart={handleProductUpdate}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}