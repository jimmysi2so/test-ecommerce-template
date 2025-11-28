'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { productService, categoryService } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { SearchBar } from '@/components/SearchBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldCheck, Pencil, Trash2, Eye, EyeOff, Plus, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  image: string | null;
  active: boolean;
  categoryId: number | null;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Estados para crear categoría
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    categoryId: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión');
      router.push('/auth');
      return;
    }

    if (!isAdmin) {
      toast.error('No tienes permisos de administrador');
      router.push('/');
      return;
    }

    loadProducts();
    loadCategories();
  }, [isAuthenticated, isAdmin, router]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll(undefined, true);
      setProducts(data);
      
      if (searchQuery.trim()) {
        applySearch(searchQuery, data);
      } else {
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar categorías');
    }
  };

  const applySearch = (query: string, productsToFilter: Product[] = products) => {
    if (!query.trim()) {
      setFilteredProducts(productsToFilter);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = productsToFilter.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
      product.id.toString().includes(query)
    );
    
    setFilteredProducts(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applySearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      categoryId: value
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const result = await categoryService.create(newCategoryName, newCategoryDescription);
      
      if (result.success) {
        toast.success('Categoría creada exitosamente');
        await loadCategories();
        setFormData({ ...formData, categoryId: result.category.id.toString() });
        setNewCategoryName('');
        setNewCategoryDescription('');
        setCategoryPopoverOpen(false);
      } else {
        toast.error(result.error || 'Error al crear categoría');
      }
    } catch (error) {
      toast.error('Error al crear categoría');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      image: '',
      categoryId: '',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock.toString(),
      image: product.image || '',
      categoryId: product.categoryId ? product.categoryId.toString() : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setFormLoading(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        stock: parseInt(formData.stock),
        image: formData.image || null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      };

      if (editingProduct) {
        const result = await productService.update(editingProduct.id, productData);
        if (result.success) {
          toast.success('Producto actualizado exitosamente');
          
          const updatedProduct = { ...editingProduct, ...productData };
          
          const updatedProducts = products.map(p => 
            p.id === editingProduct.id ? updatedProduct : p
          );
          setProducts(updatedProducts);
          
          const updatedFilteredProducts = filteredProducts.map(p => 
            p.id === editingProduct.id ? updatedProduct : p
          );
          setFilteredProducts(updatedFilteredProducts);
          
        } else {
          toast.error('Error al actualizar el producto');
        }
      } else {
        await productService.create(productData);
        toast.success('Producto creado exitosamente');
        await loadProducts();
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el producto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (product: Product) => {
    try {
      const result = await productService.toggle(product.id);
      if (result.success) {
        toast.success(product.active ? 'Producto desactivado' : 'Producto activado');
        
        const updatedProduct = { ...product, active: !product.active };
        
        const updatedProducts = products.map(p => 
          p.id === product.id ? updatedProduct : p
        );
        setProducts(updatedProducts);
        
        const updatedFilteredProducts = filteredProducts.map(p => 
          p.id === product.id ? updatedProduct : p
        );
        setFilteredProducts(updatedFilteredProducts);
      }
    } catch (error) {
      toast.error('Error al cambiar estado del producto');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      return;
    }

    try {
      const result = await productService.delete(product.id);
      if (result.success) {
        toast.success('Producto eliminado');
        
        const updatedProducts = products.filter(p => p.id !== product.id);
        setProducts(updatedProducts);
        
        const updatedFilteredProducts = filteredProducts.filter(p => p.id !== product.id);
        setFilteredProducts(updatedFilteredProducts);
      } else {
        toast.error(result.error || 'Error al eliminar el producto');
      }
    } catch (error) {
      toast.error('Error al eliminar el producto');
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-4xl font-bold">Panel de Administración</h1>
                  <p className="text-gray-600">Gestiona tu catálogo de productos</p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProduct ? 'Modifica los datos del producto' : 'Completa la información del nuevo producto'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: iPhone 15 Pro"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descripción del producto"
                      />
                    </div>

                    <div>
                      <Label>Categoría</Label>
                      <div className="flex gap-2">
                        <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin categoría</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <FolderPlus className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Nueva Categoría</h4>
                                <p className="text-sm text-gray-600 mb-4">
                                  Crea una nueva categoría sin salir del formulario
                                </p>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="newCategoryName">Nombre *</Label>
                                  <Input
                                    id="newCategoryName"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ej: Electrónica"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="newCategoryDescription">Descripción</Label>
                                  <Input
                                    id="newCategoryDescription"
                                    value={newCategoryDescription}
                                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                                    placeholder="Descripción opcional"
                                  />
                                </div>
                                
                                <Button
                                  type="button"
                                  onClick={handleCreateCategory}
                                  disabled={isCreatingCategory}
                                  className="w-full"
                                >
                                  {isCreatingCategory ? 'Creando...' : 'Crear Categoría'}
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Precio * ($)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="999.99"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="stock">Stock *</Label>
                        <Input
                          id="stock"
                          name="stock"
                          type="number"
                          value={formData.stock}
                          onChange={handleChange}
                          placeholder="50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="image">URL de Imagen</Label>
                      <Input
                        id="image"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1" disabled={formLoading}>
                        {formLoading ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear Producto'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <SearchBar 
              onSearch={handleSearch}
              placeholder="Buscar por nombre, descripción o ID..."
            />
          </div>

          {loading && products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando productos...</p>
            </div>
          ) : (
            <>
              {searchQuery && (
                <p className="text-gray-600 mb-4">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery}"
                </p>
              )}
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {searchQuery 
                      ? `No se encontraron productos para "${searchQuery}"`
                      : 'No hay productos disponibles'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className={!product.active ? 'opacity-60' : ''}>
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-gray-400 text-xs">Sin imagen</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">ID: {product.id}</span>
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <Badge variant={product.active ? 'default' : 'secondary'}>
                              {product.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Badge variant="outline">
                              {getCategoryName(product.categoryId)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span className="font-bold text-green-600">${product.price}</span>
                            <span className="text-gray-600">Stock: {product.stock}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggle(product)}
                            title={product.active ? 'Desactivar' : 'Activar'}
                          >
                            {product.active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(product)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}