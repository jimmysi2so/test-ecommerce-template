'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, SlidersHorizontal } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Product {
  price: string;
}

interface ProductFiltersProps {
  categories: Category[];
  products: Product[];
  onFilterChange: (filters: {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

export function ProductFilters({ categories, products, onFilterChange }: ProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Obtener lista de precios únicos y ordenados
  const uniquePrices = Array.from(
    new Set(
      products
        .map(p => parseFloat(p.price))
        .filter(p => !isNaN(p))
    )
  ).sort((a, b) => a - b);

  const minPossiblePrice = uniquePrices.length > 0 ? uniquePrices[0]! : 0;
  const maxPossiblePrice = uniquePrices.length > 0 ? uniquePrices[uniquePrices.length - 1]! : 2000;
  
  const [minIndex, setMinIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(Math.max(0, uniquePrices.length - 1));

  // Actualizar índices cuando cambien los productos
  useEffect(() => {
    setMinIndex(0);
    setMaxIndex(Math.max(0, uniquePrices.length - 1));
  }, [uniquePrices.length]);

  const currentMinPrice = uniquePrices[minIndex] ?? minPossiblePrice;
  const currentMaxPrice = uniquePrices[maxIndex] ?? maxPossiblePrice;

  const handleSliderChange = (value: number[]) => {
    if (value[0] !== undefined && value[1] !== undefined) {
      setMinIndex(value[0]);
      setMaxIndex(value[1]);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange({
      categoryId: selectedCategory && selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
      minPrice: minIndex > 0 ? currentMinPrice : undefined,
      maxPrice: maxIndex < uniquePrices.length - 1 ? currentMaxPrice : undefined,
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinIndex(0);
    setMaxIndex(Math.max(0, uniquePrices.length - 1));
    onFilterChange({});
  };

  const hasActiveFilters = 
    selectedCategory || 
    minIndex > 0 || 
    maxIndex < uniquePrices.length - 1;

  // Si no hay productos o solo hay uno, no mostrar el filtro de precio
  const showPriceFilter = uniquePrices.length > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Categoría</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showPriceFilter && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Rango de Precio</Label>
              <span className="text-sm font-semibold text-green-600">
                ${currentMinPrice.toFixed(2)} - ${currentMaxPrice.toFixed(2)}
              </span>
            </div>
            
            <div className="pt-2 pb-4">
              <Slider
                min={0}
                max={Math.max(0, uniquePrices.length - 1)}
                step={1}
                value={[minIndex, maxIndex]}
                onValueChange={handleSliderChange}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>${minPossiblePrice.toFixed(2)}</span>
              <span>${maxPossiblePrice.toFixed(2)}</span>
            </div>

            
          </div>
        )}

        <Button onClick={handleApplyFilters} className="w-full">
          Aplicar Filtros
        </Button>
      </CardContent>
    </Card>
  );
}