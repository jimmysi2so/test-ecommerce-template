'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cartService } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  onAddedToCart?: (productId: number, quantity: number) => void;
}

export function ProductCard({ product, onAddedToCart }: ProductCardProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para agregar productos', {
        description: 'Necesitas una cuenta para comprar',
      });
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const result = await cartService.add(user!.id, product.id, quantity);
      
      if (result.success) {
        setAdded(true);
        toast.success('Producto agregado', {
          description: `${quantity}x ${product.name} agregado a tu carrito`,
        });
        
        // Actualizar stock localmente (sin recargar página)
        if (onAddedToCart) {
          onAddedToCart(product.id, quantity);
        }
        
        // Resetear cantidad
        setQuantity(1);
        setTimeout(() => setAdded(false), 2000);
      } else {
        toast.error('Error', {
          description: result.error || 'No se pudo agregar al carrito',
        });
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      toast.error('Error de conexión', {
        description: 'Verifica tu conexión e intenta nuevamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="aspect-square bg-gray-200 rounded-md mb-4 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
          ) : (
            <span className="text-gray-400">Sin imagen</span>
          )}
        </div>
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">{product.description || 'Sin descripción'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-green-600">
            ${product.price}
          </span>
          <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
            {product.stock > 0 ? `Disponible: ${product.stock}` : 'Agotado'}
          </Badge>
        </div>
        
        {product.stock > 0 && (
          <div className="flex items-center justify-center gap-3 mb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold w-12 text-center">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              disabled={quantity >= product.stock}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={product.stock === 0 || loading}
          onClick={handleAddToCart}
        >
          {loading ? (
            'Agregando...'
          ) : added ? (
            <>✓ Agregado</>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.stock > 0 ? `Agregar ${quantity > 1 ? `(${quantity})` : ''}` : 'Sin stock'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}