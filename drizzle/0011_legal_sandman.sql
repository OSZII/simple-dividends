ALTER TABLE "stocks" ADD COLUMN "annual_total_dividends" jsonb;--> statement-breakpoint
CREATE INDEX "dividends_symbol_date_idx" ON "dividends" USING btree ("symbol","date");--> statement-breakpoint
CREATE INDEX "splits_symbol_date_idx" ON "splits" USING btree ("symbol","date");--> statement-breakpoint
CREATE INDEX "stock_history_symbol_date_idx" ON "stock_history" USING btree ("symbol","date");--> statement-breakpoint
CREATE INDEX "stocks_dividend_yield_idx" ON "stocks" USING btree ("dividend_yield");--> statement-breakpoint
CREATE INDEX "stocks_price_idx" ON "stocks" USING btree ("price");--> statement-breakpoint
CREATE INDEX "stocks_volume_idx" ON "stocks" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "stocks_market_cap_idx" ON "stocks" USING btree ("market_cap");--> statement-breakpoint
CREATE INDEX "stocks_payout_ratio_idx" ON "stocks" USING btree ("payout_ratio");--> statement-breakpoint
CREATE INDEX "stocks_dividend_growth_streak_idx" ON "stocks" USING btree ("dividend_growth_streak");