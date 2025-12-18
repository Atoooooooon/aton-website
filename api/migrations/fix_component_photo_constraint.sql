-- Fix ComponentPhoto unique constraint
-- The old constraint only allowed one photo per component
-- The new constraint allows same photo in multiple components, but not duplicate in same component

-- Drop old constraint
ALTER TABLE component_photos DROP CONSTRAINT IF EXISTS uk_component_photo_id;

-- Add new composite unique constraint
ALTER TABLE component_photos ADD CONSTRAINT uk_component_photo UNIQUE (component_name, photo_id);
