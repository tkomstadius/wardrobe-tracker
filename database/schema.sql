-- Wardrobe Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create enum type for clothing categories
CREATE TYPE clothing_category AS ENUM (
  'tops',
  'bottoms', 
  'dresses_jumpsuits',
  'shoes',
  'accessories',
  'outerwear',
  'underwear',
  'sleepwear',
  'activewear'
);

-- Main clothing items table
CREATE TABLE clothing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic item info
  name VARCHAR(255) NOT NULL,
  category clothing_category NOT NULL,
  subcategory VARCHAR(100), -- e.g., "blouse", "jeans", "sneakers", "dress", "jumpsuit"
  brand VARCHAR(100),
  color VARCHAR(50),
  pattern VARCHAR(50), -- e.g., "solid", "stripes", "floral"
  material VARCHAR(100), -- e.g., "cotton", "polyester", "wool"
  
  -- Purchase info
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  purchase_location VARCHAR(255),
  second_hand BOOLEAN DEFAULT FALSE, -- true if bought second hand
  
  -- Special flags
  dog_wear BOOLEAN DEFAULT FALSE, -- true if suitable for wearing when with dogs/walking dogs
  
  -- Usage tracking
  times_worn INTEGER DEFAULT 0,
  last_worn_date DATE,
  
  -- Images
  image_urls TEXT[], -- array of image URLs
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wear history table (track when items are worn)
CREATE TABLE wear_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clothing_item_id UUID REFERENCES clothing_items(id) ON DELETE CASCADE,
  
  date_worn DATE, -- optional, can be null if just adding to count
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_category ON clothing_items(category);
CREATE INDEX idx_clothing_items_times_worn ON clothing_items(times_worn);
CREATE INDEX idx_clothing_items_dog_wear ON clothing_items(dog_wear);
CREATE INDEX idx_wear_history_user_id ON wear_history(user_id);
CREATE INDEX idx_wear_history_item_id ON wear_history(clothing_item_id);
CREATE INDEX idx_wear_history_date ON wear_history(date_worn);

-- Enable Row Level Security (RLS)
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wear_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view their own clothing items" ON clothing_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clothing items" ON clothing_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothing items" ON clothing_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothing items" ON clothing_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wear history" ON wear_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wear history" ON wear_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wear history" ON wear_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wear history" ON wear_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to update clothing item stats when wear history is added
CREATE OR REPLACE FUNCTION update_clothing_item_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update times_worn and last_worn_date when a new wear record is added
  IF TG_OP = 'INSERT' THEN
    UPDATE clothing_items 
    SET 
      times_worn = times_worn + 1,
      last_worn_date = CASE 
        WHEN NEW.date_worn IS NOT NULL THEN NEW.date_worn 
        ELSE last_worn_date 
      END,
      updated_at = NOW()
    WHERE id = NEW.clothing_item_id;
    RETURN NEW;
  END IF;
  
  -- Update stats when wear record is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE clothing_items 
    SET 
      times_worn = GREATEST(times_worn - 1, 0),
      last_worn_date = (
        SELECT MAX(date_worn) 
        FROM wear_history 
        WHERE clothing_item_id = OLD.clothing_item_id
        AND date_worn IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = OLD.clothing_item_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_clothing_items_updated_at 
  BEFORE UPDATE ON clothing_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clothing_item_stats_on_wear
  AFTER INSERT OR DELETE ON wear_history
  FOR EACH ROW EXECUTE FUNCTION update_clothing_item_stats();

-- Create a view for clothing items with usage stats
CREATE VIEW clothing_items_with_stats AS
SELECT 
  ci.*,
  COALESCE(wh.total_wears, 0) as total_wears,
  wh.first_worn,
  wh.most_recent_wear,
  CASE 
    WHEN ci.purchase_price IS NOT NULL AND COALESCE(wh.total_wears, 0) > 0 
    THEN ci.purchase_price / COALESCE(wh.total_wears, 1)
    ELSE NULL 
  END as cost_per_wear
FROM clothing_items ci
LEFT JOIN (
  SELECT 
    clothing_item_id,
    COUNT(*) as total_wears,
    MIN(date_worn) as first_worn,
    MAX(date_worn) as most_recent_wear
  FROM wear_history
  WHERE date_worn IS NOT NULL
  GROUP BY clothing_item_id
) wh ON ci.id = wh.clothing_item_id;

-- Create storage bucket for clothing item images
INSERT INTO storage.buckets (id, name, public) VALUES ('clothing-images', 'clothing-images', true);

-- Set up RLS policies for storage
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view public clothing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'clothing-images');
