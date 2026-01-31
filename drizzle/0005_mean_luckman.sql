ALTER TABLE "stocks" ADD COLUMN "currency" text DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "full_time_employees";