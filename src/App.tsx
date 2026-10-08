import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronLeft, CircleUserRound, Clock3, ExternalLink, Facebook, Instagram, Mail, MapPin, Menu, Minus, Package, Phone, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, X, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CartItem, Category, DeliveryLocation, getSavings, OrderResult, Product, ShopSettings, formatKES } from '@/lib/types';
import { AdminAuthProvider, useAdminAuth } from '@/lib/admin-auth';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminProductForm } from '@/components/admin/AdminProductForm';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminInventory } from '@/components/admin/AdminInventory';
import { AdminLocations } from '@/components/admin/AdminLocations';
import { AdminSettings } from '@/components/admin/AdminSettings';

const brandImage = '/images/branding/WhatsApp_Image_2026-10-09_at_00.05.46_(1).jpeg';
const photoImage = 'https://images.pexels.com/photos/36737326/pexels-photo-36737326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const categories: { name: Category; note: string; icon: string }[] = [
  { name: 'Football', note: 'Match-ready essentials', icon: '01' },
  { name: 'Basketball', note: 'Built for the court', icon: '02' },
  { name: 'Rugby', note: 'Made for the clash', icon: '03' },
  { name: 'Athletics', note: 'Move without limits', icon: '04' },
  { name: 'Other', note: 'The national edit', icon: '05' },
];

function savingsLabel(product: Product) { const saving = getSavings(product); return saving ? <span className="badge badge-gold">SAVE {saving}%</span> : null; }
function productImage(product: Product) { return product.product_images?.find((image) => image.is_primary)?.image_url || product.product_images?.[0]?.image_url || brandImage; }

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const navigate = (to: string) => { window.history.pushState({}, '', to); setPath(to); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      const [productResponse, locationResponse, settingsResponse] = await Promise.all([
        supabase.from('products').select('*, product_images(*)').eq('active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('delivery_locations').select('*').eq('active', true).order('sort_order'),
        supabase.from('shop_settings').select('*').limit(1).maybeSingle(),
      ]);
      if (!productResponse.error) setProducts((productResponse.data || []) as Product[]);
      if (!locationResponse.error) setLocations((locationResponse.data || []) as DeliveryLocation[]);
      if (!settingsResponse.error && settingsResponse.data) setSettings(settingsResponse.data as ShopSettings);
      setLoading(false);
    }; load();
  }, []);

  const addToCart = (product: Product, size: string, quantity: number) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.size === size);
      if (existing) return current.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { product, size, quantity }];
    });
    navigate('/order');
  };
  const filtered = useMemo(() => products.filter((product) => `${product.team_name} ${product.product_name} ${product.season} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const routeProduct = path.startsWith('/product/') ? products.find((product) => product.id === path.split('/')[2]) : undefined;
  const showAdmin = path.startsWith('/admin');
  if (showAdmin) return <AdminApp navigate={navigate} />;
  return <div className="site-shell">
    <Header navigate={navigate} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} searchOpen={searchOpen} setSearchOpen={setSearchOpen} search={search} setSearch={setSearch} />
    {path === '/' && <Home navigate={navigate} featured={featured} categories={categories} settings={settings} />}
    {path === '/shop' && <Shop products={filtered} loading={loading} navigate={navigate} search={search} setSearch={setSearch} categories={categories} />}
    {routeProduct && <ProductDetails product={routeProduct} navigate={navigate} addToCart={addToCart} />}
    {path === '/order' && <OrderPage cart={cart} setCart={setCart} locations={locations} settings={settings} setOrderResult={setOrderResult} orderResult={orderResult} navigate={navigate} />}
    {path === '/about' && <About navigate={navigate} />}
    {path === '/contact' && <Contact settings={settings} navigate={navigate} />}
    {!routeProduct && !['/', '/shop', '/order', '/about', '/contact'].includes(path) && <NotFound navigate={navigate} />}
    <Footer navigate={navigate} settings={settings} />
  </div>;
}

function Header({ navigate, cartCount, searchOpen, setSearchOpen, search, setSearch }: { navigate: (to: string) => void; cartCount: number; searchOpen: boolean; setSearchOpen: (value: boolean) => void; search: string; setSearch: (value: string) => void }) {
  const [menu, setMenu] = useState(false);
  return <header className="site-header"><div className="container header-inner">
    <button className="brand-mark" onClick={() => navigate('/')} aria-label="Mapunjan home"><span className="brand-word">MAPUNJAN</span><span className="brand-sub">SPORTSWEAR</span></button>
    <nav className={menu ? 'main-nav is-open' : 'main-nav'}><button onClick={() => { navigate('/'); setMenu(false); }}>Home</button><button onClick={() => { navigate('/shop'); setMenu(false); }}>Shop</button><button onClick={() => { navigate('/about'); setMenu(false); }}>About</button><button onClick={() => { navigate('/contact'); setMenu(false); }}>Contact</button></nav>
    <div className="header-actions"><button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search"><Search size={19} /></button><button className="cart-button" onClick={() => navigate('/order')}><ShoppingBag size={18} /><span>Order</span>{cartCount > 0 && <b>{cartCount}</b>}</button><button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X size={21} /> : <Menu size={21} />}</button></div>
  </div>{searchOpen && <div className="search-drawer"><div className="container search-inner"><Search size={18} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && navigate('/shop')} placeholder="Search jerseys, teams or seasons..." /><button onClick={() => { setSearch(''); setSearchOpen(false); }}><X size={17} /></button></div></div>}</header>;
}

function Home({ navigate, featured, categories: categoryList, settings }: { navigate: (to: string) => void; featured: Product[]; categories: typeof categories; settings: ShopSettings | null }) {
  return <main>
    <section className="hero"><div className="hero-backdrop" style={{ backgroundImage: `url(${brandImage})` }} /><div className="hero-overlay" /><div className="container hero-content"><p className="eyebrow light"><span className="eyebrow-line" /> KAKAMEGA · KENYA</p><h1>WEAR YOUR TEAM.<br /><em>OWN THE GAME.</em></h1><p className="hero-copy">Original team kits and sportswear for football, basketball, rugby and athletics.</p><div className="button-row"><button className="button button-gold" onClick={() => navigate('/shop')}>Shop jerseys <ArrowRight size={16} /></button><button className="button button-outline-light" onClick={() => navigate('/order')}>Order now</button></div><div className="hero-foot"><span><ShieldCheck size={16} /> Quality team kits</span><span><Truck size={16} /> Local delivery</span><span><Zap size={16} /> Fast WhatsApp ordering</span></div></div></section>
    <section className="category-strip"><div className="container"><div className="section-heading compact"><div><p className="eyebrow">Find your edge</p><h2>Shop by sport</h2></div><button className="text-button" onClick={() => navigate('/shop')}>View all <ArrowRight size={15} /></button></div><div className="category-grid">{categoryList.map((category) => <button className="category-card" key={category.name} onClick={() => navigate('/shop')}><span className="category-number">{category.icon}</span><span className="category-name">{category.name}</span><span className="category-note">{category.note}</span><ArrowRight size={16} /></button>)}</div></div></section>
    <section className="featured-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">The latest rotation</p><h2>Featured jerseys</h2><p className="section-lede">The pieces that move fastest. Selected for the true supporters and serious players.</p></div><button className="button button-dark" onClick={() => navigate('/shop')}>Shop the collection <ArrowRight size={16} /></button></div>{featured.length ? <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}</div> : <EmptyProducts navigate={navigate} />}</div></section>
    <section className="editorial"><div className="container editorial-grid"><div className="editorial-image"><img src={photoImage} alt="Football player under stadium lights" loading="lazy" /><span className="editorial-stamp">MAPUNJAN<br /><small>SPORTSWEAR</small></span></div><div className="editorial-copy"><p className="eyebrow">The Mapunjan standard</p><h2>Gear that carries<br /><em>your colours.</em></h2><p>From the terraces to the track, we source team kits and sportswear made for people who show up for their game. Wear it with pride, play it with purpose.</p><button className="text-button" onClick={() => navigate('/about')}>Our story <ArrowRight size={15} /></button></div></div></section>
    <VisitShop settings={settings} />
  </main>;
}

function ProductCard({ product, navigate }: { product: Product; navigate: (to: string) => void }) { return <article className="product-card"><button className="product-image" onClick={() => navigate(`/product/${product.id}`)}><img src={productImage(product)} alt={`${product.team_name} ${product.product_name}`} loading="lazy" />{savingsLabel(product)}{product.stock_quantity < 1 && <span className="badge badge-dark">Sold out</span>}</button><div className="product-info"><div><p className="product-team">{product.team_name}</p><h3>{product.product_name}</h3></div><span className="product-arrow"><ArrowRight size={17} /></span><div className="product-meta"><span>{product.season} · {product.jersey_type}</span><span className="price">{formatKES(product.current_price)}{product.previous_price > product.current_price && <del>{formatKES(product.previous_price)}</del>}</span></div></div></article>; }
function EmptyProducts({ navigate }: { navigate: (to: string) => void }) { return <div className="empty-state"><Package size={28} /><h3>The collection is loading.</h3><p>Check back shortly for the latest Mapunjan drops.</p><button className="button button-dark" onClick={() => navigate('/contact')}>Contact us</button></div>; }

function Shop({ products, loading, navigate, search, setSearch, categories: categoryList }: { products: Product[]; loading: boolean; navigate: (to: string) => void; search: string; setSearch: (value: string) => void; categories: typeof categories }) { const [category, setCategory] = useState('All'); const shown = category === 'All' ? products : products.filter((product) => product.category === category); return <main className="page-main"><div className="container shop-top"><div><p className="eyebrow">The full rotation</p><h1>Shop jerseys.</h1><p>Find your colours, your club, your moment.</p></div><div className="shop-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jerseys, teams or seasons..." /></div></div><div className="container shop-toolbar"><div className="filter-pills"><button className={category === 'All' ? 'active' : ''} onClick={() => setCategory('All')}>All pieces</button>{categoryList.map((item) => <button className={category === item.name ? 'active' : ''} key={item.name} onClick={() => setCategory(item.name)}>{item.name}</button>)}</div><span className="result-count">{shown.length} pieces</span></div><div className="container">{loading ? <div className="loading-state"><span className="spinner" /> Loading the collection...</div> : shown.length ? <div className="product-grid product-grid-shop">{shown.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}</div> : <EmptyProducts navigate={navigate} />}</div></main>; }

function ProductDetails({ product, navigate, addToCart }: { product: Product; navigate: (to: string) => void; addToCart: (product: Product, size: string, quantity: number) => void }) { const [size, setSize] = useState(product.available_sizes[0] || ''); const [quantity, setQuantity] = useState(1); const [activeImage, setActiveImage] = useState(productImage(product)); return <main className="page-main"><div className="container breadcrumb"><button onClick={() => navigate('/shop')}><ChevronLeft size={15} /> Back to shop</button><span>{product.category} / {product.team_name}</span></div><div className="container detail-grid"><div className="detail-gallery"><div className="detail-main-image"><img src={activeImage} alt={`${product.team_name} ${product.product_name}`} /></div>{product.product_images && product.product_images.length > 1 && <div className="thumb-row">{product.product_images.map((image) => <button className={activeImage === image.image_url ? 'active' : ''} key={image.id} onClick={() => setActiveImage(image.image_url)}><img src={image.image_url} alt="" /></button>)}</div>}</div><div className="detail-copy"><p className="eyebrow">{product.category} · {product.season}</p><p className="product-team detail-team">{product.team_name}</p><h1>{product.product_name}</h1><div className="detail-price"><strong>{formatKES(product.current_price)}</strong>{product.previous_price > product.current_price && <><del>{formatKES(product.previous_price)}</del>{savingsLabel(product)}</>}</div><p className="detail-description">{product.description || 'An authentic Mapunjan team kit selected for comfort, movement and unmistakable team pride.'}</p><div className="selection-block"><div className="selection-label"><span>Select size</span><button>Size guide <ArrowRight size={13} /></button></div><div className="size-row">{product.available_sizes.map((item) => <button key={item} className={size === item ? 'selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div></div><div className="selection-block"><div className="selection-label"><span>Quantity</span></div><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock_quantity || 20, quantity + 1))}><Plus size={15} /></button></div></div><button className="button button-dark button-wide" disabled={!size || product.stock_quantity < 1} onClick={() => addToCart(product, size, quantity)}>{product.stock_quantity < 1 ? 'Sold out' : 'Order this jersey'} <ArrowRight size={17} /></button><div className="trust-row"><span><Truck size={16} /> Local delivery</span><span><ShieldCheck size={16} /> Quality checked</span></div></div></div></main>; }

function OrderPage({ cart, setCart, locations, settings, setOrderResult, orderResult, navigate }: { cart: CartItem[]; setCart: (items: CartItem[]) => void; locations: DeliveryLocation[]; settings: ShopSettings | null; setOrderResult: (result: OrderResult | null) => void; orderResult: OrderResult | null; navigate: (to: string) => void }) { const [form, setForm] = useState({ name: '', phone: '', location: '', customLocation: '', date: '', time: '', instructions: '' }); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(''); const item = cart[0]; const total = item ? item.product.current_price * item.quantity : 0; const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value })); const submit = async (event: FormEvent) => { event.preventDefault(); if (!item || !form.name || !form.phone || !form.location || !form.date || !form.time) { setError('Please complete all required details before placing your order.'); return; } setSubmitting(true); setError(''); const location = form.location === 'Other / Custom Location' ? form.customLocation : form.location; const payload = { customer_name: form.name, customer_phone: form.phone, delivery_location: location, preferred_delivery_date: form.date, preferred_delivery_time: form.time, additional_instructions: form.instructions, items: [{ product_id: item.product.id, size: item.size, quantity: item.quantity }] }; let orderNumber = `MAP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`; let orderId = crypto.randomUUID(); if (supabase) { const { data, error: orderError } = await supabase.rpc('place_public_order', { p_customer_name: payload.customer_name, p_customer_phone: payload.customer_phone, p_delivery_location: payload.delivery_location, p_preferred_delivery_date: payload.preferred_delivery_date, p_preferred_delivery_time: payload.preferred_delivery_time, p_additional_instructions: payload.additional_instructions, p_product_id: item.product.id, p_size: item.size, p_quantity: item.quantity }); if (orderError || !data) { setError('We could not place that order right now. Please try again or contact us on WhatsApp.'); setSubmitting(false); return; } orderNumber = data.order_number; orderId = data.order_id; } const whatsappText = `MAPUNJAN SPORTS WEAR - NEW ORDER\n\nOrder Number:\n${orderNumber}\n\nCustomer:\n${form.name}\n\nPhone:\n${form.phone}\n\nJersey:\n${item.product.product_name}\n\nTeam:\n${item.product.team_name}\n\nSeason:\n${item.product.season}\n\nJersey Type:\n${item.product.jersey_type}\n\nSize:\n${item.size}\n\nQuantity:\n${item.quantity}\n\nUnit Price:\n${formatKES(item.product.current_price)}\n\nTotal:\n${formatKES(total)}\n\nDelivery Location:\n${location}\n\nPreferred Delivery Date:\n${form.date}\n\nPreferred Delivery Time:\n${form.time}\n\nAdditional Instructions:\n${form.instructions || 'None'}`; setOrderResult({ orderNumber, orderId, whatsappText, item, customer: { ...form, location }, total }); setSubmitting(false); }; if (orderResult) return <main className="page-main"><div className="container success-layout"><div className="success-card"><div className="success-icon"><Check size={26} /></div><p className="eyebrow">Order received</p><h1>Thank you for<br /><em>choosing Mapunjan.</em></h1><p>Your order is safely with us. We'll confirm the details with you shortly on WhatsApp.</p><div className="order-number"><span>Order number</span><strong>{orderResult.orderNumber}</strong></div><a className="button button-gold button-wide" target="_blank" rel="noreferrer" href={`https://wa.me/${settings?.whatsapp_number?.replace(/\D/g, '') || '254798777231'}?text=${encodeURIComponent(orderResult.whatsappText)}`}>Contact us on WhatsApp <ExternalLink size={16} /></a><button className="text-button centered" onClick={() => { setCart([]); setOrderResult(null); navigate('/shop'); }}>Continue shopping <ArrowRight size={15} /></button></div><OrderSummary result={orderResult} /></div></main>; return <main className="page-main"><div className="container order-header"><p className="eyebrow">Almost game time</p><h1>Complete your order.</h1><p>Tell us where to deliver your kit and we'll take care of the rest.</p></div><div className="container order-grid">{item ? <form className="order-form" onSubmit={submit}><div className="form-section"><div className="form-title"><span>01</span><div><h2>Your details</h2><p>We'll use these to confirm your order.</p></div></div><div className="field-grid"><label>Full name<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Your full name" /></label><label>Phone number<input required value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="07XX XXX XXX" /></label></div></div><div className="form-section"><div className="form-title"><span>02</span><div><h2>Delivery details</h2><p>Choose a location and a convenient time.</p></div></div><label>Delivery location<select required value={form.location} onChange={(event) => update('location', event.target.value)}><option value="">Select a location</option>{locations.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}<option>Other / Custom Location</option></select></label>{form.location === 'Other / Custom Location' && <label>Your preferred location<input required value={form.customLocation} onChange={(event) => update('customLocation', event.target.value)} placeholder="Enter the delivery location" /></label>}<div className="field-grid"><label>Preferred date<input required type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label><label>Preferred time<select required value={form.time} onChange={(event) => update('time', event.target.value)}><option value="">Select a time</option><option>9:00 AM – 12:00 PM</option><option>12:00 PM – 3:00 PM</option><option>3:00 PM – 6:00 PM</option></select></label></div><label>Additional instructions <span className="optional">Optional</span><textarea value={form.instructions} onChange={(event) => update('instructions', event.target.value)} placeholder="Anything we should know?" rows={3} /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-dark button-wide" disabled={submitting}>{submitting ? 'Placing order...' : 'Review and place order'} <ArrowRight size={17} /></button></form> : <div className="empty-state order-empty"><ShoppingBag size={28} /><h3>Your order is empty.</h3><p>Choose a jersey from the collection to get started.</p><button className="button button-dark" onClick={() => navigate('/shop')}>Browse jerseys</button></div>}{item && <OrderSummary result={{ orderNumber: '', orderId: '', whatsappText: '', item, customer: { name: form.name, phone: form.phone, location: form.location, date: form.date, time: form.time, instructions: form.instructions }, total }} />}</div></main>; }
function OrderSummary({ result }: { result: OrderResult }) { return <aside className="order-summary"><div className="summary-label">Your selection</div><div className="summary-product"><img src={productImage(result.item.product)} alt="" /><div><p>{result.item.product.team_name}</p><h3>{result.item.product.product_name}</h3><span>{result.item.product.season} · Size {result.item.size}</span></div></div><div className="summary-lines"><span>Quantity <b>{result.item.quantity}</b></span><span>Unit price <b>{formatKES(result.item.product.current_price)}</b></span><span className="summary-total">Total <b>{formatKES(result.total)}</b></span></div><div className="summary-note"><Clock3 size={16} /> You'll receive a confirmation on WhatsApp after placing your order.</div></aside>; }

function About({ navigate }: { navigate: (to: string) => void }) { return <main className="page-main"><div className="container about-hero"><p className="eyebrow">About Mapunjan</p><h1>For the ones who<br /><em>wear the moment.</em></h1><p>MAPUNJAN SPORTS WEAR provides quality team kits and sportswear for football fans, athletes and sports enthusiasts.</p></div><div className="container about-grid"><div className="about-image"><img src={brandImage} alt="Mapunjan Sportswear brand banner" /></div><div className="about-copy"><p className="eyebrow">Our point of view</p><h2>Team spirit is<br />a daily uniform.</h2><p>We believe what you wear is part of how you show up. Whether you're backing your club, representing Kenya, or putting in the work on the track, our collection is built around that feeling.</p><p>Find your colours. Find your fit. Then take it everywhere.</p><button className="button button-dark" onClick={() => navigate('/shop')}>Explore the collection <ArrowRight size={16} /></button></div></div></main>; }
function Contact({ settings, navigate }: { settings: ShopSettings | null; navigate: (to: string) => void }) { const maps = settings?.latitude && settings?.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${settings.latitude},${settings.longitude}` : settings?.google_maps_url || '#'; return <main className="page-main"><div className="container contact-hero"><p className="eyebrow">Let's talk sportswear</p><h1>Bring your<br /><em>colours.</em></h1><p>Questions about a jersey, sizing or delivery? We're one WhatsApp message away.</p><a className="button button-gold" href={`https://wa.me/${settings?.whatsapp_number?.replace(/\D/g, '') || '254798777231'}`} target="_blank" rel="noreferrer">Message on WhatsApp <ExternalLink size={16} /></a></div><div className="container contact-grid"><div className="contact-card"><MapPin size={20} /><div><span>Visit our shop</span><strong>{settings?.shop_address || 'Kakamega, Kenya'}</strong><a href={maps} target="_blank" rel="noreferrer">Take me to the shop <ArrowRight size={14} /></a></div></div><div className="contact-card"><Phone size={20} /><div><span>Call / WhatsApp</span><strong>{settings?.whatsapp_number || '+254 798 777 231'}</strong><a href={`tel:${settings?.business_phone || settings?.whatsapp_number || '+254798777231'}`}>Get in touch <ArrowRight size={14} /></a></div></div><div className="contact-card"><Mail size={20} /><div><span>Email</span><strong>hello@mapunjan.co.ke</strong><a onClick={() => navigate('/shop')}>Browse jerseys <ArrowRight size={14} /></a></div></div></div></main>; }
function VisitShop({ settings }: { settings: ShopSettings | null }) { const maps = settings?.latitude && settings?.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${settings.latitude},${settings.longitude}` : settings?.google_maps_url || '#'; return <section className="visit-shop"><div className="container visit-inner"><div><p className="eyebrow light">Come through</p><h2>Visit our shop.</h2><p>{settings?.shop_address || 'Kakamega, Kenya'} · Find your next favourite kit in person.</p></div><a className="button button-outline-light" href={maps} target="_blank" rel="noreferrer">Take me to the shop <ExternalLink size={15} /></a></div></section>; }
function Footer({ navigate, settings }: { navigate: (to: string) => void; settings: ShopSettings | null }) { return <footer><div className="container footer-grid"><div><button className="brand-mark footer-brand" onClick={() => navigate('/')}><span className="brand-word">MAPUNJAN</span><span className="brand-sub">SPORTSWEAR</span></button><p>Original team kits<br />& sportswear.</p><div className="social-row"><a href={`https://wa.me/${settings?.whatsapp_number?.replace(/\D/g, '') || '254798777231'}`} target="_blank" rel="noreferrer"><Phone size={16} /></a><a href="#"><Instagram size={16} /></a><a href="#"><Facebook size={16} /></a></div></div><div><h4>Explore</h4><button onClick={() => navigate('/shop')}>Shop jerseys</button><button onClick={() => navigate('/about')}>About us</button><button onClick={() => navigate('/contact')}>Contact</button></div><div><h4>Categories</h4><button onClick={() => navigate('/shop')}>Football</button><button onClick={() => navigate('/shop')}>Basketball</button><button onClick={() => navigate('/shop')}>Rugby</button><button onClick={() => navigate('/shop')}>Athletics</button></div><div><h4>Contact</h4><p>{settings?.shop_address || 'Kakamega, Kenya'}</p><p>{settings?.whatsapp_number || '+254 798 777 231'}</p><button className="text-button footer-link" onClick={() => navigate('/contact')}>Get directions <ArrowRight size={14} /></button></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Mapunjan Sportswear</span><span>Original team kits & sportswear</span><button onClick={() => navigate('/admin/login')}>Admin</button></div></footer>; }
function NotFound({ navigate }: { navigate: (to: string) => void }) { return <main className="page-main"><div className="empty-state not-found"><Sparkles size={30} /><h1>That page moved.</h1><p>Let's get you back to the collection.</p><button className="button button-dark" onClick={() => navigate('/')}>Back home</button></div></main>; }

function AdminApp({ navigate }: { navigate: (to: string) => void }) {
  return (
    <AdminAuthProvider>
      <AdminRoutes navigate={navigate} />
    </AdminAuthProvider>
  );
}

function AdminRoutes({ navigate }: { navigate: (to: string) => void }) {
  const { session, loading, isAdmin } = useAdminAuth();
  const path = window.location.pathname;
  const isLogin = path === '/admin/login';

  useEffect(() => {
    if (!loading && !session && !isLogin) {
      navigate('/admin/login');
    }
  }, [loading, session, isLogin, navigate]);

  if (isLogin) {
    return <AdminLogin navigate={navigate} />;
  }

  if (loading) {
    return <div className="admin-shell"><main className="admin-main"><div className="admin-page-loader"><span className="admin-spinner" /></div></main></div>;
  }

  if (!session) {
    return <AdminLogin navigate={navigate} />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <ShieldCheck size={36} />
        <h1>Access denied</h1>
        <p>Your account does not have administrator access. Contact the shop owner to be added as an administrator.</p>
        <button className="admin-btn admin-btn-dark" onClick={async () => { await supabase?.auth.signOut(); navigate('/admin/login'); }}>Back to sign in</button>
      </div>
    );
  }

  let activeKey = 'dashboard';
  if (path === '/admin/products' || (path.startsWith('/admin/products/') && !path.endsWith('/new'))) activeKey = 'products';
  if (path === '/admin/products/new') activeKey = 'add-product';
  if (path === '/admin/orders') activeKey = 'orders';
  if (path === '/admin/inventory') activeKey = 'inventory';
  if (path === '/admin/delivery-locations') activeKey = 'locations';
  if (path === '/admin/settings') activeKey = 'settings';

  let content: ReactNode = null;
  if (path === '/admin') content = <AdminDashboard navigate={navigate} />;
  else if (path === '/admin/products') content = <AdminProducts navigate={navigate} />;
  else if (path === '/admin/products/new') content = <AdminProductForm navigate={navigate} />;
  else if (path.startsWith('/admin/products/') && path.endsWith('/edit')) {
    const editId = path.split('/')[3];
    content = <AdminProductForm productId={editId} navigate={navigate} />;
  }
  else if (path === '/admin/orders') content = <AdminOrders />;
  else if (path === '/admin/inventory') content = <AdminInventory />;
  else if (path === '/admin/delivery-locations') content = <AdminLocations />;
  else if (path === '/admin/settings') content = <AdminSettings />;

  return (
    <AdminShell activeKey={activeKey} navigate={navigate}>
      {content}
    </AdminShell>
  );
}

function AdminLogin({ navigate }: { navigate: (to: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { session, isAdmin } = useAdminAuth();

  useEffect(() => {
    if (session && isAdmin) navigate('/admin');
  }, [session, isAdmin, navigate]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) { setError('Connect Supabase before signing in.'); return; }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError('Those sign-in details could not be verified.'); return; }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-art" style={{ backgroundImage: `url(${brandImage})` }} />
      <div className="admin-login-panel">
        <button className="brand-mark" onClick={() => navigate('/')}><span className="brand-word">MAPUNJAN</span><span className="brand-sub">SPORTSWEAR</span></button>
        <div>
          <p className="eyebrow">Staff access</p>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in to manage your collection and orders.</p>
        </div>
        <form onSubmit={login}>
          <label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-dark button-wide">Sign in <ArrowRight size={16} /></button>
        </form>
        <button className="text-button" onClick={() => navigate('/')}>Back to storefront <ArrowRight size={14} /></button>
      </div>
    </div>
  );
}

export default App;
