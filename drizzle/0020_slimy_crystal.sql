CREATE INDEX "stocks_analyst_rating_idx" ON "stocks" USING btree ("analyst_rating");--> statement-breakpoint
CREATE INDEX "stocks_dividend_safety_score_idx" ON "stocks" USING btree ("dividend_safety_score");--> statement-breakpoint
CREATE INDEX "stocks_dividend_growth_1_year_idx" ON "stocks" USING btree ("dividend_growth_1_year");--> statement-breakpoint
CREATE INDEX "stocks_dividend_growth_5_year_idx" ON "stocks" USING btree ("dividend_growth_5_year");--> statement-breakpoint
CREATE INDEX "stocks_dividend_growth_10_year_idx" ON "stocks" USING btree ("dividend_growth_10_year");--> statement-breakpoint
CREATE INDEX "stocks_uninterrupted_dividend_streak_idx" ON "stocks" USING btree ("uninterrupted_dividend_streak");--> statement-breakpoint
CREATE INDEX "stocks_ex_dividend_date_idx" ON "stocks" USING btree ("ex_dividend_date");--> statement-breakpoint
CREATE INDEX "stocks_payment_frequency_idx" ON "stocks" USING btree ("payment_frequency");--> statement-breakpoint
CREATE INDEX "stocks_payment_schedule_months_idx" ON "stocks" USING btree ("payment_schedule_months");--> statement-breakpoint
CREATE INDEX "stocks_credit_rating_idx" ON "stocks" USING btree ("credit_rating");--> statement-breakpoint
CREATE INDEX "stocks_net_debt_to_capital_idx" ON "stocks" USING btree ("net_debt_to_capital");--> statement-breakpoint
CREATE INDEX "stocks_net_debt_to_ebitda_idx" ON "stocks" USING btree ("net_debt_to_ebitda");--> statement-breakpoint
CREATE INDEX "stocks_free_cashflow_idx" ON "stocks" USING btree ("free_cashflow");--> statement-breakpoint
CREATE INDEX "stocks_return_on_invested_capital_idx" ON "stocks" USING btree ("return_on_invested_capital");--> statement-breakpoint
CREATE INDEX "stocks_recession_dividend_performance_idx" ON "stocks" USING btree ("recession_dividend_performance");--> statement-breakpoint
CREATE INDEX "stocks_total_recession_return_idx" ON "stocks" USING btree ("total_recession_return");