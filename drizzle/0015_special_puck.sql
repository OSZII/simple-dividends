ALTER TABLE "stocks" ADD COLUMN "analyst_rating" real;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "total_debt" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "total_cash" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "ebitda" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "recommendation" text;--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "operating_cashflow";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "recommendation_key";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "recommendation_mean";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "target_mean_price";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "target_median_price";