ALTER TABLE "stocks" RENAME COLUMN "average_dollar_volume_90d" TO "volume90d";--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "volume" bigint;