import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { NgIf, NgFor, DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { KeyValuePipe } from '@angular/common';
import { DynamicChartComponent } from './dynamic-chart.component';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visualization?: {chart_type:string; x_column:string; y_column:string; title:string; raw_data?:any[]};
  chartId?: string;
}

const SUGGESTIONS = [
  'Bu ayki toplam satış ne kadar?',
  'En çok satan 5 ürün hangileri?',
  'Kategori bazlı satış dağılımı',
  'Bu ay kaç sipariş verildi?',
  'Ortalama sipariş tutarı nedir?',
  'Kargo durumlarının dağılımı',
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, UpperCasePipe, KeyValuePipe, FormsModule, SidebarComponent, DynamicChartComponent],
  template: `
    <div class="layout">
      <app-sidebar [items]="navItems" />
      <main class="main">

        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="ai-avatar">🤖</div>
            <div>
              <h2>AI Veri Asistanı</h2>
              <div class="status">
                <span class="dot"></span>
                <span>Online — 5 Ajan Aktif (Guardrails → SQL → Execute → Analysis → Viz)</span>
              </div>
            </div>
          </div>
          <button (click)="clearChat()" class="clear-btn">🗑️ Temizle</button>
        </div>

        <!-- Agent pipeline indicator -->
        <div class="pipeline">
          <div class="pipe-step" *ngFor="let s of pipelineSteps" [class.active]="activePipe===s.key">
            <div class="pipe-icon">{{s.icon}}</div>
            <div class="pipe-label">{{s.label}}</div>
          </div>
        </div>

        <!-- Chat area -->
        <div class="chat-area">
          <div class="messages" #msgContainer>

            <!-- Welcome -->
            <div *ngIf="messages().length===0" class="welcome">
              <div class="welcome-icon">📊</div>
              <h3>DataPulse AI Asistanına Hoşgeldiniz</h3>
              <p>Verilerinizi doğal Türkçe ile sorgulayın. LangGraph ile 5 özelleşmiş ajan çalışır.</p>
              <div class="suggestions">
                <button *ngFor="let s of suggestions" (click)="sendSuggestion(s)" class="sug-btn">
                  💬 {{s}}
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div *ngFor="let msg of messages()" class="msg-wrap" [class.user-wrap]="msg.role==='user'">

              <div *ngIf="msg.role==='assistant'" class="bot-avatar">🤖</div>

              <div class="bubble" [class.user-bubble]="msg.role==='user'"
                   [class.bot-bubble]="msg.role==='assistant'">
                <div class="msg-content" style="white-space:pre-wrap">{{msg.content}}</div>

                <!-- Visualization (Plotly-style chart using Canvas) -->
                <div *ngIf="msg.visualization && msg.visualization.chart_type!=='none'"
                     class="chart-container">
                  <div class="chart-header">
                    <span class="chart-type-badge">📈 {{msg.visualization.chart_type | uppercase}}</span>
                    <span class="chart-title">{{msg.visualization.title}}</span>
                  </div>
                  <div [id]="'chart-'+msg.chartId" class="chart-placeholder">
                    <div class="chart-visual" *ngIf="['bar','column','line','pie','doughnut'].includes(msg.visualization.chart_type)">
                      <app-dynamic-chart [vizData]="msg.visualization"></app-dynamic-chart>
                    </div>
                    <div *ngIf="msg.visualization.chart_type==='table'" class="chart-table-msg" style="overflow-x:auto; padding:10px;">
                      <table class="data-table" *ngIf="msg.visualization.raw_data" style="width:100%; border-collapse:collapse; font-size:12px;">
                        <thead>
                          <tr><th *ngFor="let kv of msg.visualization.raw_data[0] | keyvalue" style="padding:8px; border:1px solid var(--border); background:rgba(0,212,170,.1); color:var(--accent); text-align:left;">{{getColumnHeader(kv.key)}}</th></tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let row of msg.visualization.raw_data">
                            <td *ngFor="let kv of row | keyvalue" style="padding:8px; border:1px solid var(--border);">{{kv.value}}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="chart-axes">
                      <span class="axis-x">{{msg.visualization.x_column}}</span>
                      <span class="axis-y">{{msg.visualization.y_column}}</span>
                    </div>
                  </div>
                </div>

                <div class="msg-time">{{msg.timestamp | date:'HH:mm'}}</div>
              </div>

              <div *ngIf="msg.role==='user'" class="user-avatar">
                {{userInitials}}
              </div>
            </div>

            <!-- Loading -->
            <div *ngIf="loading()" class="msg-wrap">
              <div class="bot-avatar">🤖</div>
              <div class="bubble bot-bubble">
                <div class="thinking">
                  <div class="thinking-step" *ngFor="let s of thinkingSteps; let i=index"
                       [class.active]="thinkingIdx>=i">
                    {{s}}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="input-area">
            <div class="input-wrap">
              <textarea [(ngModel)]="input"
                        placeholder="Sorunuzu yazın... (Enter = gönder, Shift+Enter = yeni satır)"
                        (keydown)="onKeydown($event)"
                        rows="1" class="msg-input">
              </textarea>
              <button (click)="send()" [disabled]="loading()||!input.trim()" class="send-btn">
                <span *ngIf="!loading()">➤</span>
                <span *ngIf="loading()">⟳</span>
              </button>
            </div>
            <div class="input-meta">
              <span>Rol: <strong>{{auth.getRole()}}</strong></span>
              <span>5 ajan aktif: Guardrails · SQL · Executor · Analyst · Viz</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; background:var(--bg-base); }
    .main { margin-left:260px; flex:1; display:flex; flex-direction:column; height:100vh; overflow:hidden; }

    /* Header */
    .chat-header { display:flex; justify-content:space-between; align-items:center; padding:16px 28px; background:var(--bg-card); border-bottom:1px solid var(--border); flex-shrink:0; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .ai-avatar { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#00d4aa,#0096ff); display:flex; align-items:center; justify-content:center; font-size:22px; }
    h2 { font-size:18px; font-weight:700; color:var(--text-1); margin-bottom:3px; }
    .status { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-3); }
    .dot { width:7px; height:7px; border-radius:50%; background:#00e676; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .clear-btn { padding:7px 14px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:8px; color:var(--text-3); cursor:pointer; font-size:12px; }
    .clear-btn:hover { border-color:var(--danger); color:var(--danger); }

    /* Pipeline */
    .pipeline { display:flex; align-items:center; justify-content:center; gap:0; padding:10px 28px; background:var(--bg-card); border-bottom:1px solid var(--border); flex-shrink:0; }
    .pipe-step { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; font-size:11px; color:var(--text-3); transition:all .2s; position:relative; }
    .pipe-step::after { content:'→'; margin-left:8px; color:var(--border-2); font-size:12px; }
    .pipe-step:last-child::after { display:none; }
    .pipe-step.active { background:rgba(0,212,170,.1); color:var(--accent); border:1px solid rgba(0,212,170,.2); }
    .pipe-icon { font-size:14px; }
    .pipe-label { font-weight:500; white-space:nowrap; }

    /* Chat */
    .chat-area { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .messages { flex:1; overflow-y:auto; padding:24px 28px; display:flex; flex-direction:column; gap:20px; }

    /* Welcome */
    .welcome { text-align:center; padding:40px 20px; max-width:600px; margin:auto; }
    .welcome-icon { font-size:56px; margin-bottom:16px; }
    .welcome h3 { font-size:22px; font-weight:700; color:var(--text-1); margin-bottom:10px; }
    .welcome p { color:var(--text-3); font-size:14px; line-height:1.6; margin-bottom:28px; }
    .suggestions { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; }
    .sug-btn { padding:9px 16px; background:var(--bg-card); border:1px solid var(--border); border-radius:20px; color:var(--text-2); cursor:pointer; font-size:13px; transition:all .15s; }
    .sug-btn:hover { border-color:var(--accent); color:var(--accent); }

    /* Messages */
    .msg-wrap { display:flex; align-items:flex-start; gap:12px; }
    .user-wrap { flex-direction:row-reverse; }
    .bot-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#00d4aa,#0096ff); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .user-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#0096ff); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
    .bubble { max-width:72%; padding:14px 16px; border-radius:16px; position:relative; }
    .bot-bubble { background:var(--bg-card); border:1px solid var(--border); border-radius:4px 16px 16px 16px; }
    .user-bubble { background:linear-gradient(135deg,rgba(0,212,170,.15),rgba(0,150,255,.1)); border:1px solid rgba(0,212,170,.2); border-radius:16px 4px 16px 16px; }
    .msg-content { font-size:14px; line-height:1.7; color:var(--text-1); }
    .msg-time { font-size:11px; color:var(--text-3); margin-top:8px; text-align:right; }

    /* Chart */
    .chart-container { margin-top:14px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .chart-header { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); }
    .chart-type-badge { background:rgba(0,212,170,.15); color:var(--accent); padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
    .chart-title { font-size:13px; color:var(--text-2); font-weight:500; }
    .chart-placeholder { padding:16px; }
    .chart-visual { height:140px; display:flex; align-items:flex-end; justify-content:center; gap:8px; margin-bottom:10px; }
    .chart-bars { display:flex; align-items:flex-end; gap:10px; height:100%; width:100%; justify-content:space-around; }
    .chart-bar { flex:1; border-radius:6px 6px 0 0; position:relative; display:flex; align-items:flex-start; justify-content:center; min-width:24px; transition:opacity .2s; }
    .chart-bar:hover { opacity:.8; }
    .bar-val { font-size:10px; color:#fff; padding-top:4px; font-weight:600; }
    .chart-pie { display:flex; align-items:center; gap:20px; height:100%; }
    .pie-visual { font-size:80px; }
    .pie-legend { display:flex; flex-direction:column; gap:8px; }
    .pie-item { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-2); }
    .pie-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .chart-line { width:100%; height:100%; }
    .line-svg { width:100%; height:100%; }
    .chart-table-msg { display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-3); font-size:13px; }
    .chart-axes { display:flex; justify-content:space-between; font-size:11px; color:var(--text-3); font-family:monospace; }

    /* Thinking */
    .thinking { display:flex; flex-direction:column; gap:6px; }
    .thinking-step { font-size:12px; color:var(--text-3); padding:4px 0; opacity:.4; transition:all .3s; }
    .thinking-step.active { color:var(--accent); opacity:1; }

    /* Input */
    .input-area { padding:16px 28px; background:var(--bg-card); border-top:1px solid var(--border); flex-shrink:0; }
    .input-wrap { display:flex; gap:12px; align-items:flex-end; background:var(--bg-elevated); border:1.5px solid var(--border); border-radius:14px; padding:10px 12px; transition:border-color .15s; margin-bottom:10px; }
    .input-wrap:focus-within { border-color:var(--accent); }
    .msg-input { flex:1; background:none; border:none; color:var(--text-1); font-size:14px; outline:none; resize:none; max-height:120px; line-height:1.5; font-family:inherit; }
    .send-btn { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#00d4aa,#0096ff); color:#000; border:none; cursor:pointer; font-size:18px; font-weight:700; flex-shrink:0; transition:opacity .15s; display:flex; align-items:center; justify-content:center; }
    .send-btn:disabled { opacity:.4; cursor:not-allowed; }
    .input-meta { display:flex; justify-content:space-between; font-size:11px; color:var(--text-3); }
    .input-meta strong { color:var(--accent); }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('msgContainer') private scrollEl!: ElementRef;

  messages  = signal<Message[]>([]);
  input     = '';
  loading   = signal(false);
  activePipe = '';
  thinkingIdx = 0;
  suggestions = SUGGESTIONS;

  thinkingSteps = [
    '🛡️ Guardrails kontrol ediliyor...',
    '🔍 SQL sorgusu üretiliyor...',
    '⚡ Veritabanı sorgulanıyor...',
    '📊 Sonuçlar analiz ediliyor...',
    '📈 Görselleştirme hazırlanıyor...',
  ];

  pipelineSteps = [
    {key:'guardrails', icon:'🛡️', label:'Guardrails'},
    {key:'sql',        icon:'🔍', label:'SQL Agent'},
    {key:'execute',    icon:'⚡', label:'Executor'},
    {key:'analysis',   icon:'📊', label:'Analyst'},
    {key:'viz',        icon:'📈', label:'Visualizer'},
  ];

  navItems: NavItem[] = [];

  // Column header mapping: database column -> Turkish UI label
  private readonly columnHeaders: { [key: string]: string } = {
    'order_id': 'Sipariş No',
    'grand_total': 'Toplam Tutar',
    'ordered_at': 'Sipariş Tarihi',
    'product_name': 'Ürün Adı',
    'unit_price': 'Birim Fiyat',
    'quantity': 'Adet',
    'status': 'Durum',
    'currency': 'Para Birimi',
    'name': 'İsim',
    'first_name': 'Ad',
    'last_name': 'Soyad',
    'email': 'E-posta',
    'phone': 'Telefon',
    'address': 'Adres',
    'created_at': 'Oluşturulma Tarihi',
    'updated_at': 'Güncellenme Tarihi',
    'stock_quantity': 'Stok Miktarı',
    'category_name': 'Kategori',
    'store_name': 'Mağaza',
    'review_count': 'Yorum Sayısı',
    'average_rating': 'Ortalama Puan',
    'total_spent': 'Toplam Harcama',
    'total_items': 'Toplam Ürün',
    'id': 'ID',
    'description': 'Açıklama',
    'sku': 'SKU',
    'importance': 'Önem Derecesi',
    'is_active': 'Aktif',
    'city': 'Şehir',
    'country': 'Ülke',
    'membership_type': 'Üyelik Tipi',
    'satisfaction_level': 'Memnuniyet Seviyesi',
    'shipments.status': 'Kargo Durumu',
    'orders.status': 'Sipariş Durumu',
    'star_rating': 'Yıldız Puanı',
    'body': 'İçerik',
    'title': 'Başlık',
    'payment_method': 'Ödeme Yöntemi',
    'sales_channel': 'Satış Kanalı',
    'fulfilment': 'Teslimat Türü',
    'customer_care_calls': 'Müşteri Hizmeti Aramaları',
    'customer_rating': 'Müşteri Puanı',
    'discount_offered': 'İndirim Oranı',
    'mode_of_shipment': 'Gönderim Modu',
    'warehouse_block': 'Depo Bloku',
    'tracking_number': 'Takip Numarası',
    'carrier': 'Kargo Firması',
    'ship_service_level': 'Gönderim Seviyesi',
    'estimated_delivery': 'Tahmini Teslimat',
    'actual_delivery': 'Gerçek Teslimat',
    'cost_of_product': 'Ürün Maliyeti',
    'prior_purchases': 'Önceki Satın Alımlar',
    'sentiment': 'Duygu Analizi',
    'verified': 'Doğrulanmış',
    'marketplace': 'Pazar Yeri',
    'helpful_votes': 'Faydalı Oylar',
    'total_votes': 'Toplam Oy',
    'gender': 'Cinsiyet',
    'role_type': 'Rol',
    'age': 'Yaş',
    'total_spend': 'Toplam Harcama',
    'items_purchased': 'Satın Alınan Ürün',
    'avg_rating': 'Ortalama Puan',
    'discount_applied': 'İndirim Uygulandı',
  };

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit() {
    const role = this.auth.getRole();
    const dashPath = role==='ADMIN' ? '/admin' : role==='CORPORATE' ? '/corporate/dashboard' : '/shop';
    this.navItems = [
      {label:'Dashboard', icon:'🏠', path:dashPath},
      {label:'AI Asistan', icon:'🤖', path:'/chat'},
    ];
  }

  ngAfterViewChecked() {
    try { const el=this.scrollEl.nativeElement; el.scrollTop=el.scrollHeight; } catch {}
  }

  get userInitials() {
    const u=this.auth.currentUser();
    return u ? (u.firstName?.[0]||'')+(u.lastName?.[0]||'') : '?';
  }

  // Translate database column name to Turkish UI label
  getColumnHeader(key: string | number | symbol): string {
    const keyStr = String(key);
    // Check exact match first
    if (this.columnHeaders[keyStr]) {
      return this.columnHeaders[keyStr];
    }
    // Check lowercase match
    const lowerKey = keyStr.toLowerCase();
    if (this.columnHeaders[lowerKey]) {
      return this.columnHeaders[lowerKey];
    }
    // Fallback: convert snake_case to Title Case
    return keyStr
      .replace(/_/g, ' ')
      .replace(/\./g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  sendSuggestion(s: string) { this.input=s; this.send(); }

  onKeydown(e: Event) {
    const ke=e as KeyboardEvent;
    if(ke.key==='Enter' && !ke.shiftKey) { e.preventDefault(); this.send(); }
  }

  send() {
    const text=this.input.trim();
    if(!text||this.loading()) return;
    this.messages.update(m=>[...m,{role:'user',content:text,timestamp:new Date()}]);
    this.input=''; this.loading.set(true);
    this.runPipeline();

    this.http.post<any>('http://localhost:8081/api/chat', {
      question: text
    }).subscribe({
      next: (res) => {
        clearInterval(this.pipeTimer);
        this.activePipe='';
        const chartId = Math.random().toString(36).slice(2);
        this.messages.update(m=>[...m,{
          role:'assistant',
          content: res.answer||'Yanıt alınamadı.',
          timestamp: new Date(),
          visualization: res.visualization?.chart_type!=='none' ? res.visualization : null,
          chartId,
        }]);
        this.loading.set(false);
      },
      error: () => {
        clearInterval(this.pipeTimer);
        this.activePipe='';
        this.messages.update(m=>[...m,{
          role:'assistant',
          content:'⚠️ AI servisi şu an erişilemiyor. Chatbot servisinin çalıştığından emin olun.',
          timestamp:new Date(),
        }]);
        this.loading.set(false);
      }
    });
  }

  private pipeTimer: any;
  runPipeline() {
    const keys=['guardrails','sql','execute','analysis','viz'];
    let i=0; this.thinkingIdx=0;
    this.activePipe=keys[0];
    this.pipeTimer=setInterval(()=>{
      i++; this.thinkingIdx=i;
      if(i<keys.length) this.activePipe=keys[i];
    },900);
  }

  clearChat() { this.messages.set([]); }

  getMockBars() {
    const colors=['#00d4aa','#0096ff','#7c3aed','#ffab40','#ff5252','#00e676'];
    return [65,85,45,90,55,70,40].map((h,i)=>({h,color:colors[i%colors.length],val:Math.round(h*100)}));
  }

  getMockPie() {
    return [
      {label:'Kategori A', pct:35, color:'#00d4aa'},
      {label:'Kategori B', pct:28, color:'#0096ff'},
      {label:'Kategori C', pct:22, color:'#7c3aed'},
      {label:'Diğer',      pct:15, color:'#ffab40'},
    ];
  }
}
