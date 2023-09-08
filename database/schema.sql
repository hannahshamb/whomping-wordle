set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";

CREATE TABLE "users" (
	"userId" serial NOT NULL UNIQUE,
	"userToken" TEXT NOT NULL UNIQUE,
	CONSTRAINT "users_pk" PRIMARY KEY ("userId","userToken")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "userSubmissions" (
  "userId" integer NOT NULL,
  "userToken" TEXT NOT NULL,
	"date" TEXT NOT NULL,
	"gameStatus" TEXT NOT NULL,
	"timeStamp" TIMESTAMPTZ NOT NULL default now(),
	CONSTRAINT "userSubmissions_pk" PRIMARY KEY ("userId","userToken","date")
) WITH (
  OIDS=FALSE
);

ALTER TABLE "userSubmissions" ADD CONSTRAINT "userSubmissions_fk0" FOREIGN KEY ("userId") REFERENCES "users"("userId");
ALTER TABLE "userSubmissions" ADD CONSTRAINT "userSubmissions_fk1" FOREIGN KEY ("userToken") REFERENCES "users"("userToken");
