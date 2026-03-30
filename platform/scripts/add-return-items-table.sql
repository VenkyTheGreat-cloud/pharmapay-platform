-- Create return_items table for storing return item details
CREATE TABLE IF NOT EXISTS return_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for return_items
CREATE INDEX IF NOT EXISTS idx_return_items_order_id ON return_items(order_id);
  