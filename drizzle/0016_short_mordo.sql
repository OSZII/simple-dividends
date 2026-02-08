ALTER TABLE "stocks" RENAME COLUMN "short_name" TO "name";--> statement-breakpoint
ALTER TABLE "stocks" RENAME COLUMN "recession_return" TO "total_recession_return";--> statement-breakpoint
ALTER TABLE "stocks" RENAME COLUMN "trailing_pe" TO "pe_ratio";--> statement-breakpoint
DROP INDEX "stocks_volume_idx";--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "dividend_yield_5_year_average" real;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "ex_dividend_date_estimated_or_confirmed" boolean;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "recession_dividend_performance_percentage" real;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "valuation_min" real;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "valuation_max" real;--> statement-breakpoint
CREATE INDEX "stocks_sector_id_idx" ON "stocks" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "stocks_beta_idx" ON "stocks" USING btree ("beta");--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "long_name";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "exchange";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "dividend_rate";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "five_year_avg_dividend_yield";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "trailing_annual_dividend_rate";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "trailing_annual_dividend_yield";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "dividend_safety";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "yield_relative_to_history";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "annual_total_dividends";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "forward_pe";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "valuation_status";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "fifty_day_average";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "two_hundred_day_average";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "return_on_assets";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "return_on_equity";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "current_ratio";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "quick_ratio";