ALTER TABLE "dividends" DROP CONSTRAINT "dividends_symbol_stocks_symbol_fk";
--> statement-breakpoint
ALTER TABLE "splits" DROP CONSTRAINT "splits_symbol_stocks_symbol_fk";
--> statement-breakpoint
ALTER TABLE "stock_history" DROP CONSTRAINT "stock_history_symbol_stocks_symbol_fk";
--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "splits" ADD CONSTRAINT "splits_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE cascade ON UPDATE no action;