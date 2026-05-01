"""
seed_demo_data.py — DataPulse demo veri üretici
================================================
Bu script, aad_db_init.sql ile oluşturulan boş schema'yı
gerçek sistemdekine benzer dolu demo verisiyle doldurur.

Üretilen veriler:
  - 12 mağaza (gerçekle aynı isim/şehir)
  - 33 kategori
  - ~300 kullanıcı (3 rol: ADMIN, CORPORATE, INDIVIDUAL)
  - ~160 ürün
  - ~2000 sipariş + order_items
  - ~1800 shipment
  - ~1100 review

Kullanım:
    pip install pymysql python-dotenv faker
    python database/seed_demo_data.py

Not: Tüm şifreler  ->  demo1234  (bcrypt hash dahil)
"""

import random
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

try:
    import pymysql
except ImportError:
    raise SystemExit("pymysql yüklü değil: pip install pymysql")

try:
    from faker import Faker
except ImportError:
    raise SystemExit("faker yüklü değil: pip install faker")

# ── Config ────────────────────────────────────────────────────────────────────
_base = os.path.dirname(os.path.abspath(__file__))
for _candidate in [
    os.path.join(_base, "..", ".env"),
    os.path.join(_base, "..", "chatbot", ".env"),
    os.path.join(_base, ".env"),
]:
    if os.path.exists(_candidate):
        load_dotenv(dotenv_path=_candidate)
        print(f"[ENV] Loaded: {_candidate}")
        break

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "aad_db"),
    "charset":  "utf8mb4",
}

# bcrypt hash of "demo1234"
DEMO_PASSWORD = "$2a$10$7EqJtq98hPqEX7fNZaFWoO5.2a6Yqq/RSBksiBeIV/pY5Pja/q"

fake = Faker("tr_TR")
random.seed(42)

NOW = datetime.now()


def rdt(days_back=365):
    """Random datetime within last N days."""
    return NOW - timedelta(seconds=random.randint(0, days_back * 86400))


# ── Master data ───────────────────────────────────────────────────────────────
STORES = [
    (1,  "TechStore TR",   "OPEN",      "Turkey", "Istanbul"),
    (2,  "Fashion Hub TR", "OPEN",      "Turkey", "Ankara"),
    (3,  "TechZone",       "OPEN",      "Turkey", "Eskişehir"),
    (4,  "FashionWorld",   "OPEN",      "Turkey", "Erzurum"),
    (5,  "BookCorner",     "OPEN",      "Turkey", "Samsun"),
    (6,  "HomeStyle",      "CLOSED",    "Turkey", "Gaziantep"),
    (7,  "SportsPro",      "OPEN",      "Turkey", "Ankara"),
    (8,  "BeautyShop",     "OPEN",      "Turkey", "Gaziantep"),
    (9,  "AutoParts",      "OPEN",      "Turkey", "Ankara"),
    (10, "ToyLand",        "OPEN",      "Turkey", "Diyarbakır"),
    (11, "ElectroMart",    "SUSPENDED", "Turkey", "İstanbul"),
    (12, "ModaHouse",      "OPEN",      "Turkey", "Eskişehir"),
]

CATEGORIES = [
    (1,  "Electronics",     None),
    (2,  "Clothing",        None),
    (3,  "Books",           None),
    (4,  "Home & Garden",   None),
    (5,  "Sports",          None),
    (6,  "Phones & Tablets", 1),
    (7,  "Computers",       1),
    (8,  "Audio",           1),
    (9,  "Men Clothing",    2),
    (10, "Women Clothing",  2),
    (12, "Electronics",     None),
    (13, "Clothing",        None),
    (14, "Books",           None),
    (15, "Home & Garden",   None),
    (16, "Sports",          None),
    (17, "Beauty",          None),
    (18, "Automotive",      None),
    (19, "Toys & Games",    None),
    (20, "Phones & Tablets", 1),
    (21, "Computers",       1),
    (22, "Audio",           1),
    (23, "TV & Video",      1),
    (24, "Men Clothing",    2),
    (25, "Women Clothing",  2),
    (26, "Kids Clothing",   2),
    (27, "Fiction",         3),
    (28, "Science & Tech",  3),
    (29, "Kitchen",         4),
    (30, "Furniture",       4),
    (31, "Fitness",         5),
    (32, "Outdoor",         5),
    (33, "Skincare",        17),
    (34, "Makeup",          17),
]

STORE_CATEGORY_MAP = {
    1: [6, 7, 8, 23],   2: [9, 10, 26],  3: [6, 7, 22],
    4: [9, 10, 13],     5: [27, 28, 14], 6: [29, 30, 15],
    7: [31, 32, 16],    8: [33, 34, 17], 9: [18],
    10: [19, 26],       11: [6, 7, 1],   12: [9, 10, 25],
}

STATUSES   = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","RETURNED"]
STATUS_W   = [11, 11, 10, 9, 41, 9, 9]
PAYMENTS   = ["CREDIT_CARD","DEBIT_CARD","PAYPAL","BANK_TRANSFER","COD","WALLET"]
PAYMENT_W  = [39, 20, 11, 10, 14, 6]
SHIP_STAT  = ["PENDING","PROCESSING","IN_TRANSIT","DELIVERED","RETURNED","FAILED"]
SHIP_W     = [15, 10, 10, 44, 10, 11]
GENDERS    = ["MALE","FEMALE","OTHER"]
MEMBER     = ["BRONZE","SILVER","GOLD","PLATINUM"]
SATISFY    = ["LOW","MEDIUM","HIGH"]
IMPORTANCE = ["LOW","MEDIUM","HIGH"]
CHANNELS   = ["WEB","MOBILE","PARTNER","DIRECT"]
CARRIERS   = ["Yurtiçi Kargo","Aras Kargo","MNG Kargo","PTT Kargo","DHL","UPS"]


def weighted(choices, weights):
    return random.choices(choices, weights=weights, k=1)[0]


def main():
    print("=== DataPulse Demo Seed ===")
    print(f"DB: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")

    conn = pymysql.connect(**DB_CONFIG)
    cur  = conn.cursor()

    # ── Temizle ──────────────────────────────────────────────────────────────
    print("[1/8] Temizleniyor...")
    cur.execute("SET FOREIGN_KEY_CHECKS = 0")
    for t in ["audit_logs","refresh_tokens","reviews","shipments",
              "order_items","orders","products","customer_profiles",
              "stores","categories","users"]:
        cur.execute(f"TRUNCATE TABLE {t}")
    cur.execute("SET FOREIGN_KEY_CHECKS = 1")
    conn.commit()

    # ── Kategoriler ───────────────────────────────────────────────────────────
    print("[2/8] Kategoriler ekleniyor...")
    # Önce parent_id=None olanlar
    for cid, name, parent in CATEGORIES:
        if parent is None:
            cur.execute(
                "INSERT INTO categories (id,name,parent_id,created_at) VALUES (%s,%s,NULL,%s)",
                (cid, name, rdt(400))
            )
    # Sonra child'lar
    for cid, name, parent in CATEGORIES:
        if parent is not None:
            cur.execute(
                "INSERT INTO categories (id,name,parent_id,created_at) VALUES (%s,%s,%s,%s)",
                (cid, name, parent, rdt(400))
            )
    conn.commit()

    # ── Kullanıcılar ──────────────────────────────────────────────────────────
    print("[3/8] Kullanıcılar ekleniyor (~320)...")
    users = []

    # Sabit önemli kullanıcılar (pentest suite'e uyumlu)
    fixed_users = [
        (1,  "admin@datapulse.local",  DEMO_PASSWORD, "ADMIN",       "Admin",  "User",   "OTHER"),
        (2,  "corp1@datapulse.local",  DEMO_PASSWORD, "CORPORATE",   "Ahmet",  "Yılmaz", "MALE"),
        (3,  "corp12@datapulse.local", DEMO_PASSWORD, "CORPORATE",   "Mehmet", "Kaya",   "MALE"),   # store_id=12 sahibi
        (4,  "corp2@datapulse.local",  DEMO_PASSWORD, "CORPORATE",   "Ayşe",   "Demir",  "FEMALE"),
        (5,  "corp3@datapulse.local",  DEMO_PASSWORD, "CORPORATE",   "Fatma",  "Çelik",  "FEMALE"),
        (6,  "corp4@datapulse.local",  DEMO_PASSWORD, "CORPORATE",   "Ali",    "Şahin",  "MALE"),
        (7,  "ind1@datapulse.local",   DEMO_PASSWORD, "INDIVIDUAL",  "Zeynep", "Arslan", "FEMALE"), # IND_USER_ID=7
        (8,  "ind2@datapulse.local",   DEMO_PASSWORD, "INDIVIDUAL",  "Can",    "Öztürk", "MALE"),
    ]
    for uid, email, pw, role, fn, ln, gender in fixed_users:
        cur.execute(
            "INSERT INTO users (id,email,password_hash,role_type,first_name,last_name,gender,is_active,created_at,updated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,b'1',%s,%s)",
            (uid, email, pw, role, fn, ln, gender, rdt(400), rdt(200))
        )
        users.append(uid)

    # Kalan corporate'ler (store sahipleri 6-12)
    corp_extra_ids = list(range(9, 20))
    for i, sid in enumerate(range(6, 13)):
        uid = corp_extra_ids[i]
        cur.execute(
            "INSERT INTO users (id,email,password_hash,role_type,first_name,last_name,gender,is_active,created_at,updated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,b'1',%s,%s)",
            (uid, f"corp_s{sid}@datapulse.local", DEMO_PASSWORD, "CORPORATE",
             fake.first_name(), fake.last_name(),
             random.choice(GENDERS), rdt(400), rdt(200))
        )
        users.append(uid)

    # Individual kullanıcılar (id 20-320)
    ind_ids = list(range(20, 321))
    for uid in ind_ids:
        gender = random.choice(GENDERS)
        cur.execute(
            "INSERT INTO users (id,email,password_hash,role_type,first_name,last_name,gender,is_active,created_at,updated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,b'1',%s,%s)",
            (uid, f"user{uid}@demo.local", DEMO_PASSWORD, "INDIVIDUAL",
             fake.first_name(), fake.last_name(),
             gender, rdt(400), rdt(200))
        )
        users.append(uid)
    conn.commit()
    print(f"   {len(users)} kullanıcı eklendi.")

    # ── Mağazalar ─────────────────────────────────────────────────────────────
    print("[4/8] Mağazalar ekleniyor...")
    # Store-owner eşleşmesi: store_id → user_id
    store_owner = {
        1:2, 2:4, 3:5, 4:6, 5:9, 6:10, 7:11, 8:12, 9:13, 10:14, 11:15, 12:3
    }
    for sid, name, status, country, city in STORES:
        cur.execute(
            "INSERT INTO stores (id,owner_id,name,description,status,country,city,created_at,updated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (sid, store_owner[sid], name, f"{name} — demo mağazası",
             status, country, city, rdt(400), rdt(200))
        )
    conn.commit()

    # ── Ürünler ───────────────────────────────────────────────────────────────
    print("[5/8] Ürünler ekleniyor (~160)...")
    product_ids = []
    store_products = {}  # store_id -> [product_id, ...]
    pid = 1
    product_names = [
        "Akıllı Telefon", "Laptop", "Bluetooth Kulaklık", "Tablet", "Akıllı Saat",
        "Klavye", "Mouse", "Monitor", "Webcam", "USB Hub",
        "Tişört", "Pantolon", "Elbise", "Ceket", "Sweatshirt",
        "Koşu Ayakkabısı", "Bot", "Sneaker", "Sandalet", "Terlik",
        "Roman", "Bilim Kitabı", "Tarih Kitabı", "Çocuk Kitabı", "Dil Kitabı",
        "Tencere Seti", "Koltuk", "Yatak", "Masa", "Sandalye",
        "Dambıl", "Yoga Matı", "Bisiklet", "Koşu Bandı", "Spor Çantası",
        "Serum", "Krem", "Ruj", "Maskara", "Göz Farı",
        "Araba Lastiği", "Motor Yağı", "Korna", "Far Lambası", "Oto Koku",
        "Oyuncak Araba", "Bebek Bezi", "Lego Seti", "Puzzle", "Peluş Oyuncak",
    ]
    for sid, _, status, _, _ in STORES:
        cats = STORE_CATEGORY_MAP.get(sid, [1])
        count = random.randint(10, 18)
        store_products[sid] = []
        for _ in range(count):
            pname = random.choice(product_names) + f" {fake.word().capitalize()}"
            price = round(random.uniform(91, 8000), 2)
            cur.execute(
                "INSERT INTO products (store_id,category_id,sku,name,description,unit_price,"
                "stock_quantity,importance,is_active,created_at,updated_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,b'1',%s,%s)",
                (sid, random.choice(cats), f"SKU-{pid:04d}", pname,
                 f"Demo ürün — {pname}", price,
                 random.randint(0, 200),
                 weighted(IMPORTANCE, [30, 50, 20]),
                 rdt(400), rdt(200))
            )
            product_ids.append(pid)
            store_products[sid].append((pid, price))
            pid += 1
    conn.commit()
    print(f"   {pid-1} ürün eklendi.")

    # ── Siparişler + Order Items ───────────────────────────────────────────────
    print("[6/8] Siparişler ekleniyor (~2000)...")
    ind_user_ids = [7, 8] + list(range(20, 321))
    order_ids = []
    oid = 1

    for _ in range(2020):
        uid  = random.choice(ind_user_ids)
        sid  = random.randint(1, 12)
        prods = store_products.get(sid, [])
        if not prods:
            continue

        status  = weighted(STATUSES, STATUS_W)
        payment = weighted(PAYMENTS, PAYMENT_W)
        ordered = rdt(365)

        # Seç 1-4 ürün
        chosen = random.sample(prods, min(random.randint(1, 4), len(prods)))
        grand  = sum(p * random.randint(1, 3) for _, p in chosen)
        grand  = round(grand, 2)

        cur.execute(
            "INSERT INTO orders (id,user_id,store_id,status,payment_method,fulfilment,"
            "sales_channel,grand_total,currency,ordered_at,updated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'TRY',%s,%s)",
            (oid, uid, sid, status, payment,
             random.choice(["MERCHANT","AMAZON","SELF"]),
             random.choice(CHANNELS),
             grand, ordered, ordered + timedelta(days=random.randint(0,3)))
        )

        for prod_id, unit_price in chosen:
            qty = random.randint(1, 3)
            cur.execute(
                "INSERT INTO order_items (order_id,product_id,quantity,unit_price,discount) "
                "VALUES (%s,%s,%s,%s,%s)",
                (oid, prod_id, qty, unit_price, round(random.uniform(0, 15), 2))
            )

        order_ids.append((oid, uid, sid, status, ordered))
        oid += 1

        if oid % 200 == 0:
            conn.commit()
            print(f"   {oid} sipariş...")

    conn.commit()
    print(f"   Toplam {oid-1} sipariş eklendi.")

    # ── Shipments ─────────────────────────────────────────────────────────────
    print("[7/8] Kargolar ekleniyor...")
    ship_count = 0
    for order_id, uid, sid, order_status, ordered_at in order_ids:
        if order_status in ("PENDING", "CONFIRMED"):
            continue  # henüz kargoya verilmedi
        ship_status = weighted(SHIP_STAT, SHIP_W)
        est  = (ordered_at + timedelta(days=random.randint(3, 7))).date()
        act  = (ordered_at + timedelta(days=random.randint(5, 14))).date() \
               if ship_status in ("DELIVERED","RETURNED") else None
        cur.execute(
            "INSERT INTO shipments (order_id,tracking_number,warehouse_block,"
            "mode_of_shipment,ship_service_level,carrier,customer_care_calls,"
            "customer_rating,cost_of_product,prior_purchases,discount_offered,"
            "status,estimated_delivery,actual_delivery,created_at,updated_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (order_id,
             f"TRK{order_id:07d}",
             random.choice(["A","B","C","D","F"]),
             random.choice(["Ship","Road","Air"]),
             random.choice(["Standard","Expedited","Priority"]),
             random.choice(CARRIERS),
             random.randint(0, 5),
             random.randint(1, 5),
             round(random.uniform(50, 500), 2),
             random.randint(0, 8),
             round(random.uniform(0, 65), 2),
             ship_status, est, act,
             ordered_at, ordered_at + timedelta(hours=2))
        )
        ship_count += 1
        if ship_count % 300 == 0:
            conn.commit()
    conn.commit()
    print(f"   {ship_count} kargo eklendi.")

    # ── Reviews ───────────────────────────────────────────────────────────────
    print("[8/8] Yorumlar ekleniyor (~1100)...")
    review_titles = [
        "Harika ürün!", "Beklentimi karşıladı", "Çok beğendim", "İdare eder",
        "Fiyatına göre iyi", "Kötü kalite", "Tavsiye ederim", "Pişman oldum",
        "Süper!", "Normal",
    ]
    review_count = 0
    delivered_orders = [(oid, uid, sid, ordered) for oid, uid, sid, status, ordered in order_ids
                        if status == "DELIVERED"]
    random.shuffle(delivered_orders)
    used_pairs = set()

    for order_id, uid, sid, ordered_at in delivered_orders[:1100]:
        prods = store_products.get(sid, [])
        if not prods:
            continue
        prod_id, _ = random.choice(prods)
        if (uid, prod_id) in used_pairs:
            continue
        used_pairs.add((uid, prod_id))

        rating = random.choices([1,2,3,4,5], weights=[8,11,11,24,46])[0]
        sentiment = "POSITIVE" if rating >= 4 else ("NEUTRAL" if rating == 3 else "NEGATIVE")
        cur.execute(
            "INSERT INTO reviews (user_id,product_id,order_id,star_rating,title,body,"
            "helpful_votes,total_votes,sentiment,marketplace,verified,created_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,b'1',%s)",
            (uid, prod_id, order_id, rating,
             random.choice(review_titles),
             fake.sentence(nb_words=10),
             random.randint(0, 50), random.randint(0, 60),
             sentiment, "DataPulse",
             ordered_at + timedelta(days=random.randint(7, 30)))
        )
        review_count += 1
        if review_count % 200 == 0:
            conn.commit()
    conn.commit()
    print(f"   {review_count} yorum eklendi.")

    # ── Customer Profiles ─────────────────────────────────────────────────────
    print("[+] Customer profiles oluşturuluyor...")
    for uid in ind_user_ids[:303]:
        cur.execute(
            "INSERT IGNORE INTO customer_profiles "
            "(user_id,age,city,country,membership_type,total_spend,items_purchased,"
            "avg_rating,discount_applied,satisfaction_level,created_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,b'1',%s,%s)",
            (uid, random.randint(18, 65),
             fake.city(), "Turkey",
             random.choice(MEMBER),
             round(random.uniform(100, 50000), 2),
             random.randint(1, 100),
             round(random.uniform(1.0, 5.0), 2),
             random.choice(SATISFY),
             rdt(400))
        )
    conn.commit()

    # ── Özet ──────────────────────────────────────────────────────────────────
    print("\n=== Seed tamamlandı ===")
    for table in ["users","stores","categories","products","orders",
                  "order_items","shipments","reviews","customer_profiles"]:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        print(f"  {table:25} : {cur.fetchone()[0]:>5} rows")

    print(f"\n  Giriş bilgileri (tüm roller için şifre: demo1234)")
    print(f"  ADMIN      : admin@datapulse.local")
    print(f"  CORPORATE  : corp12@datapulse.local  (store_id=12)")
    print(f"  INDIVIDUAL : ind1@datapulse.local    (user_id=7)")

    conn.close()


if __name__ == "__main__":
    main()
