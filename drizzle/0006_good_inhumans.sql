CREATE TABLE "dividends" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dividends_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"symbol" text NOT NULL,
	"payment_date" timestamp,
	"amount" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "splits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "splits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"symbol" text NOT NULL,
	"split_date" timestamp,
	"numerator" integer NOT NULL,
	"denominator" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "splits" ADD CONSTRAINT "splits_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE no action ON UPDATE no action;