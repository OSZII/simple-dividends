CREATE TABLE "currency" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "currency_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "currency_name_unique" UNIQUE("name")
);
