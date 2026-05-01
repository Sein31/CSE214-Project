"""
refresh_sales_data.py — Tek seferlik demo veri tazeleme scripti.

YAP: Mevcut orders ve shipments kayıtlarından rastgele 40-50 tanesini seçer,
     ordered_at / actual_delivery / estimated_delivery tarihlerini son 60 güne
     (Mart–Mayıs 2026) taşır.

YAPMA: Yeni kayıt eklemez; Foreign Key ilişkilerini bozmaz.

Kullanım:
    cd aadproje
    pip install pymysql python-dotenv
    python refresh_sales_data.py
"""

import random
from datetime import datetime, timedelta

import pymysql
from dotenv import load_dotenv
import os

# Try loading .env from multiple candidate locations
_base = os.path.dirname(os.path.abspath(__file__))
for _candidate in [
    os.path.join(_base, ".env"),
    os.path.join(_base, "chatbot", ".env"),
]:
    if os.path.exists(_candidate):
        load_dotenv(dotenv_path=_candidate)
        print(f"Loaded env from: {_candidate}")
        break

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "aad_db"),
    "charset":  "utf8mb4",
}

# ── Tarih aralığı: 60 gün öncesinden bugüne ───────────────────────────────────
NOW   = datetime.now()
START = NOW - timedelta(days=60)   # ~Mart 2026 başı


def random_datetime(start: datetime, end: datetime) -> datetime:
    """start ile end arasında rastgele bir datetime döner."""
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def main():
    print("=== refresh_sales_data.py ===")
    print(f"Bağlanılıyor: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")

    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:

            # 1) Mevcut tüm order id'lerini çek
            cur.execute("SELECT id FROM orders ORDER BY id")
            all_order_ids = [row[0] for row in cur.fetchall()]

        if not all_order_ids:
            print("HATA: orders tablosunda hiç kayıt yok!")
            return

        # 2) Rastgele 40-50 tane seç (veya hepsini, hangisi küçükse)
        sample_size = min(random.randint(40, 50), len(all_order_ids))
        selected_ids = random.sample(all_order_ids, sample_size)
        print(f"Seçilen sipariş sayısı: {sample_size}  |  IDs: {selected_ids[:5]}... ")

        # 3) Her seçilen sipariş için yeni bir ordered_at üret ve güncelle
        orders_updated = 0
        shipments_updated = 0

        with conn.cursor() as cur:
            for order_id in selected_ids:
                new_ordered_at = random_datetime(START, NOW)

                # orders tablosunu güncelle
                cur.execute(
                    "UPDATE orders SET ordered_at = %s WHERE id = %s",
                    (new_ordered_at, order_id)
                )
                orders_updated += cur.rowcount

                # shipments tablosunu güncelle (varsa)
                # estimated_delivery = ordered_at + 3-7 gün
                # actual_delivery    = ordered_at + 5-12 gün (veya NULL bırak delivered değilse)
                estimated = new_ordered_at + timedelta(days=random.randint(3, 7))
                actual    = new_ordered_at + timedelta(days=random.randint(5, 12))

                # Sadece bu order'a ait shipment varsa güncelle
                cur.execute(
                    """UPDATE shipments
                       SET estimated_delivery = %s,
                           actual_delivery    = %s
                       WHERE order_id = %s""",
                    (estimated, actual, order_id)
                )
                shipments_updated += cur.rowcount

            conn.commit()

        print(f"✓ orders güncellendi   : {orders_updated} kayıt")
        print(f"✓ shipments güncellendi: {shipments_updated} kayıt")

        # 4) Doğrulama: son 30 gündeki sipariş sayısını göster
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM orders WHERE ordered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            )
            count_30 = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM orders WHERE ordered_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)"
            )
            count_60 = cur.fetchone()[0]

        print(f"\n--- Doğrulama ---")
        print(f"Son 30 gündeki sipariş: {count_30}")
        print(f"Son 60 gündeki sipariş: {count_60}")
        print("\nTamamlandı! Chatbot'a 'Bu ayki toplam satış ne kadar?' (ADMIN/CORPORATE) sorusu çalışır.")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
