DROP INDEX "stocks_credit_rating_idx";--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "earnings_timestamp" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "recession_dividend_performance_percentage";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "pe_relative_to_history";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "credit_rating";--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "number_of_analyst_opinions";