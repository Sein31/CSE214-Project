import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar/sidebar.component';

const IND_NAV: NavItem[] = [
  { label:'Mağaza',       icon:'🛍️', path:'/shop' },
  { label:'Siparişlerim', icon:'📋', path:'/shop/orders' },
  { label:'Dashboard',    icon:'📊', path:'/shop/dashboard' },
  { label:'AI Asistan',   icon:'🤖', path:'/chat' },
];

const STATUS_MAP: Record<string,{label:string,color:string,icon:string}> = {
  PENDING:    {label:'Beklemede',    color:'#f59e0b', icon:'⏳'},
  CONFIRMED:  {label:'Onaylandı',    color:'#6366f1', icon:'✅'},
  PROCESSING: {label:'Hazırlanıyor', color:'#8b5cf6', icon:'📦'},
  SHIPPED:    {label:'Kargoda',      color:'#3b82f6', icon:'🚚'},
  DELIVERED:  {label:'Teslim',       color:'#22c55e', icon:'🎉'},
  CANCELLED:  {label:'İptal',        color:'#ef4444', icon:'❌'},
  RETURNED:   {label:'İade',         color:'#94a3b8', icon:'↩️'},
};

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, DatePipe, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">
        <div class="ph">
          <div><h2>Siparişlerim 📋</h2><p class="sub">Tüm siparişlerinizi takip edin</p></div>
          <div style="display:flex;gap:12px">
            <select [(ngModel)]="filterStatus" class="fsel">
              <option value="">Tüm Durumlar</option>
              <option *ngFor="let s of statusList" [value]="s.v">{{s.l}}</option>
            </select>
            <button (click)="exportCSV()" class="btn-exp">📥 CSV İndir</button>
          </div>
        </div>

        <div class="stats-row">
          <div class="sb"><div class="sv">{{orders().length}}</div><div class="sl">Toplam</div></div>
          <div class="sb green"><div class="sv">{{deliveredCount}}</div><div class="sl">Teslim Edildi</div></div>
          <div class="sb blue"><div class="sv">{{activeCount}}</div><div class="sl">Aktif</div></div>
          <div class="sb purple"><div class="sv">{{totalSpent|number:'1.0-0'}} ₺</div><div class="sl">Harcama</div></div>
        </div>

        <div class="olist" *ngIf="filteredOrders().length>0; else empty">
          <div *ngFor="let o of filteredOrders()" class="ocard" (click)="toggle(o.id)">
            <div class="omain">
              <div class="oid">#{{o.id}}</div>
              <div class="odate">{{o.orderedAt|date:'dd MMM yyyy'}}</div>
              <div class="otot">{{o.grandTotal|number:'1.2-2'}} ₺</div>
              <div class="opay">{{o.paymentMethod}}</div>
              <div class="sbadge" [style.background]="st(o.status).color+'22'" [style.color]="st(o.status).color">
                {{st(o.status).icon}} {{st(o.status).label}}
              </div>
              <div style="color:#64748b;font-size:12px">{{expandedId===o.id?'▲':'▼'}}</div>
            </div>

            <div *ngIf="expandedId===o.id" class="odetail" (click)="$event.stopPropagation()">
              <div class="track">
                <h4>📍 Sipariş Takibi</h4>
                <div class="tl">
                  <div *ngFor="let step of getTimeline(o.status)"
                       class="ts" [class.done]="step.done" [class.active]="step.active">
                    <div class="tdot">{{step.icon}}</div>
                    <div><div class="tlabel">{{step.label}}</div>
                    <div class="tdate" *ngIf="step.done||step.active">{{o.orderedAt|date:'dd MMM'}}</div></div>
                  </div>
                </div>
              </div>

              <div class="ship-info" *ngIf="shipments()[o.id] || o.status==='SHIPPED'||o.status==='DELIVERED'">
                <h4>🚚 Kargo</h4>
                <div class="irow"><span>Takip No:</span><code>{{ shipments()[o.id]?.trackingNumber || 'TRK-' + o.id + '-' + o.id*7 }}</code></div>
                <div class="irow"><span>Kargo Firması:</span><span>{{ shipments()[o.id]?.carrier || 'Yurtiçi Kargo' }}</span></div>
                <div class="irow"><span>Tahmini Teslim:</span><span>{{ shipments()[o.id]?.estimatedDelivery ? (shipments()[o.id]?.estimatedDelivery | date:'dd MMM') : '1-3 iş günü' }}</span></div>
              </div>

              <div class="pay-info">
                <h4>💳 Ödeme</h4>
                <div class="irow"><span>Yöntem:</span><span>{{o.paymentMethod}}</span></div>
                <div class="irow"><span>Tutar:</span><span style="color:#4ade80;font-weight:700">{{o.grandTotal|number:'1.2-2'}} ₺</span></div>
                <div *ngIf="o.status==='DELIVERED'" style="margin-top:12px;display:flex;gap:8px">
                  <button class="btn-ret">↩️ İade Talebi</button>
                  <button class="btn-rev" (click)="openReview(o)">⭐ Değerlendir</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #empty>
          <div class="empty"><div style="font-size:56px;margin-bottom:12px">📦</div>
          <h3>Sipariş bulunamadı</h3><p>Henüz sipariş vermediniz</p></div>
        </ng-template>

        <div *ngIf="reviewOrder" class="ov" (click)="reviewOrder=null">
          <div class="rmodal" (click)="$event.stopPropagation()">
            <h3>⭐ Değerlendirme</h3>
            <p>Sipariş #{{reviewOrder.id}} için değerlendirmenizi paylaşın</p>
            <div class="stars-row">
              <button *ngFor="let s of [1,2,3,4,5]" (click)="reviewRating=s"
                      [style.color]="reviewRating>=s?'#f59e0b':'#1e2a45'" class="sbtn">★</button>
            </div>
            <input [(ngModel)]="reviewTitle" placeholder="Başlık" class="rinp" />
            <textarea [(ngModel)]="reviewBody" placeholder="Deneyiminizi yazın..." class="rtxt"></textarea>
            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
              <button (click)="reviewOrder=null" class="btn-cancel">İptal</button>
              <button (click)="submitReview()" class="btn-submit">Gönder ⭐</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh;background:#0a0e1a}
    .main{margin-left:240px;flex:1;padding:28px;color:#e2e8f0}
    .ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    h2{font-size:26px;font-weight:700;color:#fff;margin:0 0 4px}
    .sub{color:#64748b;font-size:13px;margin:0}
    .fsel{padding:9px 14px;background:#161d30;border:1px solid #1e2a45;border-radius:10px;color:#e2e8f0;font-size:13px}
    .btn-exp{padding:9px 16px;background:#1e2a45;border:1px solid #2d3a55;border-radius:10px;color:#a78bfa;font-size:13px;cursor:pointer;font-weight:600}
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
    .sb{background:#161d30;border:1px solid #1e2a45;border-radius:12px;padding:18px;text-align:center}
    .sb.green{border-color:#22c55e33}.sb.blue{border-color:#3b82f633}.sb.purple{border-color:#8b5cf633}
    .sv{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
    .sl{font-size:12px;color:#64748b}
    .olist{display:flex;flex-direction:column;gap:10px}
    .ocard{background:#161d30;border:1.5px solid #1e2a45;border-radius:14px;overflow:hidden;cursor:pointer;transition:border-color .2s}
    .ocard:hover{border-color:#6366f1}
    .omain{display:grid;grid-template-columns:80px 1fr 130px 140px 150px 30px;align-items:center;gap:16px;padding:16px 20px}
    .oid{font-family:monospace;color:#6366f1;font-weight:700;font-size:14px}
    .odate{color:#94a3b8;font-size:13px}
    .otot{color:#fff;font-weight:700;font-size:15px}
    .opay{color:#64748b;font-size:12px}
    .sbadge{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700}
    .odetail{border-top:1px solid #1e2a45;padding:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;background:#0f1420}
    h4{color:#fff;font-size:13px;font-weight:700;margin:0 0 12px}
    .tl{display:flex;flex-direction:column;gap:0}
    .ts{display:flex;gap:10px;align-items:flex-start;padding-bottom:14px;position:relative}
    .ts::before{content:'';position:absolute;left:13px;top:26px;bottom:0;width:2px;background:#1e2a45}
    .ts:last-child::before,.ts.done::before{background:#22c55e}
    .ts:last-child::before{display:none}
    .tdot{width:26px;height:26px;border-radius:50%;background:#1e2a45;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;border:2px solid #1e2a45}
    .ts.done .tdot{border-color:#22c55e;background:rgba(34,197,94,.1)}
    .ts.active .tdot{border-color:#6366f1;background:rgba(99,102,241,.1)}
    .tlabel{font-size:12px;color:#e2e8f0;font-weight:500}
    .tdate{font-size:10px;color:#64748b;margin-top:2px}
    .ship-info,.pay-info{background:#161d30;border-radius:10px;padding:14px}
    .irow{display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;padding:5px 0;border-bottom:1px solid #1e2a45}
    .irow:last-child{border:none}
    code{background:#0f1420;padding:2px 6px;border-radius:4px;color:#a78bfa;font-size:11px;font-family:monospace}
    .btn-ret{padding:7px 14px;background:#1e2a45;color:#94a3b8;border:1px solid #2d3a55;border-radius:8px;cursor:pointer;font-size:12px}
    .btn-rev{padding:7px 14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px}
    .empty{text-align:center;padding:80px;color:#64748b}
    .empty h3{color:#fff;font-size:20px;margin:0 0 8px}
    .ov{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:200}
    .rmodal{background:#161d30;border:1px solid #1e2a45;border-radius:20px;padding:28px;width:460px}
    .rmodal h3{color:#fff;margin:0 0 8px;font-size:18px}
    .rmodal p{color:#64748b;font-size:13px;margin:0 0 16px}
    .stars-row{display:flex;gap:6px;margin-bottom:16px}
    .sbtn{background:none;border:none;font-size:28px;cursor:pointer;transition:color .1s}
    .rinp{width:100%;padding:10px 14px;background:#0f1420;border:1px solid #1e2a45;border-radius:10px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;margin-bottom:10px}
    .rtxt{width:100%;padding:10px 14px;background:#0f1420;border:1px solid #1e2a45;border-radius:10px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;height:90px;resize:none;font-family:inherit}
    .btn-cancel{padding:9px 18px;background:#1e2a45;color:#94a3b8;border:none;border-radius:8px;cursor:pointer}
    .btn-submit{padding:9px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700}
  `]
})
export class MyOrdersComponent implements OnInit {
  orders   = signal<any[]>([]);
  navItems = IND_NAV;
  expandedId: number|null = null;
  filterStatus = '';
  reviewOrder: any = null;
  reviewRating = 5; reviewTitle = ''; reviewBody = '';
  statusList = [{v:'PENDING',l:'Beklemede'},{v:'SHIPPED',l:'Kargoda'},{v:'DELIVERED',l:'Teslim'},{v:'CANCELLED',l:'İptal'}];

  constructor(private api: ApiService) {}
  ngOnInit() { this.api.myOrders(0,50).subscribe((d:any)=>this.orders.set(d.content||[])); }

  filteredOrders() { return this.filterStatus ? this.orders().filter((o:any)=>o.status===this.filterStatus) : this.orders(); }
  get deliveredCount() { return this.orders().filter((o:any)=>o.status==='DELIVERED').length; }
  get activeCount()    { return this.orders().filter((o:any)=>['PENDING','CONFIRMED','PROCESSING','SHIPPED'].includes(o.status)).length; }
  get totalSpent()     { return this.orders().filter((o:any)=>o.status==='DELIVERED').reduce((s:number,o:any)=>s+o.grandTotal,0); }
  st(s:string)         { return STATUS_MAP[s]||{label:s,color:'#94a3b8',icon:'📦'}; }
  shipments = signal<Record<number, any>>({});

  toggle(id:number) { 
    this.expandedId=this.expandedId===id?null:id; 
    if (this.expandedId) {
      this.api.getShipment(id).subscribe({
        next: (res) => this.shipments.update(s => ({...s, [id]: res})),
        error: () => {} // Kargo kaydı yok
      });
    }
  }

  getTimeline(status:string) {
    const order=['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED'];
    const steps=[{icon:'📝',label:'Sipariş Alındı'},{icon:'✅',label:'Onaylandı'},{icon:'📦',label:'Hazırlanıyor'},{icon:'🚚',label:'Kargoya Verildi'},{icon:'🎉',label:'Teslim Edildi'}];
    const idx=order.indexOf(status);
    return steps.map((s,i)=>({...s,done:i<idx,active:i===idx}));
  }

  openReview(o:any) { this.reviewOrder=o; this.reviewRating=5; this.reviewTitle=''; this.reviewBody=''; }
  
  submitReview() { 
    if (!this.reviewOrder) return;
    const payload = {
      productId: this.reviewOrder.items[0].product.id, // ilk ürüne yorum yap (basitlik için)
      orderId: this.reviewOrder.id,
      starRating: this.reviewRating,
      title: this.reviewTitle,
      body: this.reviewBody
    };
    
    this.api.submitReview(payload).subscribe({
      next: () => {
        this.reviewOrder=null; 
        alert('Değerlendirmeniz için teşekkürler! ⭐');
      },
      error: (err) => alert('Hata: ' + err.error?.error)
    });
  }

  exportCSV() {
    const rows=this.filteredOrders().map((o:any)=>`${o.id},${o.orderedAt},${o.status},${o.grandTotal},${o.paymentMethod}`);
    const csv='Sipariş ID,Tarih,Durum,Tutar,Ödeme\n'+rows.join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='siparislerim.csv'; a.click();
  }
}
