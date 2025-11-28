import { db } from '../../packages/database/db';
import { products, users, orders, orderItems, carts, cartItems, categories } from '../../packages/database/schema';
import { eq } from 'drizzle-orm';

const sampleCategories = [
  { name: 'Laptops', description: 'Computadoras portátiles' },
  { name: 'Smartphones', description: 'Teléfonos inteligentes' },
  { name: 'Monitores', description: 'Pantallas y monitores' },
  { name: 'Periféricos', description: 'Teclados, ratones y accesorios' },
  { name: 'Audio', description: 'Auriculares y equipos de audio' },
  { name: 'Tablets', description: 'Tabletas y e-readers' },
  { name: 'Consolas', description: 'Consolas de videojuegos' },
  { name: 'Accesorios', description: 'Accesorios diversos' },
  { name: 'Almacenamiento', description: 'Discos duros y SSDs' },
  { name: 'Smart Home', description: 'Dispositivos inteligentes para el hogar' },
];

const sampleProducts = [
  { name: "Laptop Gaming ROG", description: "ASUS ROG Strix con RTX 4070, Intel i7 13th Gen, 16GB RAM, 1TB SSD", price: "1499.99", stock: 12, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80", categoryName: "Laptops" },
  { name: "iPhone 15 Pro Max", description: "256GB, Titanio Natural, Chip A17 Pro, Cámara de 48MP", price: "1199.99", stock: 25, image: "https://images.unsplash.com/photo-1592286927505-b0768e6e7e94?w=500&q=80", categoryName: "Smartphones" },
  { name: "Monitor 4K LG UltraGear", description: "27 pulgadas, 144Hz, HDR10, IPS, 1ms, HDMI 2.1", price: "449.99", stock: 18, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80", categoryName: "Monitores" },
  { name: "Teclado Mecánico Logitech G915", description: "RGB, Switches GX Blue, Inalámbrico, Batería 30hrs", price: "189.99", stock: 30, image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80", categoryName: "Periféricos" },
  { name: "Mouse Logitech MX Master 3S", description: "Inalámbrico, Sensor 8K DPI, Ergonómico, Multi-dispositivo", price: "99.99", stock: 45, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80", categoryName: "Periféricos" },
  { name: "Auriculares Sony WH-1000XM5", description: "Cancelación de ruido líder, 30hrs batería, Hi-Res Audio", price: "379.99", stock: 22, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80", categoryName: "Audio" },
  { name: "iPad Pro 12.9\" M2", description: "256GB, WiFi, Chip M2, ProMotion, Face ID, Apple Pencil", price: "1099.99", stock: 15, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80", categoryName: "Tablets" },
  { name: "Samsung Galaxy S24 Ultra", description: "512GB, Snapdragon 8 Gen 3, Cámara 200MP, S Pen incluido", price: "1299.99", stock: 20, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80", categoryName: "Smartphones" },
  { name: "Apple Watch Series 9", description: "GPS + Cellular, 45mm, Titanio, Sensor temperatura", price: "799.99", stock: 28, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80", categoryName: "Accesorios" },
  { name: "MacBook Air M3", description: "15 pulgadas, 16GB RAM, 512GB SSD, Midnight", price: "1699.99", stock: 10, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80", categoryName: "Laptops" },
  { name: "PS5 Digital Edition", description: "Consola PlayStation 5, 825GB SSD, Ray Tracing, 4K 120Hz", price: "449.99", stock: 8, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80", categoryName: "Consolas" },
  { name: "Nintendo Switch OLED", description: "Pantalla OLED 7\", 64GB, Dock mejorado, Blanco", price: "349.99", stock: 35, image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&q=80", categoryName: "Consolas" },
  { name: "Webcam Logitech Brio 4K", description: "Ultra HD 4K, HDR, Autoenfoque, Dual Micrófono", price: "199.99", stock: 40, image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=500&q=80", categoryName: "Accesorios" },
  { name: "SSD Samsung 990 PRO", description: "2TB NVMe, 7450MB/s lectura, PCIe 4.0, PS5 compatible", price: "179.99", stock: 50, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80", categoryName: "Almacenamiento" },
  { name: "Silla Gaming Secretlab TITAN", description: "Cuero PU, Soporte lumbar, 4D Armrests, Reclinable 165°", price: "549.99", stock: 14, image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500&q=80", categoryName: "Accesorios" },
  { name: "AirPods Pro 2da Gen", description: "USB-C, Cancelación activa de ruido, Audio espacial, H2", price: "249.99", stock: 60, image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500&q=80", categoryName: "Audio" },
  { name: "Razer BlackWidow V4 Pro", description: "Mecánico, Green Switches, RGB Chroma, Rueda de comandos", price: "229.99", stock: 25, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80", categoryName: "Periféricos" },
  { name: "GoPro HERO 12 Black", description: "5.3K60 Video, HDR, HyperSmooth 6.0, Sumergible 10m", price: "399.99", stock: 32, image: "https://images.unsplash.com/photo-1591605505262-e0750d8d3295?w=500&q=80", categoryName: "Accesorios" },
  { name: "Bose QuietComfort 45", description: "Cancelación de ruido, 24hrs batería, Bluetooth 5.1", price: "329.99", stock: 38, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80", categoryName: "Audio" },
  { name: "Ring Video Doorbell Pro 2", description: "1536p HDR, Visión 3D, Alexa, Detección de movimiento", price: "249.99", stock: 27, image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80", categoryName: "Smart Home" },
];

const sampleUsers = [
  { name: "Admin User", email: "admin@ecommerce.com", password: "admin123", role: "admin" },
  { name: "Demo User", email: "demo@test.com", password: "demo123", role: "customer" }
];

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  try {
    console.log('🗑️  Limpiando datos existentes...');
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(users);
    
    console.log('\n📂 Creando categorías...');
    const categoryMap = new Map<string, number>();
    for (const category of sampleCategories) {
      const result = await db.insert(categories).values(category).returning();
      categoryMap.set(category.name, result[0]!.id);
      console.log(`   ✓ Categoría creada: ${category.name}`);
    }

    console.log('\n👥 Creando usuarios de prueba...');
    for (const user of sampleUsers) {
      await db.insert(users).values(user);
      console.log(`   ✓ Usuario creado: ${user.email} (${user.role})`);
    }

    console.log('\n📦 Creando productos...');
    let count = 0;
    for (const product of sampleProducts) {
      const { categoryName, ...productData } = product;
      const categoryId = categoryMap.get(categoryName);
      
      await db.insert(products).values({
        ...productData,
        categoryId: categoryId || null,
      });
      count++;
      console.log(`   ✓ ${count}/${sampleProducts.length} - ${product.name} (${categoryName})`);
    }

    console.log('\n✅ Seed completado exitosamente!');
    console.log(`   📂 ${sampleCategories.length} categorías creadas`);
    console.log(`   📊 ${count} productos creados`);
    console.log(`   👤 ${sampleUsers.length} usuarios disponibles\n`);
    
    console.log('🔑 Credenciales de prueba:');
    console.log('   👑 ADMIN:');
    console.log('      Email: admin@ecommerce.com | Password: admin123');
    console.log('   👤 CLIENTE:');
    console.log('      Email: demo@test.com | Password: demo123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

seed();