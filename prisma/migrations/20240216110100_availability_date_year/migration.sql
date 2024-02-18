UPDATE "AvailabilityDate"
SET 
  "date" = "date" + INTERVAL '23 years'
WHERE 
  EXTRACT(MONTH FROM "date") >= 8;

UPDATE "AvailabilityDate"
SET 
  "date" = "date" + INTERVAL '24 years'
WHERE 
  EXTRACT(MONTH FROM "date") < 8;

-- cases
-- if month >= 8, then year should be set to 2023
-- if month < 8, then year should be set to 2024
