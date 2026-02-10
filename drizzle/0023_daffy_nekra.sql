ALTER TABLE "stocks" ALTER COLUMN "ex_dividend_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "stocks" ALTER COLUMN "dividend_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "latest_dividend_raise_date";