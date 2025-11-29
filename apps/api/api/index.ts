import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from '../../../packages/database/db';
import { users, products, carts, cartItems, orders, orderItems, categories } from '../../../packages/database/schema';
import { eq, and, asc } from 'drizzle-orm';

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }))
  
  // ===== RUTAS GENERALES =====
  .get('/', () => ({ message: 'E-commerce API funcionando! 🚀' }))
  
  // ===== CATEGORÍAS =====
  .get('/categories', async () => {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));
    return { categories: allCategories };
  })
  
  .post('/categories', async ({ body }: { body: any }) => {
    try {
      const newCategory = await db
        .insert(categories)
        .values({
          name: body.name,
          description: body.description || null,
        })
        .returning();
      
      return { success: true, category: newCategory[0]! };
    } catch (error) {
      return { success: false, error: 'La categoría ya existe o hubo un error' };
    }
  })
  
  // ===== PRODUCTOS =====
  .get('/products', async ({ query }: { query: any }) => {
    try {
      let allProducts = await db
        .select()
        .from(products)
        .orderBy(asc(products.id));
      
      // Filtro: solo activos (si no es admin)
      if (!query.admin) {
        allProducts = allProducts.filter(p => p.active);
      }
      
      // Filtro: por categoría
      if (query.categoryId) {
        const categoryId = parseInt(query.categoryId);
        allProducts = allProducts.filter(p => p.categoryId === categoryId);
      }
      
      // Filtro: búsqueda por nombre/descripción
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        allProducts = allProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }
      
      // Filtro: rango de precios
      if (query.minPrice) {
        const minPrice = parseFloat(query.minPrice);
        allProducts = allProducts.filter(p => parseFloat(p.price) >= minPrice);
      }
      
      if (query.maxPrice) {
        const maxPrice = parseFloat(query.maxPrice);
        allProducts = allProducts.filter(p => parseFloat(p.price) <= maxPrice);
      }
      
      // Si viene userId, ajustar stock disponible
      if (query.userId) {
        const userId = parseInt(query.userId);
        
        const cartResult = await db
          .select()
          .from(carts)
          .where(eq(carts.userId, userId))
          .limit(1);
        
        if (cartResult.length > 0) {
          const cart = cartResult[0]!;
          
          const cartItemsResult = await db
            .select()
            .from(cartItems)
            .where(eq(cartItems.cartId, cart.id));
          
          const cartQuantities = new Map<number, number>();
          for (const item of cartItemsResult) {
            cartQuantities.set(item.productId, item.quantity);
          }
          
          allProducts = allProducts.map(product => ({
            ...product,
            stock: product.stock - (cartQuantities.get(product.id) || 0),
            realStock: product.stock,
          }));
        }
      }
      
      return { products: allProducts };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [] };
    }
  })

  .get('/products/:id', async ({ params }) => {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(params.id)))
      .limit(1);
    
    if (product.length === 0) {
      return { error: 'Producto no encontrado' };
    }
    return { product: product[0] };
  })

  .post('/products', async ({ body }) => {
    const newProduct = await db
      .insert(products)
      .values(body as any)
      .returning();
    
    return { product: newProduct[0]! };
  })

  .put('/products/:id', async ({ params, body }: { params: any, body: any }) => {
    const productId = parseInt(params.id);
    
    const updated = await db
      .update(products)
      .set(body)
      .where(eq(products.id, productId))
      .returning();
    
    if (updated.length === 0) {
      return { success: false, error: 'Producto no encontrado' };
    }
    
    return { success: true, product: updated[0]! };
  })

  .patch('/products/:id/toggle', async ({ params }: { params: any }) => {
    const productId = parseInt(params.id);
    
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    
    if (product.length === 0) {
      return { success: false, error: 'Producto no encontrado' };
    }
    
    const updated = await db
      .update(products)
      .set({ active: !product[0]!.active })
      .where(eq(products.id, productId))
      .returning();
    
    return { success: true, product: updated[0]! };
  })

  .delete('/products/:id', async ({ params }: { params: any }) => {
    const productId = parseInt(params.id);
    
    try {
      await db
        .delete(products)
        .where(eq(products.id, productId));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'No se puede eliminar el producto. Puede estar referenciado en órdenes.' };
    }
  })
  
  // ===== USUARIOS =====
  .post('/auth/register', async ({ body }: { body: any }) => {
    try {
      const newUser = await db
        .insert(users)
        .values({
          name: body.name,
          email: body.email,
          password: body.password,
          role: 'customer',
        })
        .returning();
      
      const user = newUser[0]!;
      
      return { 
        success: true, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role
        } 
      };
    } catch (error) {
      return { success: false, error: 'El email ya está registrado' };
    }
  })
  
  .post('/auth/login', async ({ body }: { body: any }) => {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    
    if (user.length === 0 || user[0]!.password !== body.password) {
      return { success: false, error: 'Credenciales inválidas' };
    }
    
    const foundUser = user[0]!;
    
    return { 
      success: true, 
      user: { 
        id: foundUser.id, 
        name: foundUser.name, 
        email: foundUser.email,
        role: foundUser.role
      } 
    };
  })
  
  // ===== CARRITO =====
  .get('/cart/:userId', async ({ params }) => {
    const userId = parseInt(params.userId);
    
    let cartResult = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    
    let cart;
    if (cartResult.length === 0) {
      const newCart = await db
        .insert(carts)
        .values({ userId })
        .returning();
      cart = newCart[0]!;
    } else {
      cart = cartResult[0]!;
    }
    
    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));
    
    return { cart, items };
  })
  
  .post('/cart/add', async ({ body }: { body: any }) => {
    const { userId, productId, quantity } = body;
    
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    
    if (productResult.length === 0) {
      return { success: false, error: 'Producto no encontrado' };
    }
    
    const product = productResult[0]!;
    
    let cartResult = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    
    let cart;
    if (cartResult.length === 0) {
      const newCart = await db
        .insert(carts)
        .values({ userId })
        .returning();
      cart = newCart[0]!;
    } else {
      cart = cartResult[0]!;
    }
    
    const existingItemResult = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, productId)
        )
      )
      .limit(1);
    
    if (existingItemResult.length > 0) {
      const existingItem = existingItemResult[0]!;
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return { 
          success: false, 
          error: `Stock insuficiente. Disponible: ${product.stock}` 
        };
      }
      
      const updated = await db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      
      return { success: true, item: updated[0]! };
    } else {
      if (quantity > product.stock) {
        return { 
          success: false, 
          error: `Stock insuficiente. Disponible: ${product.stock}` 
        };
      }
      
      const newItem = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          quantity,
        })
        .returning();
      
      return { success: true, item: newItem[0]! };
    }
  })
  
  .delete('/cart/item/:itemId', async ({ params }) => {
    await db
      .delete(cartItems)
      .where(eq(cartItems.id, parseInt(params.itemId)));
    
    return { success: true };
  })
  
  // ===== ÓRDENES =====
  .post('/orders/create', async ({ body }: { body: any }) => {
    const { userId } = body;
    
    const cartResult = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    
    if (cartResult.length === 0) {
      return { success: false, error: 'Carrito vacío' };
    }
    
    const cart = cartResult[0]!;
    
    const items = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));
    
    if (items.length === 0) {
      return { success: false, error: 'Carrito vacío' };
    }
    
    for (const item of items) {
      if (item.product.stock < item.cartItem.quantity) {
        return { 
          success: false, 
          error: `Stock insuficiente para ${item.product.name}. Stock disponible: ${item.product.stock}` 
        };
      }
    }
    
    const total = items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.cartItem.quantity);
    }, 0);
    
    const newOrder = await db
      .insert(orders)
      .values({
        userId,
        total: total.toFixed(2),
        status: 'pending',
      })
      .returning();
    
    const order = newOrder[0]!;
    
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.cartItem.quantity,
        price: item.product.price,
      });
      
      await db
        .update(products)
        .set({ 
          stock: item.product.stock - item.cartItem.quantity 
        })
        .where(eq(products.id, item.product.id));
    }
    
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cart.id));
    
    return { success: true, order };
  })
  
  .get('/orders/:userId', async ({ params }) => {
    const userId = parseInt(params.userId);
    
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
    
    return { orders: userOrders };
  });

export default app;
