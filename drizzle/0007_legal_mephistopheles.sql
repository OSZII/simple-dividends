CREATE TABLE "stock_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stock_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"symbol" text NOT NULL,
	"date" date NOT NULL,
	"price" numeric(12, 4) NOT NULL,
	"volume" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dividends" ALTER COLUMN "payment_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "dividends" ALTER COLUMN "payment_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dividends" ALTER COLUMN "amount" SET DATA TYPE numeric(11, 6);--> statement-breakpoint
ALTER TABLE "splits" ALTER COLUMN "split_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "splits" ALTER COLUMN "split_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE no action ON UPDATE no action;