CREATE TABLE "authors" 
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL
, "isLiving" BOOLEAN );

CREATE TABLE "books" 
( "id" SERIAL PRIMARY KEY
, "authorId" INTEGER NOT NULL REFERENCES "authors"("id")
, "title" TEXT
, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now() );

CREATE TABLE "tags"
( "tag" TEXT NOT NULL
, "bookId" INTEGER NOT NULL REFERENCES "books"("id") ON DELETE CASCADE );

CREATE UNIQUE INDEX "tagsUniqueIdx" ON "tags"("bookId", "tag");
CREATE INDEX "tagsBookIdIdx" ON "tags"("tag");

CREATE TABLE "bankAccounts" 
( "id" SERIAL PRIMARY KEY
, "balance" INTEGER NOT NULL DEFAULT 0 CHECK ("balance" > 0) );

CREATE TABLE "emailAuthentication" 
( "email" TEXT PRIMARY KEY
, "consecutiveFailedLogins" INTEGER NOT NULL DEFAULT 0
, "lastFailedLogin" TIMESTAMPTZ );

CREATE TYPE "appleEnvironment" AS ENUM 
( 'PROD'
, 'Sandbox' );

CREATE TABLE "appleTransactions" 
( "environment" "appleEnvironment" NOT NULL
, "originalTransactionId" TEXT NOT NULL
, "accountId" INTEGER NOT NULL
, "latestReceiptData" TEXT
-- ... lots more fields ...
);

ALTER TABLE "appleTransactions" 
  ADD CONSTRAINT "appleTransPKey" 
  PRIMARY KEY ("environment", "originalTransactionId");

CREATE TABLE "employees"
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL
, "managerId" INTEGER REFERENCES "employees"("id")
);

CREATE EXTENSION postgis;
CREATE TABLE "stores"
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL
, "geom" GEOMETRY NOT NULL
);
CREATE INDEX "storesGeomIdx" ON "stores" USING gist("geom");


INSERT INTO "authors" VALUES (1000, 'Philip Pullman', true);
INSERT INTO "books" VALUES (1000, 1000, 'Northern Lights');
INSERT INTO "books" VALUES (1001, 1000, 'The Subtle Knife');
INSERT INTO "books" VALUES (1002, 1000, 'The Amber Spyglass');
INSERT INTO "tags" VALUES ('His Dark Materials', 1000);
INSERT INTO "tags" VALUES ('1/3', 1000);
INSERT INTO "tags" VALUES ('His Dark Materials', 1001);
INSERT INTO "tags" VALUES ('2/3', 1001);
INSERT INTO "tags" VALUES ('His Dark Materials', 1002);
INSERT INTO "tags" VALUES ('3/3', 1002);

INSERT INTO "authors" VALUES (1001, 'Mark Haddon', true);
INSERT INTO "books" VALUES (1003, 1001, 'The Curious Incident of the Dog in the Night-Time');
INSERT INTO "tags" VALUES ('mystery', 1003);

INSERT INTO "authors" VALUES (1002, 'Louis Sachar', true);
INSERT INTO "books" VALUES (1004, 1002, 'Holes');
INSERT INTO "tags" VALUES ('adventure', 1004);

INSERT INTO "emailAuthentication" VALUES ('me@privacy.net');

INSERT INTO "appleTransactions" VALUES ('PROD', '123456', 123, 'X');