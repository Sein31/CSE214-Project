import os
import re
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

DB_URL = (
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

engine = create_engine(DB_URL)

# AV-12: Hassas kolonları her zaman filtrele
BLOCKED_COLUMNS = [
    "password_hash", "password", "secret", "api_key",
    "token", "private_key", "internal_cost", "supplier_margin",
    "cost_price", "refresh_token"
]

# AV-03: Tehlikeli SQL pattern'leri
BLOCKED_SQL_PATTERNS = [
    r"\bDROP\b", r"\bDELETE\b", r"\bINSERT\b", r"\bUPDATE\b",
    r"\bALTER\b", r"\bCREATE\b", r"\bTRUNCATE\b", r"\bEXEC\b",
    r"\bUNION\b", r"--", r"/\*", r"\bINFORMATION_SCHEMA\b",
    r"\bSYS\b", r";\s*SELECT"
]


def validate_sql(sql: str) -> None:
    """AV-03: SQL injection ve tehlikeli komut kontrolü."""
    sql_upper = sql.upper().strip()
    if not sql_upper.startswith("SELECT"):
        raise ValueError("Guvenlik: Sadece SELECT sorguları calistirilebilir.")
    for pattern in BLOCKED_SQL_PATTERNS:
        if re.search(pattern, sql_upper):
            raise ValueError("Guvenlik: Tehlikeli SQL kalıbı tespit edildi.")
    for col in BLOCKED_COLUMNS:
        if col.upper() in sql_upper:
            raise ValueError(f"Guvenlik: '{col}' kolonuna erisim yasaktir.")


def inject_condition(sql: str, condition: str) -> str:
    """Mevcut WHERE varsa AND ile ekle, yoksa WHERE olarak ekle."""
    pattern = re.compile(r'\bWHERE\b', re.IGNORECASE)
    if pattern.search(sql):
        return pattern.sub(f"WHERE {condition} AND", sql, count=1)
    else:
        # LIMIT veya GROUP BY veya ORDER BY öncesine ekle
        for keyword in [' GROUP BY', ' ORDER BY', ' HAVING', ' LIMIT']:
            idx = sql.upper().find(keyword)
            if idx != -1:
                return sql[:idx] + f" WHERE {condition}" + sql[idx:]
        return sql + f" WHERE {condition}"


def apply_rbac(sql: str, role: str, user_id: int, store_id: int = None) -> str:
    """AV-02, AV-05: Backend seviyesinde zorunlu RBAC — tüm JOIN senaryolarını kapsar."""
    if role == "ADMIN":
        return sql

    sql_check = sql.upper()

    def has_table(table_name: str) -> bool:
        return re.search(rf"\b{table_name}\b", sql_check) is not None

    if role == "CORPORATE":
        if not store_id:
            raise PermissionError("Bu bilgiyi paylasamam.")
        enforced_store = store_id

        orders_present = has_table("ORDERS")
        order_items_present = has_table("ORDER_ITEMS")
        products_present = has_table("PRODUCTS")

        # Helper: detect table alias (e.g. "orders o", "orders AS o")
        def get_alias(table_name: str) -> str:
            alias_match = re.search(
                rf'\b{table_name}\s+(?:AS\s+)?(\w+)\b', sql, re.IGNORECASE
            )
            reserved = {
                'SET', 'WHERE', 'JOIN', 'ON', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
                'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'AND', 'OR', 'SELECT', 'FROM',
            }
            if alias_match and alias_match.group(1).upper() not in reserved:
                return alias_match.group(1)
            return table_name

        # Helper: check if store_id filter already exists for a given table/alias
        def already_has_store_filter(tbl: str) -> bool:
            return re.search(
                rf'\b{re.escape(tbl)}\.store_id\s*=\s*{enforced_store}\b', sql, re.IGNORECASE
            ) is not None

        # 1) ORDERS — primary filter point for the orders JOIN chain
        if orders_present:
            tbl = get_alias("orders")
            if not already_has_store_filter(tbl):
                sql = inject_condition(sql, f"{tbl}.store_id = {enforced_store}")

        # 2) PRODUCTS — filter directly if present
        if products_present:
            tbl = get_alias("products")
            if not already_has_store_filter(tbl):
                sql = inject_condition(sql, f"{tbl}.store_id = {enforced_store}")

        # 3) ORDER_ITEMS — JOIN chain handles it if orders is present;
        #    otherwise use subquery
        if order_items_present and not orders_present:
            tbl = get_alias("order_items")
            sql = inject_condition(
                sql, f"{tbl}.order_id IN (SELECT o.id FROM orders o WHERE o.store_id = {enforced_store})"
            )

        # 4) SHIPMENTS — same logic as order_items
        if has_table("SHIPMENTS") and not orders_present:
            tbl = get_alias("shipments")
            sql = inject_condition(
                sql, f"{tbl}.order_id IN (SELECT o.id FROM orders o WHERE o.store_id = {enforced_store})"
            )

        # 5) STORES — filter to own store only
        if has_table("STORES"):
            tbl = get_alias("stores")
            sql = inject_condition(sql, f"{tbl}.id = {enforced_store}")

        # 6) USERS — allow access to customers who ordered from this store
        if has_table("USERS"):
            tbl = get_alias("users")
            sql = inject_condition(
                sql, f"{tbl}.id IN (SELECT DISTINCT o2.user_id FROM orders o2 WHERE o2.store_id = {enforced_store})"
            )

        # 7) CUSTOMER_PROFILES
        if has_table("CUSTOMER_PROFILES"):
            tbl = get_alias("customer_profiles")
            sql = inject_condition(
                sql, f"{tbl}.user_id IN (SELECT DISTINCT o2.user_id FROM orders o2 WHERE o2.store_id = {enforced_store})"
            )

        # 8) REVIEWS — products of this store OR customers of this store
        if has_table("REVIEWS"):
            tbl = get_alias("reviews")
            sql = inject_condition(
                sql,
                f"({tbl}.product_id IN (SELECT p2.id FROM products p2 WHERE p2.store_id = {enforced_store}) "
                f"OR {tbl}.user_id IN (SELECT DISTINCT o2.user_id FROM orders o2 WHERE o2.store_id = {enforced_store}))"
            )

    if role == "INDIVIDUAL":
        if not user_id:
            raise PermissionError("Bu bilgiyi paylasamam.")
        enforced_user = user_id
        sql_upper = sql.upper()

        # Individual kullanıcılar için güvenli global katalog sorgularına izin ver.
        # PUBLIC: ürün adları, fiyatlar, stok, review ortalamaları, best-seller (SUM quantity)
        # PRIVATE: ciro (grand_total), sipariş sayısı per-user, kişisel veri
        def is_safe_public_catalog_query() -> bool:
            """Public katalog/analitik sorgusu mu? (user_id filtresi GEREKMEZ)"""
            # Kesinlikle yasak tablolar (kişisel veri)
            if any(has_table(t) for t in ["USERS", "CUSTOMER_PROFILES", "SHIPMENTS"]):
                return False
            # Kişisel/finansal kolon sızıntısı
            financial_fields = ["GRAND_TOTAL", "UNIT_PRICE", "PAYMENT_METHOD"]
            identity_fields = ["USER_ID", "EMAIL", "FIRST_NAME", "LAST_NAME"]
            if any(field in sql_upper for field in identity_fields):
                return False

            # ORDERS tablosu varsa: sadece financial aggregate ise engelle
            if has_table("ORDERS"):
                if any(field in sql_upper for field in financial_fields):
                    return False
                # SELECT ... FROM orders tek başına = sipariş verileri = private
                if not has_table("PRODUCTS") and not has_table("ORDER_ITEMS"):
                    return False

            # Pure product/store catalog queries (no orders) → always safe
            if not has_table("ORDERS") and not has_table("ORDER_ITEMS"):
                return True

            # ORDER_ITEMS + PRODUCTS for best-seller (SUM quantity) → safe
            # ORDER_ITEMS + financial columns → not safe
            if has_table("ORDER_ITEMS"):
                if any(field in sql_upper for field in financial_fields):
                    return False
                if has_table("PRODUCTS") or has_table("REVIEWS"):
                    return True

            return False

        safe_public_catalog = is_safe_public_catalog_query()

        # HARD-BLOCK: INDIVIDUAL kullanıcı USERS tablosunu ASLA sorgulayamaz.
        # Başka kullanıcıları arama/bulma girişimlerini tamamen engelle.
        if has_table("USERS"):
            raise PermissionError("Diger kullanicilarin bilgilerine erisim yetkiniz bulunmamaktadir.")

        # Individual kullanıcı store finansal analizini sorgulayamaz,
        # ancak ürün kataloğu için mağaza adı/şehir bilgisine erişebilir.
        if has_table("STORES") and has_table("ORDERS"):
            raise PermissionError("Bu bilgiyi paylasamam.")

        orders_present = has_table("ORDERS")
        order_items_present = has_table("ORDER_ITEMS")
        products_present = has_table("PRODUCTS")

        if orders_present and not safe_public_catalog:
            # MUTLAK user_id KİLİDİ: LLM başka birinin user_id'sini yazmış olsa bile,
            # HER ZAMAN mevcut kullanıcının ID'sini zorla enjekte et.
            # Önce LLM'in koymuş olabileceği YANLIŞ user_id filtrelerini kaldır.
            sql = re.sub(
                r'\buser_id\s*=\s*\d+', f'user_id = {enforced_user}',
                sql, flags=re.IGNORECASE
            )
            # Eğer hala user_id filtresi yoksa (LLM hiç koymamışsa), ekle.
            has_correct_filter = re.search(
                rf'\buser_id\s*=\s*{enforced_user}\b', sql, re.IGNORECASE
            )
            if not has_correct_filter:
                # Detect alias: "orders o" or "orders AS o"
                alias_match = re.search(
                    r'\borders\s+(?:AS\s+)?(\w+)\b', sql, re.IGNORECASE
                )
                tbl = alias_match.group(1) if alias_match and alias_match.group(1).upper() not in (
                    'SET', 'WHERE', 'JOIN', 'ON', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
                    'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'AND', 'OR'
                ) else "orders"
                sql = inject_condition(sql, f"{tbl}.user_id = {enforced_user}")
        elif order_items_present and not safe_public_catalog:
            # order_items without orders table
            sql = inject_condition(sql, f"order_id IN (SELECT o.id FROM orders o WHERE o.user_id = {enforced_user})")
        elif products_present and not safe_public_catalog:
            # products without orders/order_items tables
            sql = inject_condition(
                sql,
                f"id IN (SELECT oi.product_id FROM order_items oi "
                f"JOIN orders o ON oi.order_id=o.id WHERE o.user_id = {enforced_user})"
            )

        # Tables that are NOT covered by orders join chain
        if has_table("SHIPMENTS"):
            if not orders_present:
                sql = inject_condition(sql, f"order_id IN (SELECT o.id FROM orders o WHERE o.user_id = {enforced_user})")
        if has_table("REVIEWS") and not safe_public_catalog and not products_present:
            sql = inject_condition(sql, f"user_id = {enforced_user}")
        if has_table("CUSTOMER_PROFILES"):
            sql = inject_condition(sql, f"user_id = {enforced_user}")

    return sql


def sanitize_output(df: pd.DataFrame) -> pd.DataFrame:
    """AV-12: Ciktidan hassas kolonları kaldir."""
    cols_to_drop = [c for c in df.columns
                    if any(b in c.lower() for b in BLOCKED_COLUMNS)]
    return df.drop(columns=cols_to_drop) if cols_to_drop else df


def execute_query(sql: str, role: str = "ADMIN",
                  user_id: int = None, store_id: int = None) -> pd.DataFrame:
    sql = sql.strip().rstrip(";")
    validate_sql(sql)
    if "LIMIT" not in sql.upper():
        sql = sql + " LIMIT 100"
    print(f"\033[94m[DB] Pre-RBAC  SQL: {sql}\033[0m")
    print(f"\033[93m[DB] Role={role}, user_id={user_id}, store_id={store_id}\033[0m")
    sql = apply_rbac(sql, role, user_id, store_id)
    print(f"\033[92m[DB] Post-RBAC SQL: {sql}\033[0m")
    with engine.connect() as conn:
        df = pd.read_sql(text(sql), conn)
    print(f"\033[96m[DB] Result rows: {len(df)}\033[0m")
    return sanitize_output(df)


# AV-07: Schema bilgisini minimize et - kolon detaylari yok
DB_SCHEMA = """
Veritaban: aad_db (MySQL)

Tablolar:
- users (id, email, role_type, first_name, last_name, gender, is_active)
- customer_profiles (id, user_id, age, city, membership_type, total_spend, avg_rating)
- stores (id, owner_id, name, status, city, country)
- products (id, store_id, category_id, sku, name, unit_price, stock_quantity, importance)
- categories (id, name, parent_id)
- orders (id, user_id, store_id, status, payment_method, grand_total, currency, ordered_at)
- order_items (id, order_id, product_id, quantity, unit_price, discount, subtotal)
- shipments (id, order_id, tracking_number, carrier, status, estimated_delivery, actual_delivery)
- reviews (id, user_id, product_id, star_rating, title, body, sentiment, verified)

Kural: Hassas kolonlar (password_hash vb.) sorgulanamaz. Sadece SELECT. LIMIT 100.
Tarih fonksiyonlari: NOW(), DATE_SUB(), MONTH(), YEAR(), CURDATE()
"""
