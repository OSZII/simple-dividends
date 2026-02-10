CREATE TABLE "dividend_calendar" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dividend_calendar_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"symbol" text NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dividend_calendar" ADD CONSTRAINT "dividend_calendar_symbol_stocks_symbol_fk" FOREIGN KEY ("symbol") REFERENCES "public"."stocks"("symbol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dividend_calendar_symbol_date_idx" ON "dividend_calendar" USING btree ("symbol","date");