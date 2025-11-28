'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cartService, orderService } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    description: string | null;
    price: string;
    image: string | null;
    stock: number;
  };
}

export default function CartPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    loadCart();
  }, [isAuthenticated, router]);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await cartService.get(user.id);
      setItems(data.items);
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      toast.error('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: number, productName: string) => {
    try {
      await cartService.removeItem(itemId);
      setItems(items.filter(item => item.id !== itemId));
      toast.success(`${productName} eliminado del carrito`);
    } catch (error) {
      console.error('Error al eliminar item:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    
    setCheckoutLoading(true);
    try {
      const result = await orderService.create(user.id);
      
      if (result.success) {
        toast.success('¡Compra realizada con éxito!', {
          description: `Total: $${calculateTotal()}`,
          icon: <CheckCircle2 className="h-5 w-5" />,
          duration: 3000,
        });
        setItems([]);
        
        // Esperar un poco para que el usuario vea el mensaje
        setTimeout(() => {
          // Redirigir a órdenes
          router.push('/orders');
          // Refrescar la página principal para actualizar stock
          router.refresh();
        }, 1500);
      } else {
        toast.error('Error al procesar la compra', {
          description: result.error || 'Intenta nuevamente',
        });
      }
    } catch (error) {
      console.error('Error al crear orden:', error);
      toast.error('Error al procesar la compra', {
        description: 'Verifica tu conexión e intenta nuevamente',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0).toFixed(2);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Mi Carrito</h1>
            <p className="text-gray-600">Revisa tus productos antes de comprar</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
              <Button onClick={() => router.push('/')}>
                Ir a comprar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Sin imagen</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.product.name}</h3>
                      <p className="text-gray-600 text-sm">{item.product.description}</p>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-green-600">
                          ${item.product.price}
                        </span>
                        <span className="text-gray-500 ml-2">
                          x {item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xl font-bold">
                        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id, item.product.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-gray-100">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Total</CardTitle>
                    <span className="text-3xl font-bold text-green-600">
                      ${calculateTotal()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? 'Procesando...' : 'Finalizar Compra'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}