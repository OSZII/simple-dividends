CREATE TYPE "public"."dividend_safety" AS ENUM('very_unsafe', 'unsafe', 'borderline', 'safe', 'very_safe');--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "average_dollar_volume_90d" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "dividend_safety" "dividend_safety";