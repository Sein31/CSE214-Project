import unittest

from database import apply_rbac


class RbacScopeTests(unittest.TestCase):
    def test_individual_orders_query_is_scoped_to_user(self):
        sql = "SELECT id, grand_total FROM orders ORDER BY ordered_at DESC LIMIT 10"
        scoped = apply_rbac(sql, role="INDIVIDUAL", user_id=7, store_id=None)
        self.assertIn("user_id = 7", scoped)

    def test_corporate_shipments_query_is_scoped_to_store_orders(self):
        sql = "SELECT id, status FROM shipments LIMIT 20"
        scoped = apply_rbac(sql, role="CORPORATE", user_id=4, store_id=12)
        self.assertIn("order_id IN (SELECT o.id FROM orders o WHERE o.store_id = 12)", scoped)

    def test_corporate_without_store_scope_is_rejected(self):
        with self.assertRaises(PermissionError):
            apply_rbac("SELECT * FROM orders LIMIT 5", role="CORPORATE", user_id=4, store_id=None)


if __name__ == "__main__":
    unittest.main()
