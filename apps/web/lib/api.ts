import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProductFilters {
  userId?: number;
  isAdmin?: boolean;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

// Funciones para productos
export const productService = {
  getAll: async (filters?: ProductFilters) => {
    const params: any = {};
    
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.isAdmin) params.admin = true;
    if (filters?.search) params.search = filters.search;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters?.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    
    const response = await api.get('/products', { params });
    return response.data.products.sort((a: any, b: any) => a.id - b.id);
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  },
  
  create: async (product: any) => {
    const response = await api.post('/products', product);
    return response.data.product;
  },
  
  update: async (id: number, product: any) => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },
  
  toggle: async (id: number) => {
    const response = await api.patch(`/products/${id}/toggle`);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Funciones para autenticación
export const authService = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Funciones para carrito
export const cartService = {
  get: async (userId: number) => {
    const response = await api.get(`/cart/${userId}`);
    return response.data;
  },
  
  add: async (userId: number, productId: number, quantity: number) => {
    const response = await api.post('/cart/add', { userId, productId, quantity });
    return response.data;
  },
  
  removeItem: async (itemId: number) => {
    const response = await api.delete(`/cart/item/${itemId}`);
    return response.data;
  },
};

// Funciones para órdenes
export const orderService = {
  create: async (userId: number) => {
    const response = await api.post('/orders/create', { userId });
    return response.data;
  },
  
  getByUser: async (userId: number) => {
    const response = await api.get(`/orders/${userId}`);
    return response.data.orders;
  },
};

// Funciones para categorías
export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data.categories;
  },
  
  create: async (name: string, description?: string) => {
    const response = await api.post('/categories', { name, description });
    return response.data;
  },
};