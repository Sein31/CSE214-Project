import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { CheckoutComponent } from '../checkout/checkout.component';

const CATEGORY_IMAGES: Record<string, string[]> = {
  'Phones & Tablets': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80'],
  'Computers': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80'],
  'Audio': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80','https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80'],
  'TV & Video': ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80'],
  'Men Clothing': ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80','https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&q=80'],
  'Women Clothing': ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80'],
  'Kids Clothing': ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80'],
  'Fiction': ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'],
  'Science & Tech': ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'],
  'Kitchen': ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'],
  'Furniture': ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80'],
  'Fitness': ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80'],
  'Skincare': ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80'],
  'Makeup': ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80'],
  'default': ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80','https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80','https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80'],
};

const CAT_EMOJI: Record<string,string> = {
  'Electronics':'💻','Clothing':'👕','Books':'📚','Home & Garden':'🏡','Sports':'⚽','Beauty':'💄',
  'Phones & Tablets':'📱','Computers':'🖥️','Audio':'🎧','TV & Video':'📺',
  'Men Clothing':'👔','Women Clothing':'👗','Kids Clothing':'👶','Fiction':'📖',
  'Science & Tech':'🔬','Kitchen':'🍳','Furniture':'🛋️','Fitness':'🏋️','Skincare':'🧴','Makeup':'💋',
};

const IND_NAV: NavItem[] = [
  { label:'Mağaza',       icon:'🛍️', path:'/shop' },
  { label:'Siparişlerim', icon:'📋', path:'/shop/orders' },
  { label:'Dashboard',    icon:'📊', path:'/shop/dashboard' },
  { label:'AI Asistan',   icon:'🤖', path:'/chat' },
];

const MOCK_REVIEWS = [
  { avatar:'😊', name:'Ali D.',     stars:'★★★★★', date:'2 gün önce',   text:'Harika ürün! Fotoğraftaki gibi geldi. Kesinlikle tavsiye ederim.' },
  { avatar:'🎉', name:'Zeynep K.', stars:'★★★★☆', date:'1 hafta önce', text:'Kalitesi çok iyi, kargo hızlıydı. Fiyatına göre değerli.' },
  { avatar:'👍', name:'Mehmet A.', stars:'★★★★★', date:'2 hafta önce', text:'Beklentilerimi aştı. Paketleme özenli, sağlam geldi.' },
];

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, FormsModule, SidebarComponent, CheckoutComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">

        <!-- Topbar -->
        <div class="topbar">
          <div class="search-wrap">
            <span class="s-icon">🔍</span>
            <input [(ngModel)]="q" placeholder="Ürün, kategori veya marka ara..."
                   (keyup.enter)="search()" class="s-input" />
            <button (click)="search()" class="s-btn">Ara</button>
          </div>
          <button class="cart-pill" (click)="showCart=!showCart">
            🛒
            <span class="c-badge" *ngIf="cart.length>0">{{cart.length}}</span>
            Sepet
            <span class="c-total" *ngIf="cart.length>0">{{cartTotal|number:'1.0-0'}} ₺</span>
          </button>
        </div>

        <!-- Sepet drawer -->
        <div *ngIf="showCart" class="drawer">
          <div class="d-header">
            <h3>🛒 Sepetim ({{cart.length}})</h3>
            <button (click)="showCart=false" class="d-close">✕</button>
          </div>
          <div *ngIf="cart.length===0" class="d-empty">Sepetiniz boş</div>
          <div class="d-items">
            <div *ngFor="let item of cart" class="d-row">
              <img [src]="item.image" class="d-img" (error)="onImgError($event)" />
              <div class="d-info">
                <div class="d-name">{{item.name}}</div>
                <div class="d-pr">
                  <span class="d-price">{{item.price|number:'1.2-2'}} ₺</span>
                  <div class="qty">
                    <button (click)="decQty(item)">−</button>
                    <span>{{item.qty}}</span>
                    <button (click)="item.qty=item.qty+1">+</button>
                  </div>
                </div>
              </div>
              <button (click)="removeFromCart(item)" class="d-rm">🗑️</button>
            </div>
          </div>
          <div *ngIf="cart.length>0" class="d-footer">
            <div class="d-sum"><span>Ara Toplam</span><span>{{cartTotal|number:'1.2-2'}} ₺</span></div>
            <div class="d-sum green"><span>Kargo</span><span>Ücretsiz 🚚</span></div>
            <div class="d-sum bold"><strong>Toplam</strong><strong>{{cartTotal|number:'1.2-2'}} ₺</strong></div>
            <button class="d-checkout" (click)="showCart=false;showCheckout=true">💳 Ödemeye Geç</button>
          </div>
        </div>

        <!-- Hero -->
        <div class="hero">
          <div class="h-left">
            <div class="h-tag">🔥 Özel Teklif</div>
            <h1>Yeni Sezon<br/><span class="h-accent">Büyük İndirim</span></h1>
            <p>Binlerce ürün, en uygun fiyatlarla</p>
            <button class="h-cta" (click)="clearFilter()">Alışverişe Başla →</button>
          </div>
          <div class="h-pills">
            <div class="h-pill">🛍️ {{totalProducts}}+ Ürün</div>
            <div class="h-pill">⭐ 4.8/5 Memnuniyet</div>
            <div class="h-pill">🚚 Ücretsiz Kargo</div>
          </div>
        </div>

        <!-- Kategoriler -->
        <div class="sec">
          <h2 class="sec-title">Kategoriler</h2>
          <div class="cats">
            <button (click)="clearFilter()" [class.active]="!selectedCategory" class="cat">
              <span class="ce">🌟</span><span>Tümü</span>
            </button>
            <button *ngFor="let c of categories" (click)="filterByCategory(c)"
                    [class.active]="selectedCategory===c" class="cat">
              <span class="ce">{{getCatEmoji(c)}}</span><span>{{c}}</span>
            </button>
          </div>
        </div>

        <!-- Sort bar -->
        <div class="fbar" *ngIf="sortedProducts().length>0">
          <span class="fcount">{{sortedProducts().length}} ürün</span>
          <div class="sorts">
            <button *ngFor="let s of sortOptions" (click)="sort=s.v"
                    [class.active]="sort===s.v" class="stab">{{s.l}}</button>
          </div>
        </div>

        <!-- Grid -->
        <div class="pgrid" *ngIf="sortedProducts().length>0; else empty">
          <div *ngFor="let p of sortedProducts()" class="pcard" (click)="openDetail(p)">
            <div class="pimg-wrap">
              <img [src]="getImage(p)" [alt]="p.name" class="pimg" (error)="onImgError($event)" />
              <div class="pbadges">
                <span *ngIf="p.importance==='HIGH'" class="b-hot">🔥 Popüler</span>
                <span *ngIf="p.stockQuantity<10&&p.stockQuantity>0" class="b-low">Son {{p.stockQuantity}}!</span>
                <span *ngIf="p.stockQuantity===0" class="b-out">Tükendi</span>
              </div>
              <button class="qadd" [disabled]="p.stockQuantity===0"
                      (click)="addToCart(p,$event)">
                {{p.stockQuantity===0?'Tükendi':'+ Sepete Ekle'}}
              </button>
            </div>
            <div class="pbody">
              <div class="pcat">{{p.categoryName||'Genel'}}</div>
              <div class="pname">{{p.name}}</div>
              <div class="prating">★★★★<span style="opacity:.4">★</span> <span class="rcnt">({{(p.id*7)%150+20}})</span></div>
              <div class="pprices">
                <span class="pprice">{{p.unitPrice|number:'1.2-2'}} ₺</span>
                <span class="pold" *ngIf="p.importance==='HIGH'">{{p.unitPrice*1.15|number:'1.2-2'}} ₺</span>
              </div>
              <div class="pship">🚚 Ücretsiz Kargo</div>
            </div>
          </div>
        </div>

        <ng-template #empty>
          <div class="empty-box">
            <div style="font-size:64px;margin-bottom:16px">🔍</div>
            <h3 style="color:#fff;margin:0 0 8px">Ürün bulunamadı</h3>
            <p style="color:#64748b;margin:0 0 24px">Farklı bir arama deneyin</p>
            <button (click)="clearFilter()" class="d-checkout" style="width:auto;padding:12px 28px">Tümünü Gör</button>
          </div>
        </ng-template>

        <!-- Detay modal -->
        <div *ngIf="selectedProduct" class="det-overlay" (click)="selectedProduct=null">
          <div class="det-modal" (click)="$event.stopPropagation()">
            <button class="det-close" (click)="selectedProduct=null">✕</button>
            <div class="det-grid">
              <div class="det-img-wrap">
                <img [src]="getImage(selectedProduct)" [alt]="selectedProduct.name"
                     class="det-img" (error)="onImgError($event)" />
                <span *ngIf="selectedProduct.importance==='HIGH'" class="b-hot" style="position:absolute;top:16px;left:16px">🔥 Çok Satan</span>
              </div>
              <div class="det-info">
                <div class="pcat" style="font-size:12px">{{selectedProduct.categoryName}}</div>
                <h2 class="det-title">{{selectedProduct.name}}</h2>
                <div class="prating" style="font-size:16px;margin-bottom:8px">
                  ★★★★☆ <span class="rcnt" style="font-size:13px">{{(selectedProduct.id*7)%150+20}} değerlendirme</span>
                </div>
                <div style="font-size:12px;color:#4a5568;font-family:monospace;margin-bottom:16px">SKU: {{selectedProduct.sku}}</div>
                <div class="det-desc">{{selectedProduct.description || 'Yüksek kaliteli ürün. Hızlı teslimat ve ücretsiz kargo ile kapınıza gelir. Müşteri memnuniyeti garantisi.'}}</div>
                <div class="det-price-box">
                  <span class="det-price">{{selectedProduct.unitPrice|number:'1.2-2'}} ₺</span>
                  <span *ngIf="selectedProduct.importance==='HIGH'" class="pold" style="font-size:16px">{{selectedProduct.unitPrice*1.15|number:'1.2-2'}} ₺</span>
                  <span *ngIf="selectedProduct.importance==='HIGH'" class="disc-badge">%13 İndirim</span>
                </div>
                <div class="det-stock">
                  <span [class]="selectedProduct.stockQuantity>10?'sok':'selectedProduct.stockQuantity>0?slow:sout'">
                    {{selectedProduct.stockQuantity>0?'✓ Stokta ('+selectedProduct.stockQuantity+' adet)':'✗ Tükendi'}}
                  </span>
                </div>
                <div class="det-acts">
                  <button class="btn-sec" [disabled]="selectedProduct.stockQuantity===0"
                          (click)="addToCart(selectedProduct,$event)">🛒 Sepete Ekle</button>
                  <button class="btn-pri" [disabled]="selectedProduct.stockQuantity===0"
                          (click)="addToCart(selectedProduct,$event);selectedProduct=null;showCheckout=true">⚡ Hemen Al</button>
                </div>
                <div class="det-feats">
                  <span>🚚 Ücretsiz Kargo</span>
                  <span>↩️ 30 Gün İade</span>
                  <span>🔒 Güvenli Ödeme</span>
                  <span>⭐ Orijinal Ürün</span>
                </div>
                <div class="reviews">
                  <h3>Müşteri Yorumları</h3>
                  <div *ngFor="let r of getMockReviews(selectedProduct.id)" class="rev-item">
                    <div class="rev-head">
                      <div class="rev-av">{{r.avatar}}</div>
                      <div><div class="rev-name">{{r.name}}</div><div style="color:#f59e0b;font-size:12px">{{r.stars}}</div></div>
                      <div class="rev-date">{{r.date}}</div>
                    </div>
                    <div class="rev-text">{{r.text}}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <app-checkout *ngIf="showCheckout" [items]="cart" [total]="cartTotal"
          (cancelled)="showCheckout=false" (completed)="onCheckoutComplete()"/>

        <div *ngIf="toastMsg" class="toast">{{toastMsg}}</div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0a0e1a}
    .main{margin-left:240px;flex:1;color:#e2e8f0}
    /* Topbar */
    .topbar{display:flex;gap:16px;align-items:center;padding:16px 28px;background:#0f1420;border-bottom:1px solid #1a2035;position:sticky;top:0;z-index:100}
    .search-wrap{flex:1;display:flex;align-items:center;background:#161d30;border:1.5px solid #1e2a45;border-radius:12px;overflow:hidden;padding-left:14px}
    .s-icon{font-size:15px;color:#4a5568}
    .s-input{flex:1;padding:12px 10px;background:none;border:none;color:#fff;font-size:14px;outline:none}
    .s-btn{padding:12px 22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;font-weight:700;cursor:pointer}
    .cart-pill{position:relative;display:flex;align-items:center;gap:8px;padding:10px 18px;background:#161d30;border:1.5px solid #1e2a45;border-radius:12px;color:#e2e8f0;cursor:pointer;font-weight:500;white-space:nowrap}
    .cart-pill:hover{border-color:#6366f1}
    .c-badge{position:absolute;top:-8px;right:-8px;background:#e11d48;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
    .c-total{background:#1e2a45;padding:2px 10px;border-radius:20px;font-size:12px;color:#a78bfa}
    /* Drawer */
    .drawer{position:fixed;right:0;top:0;height:100vh;width:370px;background:#0f1420;border-left:1px solid #1e2a45;z-index:200;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,.6)}
    .d-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #1e2a45}
    .d-header h3{color:#fff;margin:0;font-size:18px}
    .d-close{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer}
    .d-empty{text-align:center;color:#4a5568;padding:48px}
    .d-items{flex:1;overflow-y:auto;padding:16px 24px}
    .d-row{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #1e2a45}
    .d-img{width:52px;height:52px;object-fit:cover;border-radius:8px}
    .d-info{flex:1}
    .d-name{font-size:13px;color:#e2e8f0;margin-bottom:8px;font-weight:500}
    .d-pr{display:flex;align-items:center;gap:12px}
    .d-price{color:#a78bfa;font-weight:700;font-size:14px}
    .qty{display:flex;align-items:center;gap:8px;background:#161d30;border-radius:8px;padding:4px 10px}
    .qty button{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;line-height:1}
    .qty span{color:#fff;font-size:13px;min-width:18px;text-align:center}
    .d-rm{background:none;border:none;cursor:pointer;font-size:15px;opacity:.6}
    .d-footer{padding:20px 24px;border-top:1px solid #1e2a45}
    .d-sum{display:flex;justify-content:space-between;font-size:13px;color:#94a3b8;margin-bottom:8px}
    .d-sum.green span:last-child{color:#4ade80}
    .d-sum.bold{font-size:15px;color:#fff;padding-top:12px;border-top:1px solid #1e2a45;margin-top:4px}
    .d-checkout{width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:16px}
    /* Hero */
    .hero{padding:40px 28px;background:linear-gradient(135deg,#0f1420,#1a1040,#0f1420);border-bottom:1px solid #1e2a45;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;top:-50%;right:0;width:400px;height:400px;background:radial-gradient(circle,rgba(99,102,241,.15),transparent 70%);pointer-events:none}
    .h-tag{display:inline-block;background:rgba(99,102,241,.2);color:#a78bfa;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:14px;border:1px solid rgba(99,102,241,.3)}
    .hero h1{font-size:38px;font-weight:800;color:#fff;margin:0 0 10px;line-height:1.2}
    .h-accent{background:linear-gradient(135deg,#6366f1,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero p{color:#64748b;font-size:15px;margin:0 0 22px}
    .h-cta{padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer}
    .h-pills{display:flex;gap:10px;margin-top:28px;flex-wrap:wrap}
    .h-pill{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:7px 14px;border-radius:20px;font-size:12px;color:#94a3b8}
    /* Section */
    .sec{padding:28px 28px 0}
    .sec-title{font-size:20px;font-weight:700;color:#fff;margin:0 0 16px}
    .cats{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
    .cat{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 18px;background:#161d30;border:1.5px solid #1e2a45;border-radius:14px;cursor:pointer;min-width:80px;color:#94a3b8;font-size:11px;font-weight:600;transition:all .2s;white-space:nowrap}
    .cat:hover,.cat.active{border-color:#6366f1;color:#a78bfa;background:rgba(99,102,241,.1)}
    .ce{font-size:22px}
    /* Filter bar */
    .fbar{display:flex;justify-content:space-between;align-items:center;padding:14px 28px}
    .fcount{color:#64748b;font-size:13px}
    .sorts{display:flex;gap:8px}
    .stab{padding:5px 12px;background:#161d30;border:1px solid #1e2a45;border-radius:8px;color:#64748b;cursor:pointer;font-size:12px;transition:all .2s}
    .stab.active{background:#6366f1;color:#fff;border-color:#6366f1}
    /* Grid */
    .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;padding:0 28px 28px}
    .pcard{background:#161d30;border:1.5px solid #1e2a45;border-radius:18px;overflow:hidden;cursor:pointer;transition:all .25s}
    .pcard:hover{border-color:#6366f1;transform:translateY(-6px);box-shadow:0 16px 48px rgba(99,102,241,.2)}
    .pimg-wrap{position:relative;height:195px;overflow:hidden;background:#0f1420}
    .pimg{width:100%;height:100%;object-fit:cover;transition:transform .3s}
    .pcard:hover .pimg{transform:scale(1.05)}
    .pbadges{position:absolute;top:10px;left:10px;display:flex;flex-direction:column;gap:5px}
    .b-hot{background:rgba(239,68,68,.9);color:#fff;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
    .b-low{background:rgba(245,158,11,.9);color:#fff;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
    .b-out{background:rgba(107,114,128,.9);color:#fff;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
    .qadd{position:absolute;bottom:0;left:0;right:0;padding:11px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;font-weight:700;font-size:13px;cursor:pointer;transform:translateY(100%);transition:transform .2s}
    .pcard:hover .qadd{transform:translateY(0)}
    .qadd:disabled{background:#374151;cursor:not-allowed}
    .pbody{padding:14px}
    .pcat{font-size:10px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
    .pname{font-size:13px;font-weight:600;color:#fff;margin-bottom:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:38px;line-height:1.4}
    .prating{font-size:13px;color:#f59e0b;margin-bottom:8px}
    .rcnt{color:#64748b;font-size:11px}
    .pprices{display:flex;align-items:center;gap:8px;margin-bottom:5px}
    .pprice{font-size:18px;font-weight:800;color:#fff}
    .pold{font-size:12px;color:#4a5568;text-decoration:line-through}
    .pship{font-size:11px;color:#4ade80}
    /* Empty */
    .empty-box{text-align:center;padding:80px 28px}
    /* Detail modal */
    .det-overlay{position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px}
    .det-modal{background:#0f1420;border:1px solid #1e2a45;border-radius:24px;width:880px;max-width:95vw;max-height:90vh;overflow-y:auto;position:relative}
    .det-close{position:sticky;top:16px;float:right;margin:16px;background:#1e2a45;border:none;color:#94a3b8;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;z-index:10}
    .det-grid{display:grid;grid-template-columns:1fr 1fr;clear:both}
    .det-img-wrap{position:relative;height:480px;background:#161d30;border-radius:24px 0 0 24px;overflow:hidden}
    .det-img{width:100%;height:100%;object-fit:cover}
    .det-info{padding:28px;overflow-y:auto;max-height:480px}
    .det-title{font-size:22px;font-weight:800;color:#fff;margin:6px 0 10px;line-height:1.3}
    .det-desc{color:#94a3b8;font-size:13px;line-height:1.7;margin-bottom:18px;padding:14px;background:#161d30;border-radius:10px}
    .det-price-box{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:14px;background:rgba(99,102,241,.1);border-radius:10px;border:1px solid rgba(99,102,241,.2)}
    .det-price{font-size:28px;font-weight:800;color:#fff}
    .disc-badge{background:#dc2626;color:#fff;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
    .det-stock{margin-bottom:18px;font-size:13px;font-weight:600}
    .sok{color:#4ade80}.slow{color:#fbbf24}.sout{color:#fc8181}
    .det-acts{display:flex;gap:10px;margin-bottom:16px}
    .btn-sec{flex:1;padding:13px;background:#1e2a45;color:#a78bfa;border:1px solid #6366f1;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px}
    .btn-pri{flex:1;padding:13px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px}
    .btn-sec:disabled,.btn-pri:disabled{opacity:.4;cursor:not-allowed;background:#1e2a45;color:#4a5568;border-color:#1e2a45}
    .det-feats{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:20px}
    .det-feats span{background:#161d30;padding:9px 12px;border-radius:8px;font-size:12px;color:#94a3b8}
    .reviews h3{color:#fff;font-size:15px;margin:0 0 14px}
    .rev-item{background:#161d30;border-radius:10px;padding:14px;margin-bottom:10px}
    .rev-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
    .rev-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
    .rev-name{color:#fff;font-size:12px;font-weight:600}
    .rev-date{margin-left:auto;color:#4a5568;font-size:11px}
    .rev-text{color:#94a3b8;font-size:12px;line-height:1.6}
    /* Toast */
    .toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e2a45;color:#a78bfa;border:1px solid #6366f1;padding:12px 24px;border-radius:12px;font-weight:600;z-index:400;white-space:nowrap;animation:fadeIn .3s ease}
    @keyframes fadeIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
  `]
})
export class ShopComponent implements OnInit {
  products  = signal<any>({content:[]});
  q = ''; sort = 'default';
  selectedCategory: string|null = null;
  selectedProduct: any = null;
  showCart = false; showCheckout = false; toastMsg = '';
  cart: Array<{id:number,name:string,price:number,qty:number,storeId:number,image:string}> = [];
  navItems = IND_NAV; categories: string[] = []; totalProducts = 0;
  sortOptions = [{l:'Önerilen',v:'default'},{l:'En Ucuz',v:'asc'},{l:'En Pahalı',v:'desc'},{l:'Popüler',v:'popular'}];

  constructor(private api: ApiService) {}
  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    this.api.searchProducts('',0,100).subscribe(data => {
      this.products.set(data);
      this.totalProducts = data.totalElements||data.content?.length||0;
      const cats = new Set<string>();
      data.content?.forEach((p:any) => { if(p.categoryName) cats.add(p.categoryName); });
      this.categories = Array.from(cats);
    });
  }

  search() { this.selectedCategory=null; this.api.searchProducts(this.q,0,100).subscribe(d=>this.products.set(d)); }
  filterByCategory(c:string) { this.selectedCategory=c; this.api.searchProducts(c,0,100).subscribe(d=>this.products.set(d)); }
  clearFilter() { this.selectedCategory=null; this.q=''; this.loadProducts(); }

  sortedProducts() {
    const items=[...(this.products()?.content||[])];
    if(this.sort==='asc') return items.sort((a,b)=>a.unitPrice-b.unitPrice);
    if(this.sort==='desc') return items.sort((a,b)=>b.unitPrice-a.unitPrice);
    if(this.sort==='popular') return items.sort((a,b)=>(b.importance==='HIGH'?1:0)-(a.importance==='HIGH'?1:0));
    return items;
  }

  openDetail(p:any) { this.selectedProduct=p; }

  addToCart(p:any,e:Event) {
    e.stopPropagation();
    const ex=this.cart.find(c=>c.id===p.id);
    if(ex) ex.qty++;
    else this.cart.push({id:p.id,name:p.name,price:p.unitPrice,qty:1,storeId:p.storeId,image:this.getImage(p)});
    this.showToast('✅ Sepete eklendi!');
  }

  decQty(item:any) { if(item.qty>1) item.qty--; else this.removeFromCart(item); }
  removeFromCart(item:any) { this.cart=this.cart.filter(c=>c.id!==item.id); }
  get cartTotal() { return this.cart.reduce((s,c)=>s+c.price*c.qty,0); }

  onCheckoutComplete() {
    this.cart=[]; this.showCart=false; this.showCheckout=false;
    this.showToast('🎉 Siparişiniz oluşturuldu!');
  }

  showToast(msg:string) { this.toastMsg=msg; setTimeout(()=>this.toastMsg='',2500); }

  getImage(p:any):string {
    const cat=p.categoryName||'default';
    const imgs=CATEGORY_IMAGES[cat]||CATEGORY_IMAGES['default'];
    return imgs[p.id%imgs.length];
  }

  onImgError(e:Event) { (e.target as HTMLImageElement).src='https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80'; }
  getCatEmoji(c:string):string { return CAT_EMOJI[c]||'📦'; }
  getMockReviews(id:number) { return MOCK_REVIEWS.slice(0,(id%3)+1); }
}
