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

        if has_table("ORDERS"):
            sql = inject_condition(sql, f"store_id = {enforced_store}")
        if has_table("STORES"):
            sql = inject_condition(sql, f"(id = {enforced_store} AND owner_id = {user_id})")
        if has_table("PRODUCTS"):
            sql = inject_condition(sql, f"store_id = {enforced_store}")
        if has_table("SHIPMENTS"):
            sql = inject_condition(sql, f"order_id IN (SELECT o.id FROM orders o WHERE o.store_id = {enforced_store})")
        if has_table("ORDER_ITEMS"):
            sql = inject_condition(sql, f"order_id IN (SELECT o.id FROM orders o WHERE o.store_id = {enforced_store})")
        if has_table("USERS"):
            sql = inject_condition(sql, f"id IN (SELECT DISTINCT o.user_id FROM orders o WHERE o.store_id = {enforced_store})")
        if has_table("CUSTOMER_PROFILES"):
            sql = inject_condition(sql, f"user_id IN (SELECT DISTINCT o.user_id FROM orders o WHERE o.store_id = {enforced_store})")
        if has_table("REVIEWS"):
            sql = inject_condition(
                sql,
                f"(user_id IN (SELECT DISTINCT o.user_id FROM orders o WHERE o.store_id = {enforced_store}) "
                f"OR product_id IN (SELECT p.id FROM products p WHERE p.store_id = {enforced_store}))"
            )

    if role == "INDIVIDUAL":
        if not user_id:
            raise PermissionError("Bu bilgiyi paylasamam.")
        enforced_user = user_id
        sql_upper = sql.upper()

        # Individual kullanıcılar için güvenli global ürün analitik sorgularına izin ver:
        # - aggregate odaklı olmalı
        # - kullanıcı/sipariş/store kimliği döndüren kolonlar içermemeli
        # - müşteri/store tablolarına dokunmamalı
        def is_safe_global_product_aggregate() -> bool:
            has_aggregate = any(fn in sql_upper for fn in ["COUNT(", "SUM(", "AVG(", "MAX(", "MIN("])
            touches_forbidden_tables = any(
                has_table(t) for t in ["USERS", "CUSTOMER_PROFILES", "STORES", "SHIPMENTS"]
            )
            leaks_identity_fields = any(
                field in sql_upper for field in ["USER_ID", "ORDER_ID", "STORE_ID", "EMAIL", "FIRST_NAME", "LAST_NAME"]
            )
            return has_aggregate and not touches_forbidden_tables and not leaks_identity_fields

        safe_global_product_aggregate = is_safe_global_product_aggregate()

        # Individual kullanıcı store/company seviyesinde toplu analiz sorgulayamaz.
        if has_table("STORES"):
            raise PermissionError("Bu bilgiyi paylasamam.")
        if has_table("ORDERS") and not safe_global_product_aggregate:
            sql = inject_condition(sql, f"user_id = {enforced_user}")
        if has_table("ORDER_ITEMS") and not safe_global_product_aggregate:
            sql = inject_condition(sql, f"order_id IN (SELECT o.id FROM orders o WHERE o.user_id = {enforced_user})")
        if has_table("SHIPMENTS"):
            sql = inject_condition(sql, f"order_id IN (SELECT o.id FROM orders o WHERE o.user_id = {enforced_user})")
        if has_table("PRODUCTS") and not safe_global_product_aggregate:
            sql = inject_condition(
                sql,
                f"id IN (SELECT oi.product_id FROM order_items oi "
                f"JOIN orders o ON oi.order_id=o.id WHERE o.user_id = {enforced_user})"
            )
        if has_table("REVIEWS") and not safe_global_product_aggregate:
            sql = inject_condition(sql, f"user_id = {enforced_user}")
        if has_table("CUSTOMER_PROFILES"):
            sql = inject_condition(sql, f"user_id = {enforced_user}")
        if has_table("USERS"):
            sql = inject_condition(sql, f"id = {enforced_user}")

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
    sql = apply_rbac(sql, role, user_id, store_id)
    with engine.connect() as conn:
        df = pd.read_sql(text(sql), conn)
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
