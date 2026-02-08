ALTER TABLE "stocks" RENAME COLUMN "sector_id" TO "sector";--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_country_id_countries_id_fk";
--> statement-breakpoint
DROP INDEX "stocks_sector_id_idx";--> statement-breakpoint
CREATE INDEX "stocks_pe_ratio_idx" ON "stocks" USING btree ("pe_ratio");--> statement-breakpoint
CREATE INDEX "stocks_fifty_two_week_high_idx" ON "stocks" USING btree ("fifty_two_week_high");--> statement-breakpoint
CREATE INDEX "stocks_fifty_two_week_low_idx" ON "stocks" USING btree ("fifty_two_week_low");--> statement-breakpoint
CREATE INDEX "stocks_sector_id_idx" ON "stocks" USING btree ("sector");--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "country_id";